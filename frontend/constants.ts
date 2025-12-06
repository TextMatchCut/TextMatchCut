import { BlurType, Config } from '@types';

export const FONT_OPTIONS = [
  'Roboto-Italic',
  'Roboto-Black',
  'Roboto-BlackItalic',
  'Roboto-Condensed',
  'Roboto-Light',
  'Minecraft',
];

export const DEFAULT_WIDTH = 1920;
export const DEFAULT_HEIGHT = 1080;
export const DEFAULT_FPS = 4;
export const DEFAULT_HIGHLIGHTED_TEXT = 'Web Dev';

export const DEFAULT_HIGHLIGHT_COLOR = '#ffff00';
export const DEFAULT_TEXT_COLOR = '#000000';
export const DEFAULT_BACKGROUND_COLOR = '#ffffff';

export const DEFAULT_BLUR_TYPE = BlurType.Directional;
export const DEFAULT_BLUR_ANGLE = 45.0;
export const DEFAULT_BLUR_RADIUS = 5.0;
export const DEFAULT_FONT_SIZE = 60;
export const DEFAULT_MIN_LINES = 5;
export const DEFAULT_MAX_LINES = 10;
export const DEFAULT_VERTICAL_SPREAD = 1.5;
export const DEFAULT_FEATHER = 0.9;

export const DEFAULT_SUGGESTED_GEMINI_MODEL = 'gemini-2.5-flash';
export const DEFAULT_SUGGESTED_OPENAI_MODEL = 'gpt-3.5-turbo';

export const DEFAULT_SERIALIZED_APP_STATE_KEY = 'app';

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
  Font: 'Minecraft',
  BackgroundImage: '',
  AIEnabled: false,
  ApiKey: '',
  Model: '',
  Provider: '',
  Prompt: '',
  Verbose: false,
  SoundEffectPath: '',
  Type: 'preview',
  Sfx: 'sfx/shutter.wav',
  BackgroundImpl: 'image', // 'image' or 'solid'
  HighlightRadius: 300,
  SnippetSize: 7,
} as Config;

export const REPO_URL = 'https://github.com/TextMatchCut/TextMatchCut';
