import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

import { getSelectableCalendarsForUser } from "@/src/lib/calendar-sync";
import connectToDatabase from "@/src/lib/mongodb";
import { getSessionUser } from "@/src/lib/session";
import Board from "@/src/models/Board";
import CustomBoardForm from "@/src/components/forms/custom-board-form";
import CopyBoardLinkButton from "@/src/components/custom-ui/copy-board-link-button";

type BoardListItem = {
  _id: string;
  name: string;
  visibility?: { masked?: boolean; pastDays?: number; futureDays?: number };
  selectedCalendars: Array<{ calendarName: string }>;
};

export default async function CustomCalendarSection() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const calendars = await getSelectableCalendarsForUser(user.id);
  const serializableCalendars = calendars.map((calendar) => ({
    ...calendar,
    connectionId: String(calendar.connectionId),
  }));

  await connectToDatabase();
  const boards = await Board.find({ userId: user.id })
    .select("name visibility selectedCalendars createdAt")
    .sort({ createdAt: -1 })
    .lean<BoardListItem[]>();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Custom Calendar Boards</CardTitle>
        <CardDescription>
          Create multiple named boards by selecting calendars from connected
          Google and Microsoft accounts.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <CustomBoardForm calendars={serializableCalendars} />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Created Boards</h3>
          {boards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No boards created yet.
            </p>
          ) : (
            <div className="space-y-2">
              {boards.map((board) => {
                const boardId = String(board._id);

                return (
                  <div key={boardId} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{board.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {board.selectedCalendars.length} calendar(s) selected
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {board.visibility?.masked ? "Masked" : "Unmasked"} •
                          Past {board.visibility?.pastDays ?? 0}d • Future{" "}
                          {board.visibility?.futureDays ?? 14}d
                        </p>
                        <Link
                          href={`/board/${boardId}`}
                          className="mt-2 inline-block text-sm font-medium text-foreground underline underline-offset-4"
                        >
                          Open board preview
                        </Link>
                      </div>
                      <CopyBoardLinkButton boardId={boardId} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
