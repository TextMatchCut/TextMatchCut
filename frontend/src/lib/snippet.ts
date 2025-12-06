import { Config, GOWorkerType } from '@types';
import { GetSnippetsGeminiWeb } from './gemini';
import { GetSnippetsOpenAIWeb } from './openai';
import * as Comlink from 'comlink';

//FIXME:this util exists on both js and go
function parseAISnippets(
  snippets: Array<{ text: string }>,
  highlightedText: string
) {
  return snippets.map(snippet => {
    // Split text into lines by sentence endings
    let text = snippet.text;
    const lines: string[] = [];

    // Split by sentence delimiters
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    lines.push(...sentences);

    const highlightIndex = lines.findIndex(line =>
      line.toLowerCase().includes(highlightedText.toLowerCase())
    );

    return {
      Lines: lines,
      HighlightIndex: Math.max(0, highlightIndex),
    };
  });
}

export async function GetSnippetsWeb(
  config: Config,
  signal: AbortSignal,
  worker: Comlink.Remote<GOWorkerType>
) {
  let snippets: any;

  if (config.Provider == 'gemini') {
    snippets = await GetSnippetsGeminiWeb(config, signal);
  } else if (config.Provider == 'openai') {
    snippets = await GetSnippetsOpenAIWeb(config, signal);
  } else {
    return JSON.parse(await worker.generateRandomTextSnippetWeb(config));
  }

  const parsedSnippets = parseAISnippets(snippets, config.HighlightedText);

  return parsedSnippets;
}
