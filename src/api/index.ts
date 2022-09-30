import cors from 'cors';
import express from 'express';
import api from './api';
// hacks
import config from '../config/juicebox/config.juicebox';
import config2 from '../config/waterbox/config.waterbox';

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: false }));
app.use(cors({
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
