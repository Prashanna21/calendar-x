import { notFound } from "next/navigation";
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

  const events = await getBoardEvents(board);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>{board.name}</CardTitle>
          <CardDescription>
            {board.visibility?.masked ? "Masked" : "Unmasked"} events • Past{" "}
            {board.visibility?.pastDays ?? 0} days • Future{" "}
            {board.visibility?.futureDays ?? 14} days
          </CardDescription>
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
