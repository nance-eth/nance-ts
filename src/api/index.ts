import cors from 'cors';
import express from 'express';
import { TspecDocsMiddleware } from 'tspec';
import { params } from './tspec';
import api from './api';
import ish from './nanceish';
import tasks from './tasks';
import { limiter, bannedIps } from "./limiter";

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: false }));
app.use(cors({
  maxAge: 86400,
}));

app.set('trust proxy', 1);
app.use(limiter);
app.use((req, res, next) => {
  const ip = req.ip || req.ips[0];
  if (bannedIps.includes(ip)) {
    console.error(`Banned IP address: ${ip}`);
    res.status(403).send('you banned.');
    return;
  }
  console.log(`Client connected with IP address: ${req.ip || req.ips[0]}`);
  console.log(`Request URL: ${req.url}`);
  console.log('==============================================');
  next();
});

app.set('json spaces', 2);

app.use('/ish', ish);

app.use('/tasks', tasks);

app.use('/', api);

app.get('/', (req, res) => {
  return res.send(`nance-api commit: ${process.env.RAILWAY_GIT_COMMIT_SHA?.substring(0, 7) ?? 'LOCAL'}`);
});

const initDocs = async () => {
  app.use('/api/docs', await TspecDocsMiddleware(params));
};

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Started on: http://localhost:${PORT}`);
});

initDocs();
