import { create } from 'zustand';
import { DEFAULT_CONFIG } from '@constants';
import { BlurType, Config } from '@types';

const useAppContext = create<{
  isLoading: boolean;
  isWasmBackendLoading: boolean;
  isFfmpegLoading: boolean;
  isFfmpegError: string | null;
  isWasmBackendError: string | null;
  blurType: BlurType;
  config: Config;
  setIsWasmBackendError: (error: string) => void;
  setIsFfmpegError: (error: string) => void;
  setIsLoading: (loading: boolean) => void;
  setIsWasmBackendLoading: (loading: boolean) => void;
  setIsFfmpegLoading: (loading: boolean) => void;
  setConfig: (config: Config) => void;
}>(set => ({
  isLoading: true,
  isWasmBackendLoading: true,
  isFfmpegLoading: true,
  isFfmpegError: null,
  isWasmBackendError: null,
  blurType: BlurType.Horizontal,
  config: DEFAULT_CONFIG,
  setIsWasmBackendError: (error: string) => set({ isWasmBackendError: error }),
  setIsFfmpegError: (error: string) => set({ isFfmpegError: error }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setIsWasmBackendLoading: (loading: boolean) =>
    set({ isWasmBackendLoading: loading }),
  setIsFfmpegLoading: (loading: boolean) => set({ isFfmpegLoading: loading }),
  setBlurType: (blurType: BlurType) => set({ blurType }),
  setConfig: (config: Config) => set({ config }),
}));

export default useAppContext;
