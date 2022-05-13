import ical, { CalendarResponse, VEvent } from 'node-ical';
import { addDaysToDate, formatUTCTime } from '../utils';
import { DateEvent } from '../types';

export class CalendarHandler {
  public events: CalendarResponse;

  constructor(
    private icsLink: string,
  ) {
    this.events = ical.sync.parseFile(this.icsLink);
  }

  async useIcsLinkInstead(icsURL:string) {
    this.events = await ical.fromURL(icsURL);
  }

  getNextEvent(): DateEvent {
    const nextDates: DateEvent[] = [];
    const now = new Date();
    Object.keys(this.events).forEach((key:string) => {
      const event = this.events[key] as VEvent;
      if (event.type !== 'VEVENT' || !event.rrule) return;
      const eventDateStart = event.rrule.after(now, true);
      const originalEventLength = (new Date(event.end).valueOf() - new Date(event.start).valueOf());
      const eventDateStartUTC = formatUTCTime(eventDateStart);
      const eventDateEndUTC = new Date(eventDateStartUTC.valueOf() + originalEventLength);
      nextDates.push({
        event: event.summary,
        start: eventDateStartUTC,
        end: eventDateEndUTC
      });
    });
    const sortedNextDates = nextDates.sort((a: DateEvent, b: DateEvent) => {
      return a.start.getTime() - b.start.getTime();
    });
    return sortedNextDates[0];
  }
}
