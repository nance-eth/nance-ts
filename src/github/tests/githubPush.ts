import { GithubHandler } from '../githubHandler';
import { NotionHandler } from '../../notion/notionHandler';
import { keys } from '../../keys';

async function main() {
  const github = new GithubHandler(keys.GITHUB_KEY, 'jigglyjams', 'dev-governance');
  console.log(await github.lastCommitSHA());
  // console.log(await github.pushContent('JBP-123', 'proposal'));
  console.log(Number(await github.getContent('VERSION')));
}

main();
