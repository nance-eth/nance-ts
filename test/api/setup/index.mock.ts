// this replaces @/api/index.ts
// allows for middleware injection and to remove some discord dependencies
import cors from "cors";
import express from "express";
import { initializePools } from "@/dolt/pools";

// routes
import system from "@/api/routes/system";
import snapshotProposal from "@/api/routes/snapshot";
import spaceInfo from "@/api/routes/space/info";
import tasks from "@/api/routes/space/tasks";
import spaceProposal from "@/api/routes/space/proposal";
import spaceProposals from "@/api/routes/space/proposals";
import spaceReconfig from "@/api/routes/space/reconfig";
import spaceSummary from "@/api/routes/space/summary";
import spaceActions from "@/api/routes/space/actions";
import mockSpaceMiddleware from "./middleware/space.mock";
import authMiddleware from "./middleware/auth.mock";

const PORT = process.env.PORT || 3003;
const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: false }));
app.use(cors({
  maxAge: 86400,
}));

app.set("json spaces", 2);

const server = app.listen(PORT, () => {
  console.log(`[API] Started on: http://localhost:${PORT}`);
});

export const init = async () => {
  console.log("[API] init...");
  await initializePools();
  app.use("/ish", authMiddleware, system);
  app.use("/~/proposal", snapshotProposal);
  app.use("/:space", mockSpaceMiddleware, spaceInfo);
  app.use("/:space/tasks", tasks);
  app.use("/:space/proposal", spaceProposal);
  app.use("/:space/proposals", spaceProposals);
  app.use("/:space/reconfig", spaceReconfig);
  app.use("/:space/summary", spaceSummary);
  app.use("/:space/actions", spaceActions);
  console.log("[API] ready!");
};

export const shutdown = async () => {
  console.log("Shutting down...");
  server.close();
};
