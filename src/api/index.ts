import cors from "cors";
import express from "express";
import { TspecDocsMiddleware } from "tspec";
import { params } from "./tspec";

import { discordInitButtonManager } from "./helpers/discord";

import tasks from "./tasks";
import system from "./routes/system";
import snapshotProposal from "./routes/snapshot";
import spaceMiddleware from "./routes/space/middleware";
import spaceInfo from "./routes/space/info";
import spaceProposal from "./routes/space/proposal";
import spaceProposals from "./routes/space/proposals";
import spaceReconfig from "./routes/space/reconfig";
import spaceSummary from "./routes/space/summary";
// import spaceDiscussion from "./routes/space/discussion";

const PORT = process.env.PORT || 3003;
const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: false }));
app.use(cors({
  maxAge: 86400,
}));

app.set("json spaces", 2);

app.listen(PORT, () => {
  console.log(`Started on: http://localhost:${PORT}`);
});

// show commit information
app.get("/", (_, res) => {
  const commit = process.env.RAILWAY_GIT_COMMIT_SHA?.substring(0, 7);
  return res.send(`nance-api commit: ${commit ?? "LOCAL"}`);
});

const init = async () => {
  app.use("/docs", await TspecDocsMiddleware(params));
  app.use("/ish", system);
  app.use("/tasks", tasks);
  app.use("/~/proposal", snapshotProposal);
  app.use("/:space", spaceMiddleware);
  app.use("/:space", spaceInfo);
  app.use("/:space/proposal", spaceProposal);
  app.use("/:space/proposals", spaceProposals);
  app.use("/:space/reconfig", spaceReconfig);
  app.use("/:space/summary", spaceSummary);
  // app.use("/:space/discussion", spaceDiscussion);
  await discordInitButtonManager();
};

init();
