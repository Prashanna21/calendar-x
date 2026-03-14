"use server";

import { redirect } from "next/navigation";

export async function connectGoogleCalendarAction() {
  redirect("/api/google/connect");
}

export async function connectMicrosoftCalendarAction() {
  redirect("/api/microsoft/connect");
}
