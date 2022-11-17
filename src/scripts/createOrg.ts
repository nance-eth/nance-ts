import fs from 'fs';
import template from '../config/template/template.json';

const configPath = './src/config';

function initOrg(org: string) {
  if (!fs.existsSync(`${configPath}/${org}`)){ fs.mkdirSync(`${configPath}/${org}`); }
  const output = template;
  output.name = org;
  output.discord.API_KEY = `DISCORD_KEY_${org.toUpperCase()}`;
  output.notion.API_KEY = `NOTION_KEY_${org.toUpperCase()}`;
  output.notion.propertyKeys.proposalId = template.notion.propertyKeys.proposalId.replace('${NAME}', org);
  output.github.propertyKeys.proposalId = template.github.propertyKeys.proposalId.replace('${NAME}', org);
  output.notion.propertyKeys.proposalIdPrefix = org.slice(0, 2);
  output.snapshot.space = `${org}.eth`;

  fs.writeFileSync(`${configPath}/${org}/${org}.json`, JSON.stringify(output, null, 2));
  fs.copyFileSync(`${configPath}/template/template.ics`, `${configPath}/${org}/${org}.ics`);
}

initOrg(process.argv[2]);
