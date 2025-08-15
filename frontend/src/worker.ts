let go: any;
import { GO_RenderFrameWeb_Input } from '@types';
import '../wasm/wasm_exec.js';
import { loadWasmBackend } from './lib/utils.js';
import * as Comlink from 'comlink';

// Listen for messages from the main thread
async function init() {
  go = new self.Go();
  try {
    await loadWasmBackend();
    return { ok: true, message: 'WASM backend loaded successfully.' };
  } catch (error) {
    return { ok: false, message: 'Failed to load WASM backend.' };
  }
}

async function getSnippets(payload: any) {
  try {
    const snippetsJSON = await (self as any).GO_GetSnippets(
      JSON.stringify(payload)
    );
    console.log('resolved');
    // The result from Go is a JSON string, so we parse it
    console.log('snippetsJSON', snippetsJSON);
    const snippets = JSON.parse(snippetsJSON);
    console.log('snippets', snippets);
    return {
      ok: true,
      data: snippets,
    };
  } catch (error) {
    return {
      ok: false,
      message: `Error fetching snippets: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

async function renderFrameWeb(input: GO_RenderFrameWeb_Input) {
  return await (self as any).GenerateFrameFromJSON(JSON.stringify(input));
}

// self.postMessage({
//   status: 'success',
//   command: 'getSnippets',
//   data: snippets,
// });

Comlink.expose({
  init,
  getSnippets,
  renderFrameWeb,
});
