import { NotionHandler } from '../notionHandler';
import config from '../../config/dev/config.dev';
import { keys } from '../../keys';
import { NanceConfig } from '../../types';

if (keys.NOTION_KEY) {
  const notion = new NotionHandler(keys.NOTION_KEY, config as NanceConfig);
  notion.getToDiscuss().then((r) => {
    console.log(r);
  });
}
