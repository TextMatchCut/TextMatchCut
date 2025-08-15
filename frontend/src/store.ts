import { create } from 'zustand';
import { BlurType, Status } from '@types';
import { FFmpeg } from '@ffmpeg/ffmpeg';

const useAppContext = create<{
  blurType: BlurType;
  status: Status;
  ffmpeg: FFmpeg;
  elapsedTime: number;
  openDrawer: boolean;
  progress: number;
  preview: string | null;
  setStatus: (status: Status) => void;
  setElapsedTime: (elapsedTime: number) => void;
  setOpenDrawer: (openDrawer: boolean) => void;
  setProgress: (progress: number) => void;
  setPreview: (preview: string | null) => void;
}>(set => ({
  blurType: BlurType.Horizontal,
  status: 'loading',
  elapsedTime: 0,
  progress: 0,
  openDrawer: false,
  ffmpeg: (!__DESKTOP__ ? new FFmpeg() : null) as FFmpeg, // Ensure FFmpeg is only initialized in web
  preview: null,
  starPromptShown: false,
  setPreview: (preview: string | null) => set({ preview }),
  setBlurType: (blurType: BlurType) => set({ blurType }),
  setStatus: (status: Status) => set({ status }),
  setElapsedTime: (elapsedTime: number) => set({ elapsedTime }),
  setOpenDrawer: (openDrawer: boolean) => set({ openDrawer }),
  setProgress: (progress: number) => set({ progress }),
}));

export default useAppContext;
