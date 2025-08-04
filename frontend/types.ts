export enum BlurType {
  Horizontal = 'horizontal',
  Gaussian = 'gaussian',
  'Gaussian No Feather' = 'gaussian-no-feather',
  Directional = 'directional',
}

export type Config = {
  Width: number;
  Height: number;
  FPS: number;
  HighlightedText: string;
  HighlightColor: string;
  TextColor: string;
  BackgroundColor: string;
  BlurType: BlurType;
  BlurAngle?: number; // Optional for directional blur
  BlurRadius?: number; // Optional for gaussian blur
  FontSize: number;
  MinLines: number;
  MaxLines: number;
  VerticalSpread: number;
  Feather?: number; // Optional for feathering effect
};
