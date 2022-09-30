import { NotionHandler } from '../notionHandler';
import config from '../../config/waterbox/config.waterbox';

const notion = new NotionHandler(config);
notion.getToDiscuss().then((r) => {
  console.log(r);
});
