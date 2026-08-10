import { CalendarEvent } from './types';

/** Calendar events come from `/calendar/events` API. */
export const mockCalendarEvents: CalendarEvent[] = [];

export function getEventsForDate(date: string): CalendarEvent[] {
  return mockCalendarEvents.filter((event) => event.date === date);
}
