import { logoutAction } from "@/src/actions/auth-actions";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { getSessionUser } from "@/src/lib/session";

export default async function DashboardSection() {
  const user = await getSessionUser();
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Username</p>
          <p className="font-medium">{user?.name || "N/A"}</p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{user?.email}</p>
        </div>

        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Logout
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
