import { NotionHandler } from '../notionHandler';
import config from '../../config/config.dev';
import { keys } from '../../keys';

if (keys.NOTION_KEY) {
  const notion = new NotionHandler(keys.NOTION_KEY, config.database_id, config.filters);
  notion.getDiscussions().then((r) => {
    console.log(r);
  });
}
