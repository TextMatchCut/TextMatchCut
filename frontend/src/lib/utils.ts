import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toBlobURL } from '@ffmpeg/util';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import useAppContext from '@/store';
import { Config } from '@types';
import { DEFAULT_CONFIG } from '@constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function loadWasmBackend() {
  const go = new Go();
  await WebAssembly.instantiateStreaming(
    fetch('/lib.wasm'),
    go.importObject
  ).then(result => {
    console.log('WASM loaded successfully');
    go.run(result.instance);
  });
}

export const loadFFmpeg = async (ffmpeg: FFmpeg) => {
  const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.10/dist/esm';
  // ffmpeg.on('log', ({ message }) => {
  //   if (messageRef.current) messageRef.current.innerHTML = message;
  // });
  // toBlobURL is used to bypass CORS issue, urls with the same
  // domain can be used directly.
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.worker.js`,
      'text/javascript'
    ),
  });
};

export const readAsRawBase64 = (f: File | undefined) => {
  return new Promise<{ raw: string; normal: string } | undefined>(
    (resolve, reject) => {
      if (!f) {
        resolve(undefined);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        //removes text like data:font/woff2;base64 from string
        resolve({ raw: base64.split(',')[1], normal: base64 });
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(f);
    }
  );
};

export const serializeState = (config: Config) => {
  /*
   Api key is sensitive and should not be serialized
   Background image, Sfx and Font are high in size and may go beyond localStorage limits
   TODO: Update components to make use of IndexedDB for larger data storage
  */
  const unwantedKeys = [
    'ApiKey',
    'BackgroundImage',
    'Sfx',
    'Font',
  ] as (keyof Config)[];

  const filteredConfigState = Object.keys(config).reduce((acc, key) => {
    if (!unwantedKeys.includes(key as keyof Config)) {
      acc[key] = config[key as keyof typeof config];
    }
    return acc;
  }, {} as Record<string, any>);

  filteredConfigState['Sfx'] = DEFAULT_CONFIG.Sfx;
  filteredConfigState['BackgroundImage'] = DEFAULT_CONFIG.BackgroundImage;
  filteredConfigState['Font'] = DEFAULT_CONFIG.Font;

  return JSON.stringify({
    config: filteredConfigState,
    __APP_VERSION__,
  });
};

type SetConfig = Config | ((config: Config) => Config);

const parseState = () => {
  try {
    let app = localStorage.getItem('app');
    if (app) {
      app = JSON.parse(app);
      if (!app || typeof app !== 'object') return DEFAULT_CONFIG;
      const typedConfig = app as {
        config: Config;
        __APP_VERSION__: string;
      };
      if (typedConfig.__APP_VERSION__ !== __APP_VERSION__) {
        console.warn('App version mismatch. Resetting config to default.');
        return DEFAULT_CONFIG;
      }
      return typedConfig.config || DEFAULT_CONFIG;
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Failed to parse app config from localStorage:', error);
    return DEFAULT_CONFIG;
  }
};
