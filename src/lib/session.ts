import connectToDatabase from "@/src/lib/mongodb";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/src/lib/auth";
import User from "@/src/models/User";
import { cookies } from "next/headers";

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return null;
  }

  await connectToDatabase();
  const user = await User.findById(payload.userId).lean();

  if (!user) {
    return null;
  }

  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    image: user.image,
  };
}
