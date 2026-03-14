"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/src/lib/mongodb";
import { getSessionUser } from "@/src/lib/session";
import Board from "@/src/models/Board";

type ParsedCalendar = {
  connectionId: string;
  provider: "google" | "outlook";
  calendarId: string;
  calendarName: string;
  color?: string;
};

function parseSelectedCalendar(value: string): ParsedCalendar | null {
  const [connectionId, provider, calendarId, calendarName, color] =
    value.split("||");

  if (!connectionId || !provider || !calendarId || !calendarName) {
    return null;
  }

  if (provider !== "google" && provider !== "outlook") {
    return null;
  }

  return {
    connectionId,
    provider,
    calendarId,
    calendarName,
    color,
  };
}

export async function createBoardAction(formData: FormData) {
  const user = await getSessionUser();

  if (!user) {
    return;
  }

  const name = String(formData.get("name") || "").trim();
  const selectedCalendarsRaw = formData.getAll("selectedCalendars");
  const masked = formData.get("masked") === "on";
  const hidePastEvents = formData.get("hidePastEvents") === "on";
  const futureDaysInput = Number(formData.get("futureDays") || 14);
  const pastDaysInput = Number(formData.get("pastDays") || 7);

  if (!name || selectedCalendarsRaw.length === 0) {
    return;
  }

  const selectedCalendars = selectedCalendarsRaw
    .map((value) => parseSelectedCalendar(String(value)))
    .filter((calendar): calendar is ParsedCalendar => Boolean(calendar));

  if (selectedCalendars.length === 0) {
    return;
  }

  const futureDays = Number.isFinite(futureDaysInput)
    ? Math.max(1, futureDaysInput)
    : 14;

  const pastDays = hidePastEvents
    ? 0
    : Number.isFinite(pastDaysInput)
      ? Math.max(0, pastDaysInput)
      : 7;

  await connectToDatabase();

  await Board.create({
    userId: user.id,
    name,
    selectedCalendars,
    visibility: {
      masked,
      hidePastEvents,
      pastDays,
      futureDays,
    },
  });

  revalidatePath("/dashboard");
}
