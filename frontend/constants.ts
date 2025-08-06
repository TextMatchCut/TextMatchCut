import { BlurType, Config } from '@types';
// import { types} from 'wailsjs/go//models';
export const DEFAULT_WIDTH = 1920;
export const DEFAULT_HEIGHT = 1080;
export const DEFAULT_FPS = 3;
export const DEFAULT_HIGHLIGHTED_TEXT = 'Web Dev';
export const DEFAULT_HIGHLIGHT_COLOR = [255, 255, 0, 255] as [
  number,
  number,
  number,
  number
]; // yellow - RGBA format
export const DEFAULT_TEXT_COLOR = [0, 0, 0, 255] as [
  number,
  number,
  number,
  number
]; // black - RGBA format
export const DEFAULT_BACKGROUND_COLOR = [255, 255, 255, 255] as [
  number,
  number,
  number,
  number
]; // white - RGBA format
export const DEFAULT_BLUR_TYPE = BlurType.Horizontal;
export const DEFAULT_BLUR_ANGLE = 45.0;
export const DEFAULT_BLUR_RADIUS = 5.0;
export const DEFAULT_FONT_SIZE = 60;
export const DEFAULT_MIN_LINES = 5;
export const DEFAULT_MAX_LINES = 10;
export const DEFAULT_VERTICAL_SPREAD = 1.5;
export const DEFAULT_FEATHER = 0.5;

export const DEFAULT_CONFIG = {
  Width: DEFAULT_WIDTH,
  Height: DEFAULT_HEIGHT,
  FPS: DEFAULT_FPS,
  HighlightedText: DEFAULT_HIGHLIGHTED_TEXT,
  HighlightColor: DEFAULT_HIGHLIGHT_COLOR,
  TextColor: DEFAULT_TEXT_COLOR,
  BackgroundColor: DEFAULT_BACKGROUND_COLOR,
  BlurType: DEFAULT_BLUR_TYPE,
  BlurAngle: DEFAULT_BLUR_ANGLE,
  BlurRadius: DEFAULT_BLUR_RADIUS,
  FontSize: DEFAULT_FONT_SIZE,
  MinLines: DEFAULT_MIN_LINES,
  MaxLines: DEFAULT_MAX_LINES,
  VerticalSpread: DEFAULT_VERTICAL_SPREAD,
  Feather: DEFAULT_FEATHER,
  OutputPath: '',
  Font: '',
  BackgroundImage: '',
  AIEnabled: false,
  ApiKey: '',
  Model: '',
  Provider: '',
  Verbose: false,
  SoundEffectPath: '',
  Duration: 2,
  Sfx: 'sfx/shutter.wav',
  BackgroundImpl: 'image', // 'image' or 'solid'
} as Config;

export const REPO_URL = 'https://github.com/uncor3/text-match-cut';
