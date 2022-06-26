import ical, { CalendarResponse, VEvent } from 'node-ical';
import { addDaysToDate, formatUTCTime } from '../utils';
import { DateEvent } from '../types';

export class CalendarHandler {
  public events: CalendarResponse;

  constructor(
    private icsFile: string,
  ) {
    this.events = ical.sync.parseFile(this.icsFile);
  }

  async useIcsLinkInstead(icsURL:string) {
    this.events = await ical.fromURL(icsURL);
  }

  getNextEvents(): DateEvent[] {
    const nextDates: DateEvent[] = [];
    const yesterday = addDaysToDate(new Date(), -1); // yesterday so can test today
    Object.keys(this.events).forEach((key:string) => {
      const event = this.events[key] as VEvent;
      if (event.type !== 'VEVENT' || !event.rrule) return;
      const eventDateStart = event.rrule.after(yesterday, true);
      const originalEventLength = (new Date(event.end).valueOf() - new Date(event.start).valueOf());
      const eventDateStartUTC = formatUTCTime(eventDateStart);
      const eventDateEndUTC = new Date(eventDateStartUTC.valueOf() + originalEventLength);
      nextDates.push({
        title: event.summary,
        start: eventDateStartUTC,
        end: eventDateEndUTC
      });
    });
    const sortedNextDates = nextDates.sort((a: DateEvent, b: DateEvent) => {
      return a.start.getTime() - b.start.getTime();
    });
    return sortedNextDates;
  }
}
