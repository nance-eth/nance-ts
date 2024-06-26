import cors from 'cors';
import express from 'express';
import { TspecDocsMiddleware } from 'tspec';
import { params } from './tspec';
import api from './api';
import ish from './nanceish';
import tasks from './tasks';
import { discordInitButtonManager } from "./helpers/discord";

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: false }));
app.use(cors({
  maxAge: 86400,
}));

app.set('json spaces', 2);

app.use('/ish', ish);

app.use('/tasks', tasks);

app.use('/', api);

app.get('/', (req, res) => {
  return res.send(`nance-api commit: ${process.env.RAILWAY_GIT_COMMIT_SHA?.substring(0, 7) ?? 'LOCAL'}`);
});

const init = async () => {
  app.use('/api/docs', await TspecDocsMiddleware(params));
  await discordInitButtonManager();
};

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Started on: http://localhost:${PORT}`);
});

init();
