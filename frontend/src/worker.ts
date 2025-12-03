let go: any;
import { GO_RenderFrameWeb_Input } from '@types';
import '../wasm/wasm_exec.js';
import { loadWasmBackend } from './lib/utils.js';
import * as Comlink from 'comlink';

// Listen for messages from the main thread
async function init() {
  //@ts-ignore
  go = new self.Go();
  try {
    await loadWasmBackend();
    return { ok: true, message: 'WASM backend loaded successfully.' };
  } catch (error) {
    return { ok: false, message: 'Failed to load WASM backend.' };
  }
}

async function renderFrameWeb(
  input: GO_RenderFrameWeb_Input,
  /*JSON*/ snippets: any
) {
  return await (self as any).GO_GenerateFrameFromJSON(
    JSON.stringify(input),
    JSON.stringify(snippets)
  );
}

Comlink.expose({
  init,
  renderFrameWeb,
});
