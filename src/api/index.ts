import cors from 'cors';
import express from 'express';
import { TspecDocsMiddleware } from 'tspec';
import { params } from './tspec';
import api from './api';
import ish from './nanceish';
import tasks from './tasks';

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

app.use((req, res, next) => {
  const clientIp = req.ip || req.ips[0];
  console.log(`Client connected with IP address: ${clientIp}`);
  // log route
  console.log(`Route: ${req.method} ${req.originalUrl}`);
  next();
});

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
