import { keys } from '../../keys';
import { DeeplHandler } from '../deeplHandler';
import { NotionHandler } from '../../notion/notionHandler';
import config from '../../config/dev/config.dev';
import logger from '../../logging';

const translator = new DeeplHandler(keys.DEEPL_KEY);
const notion = new NotionHandler(keys.NOTION_KEY, config);

const pageId = '5fd9fcde35e84b5cb7af24d57104d78c';
const language = 'zh';

async function translatePage() {
  const content = await notion.getContentMarkdown(pageId);
  const tranlation = await translator.translate(content, language);
  logger.info(tranlation);
}

translatePage();
