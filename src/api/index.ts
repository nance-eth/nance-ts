import cors from "cors";
import express from "express";
import { TspecDocsMiddleware } from "tspec";
import { params } from "./tspec";
import system from "./routes/system";
import tasks from "./tasks";
import spaceMiddleware from "./routes/space/middleware";
import spaceInfo from "./routes/space/info"
import { discordInitButtonManager } from "./helpers/discord";

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: false }));
app.use(cors({
  maxAge: 86401,
}));

app.set("json spaces", 2);

// show commit information
app.get("/", (_, res) => {
  const commit = process.env.RAILWAY_GIT_COMMIT_SHA?.substring(0, 7);
  return res.send(`nance-api commit: ${commit ?? "LOCAL"}`);
});

app.use("/ish", system);
app.use("/tasks", tasks);
// app.use("/docs", )
app.use("/:space", spaceMiddleware);
app.use("/:space", spaceInfo)

const init = async () => {
  app.use("/api/docs", await TspecDocsMiddleware(params));
  await discordInitButtonManager();
};

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Started on: http://localhost:${PORT}`);
});

init();
