import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/lib/session";
import DashboardSection from "./_components/DashboardSection";
import ConnectionSection from "./_components/ConnectionSection";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex flex-col gap-8 w-full max-w-3xl items-start p-6">
      <DashboardSection />

      <ConnectionSection />
    </main>
  );
}
