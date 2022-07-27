import { GithubAPI } from '../githubAPI';
import { NotionHandler } from '../../notion/notionHandler';
import { keys } from '../../keys';

async function main() {
  const github = new GithubAPI(keys.GITHUB_KEY, 'jigglyjams', 'dev-governance');
  console.log(await github.lastCommitSHA());
  console.log(await github.getSHA('VERSION'));
  // const nextGovernanceVersion = Number(await github.getContent('VERSION')) + 1;
  // await github.pushContent(`GC${nextGovernanceVersion}/JBP-123_zh.md`, 'hihihih');
}

main();
