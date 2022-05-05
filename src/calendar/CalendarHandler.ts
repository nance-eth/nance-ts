import ical, { CalendarResponse, VEvent } from 'node-ical';
import { formatUTCTime } from '../utils';

type DateEvent = {
  date: Date,
  event: string
};

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

  getNextEvent(): any {
    const nextDates: DateEvent[] = [];
    const now = new Date();
    Object.keys(this.events).forEach((key:string) => {
      const event = this.events[key] as VEvent;
      if (event.type !== 'VEVENT' || !event.rrule) return;
      const nextEventDate = event.rrule.after(now, true);
      const nextEventDateUTC = formatUTCTime(nextEventDate);
      nextDates.push({ date: nextEventDateUTC, event: event.summary });
    });
    const sortedNextDates = nextDates.sort((a: DateEvent, b: DateEvent) => {
      return a.date.getTime() - b.date.getTime();
    });
    return sortedNextDates[0];
  }
}
