import { types } from './wailsjs/go/models';
import * as Comlink from 'comlink';

export type Status = 'ready' | 'loading' | 'processing' | 'error';

export enum BlurType {
  Horizontal = 'horizontal',
  Gaussian = 'gaussian',
  'Gaussian No Feather' = 'gaussian-no-feather',
  Directional = 'directional',
}

export type Config = types.Config;

export type GO_RenderFrameWeb_Input = {
  FrameNum: number;
  Config: Config;
};

export type GOWorkerType = Comlink.Remote<{
  init: () => Promise<void>;
  getSnippets: (payload: any) => Promise<any>;
  renderFrameWeb: (input: GO_RenderFrameWeb_Input) => Promise<string>;
}>;
