import { NotionHandler } from '../notionHandler';
import config from '../../config/dev/config.dev';

const notion = new NotionHandler(config);
notion.getToDiscuss().then((r) => {
  console.log(r);
});
