"use client";

import { useState } from "react";
import { createBoardAction } from "@/src/actions/board-actions";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import type { SelectableCalendar } from "@/src/lib/calendar-sync";

type CustomBoardFormProps = {
  calendars: SelectableCalendar[];
};

export default function CustomBoardForm({ calendars }: CustomBoardFormProps) {
  const [hidePastEvents, setHidePastEvents] = useState(false);
  const [pastDays, setPastDays] = useState(7);

  const onToggleHidePast = (checked: boolean) => {
    setHidePastEvents(checked);
    if (checked) {
      setPastDays(0);
    } else if (pastDays === 0) {
      setPastDays(7);
    }
  };

  const onPastDaysChange = (value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    setPastDays(safeValue);

    if (safeValue > 0 && hidePastEvents) {
      setHidePastEvents(false);
    }

    if (safeValue === 0 && !hidePastEvents) {
      return;
    }
  };

  return (
    <form action={createBoardAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="board-name">Board Name</Label>
        <Input
          id="board-name"
          name="name"
          placeholder="Office Calendar / Team View / X Calendar"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Select Calendars</Label>
        {calendars.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No calendars available yet. Connect Google or Microsoft first.
          </p>
        ) : (
          <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-3">
            {calendars.map((calendar, index) => {
              const value = [
                calendar.connectionId,
                calendar.provider,
                calendar.calendarId,
                calendar.calendarName,
                calendar.color || "",
              ].join("||");

              const id = `cal-${index}`;

              return (
                <label key={id} htmlFor={id} className="flex items-start gap-3">
                  <input
                    id={id}
                    name="selectedCalendars"
                    type="checkbox"
                    value={value}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {calendar.calendarName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {calendar.provider === "google" ? "Google" : "Microsoft"}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="masked" />
          Mask event titles
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="hidePastEvents"
            checked={hidePastEvents}
            onChange={(event) => onToggleHidePast(event.target.checked)}
          />
          Hide past events
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="past-days">Past days visible</Label>
          <Input
            id="past-days"
            name="pastDays"
            type="number"
            min={0}
            value={pastDays}
            onChange={(event) => onPastDaysChange(Number(event.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="future-days">Future days visible</Label>
          <Input
            id="future-days"
            name="futureDays"
            type="number"
            min={1}
            defaultValue={14}
          />
        </div>
      </div>

      <Button type="submit" disabled={calendars.length === 0}>
        Create Board
      </Button>
    </form>
  );
}
