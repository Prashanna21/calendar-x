import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri =
    process.env.MICROSOFT_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/microsoft/callback`;

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(
      new URL("/dashboard?microsoft=oauth-not-configured", request.url),
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope:
      "openid profile offline_access User.Read https://graph.microsoft.com/Calendars.Read",
    prompt: "consent",
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`,
  );
}
