import { Config } from '@types';
import { GetSnippetsGeminiWeb } from './gemini';
import { GetSnippetsOpenAIWeb } from './openai';

export async function GetSnippetsWeb(config: Config) {
  if (config.Provider == 'gemini') {
    return await GetSnippetsGeminiWeb(config);
  } else if (config.Provider == 'openai') {
    return await GetSnippetsOpenAIWeb(config);
  }
}
