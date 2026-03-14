import { NextResponse } from "next/server";
import connectToDatabase from "@/src/lib/mongodb";
import { getSessionUser } from "@/src/lib/session";
import Connection from "@/src/models/Connection";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard?microsoft=missing-code", url),
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", url));
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri =
    process.env.MICROSOFT_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/microsoft/callback`;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL("/dashboard?microsoft=oauth-not-configured", url),
    );
  }

  const tokenRes = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    },
  );

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL("/dashboard?microsoft=token-exchange-failed", url),
    );
  }

  const tokenJson = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };

  const profileRes = await fetch(
    "https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName",
    {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    },
  );

  if (!profileRes.ok) {
    return NextResponse.redirect(
      new URL("/dashboard?microsoft=profile-fetch-failed", url),
    );
  }

  const profile = (await profileRes.json()) as {
    id: string;
    displayName?: string;
    mail?: string;
    userPrincipalName?: string;
  };

  const email = profile.mail || profile.userPrincipalName;
  if (!email) {
    return NextResponse.redirect(
      new URL("/dashboard?microsoft=email-missing", url),
    );
  }

  let imageUrl: string | undefined;
  const photoRes = await fetch(
    "https://graph.microsoft.com/v1.0/me/photo/$value",
    {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    },
  );

  if (photoRes.ok) {
    const photoBuffer = Buffer.from(await photoRes.arrayBuffer());
    const contentType = photoRes.headers.get("content-type") || "image/jpeg";
    imageUrl = `data:${contentType};base64,${photoBuffer.toString("base64")}`;
  }

  await connectToDatabase();

  const existing = await Connection.findOne({
    userId: user.id,
    provider: "outlook",
    providerAccountId: profile.id,
  })
    .select("refreshToken")
    .lean<{ refreshToken?: string }>();

  await Connection.findOneAndReplace(
    { userId: user.id, provider: "outlook", providerAccountId: profile.id },
    {
      userId: user.id,
      provider: "outlook",
      username: profile.displayName || email,
      imageUrl,
      email,
      providerAccountId: profile.id,
      accessToken: tokenJson.access_token,
      refreshToken: tokenJson.refresh_token || existing?.refreshToken || "",
      expiresAt: tokenJson.expires_in
        ? Math.floor(Date.now() / 1000) + tokenJson.expires_in
        : undefined,
      scope: tokenJson.scope,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return NextResponse.redirect(new URL("/dashboard?microsoft=connected", url));
}
