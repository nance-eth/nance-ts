import cors from 'cors';
import express, { query } from 'express';
import { NotionHandler } from '../notion/notionHandler';
import { getConfig } from '../configLoader';

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: false }));
app.use(cors({ maxAge: 86400 }));

const PORT = process.env.PORT || 3000;

app.use('/notion/:space', async (request, response, next) => {
  const { space } = request.params;
  console.log(space);
  const config = await getConfig(space);
  response.locals.notion = new NotionHandler(config);
  next();
});

app.post('/notion/:space/upload', async (request, response) => {
  const { proposal } = request.body;
  response.locals.notion.addProposalToDb(proposal);
  // console.log(notion.databases.query());
  // const notion = new NotionHandler(config);
  // console.log(await getDatabase());
});

app.get('/notion/:space/getPage/:pageId', async (request, response) => {
  const { pageId } = request.params;
  console.log(pageId);
  console.dir(await response.locals.notion.notion.pages.retrieve({ page_id: pageId }));
});

app.listen(PORT, () => {
  console.log(`Started on: http://localhost:${PORT}`);
});
