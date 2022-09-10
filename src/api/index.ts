import cors from 'cors';
import express from 'express';
import { NotionHandler } from '../notion/notionHandler';
import { getConfig } from '../configLoader';

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: false }));
app.use(cors({ maxAge: 86400 }));

const PORT = process.env.PORT || 3000;

app.use(async (request, response, next) => {
  const { space } = request.body;
  const config = await getConfig(space);
  response.locals.notion = new NotionHandler(config);
  next();
});

app.post('/notion', async (request, response, next) => {
  console.log(await response.locals.notion.getPayoutsDb('V2'));
  // const notion = new NotionHandler(config);
  // console.log(await getDatabase());
});

app.listen(PORT, () => {
  console.log(`Started on: http://localhost:${PORT}`);
});
