"use server";

import { redirect } from "next/navigation";
import connectToDatabase from "@/src/lib/mongodb";
import {
  clearSession,
  hashPassword,
  setSession,
  verifyPassword,
} from "@/src/lib/auth";
import User from "@/src/models/User";

export type AuthActionState = {
  error: string | null;
};

const initialState: AuthActionState = { error: null };

function getTextField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function signupAction(
  _prevState: AuthActionState = initialState,
  formData: FormData,
): Promise<AuthActionState> {
  void _prevState;
  const email = getTextField(formData, "email").toLowerCase();
  const password = getTextField(formData, "password");
  const name = getTextField(formData, "name");
  const confirmPassword = getTextField(formData, "confirmPassword");

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (!name) {
    return { error: "Username is required." };
  }

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  await connectToDatabase();

  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const user = await User.create({
    email,
    passwordHash: hashPassword(password),
    name,
    connectedAccounts: [],
  });

  await setSession(String(user._id));
  redirect("/dashboard");
}

export async function loginAction(
  _prevState: AuthActionState = initialState,
  formData: FormData,
): Promise<AuthActionState> {
  void _prevState;
  const email = getTextField(formData, "email").toLowerCase();
  const password = getTextField(formData, "password");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  await connectToDatabase();

  const user = await User.findOne({ email });
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const isValid = verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "Invalid email or password." };
  }

  await setSession(String(user._id));
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
