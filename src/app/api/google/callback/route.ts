import { NextResponse } from "next/server";
import connectToDatabase from "@/src/lib/mongodb";
import { getSessionUser } from "@/src/lib/session";
import Connection from "@/src/models/Connection";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard?google=missing-code", url),
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL("/dashboard?google=oauth-not-configured", url),
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL("/dashboard?google=token-exchange-failed", url),
    );
  }

  const tokenJson = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };

  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    },
  );

  if (!profileRes.ok) {
    return NextResponse.redirect(
      new URL("/dashboard?google=profile-fetch-failed", url),
    );
  }

  const profile = (await profileRes.json()) as {
    sub: string;
    name: string;
    email: string;
    picture?: string;
  };

  await connectToDatabase();

  const existing = await Connection.findOne({
    userId: user.id,
    provider: "google",
    providerAccountId: profile.sub,
  })
    .select("refreshToken")
    .lean<{ refreshToken?: string }>();
  console.log("profiles" + profile.sub, profile.name, profile.email);

  await Connection.findOneAndReplace(
    { userId: user.id, provider: "google", providerAccountId: profile.sub },
    {
      userId: user.id,
      username: profile.name || profile.email,
      imageUrl: profile.picture,
      email: profile.email,
      provider: "google",
      providerAccountId: profile.sub,
      accessToken: tokenJson.access_token,
      refreshToken: tokenJson.refresh_token || existing?.refreshToken || "",
      expiresAt: tokenJson.expires_in
        ? Math.floor(Date.now() / 1000) + tokenJson.expires_in
        : undefined,
      scope: tokenJson.scope,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return NextResponse.redirect(new URL("/dashboard?google=connected", url));
}
