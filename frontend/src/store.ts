import { create } from 'zustand';
import { DEFAULT_CONFIG } from '@constants';
import { BlurType, Config, Status } from '@types';
import { FFmpeg } from '@ffmpeg/ffmpeg';

type SetConfig = Config | ((config: Config) => Config);

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
  config: DEFAULT_CONFIG,
  status: 'loading',
  elapsedTime: 0,
  progress: 0,
  openDrawer: false,
  ffmpeg: new FFmpeg(),
  preview: null,
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
export { useAppContext as getAppContext };
export default useAppContext;
