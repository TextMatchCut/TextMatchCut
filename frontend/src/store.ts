import { create } from 'zustand';
import { DEFAULT_CONFIG } from '@constants';
import { BlurType, Config, Status } from '@types';
import { FFmpeg } from '@ffmpeg/ffmpeg';

type SetConfig = Config | ((config: Config) => Config);

const _config = () => {
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
const useAppContext = create<{
  blurType: BlurType;
  config: Config;
  status: Status;
  ffmpeg: FFmpeg;
  elapsedTime: number;
  openDrawer: boolean;
  progress: number;
  preview: string | null;
  setConfig: (config: SetConfig) => void;
  setStatus: (status: Status) => void;
  setElapsedTime: (elapsedTime: number) => void;
  setOpenDrawer: (openDrawer: boolean) => void;
  setProgress: (progress: number) => void;
  setPreview: (preview: string | null) => void;
}>(set => ({
  blurType: BlurType.Horizontal,
  config: _config() as Config,
  status: 'loading',
  elapsedTime: 0,
  progress: 0,
  openDrawer: false,
  ffmpeg: (!__DESKTOP__ ? new FFmpeg() : null) as FFmpeg, // Ensure FFmpeg is only initialized in web
  preview: null,
  starPromptShown: false,
  setPreview: (preview: string | null) => set({ preview }),
  setBlurType: (blurType: BlurType) => set({ blurType }),
  // TODO : ?
  setConfig: (config: SetConfig) => {
    if (typeof config === 'object') {
      return set({ config: { ...config } });
    }

    set(state => ({
      config: {
        ...state.config,
        ...config(state.config),
      },
    }));
  },
  setStatus: (status: Status) => set({ status }),
  setElapsedTime: (elapsedTime: number) => set({ elapsedTime }),
  setOpenDrawer: (openDrawer: boolean) => set({ openDrawer }),
  setProgress: (progress: number) => set({ progress }),
}));

export default useAppContext;
