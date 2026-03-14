import connectToDatabase from "@/src/lib/mongodb";
import Connection from "@/src/models/Connection";

type Provider = "google" | "outlook";

export type SelectableCalendar = {
  provider: Provider;
  connectionId: string;
  calendarId: string;
  calendarName: string;
  color?: string;
};

type BoardVisibility = {
  masked?: boolean;
  hidePastEvents?: boolean;
  pastDays?: number;
  futureDays?: number;
};

type BoardCalendar = {
  connectionId: string;
  provider: Provider;
  calendarId: string;
  calendarName: string;
  color?: string;
};

export type BoardLike = {
  _id: string;
  name: string;
  selectedCalendars: BoardCalendar[];
  visibility?: BoardVisibility;
};

export type BoardEvent = {
  id: string;
  provider: Provider;
  calendarId: string;
  calendarName: string;
  title: string;
  maskedTitle: string;
  isMasked: boolean;
  allDay?: boolean;
  startAt: string;
  endAt: string;
  color?: string;
};

type ConnectionDoc = {
  _id: string;
  provider: Provider;
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
};

async function refreshGoogleToken(connection: ConnectionDoc) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || !connection.refreshToken) {
    return null;
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken,
    }),
  });

  if (!tokenRes.ok) {
    return null;
  }

  const tokenJson = (await tokenRes.json()) as {
    access_token: string;
    expires_in?: number;
  };

  const expiresAt = tokenJson.expires_in
    ? Math.floor(Date.now() / 1000) + tokenJson.expires_in
    : connection.expiresAt;

  await Connection.findByIdAndUpdate(connection._id, {
    accessToken: tokenJson.access_token,
    expiresAt,
  });

  return tokenJson.access_token;
}

async function refreshMicrosoftToken(connection: ConnectionDoc) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret || !connection.refreshToken) {
    return null;
  }

  const tokenRes = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: connection.refreshToken,
        scope:
          "openid profile offline_access User.Read https://graph.microsoft.com/Calendars.Read",
      }),
    },
  );

  if (!tokenRes.ok) {
    return null;
  }

  const tokenJson = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const expiresAt = tokenJson.expires_in
    ? Math.floor(Date.now() / 1000) + tokenJson.expires_in
    : connection.expiresAt;

  await Connection.findByIdAndUpdate(connection._id, {
    accessToken: tokenJson.access_token,
    refreshToken: tokenJson.refresh_token || connection.refreshToken,
    expiresAt,
  });

  return tokenJson.access_token;
}

async function ensureValidAccessToken(connection: ConnectionDoc) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (!connection.expiresAt || connection.expiresAt > nowInSeconds + 60) {
    return connection.accessToken;
  }

  if (connection.provider === "google") {
    return refreshGoogleToken(connection);
  }

  return refreshMicrosoftToken(connection);
}

async function fetchGoogleCalendars(connection: ConnectionDoc) {
  let accessToken = await ensureValidAccessToken(connection);
  if (!accessToken) {
    return [] as SelectableCalendar[];
  }

  let res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (res.status === 401) {
    const refreshed = await refreshGoogleToken(connection);
    if (!refreshed) {
      return [];
    }

    accessToken = refreshed;
    res = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );
  }

  if (!res.ok) {
    return [];
  }

  const json = (await res.json()) as {
    items?: Array<{ id: string; summary?: string; backgroundColor?: string }>;
  };

  return (json.items || []).map((item) => ({
    provider: "google" as const,
    connectionId: connection._id,
    calendarId: item.id,
    calendarName: item.summary || "Google Calendar",
    color: item.backgroundColor,
  }));
}

async function fetchMicrosoftCalendars(connection: ConnectionDoc) {
  let accessToken = await ensureValidAccessToken(connection);
  if (!accessToken) {
    return [] as SelectableCalendar[];
  }

  let res = await fetch("https://graph.microsoft.com/v1.0/me/calendars", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    const refreshed = await refreshMicrosoftToken(connection);
    if (!refreshed) {
      return [];
    }

    accessToken = refreshed;
    res = await fetch("https://graph.microsoft.com/v1.0/me/calendars", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  }

  if (!res.ok) {
    return [];
  }

  const json = (await res.json()) as {
    value?: Array<{ id: string; name?: string; hexColor?: string }>;
  };

  return (json.value || []).map((item) => ({
    provider: "outlook" as const,
    connectionId: connection._id,
    calendarId: item.id,
    calendarName: item.name || "Outlook Calendar",
    color: item.hexColor,
  }));
}

export async function getSelectableCalendarsForUser(userId: string) {
  await connectToDatabase();

  const connections = await Connection.find({ userId })
    .select("provider accessToken refreshToken expiresAt")
    .lean<ConnectionDoc[]>();

  const allCalendars = await Promise.all(
    connections.map(async (connection) => {
      if (connection.provider === "google") {
        return fetchGoogleCalendars(connection);
      }

      return fetchMicrosoftCalendars(connection);
    }),
  );

  return allCalendars.flat();
}

function calculateDateWindow(visibility?: BoardVisibility) {
  const now = new Date();
  const pastDays = visibility?.hidePastEvents
    ? 0
    : Math.max(0, visibility?.pastDays ?? 7);
  const futureDays = Math.max(1, visibility?.futureDays ?? 14);

  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - pastDays);

  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + futureDays);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function toIsoDateTime(value?: string, fallback?: string) {
  if (!value && fallback) {
    return fallback;
  }

  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback || new Date().toISOString();
  }

  return date.toISOString();
}

function normalizeMicrosoftDateTime(
  value?: string,
  timeZone?: string,
  fallback?: string,
) {
  if (!value && fallback) {
    return fallback;
  }

  if (!value) {
    return new Date().toISOString();
  }

  const normalizedValue = value.trim().replace(/\.(\d{3})\d+/, ".$1");

  const hasExplicitOffset = /([zZ]|[+-]\d{2}:\d{2})$/.test(normalizedValue);

  if (hasExplicitOffset) {
    return toIsoDateTime(normalizedValue, fallback);
  }

  const normalizedTimeZone = timeZone?.trim().toLowerCase();
  const isUtcTimeZone =
    normalizedTimeZone === "utc" ||
    normalizedTimeZone === "etc/utc" ||
    normalizedTimeZone === "coordinated universal time";

  if (isUtcTimeZone) {
    return toIsoDateTime(`${normalizedValue}Z`, fallback);
  }

  return toIsoDateTime(normalizedValue, fallback);
}

function toDateOnly(value?: string, fallback?: string) {
  if (!value && fallback) {
    return fallback;
  }

  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

async function fetchGoogleBoardEvents(
  connection: ConnectionDoc,
  selectedCalendar: BoardCalendar,
  dateWindow: { startIso: string; endIso: string },
  boardName: string,
  masked: boolean,
) {
  let accessToken = await ensureValidAccessToken(connection);
  if (!accessToken) {
    return [] as BoardEvent[];
  }

  const fetchUrl = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendar.calendarId)}/events`,
  );
  fetchUrl.searchParams.set("singleEvents", "true");
  fetchUrl.searchParams.set("orderBy", "startTime");
  fetchUrl.searchParams.set("timeMin", dateWindow.startIso);
  fetchUrl.searchParams.set("timeMax", dateWindow.endIso);

  let res = await fetch(fetchUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    const refreshed = await refreshGoogleToken(connection);
    if (!refreshed) {
      return [];
    }

    accessToken = refreshed;
    res = await fetch(fetchUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  }

  if (!res.ok) {
    return [];
  }

  const json = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };

  return (json.items || []).map((event) => {
    const title = event.summary || "Busy";
    const maskedTitle = selectedCalendar.calendarName || boardName || "Busy";
    const isAllDay = Boolean(event.start?.date && !event.start?.dateTime);
    const startAt = isAllDay
      ? event.start?.date || new Date().toISOString().slice(0, 10)
      : toIsoDateTime(event.start?.dateTime || event.start?.date);
    const endAt = isAllDay
      ? event.end?.date || startAt
      : toIsoDateTime(event.end?.dateTime || event.end?.date, startAt);

    return {
      id: `${selectedCalendar.provider}:${selectedCalendar.calendarId}:${event.id}`,
      provider: selectedCalendar.provider,
      calendarId: selectedCalendar.calendarId,
      calendarName: selectedCalendar.calendarName,
      title,
      maskedTitle,
      isMasked: masked,
      allDay: isAllDay,
      startAt,
      endAt,
      color: selectedCalendar.color,
    };
  });
}

async function fetchMicrosoftBoardEvents(
  connection: ConnectionDoc,
  selectedCalendar: BoardCalendar,
  dateWindow: { startIso: string; endIso: string },
  boardName: string,
  masked: boolean,
) {
  let accessToken = await ensureValidAccessToken(connection);
  if (!accessToken) {
    return [] as BoardEvent[];
  }

  const fetchUrl = new URL(
    `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(selectedCalendar.calendarId)}/calendarView`,
  );
  fetchUrl.searchParams.set("startDateTime", dateWindow.startIso);
  fetchUrl.searchParams.set("endDateTime", dateWindow.endIso);
  fetchUrl.searchParams.set("$select", "id,subject,isAllDay,start,end");

  let res = await fetch(fetchUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="UTC"',
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    const refreshed = await refreshMicrosoftToken(connection);
    if (!refreshed) {
      return [];
    }

    accessToken = refreshed;
    res = await fetch(fetchUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'outlook.timezone="UTC"',
      },
      cache: "no-store",
    });
  }

  if (!res.ok) {
    return [];
  }

  const json = (await res.json()) as {
    value?: Array<{
      id: string;
      subject?: string;
      isAllDay?: boolean;
      start?: { dateTime?: string; timeZone?: string };
      end?: { dateTime?: string; timeZone?: string };
    }>;
  };

  return (json.value || []).map((event) => {
    const title = event.subject || "Busy";
    const maskedTitle = selectedCalendar.calendarName || boardName || "Busy";
    const isAllDay = Boolean(event.isAllDay);
    const startAt = isAllDay
      ? toDateOnly(event.start?.dateTime)
      : normalizeMicrosoftDateTime(
          event.start?.dateTime,
          event.start?.timeZone,
        );
    const endAt = isAllDay
      ? toDateOnly(event.end?.dateTime, startAt)
      : normalizeMicrosoftDateTime(
          event.end?.dateTime,
          event.end?.timeZone,
          startAt,
        );

    return {
      id: `${selectedCalendar.provider}:${selectedCalendar.calendarId}:${event.id}`,
      provider: selectedCalendar.provider,
      calendarId: selectedCalendar.calendarId,
      calendarName: selectedCalendar.calendarName,
      title,
      maskedTitle,
      isMasked: masked,
      allDay: isAllDay,
      startAt,
      endAt,
      color: selectedCalendar.color,
    };
  });
}

export async function getBoardEvents(board: BoardLike) {
  await connectToDatabase();

  const selectedCalendars = board.selectedCalendars || [];
  if (selectedCalendars.length === 0) {
    return [] as BoardEvent[];
  }

  const connectionIds = selectedCalendars.map(
    (calendar) => calendar.connectionId,
  );

  const connections = await Connection.find({ _id: { $in: connectionIds } })
    .select("provider accessToken refreshToken expiresAt")
    .lean<ConnectionDoc[]>();

  const connectionMap = new Map(
    connections.map((connection) => [String(connection._id), connection]),
  );

  const dateWindow = calculateDateWindow(board.visibility);
  const masked = Boolean(board.visibility?.masked);

  const results = await Promise.all(
    selectedCalendars.map(async (selectedCalendar) => {
      const connection = connectionMap.get(
        String(selectedCalendar.connectionId),
      );
      if (!connection) {
        return [] as BoardEvent[];
      }

      if (selectedCalendar.provider === "google") {
        return fetchGoogleBoardEvents(
          connection,
          selectedCalendar,
          dateWindow,
          board.name,
          masked,
        );
      }

      return fetchMicrosoftBoardEvents(
        connection,
        selectedCalendar,
        dateWindow,
        board.name,
        masked,
      );
    }),
  );

  return results
    .flat()
    .sort(
      (firstEvent, secondEvent) =>
        new Date(firstEvent.startAt).getTime() -
        new Date(secondEvent.startAt).getTime(),
    );
}
