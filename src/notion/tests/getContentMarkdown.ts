import { NotionHandler } from '../notionHandler';
import config from '../../config/config.dev';
import { keys } from '../../keys';

if (keys.NOTION_KEY) {
  const notion = new NotionHandler(keys.NOTION_KEY, config.database_id, config.filters);
  notion.getContentMarkdown('6a6ab6e6-5933-4d77-a0aa-6792ccc2b20b').then((r) => {
    console.log(r);
  });
}
