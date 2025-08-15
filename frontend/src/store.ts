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
  videoSrc: string | null;
  videoOutputPath: string | null;
  setStatus: (status: Status) => void;
  setElapsedTime: (elapsedTime: number) => void;
  setOpenDrawer: (openDrawer: boolean) => void;
  setProgress: (progress: number) => void;
  setPreview: (preview: string | null) => void;
  setVideoSrc: (videoSrc: string | null) => void;
  setVideoOutputPath: (videoOutputPath: string | null) => void;
  toggleDrawer: () => void;
}>(set => ({
  blurType: BlurType.Horizontal,
  status: 'loading',
  elapsedTime: 0,
  progress: 0,
  openDrawer: false,
  ffmpeg: (!__DESKTOP__ ? new FFmpeg() : null) as FFmpeg, // Ensure FFmpeg is only initialized in web
  preview: null,
  starPromptShown: false,
  videoSrc: null,
  videoOutputPath: null,
  setVideoOutputPath: (videoOutputPath: string | null) =>
    set({ videoOutputPath }),
  setVideoSrc: (videoSrc: string | null) => set({ videoSrc }),
  setPreview: (preview: string | null) => set({ preview }),
  setBlurType: (blurType: BlurType) => set({ blurType }),
  setStatus: (status: Status) => set({ status }),
  setElapsedTime: (elapsedTime: number) => set({ elapsedTime }),
  setOpenDrawer: (openDrawer: boolean) => set({ openDrawer }),
  setProgress: (progress: number) => set({ progress }),
  toggleDrawer: () => set(state => ({ openDrawer: !state.openDrawer })),
}));

export default useAppContext;
