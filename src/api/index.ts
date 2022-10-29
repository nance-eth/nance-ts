import cors from 'cors';
import express from 'express';
import api from './api';
import { SPACES } from '../config/map';
// hacks /
import config from '../config/juicebox/config.juicebox';
import config2 from '../config/waterbox/config.waterbox';
import config3 from '../config/slice/config.slice';
import config4 from '../config/jigglyjams/config.jigglyjams';

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: false }));
app.use(cors({
  origin: 'https://juicetool-24ahx8sqh-jigglyjams.vercel.app',
  maxAge: 86400,
}));
app.use('/', api);

app.get('/', (request, response) => {
  return response.send(`nance-api commit:${process.env.RAILWAY_GIT_COMMIT_SHA?.substring(0, 7) ?? ''}`);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Started on: http://localhost:${PORT}`);
});
