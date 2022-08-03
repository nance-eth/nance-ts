import { GithubAPI } from '../githubAPI';
import { NotionHandler } from '../../notion/notionHandler';
import { keys } from '../../keys';

async function main() {
  const github = new GithubAPI(keys.GITHUB_KEY, 'jigglyjams', 'dev-governance');
  console.log(await github.getDirectories());
}

main();
