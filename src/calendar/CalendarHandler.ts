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
    // look back 4 days in case this runs in middle of event
    const daysPast = addDaysToDate(new Date(), -4);
    Object.keys(this.events).forEach((key:string) => {
      const event = this.events[key] as VEvent;
      if (event.type !== 'VEVENT' || !event.rrule) return;
      const eventDateStart = event.rrule.after(daysPast, true);
      const originalEventLength = (new Date(event.end).valueOf() - new Date(event.start).valueOf());
      const eventDateStartUTC = formatUTCTime(eventDateStart);
      const eventDateEndUTC = new Date(eventDateStartUTC.valueOf() + originalEventLength);
      const eventInProgress = eventDateStartUTC <= formatUTCTime(new Date());
      nextDates.push({
        title: event.summary,
        start: eventDateStartUTC,
        end: eventDateEndUTC,
        inProgress: eventInProgress
      });
    });
    const sortedNextDates = nextDates.sort((a: DateEvent, b: DateEvent) => {
      return a.start.getTime() - b.start.getTime();
    });
    return sortedNextDates;
  }
}
