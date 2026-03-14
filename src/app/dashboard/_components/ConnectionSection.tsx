import {
  connectGoogleCalendarAction,
  connectMicrosoftCalendarAction,
} from "@/src/actions/calendar-actions";
import Image from "next/image";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import connectToDatabase from "@/src/lib/mongodb";
import { getSessionUser } from "@/src/lib/session";
import Connection from "@/src/models/Connection";

type ConnectedAccount = {
  _id: string;
  provider: "google" | "outlook";
  username: string;
  email: string;
  imageUrl?: string;
};

async function ConnectionSection() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  await connectToDatabase();

  const connections = await Connection.find({ userId: user.id })
    .select("provider username email imageUrl")
    .lean<ConnectedAccount[]>();

  const googleAccounts = connections.filter(
    (connection) => connection.provider === "google",
  );
  const microsoftAccounts = connections.filter(
    (connection) => connection.provider === "outlook",
  );

  const googleCount = googleAccounts.length;
  const microsoftCount = microsoftAccounts.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Calendar Connections</CardTitle>
        <CardDescription>
          Connect multiple Google and Microsoft calendars to build shareable
          board views.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-md border p-4">
          <div className="space-y-3">
            <p className="font-medium">Google Calendar</p>
            <p className="text-sm text-muted-foreground">
              {googleCount > 0
                ? `${googleCount} account(s) connected`
                : "No Google account connected"}
            </p>

            {googleAccounts.length > 0 ? (
              <div className="space-y-2">
                {googleAccounts.map((account) => (
                  <div key={account._id} className="flex items-center gap-3">
                    {account.imageUrl ? (
                      <Image
                        src={account.imageUrl}
                        alt={account.username}
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full border"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium">
                        {account.username?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {account.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {account.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <form action={connectGoogleCalendarAction}>
            <Button
              type="submit"
              variant={googleCount > 0 ? "outline" : "default"}
            >
              {googleCount > 0 ? "Connect Another" : "Connect Google"}
            </Button>
          </form>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border p-4">
          <div className="space-y-3">
            <p className="font-medium">Microsoft Calendar</p>
            <p className="text-sm text-muted-foreground">
              {microsoftCount > 0
                ? `${microsoftCount} account(s) connected`
                : "No Microsoft account connected"}
            </p>

            {microsoftAccounts.length > 0 ? (
              <div className="space-y-2">
                {microsoftAccounts.map((account) => (
                  <div key={account._id} className="flex items-center gap-3">
                    {account.imageUrl ? (
                      <Image
                        src={account.imageUrl}
                        alt={account.username}
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full border"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium">
                        {account.username?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {account.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {account.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <form action={connectMicrosoftCalendarAction}>
            <Button
              type="submit"
              variant={microsoftCount > 0 ? "outline" : "default"}
            >
              {microsoftCount > 0 ? "Connect Another" : "Connect Microsoft"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export default ConnectionSection;
