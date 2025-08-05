import { types } from './wailsjs/go/models';

export type Status = 'ready' | 'loading' | 'processing' | 'error';

export enum BlurType {
  Horizontal = 'horizontal',
  Gaussian = 'gaussian',
  'Gaussian No Feather' = 'gaussian-no-feather',
  Directional = 'directional',
}

export type Config = types.Config;
