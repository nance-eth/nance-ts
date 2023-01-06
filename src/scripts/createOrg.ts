import 'dotenv/config';
import fs from 'fs';
import mysql from 'mysql2';
import { DoltSQL } from '../dolt/doltSQL';
import template from '../config/template/template.json';
import { sleep } from '../utils';

const configPath = './src/config';

function initOrg(org: string) {
  if (!fs.existsSync(`${configPath}/${org}`)){ fs.mkdirSync(`${configPath}/${org}`); }
  const output = template;
  output.name = org;
  output.discord.API_KEY = `DISCORD_KEY_${org.toUpperCase()}`;
  output.notion.API_KEY = `NOTION_KEY_${org.toUpperCase()}`;
  output.propertyKeys.proposalId = template.propertyKeys.proposalId.replace('${NAME}', org);
  output.dolt.repo = template.dolt.repo.replace('${NAME}', org);
  output.propertyKeys.proposalIdPrefix = org.slice(0, 2);
  output.snapshot.space = `${org}.eth`;

  fs.writeFileSync(`${configPath}/${org}/${org}.json`, JSON.stringify(output, null, 2));
  fs.copyFileSync(`${configPath}/template/template.ics`, `${configPath}/${org}/${org}.ics`);
  createDB(org);
}

async function createDB(org: string) {
  const schema = fs.readFileSync(`${__dirname}/../dolt/schema.sql`, 'utf-8');
  const initDB = mysql.createConnection({ host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: 'root' });
  initDB.query(`CREATE DATABASE IF NOT EXISTS ${org}`);
  initDB.end();
  await sleep(150);
  const dolt = new DoltSQL({ host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: 'root', database: org });
  // dolt was complaining about creating multiple tables in one query so split them up
  schema.split(';').forEach((table) => {
    dolt.query(`${table};`);
  });
  await sleep(150);
  await dolt.add();
  dolt.commit('initialize tables');
  console.log('done!');
}

initOrg(process.argv[2]);
