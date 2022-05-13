import axios from 'axios';
import schedule from 'node-schedule';
import Redis from 'ioredis';
import { log, base64ToJSON, base64ToString } from './utils';
import { keys } from './keys';

const baseManifestURL = 'https://api.github.com/repos/jigglyjams/nance-config/contents/';
const manifestFile = 'manifest.json';

const downloadContent = async (url: string) => {
  try {
    const results = await axios.get(url, {
      headers: {
        Authorization: keys.GITHUB_KEY
      }
    });
    return results.data.content;
  } catch (e) {
    return Promise.reject(e);
  }
};

async function getConfigs() {
  downloadContent(`${baseManifestURL}/${manifestFile}`).then((data: string) => {
    const content = base64ToJSON(data);
    const organizations = Object.keys(content.orgs);
    organizations.forEach((orgName) => {
      const orgConfig = content.orgs[orgName].config;
      downloadContent(`${baseManifestURL}/${orgName}/${orgConfig}`).then((config: string) => {
        // console.log(base64ToJSON(config));
      });
      const orgCalendar = content.orgs[orgName].calendar;
      downloadContent(`${baseManifestURL}/${orgName}/${orgCalendar}`).then((config: string) => {
        // console.log(base64ToString(config));
      });
    });
  }).catch((e) => {
    console.log('error');
    console.log(e.response.data);
  });
}

getConfigs();
