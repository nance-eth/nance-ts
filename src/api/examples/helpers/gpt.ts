/* eslint-disable import/no-extraneous-dependencies */
import 'dotenv/config';
import { Configuration, OpenAIApi } from 'openai';

const prompt = `
  Write a governance proposal (including a catchy title) asking for
  a specific amount of money to complete a task for a web3 protocol organization called juicebox, in a markdown format.
`;

const configuration = new Configuration({
  organization: 'org-NxFbp0TWSjymgDZtDAnugwuG',
  apiKey: process.env.OPENAI_KEY,
});

export async function getProposal() {
  const openai = new OpenAIApi(configuration);

  const completion = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt,
    temperature: 0.78,
    max_tokens: 430,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  return completion.data.choices[0].text;
}
