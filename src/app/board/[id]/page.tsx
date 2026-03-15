import { notFound } from "next/navigation";
import { headers } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import BoardFullCalendar from "../../../components/calendar/BoardFullCalendar";
import { getBoardEvents } from "@/src/lib/calendar-sync";
import connectToDatabase from "@/src/lib/mongodb";
import Board from "@/src/models/Board";
import ShareBoardLink from "@/src/components/custom-ui/share-board-link";

export const dynamic = "force-dynamic";

type BoardPageProps = {
  params: Promise<{ id: string }>;
};

type BoardDocument = {
  _id: string;
  name: string;
  selectedCalendars: Array<{
    connectionId: string;
    provider: "google" | "outlook";
    calendarId: string;
    calendarName: string;
    color?: string;
  }>;
  visibility?: {
    masked?: boolean;
    hidePastEvents?: boolean;
    pastDays?: number;
    futureDays?: number;
  };
};

export default async function BoardPreviewPage({ params }: BoardPageProps) {
  const { id } = await params;

  await connectToDatabase();
  const board = await Board.findById(id).lean<BoardDocument | null>();

  if (!board) {
    notFound();
  }

  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") || "https";
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  const origin = host ? `${protocol}://${host}` : appUrl || "";
  const shareUrl = `${origin}/board/${board._id}`;

  const events = await getBoardEvents(board);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 p-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{board.name}</CardTitle>
            <CardDescription>
              {board.visibility?.masked ? "Masked" : "Unmasked"} events • Past{" "}
              {board.visibility?.pastDays ?? 0} days • Future{" "}
              {board.visibility?.futureDays ?? 14} days
            </CardDescription>
          </div>
          <ShareBoardLink shareUrl={shareUrl} />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendar Events</CardTitle>
          <CardDescription>
            {events.length} event(s) from {board.selectedCalendars.length}{" "}
            selected calendar(s)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No events found in this board range.
            </p>
          ) : (
            <BoardFullCalendar
              events={events}
              masked={Boolean(board.visibility?.masked)}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
