import cors from "cors";
import express from "express";
import { TspecDocsMiddleware } from "tspec";
import { params } from "./tspec";
import { discordInitInteractionManager } from "./helpers/discord";
import { initializePools } from "@/dolt/pools";

// routes
import system from "./routes/system";
import snapshotProposal from "./routes/snapshot";
import spaceMiddleware from "./routes/space/middleware";
import spaceInfo from "./routes/space/info";
import tasks from "./routes/space/tasks";
import spaceProposal from "./routes/space/proposal";
import spaceProposals from "./routes/space/proposals";
import spaceReconfig from "./routes/space/reconfig";
import spaceSummary from "./routes/space/summary";
import spaceActions from "./routes/space/actions";

const PORT = process.env.PORT || 3003;
const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: false }));
app.use(cors({
  maxAge: 86400,
}));

app.set("json spaces", 2);

app.listen(PORT, () => {
  console.log(`[API] Started on: http://localhost:${PORT}`);
});

// show commit information
app.get("/", (_, res) => {
  const commit = process.env.RAILWAY_GIT_COMMIT_SHA?.substring(0, 7);
  return res.send(`nance-api commit: ${commit ?? "LOCAL"}`);
});

export const init = async () => {
  console.log("[API] init...");
  await initializePools();
  await discordInitInteractionManager();
  app.use("/docs", await TspecDocsMiddleware(params));
  app.use("/ish", system);
  app.use("/~/proposal", snapshotProposal);
  app.use("/:space", spaceMiddleware, spaceInfo);
  app.use("/:space/tasks", tasks)
  app.use("/:space/proposal", spaceProposal);
  app.use("/:space/proposals", spaceProposals);
  app.use("/:space/reconfig", spaceReconfig);
  app.use("/:space/summary", spaceSummary);
  app.use("/:space/actions", spaceActions);
  console.log("[API] ready!");
};

init();
