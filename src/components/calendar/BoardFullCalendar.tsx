"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { BoardEvent } from "@/src/lib/calendar-sync";

type BoardFullCalendarProps = {
  events: BoardEvent[];
  masked: boolean;
};

export default function BoardFullCalendar({
  events,
  masked,
}: BoardFullCalendarProps) {
  const initialDate = events.length > 0 ? events[0].startAt : undefined;

  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: masked ? "Masked event" : event.title,
    start: event.startAt,
    end: event.endAt,
    allDay: Boolean(event.allDay),
    backgroundColor: event.color || "#64748b",
    borderColor: event.color || "#64748b",
    textColor: "#ffffff",
    extendedProps: {
      calendarName: event.calendarName,
      provider: event.provider,
    },
  }));

  return (
    <div className="rounded-md border p-3">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={initialDate}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
        }}
        height="auto"
        events={calendarEvents}
        eventDisplay="block"
        eventClassNames={() => (masked ? ["fc-masked-event"] : [])}
        displayEventTime={true}
        eventTimeFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
        }}
        eventContent={
          masked
            ? (arg) => {
                if (arg.view.type.startsWith("list")) {
                  return <span>Masked event</span>;
                }

                return (
                  <div
                    className="h-full w-full"
                    aria-label={`Masked event on ${String(arg.event.extendedProps.calendarName || "calendar")}`}
                  />
                );
              }
            : undefined
        }
      />
    </div>
  );
}
