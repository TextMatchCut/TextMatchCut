//this file is needed because for some reason fetch requests do not work on wasm backend (go)
import { GoogleGenAI } from '@google/genai';
import { Config } from '@types';

import * as z from 'zod';

const snippetSchema = z.object({
  text: z.string(),
});

const snippetsArraySchema = z.array(snippetSchema);

export async function GetSnippetsGeminiWeb(config: Config) {
  const ai = new GoogleGenAI({
    apiKey: config.ApiKey,
  });

  const res = await ai.models.generateContent({
    contents: config.Prompt,
    model: config.Model as string,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: z.toJSONSchema(snippetsArraySchema),
    },
  });

  const final = snippetsArraySchema.parse(JSON.parse(res.text!));

  console.log('final snippets from gemini.ts', final);
  return final;
}
