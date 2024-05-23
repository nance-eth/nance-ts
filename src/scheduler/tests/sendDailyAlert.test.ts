import schedule from "node-schedule";
import { sendDailyAlert } from "../../tasks";

async function main() {
  // schedule daily alert for moondao 1 minute from now
  const minute = new Date().getUTCMinutes() + 1;
  const cronNotation = `${minute} * * * *`;
  try {
    schedule.scheduleJob('moondao:sendDailyAlert', cronNotation, async () => {
      try {
        await sendDailyAlert('moondao');
      } catch (e) {
        console.error(e);
      }
    });
  } catch (e) {
    console.error(e);
  }
  console.log('scheduled sendDailyAlert for moondao');
  console.log(schedule.scheduledJobs['moondao:sendDailyAlert'].nextInvocation().toISOString());
}

main();
