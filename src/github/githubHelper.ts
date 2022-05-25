import axios from 'axios';
import { keys } from '../keys';

export const githubContent = async (url: string) => {
  try {
    const results = await axios.get(url, {
      headers: {
        Authorization: `token ${keys.GITHUB_KEY}`
      }
    });
    return results.data.content;
  } catch (e) {
    return Promise.reject(e);
  }
};
