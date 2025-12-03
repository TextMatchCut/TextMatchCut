//this file is needed because for some reason fetch requests do not work on wasm backend (go)
import OpenAI from 'openai';
import { Config } from '@types';
import { z } from 'zod';

const snippetSchema = z.object({
  text: z.string(),
});

const snippetsArraySchema = z.array(snippetSchema);

let openaiClient: OpenAI | null = null;

function getOpenAIClient(apiKey: string): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Required for browser usage
    });
  }
  return openaiClient;
}

export async function GetSnippetsOpenAIWeb(config: Config) {
  const client = getOpenAIClient(config.ApiKey!);

  const prompt =
    config.Prompt + '(Respond in JSON array format: [{"text": "..."}, ...] )';
  console.log('Prompt for AI:', prompt);

  const completion = await client.chat.completions.create({
    model: config.Model || 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  if (!completion.choices || completion.choices.length === 0) {
    throw new Error('No choices returned from OpenAI');
  }

  const responseContent = completion.choices[0].message?.content;
  if (!responseContent) {
    throw new Error('No content in OpenAI response');
  }

  const rawData = JSON.parse(responseContent);
  const validatedData = snippetsArraySchema.parse(rawData);

  console.log('Snippets look like this:', validatedData);
  return validatedData;
}
