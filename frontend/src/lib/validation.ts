import { z } from 'zod';
import { BlurType } from '@types';

// Helper schemas for color validation
const colorArraySchema = z.array(z.number().min(0).max(255)).length(4);
// const hexColorSchema = z
//   .string()
//   .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format');

export const configSchema = z
  .object({
    HighlightedText: z
      .string()
      .min(1, 'Highlighted text cannot be empty.')
      .max(100, 'Highlighted text too long.'),
    Width: z.coerce
      .number()
      .min(100, 'Width must be at least 100px.')
      .max(4000, 'Width cannot exceed 4000px.'),
    Height: z.coerce
      .number()
      .min(100, 'Height must be at least 100px.')
      .max(4000, 'Height cannot exceed 4000px.'),
    FPS: z.coerce
      .number()
      .min(1, 'FPS must be at least 1.')
      .max(60, 'FPS cannot exceed 60.'),
    Duration: z.coerce
      .number()
      .min(1, 'Duration must be at least 1 second.')
      .max(300, 'Duration cannot exceed 5 minutes.'),
    FontSize: z.coerce
      .number()
      .min(8, 'Font size must be at least 8.')
      .max(200, 'Font size cannot exceed 200.'),
    MinLines: z.coerce
      .number()
      .min(1, 'Must have at least one line.')
      .max(20, 'Cannot exceed 20 lines.'),
    MaxLines: z.coerce
      .number()
      .min(1, 'Must have at least one line.')
      .max(20, 'Cannot exceed 20 lines.'),
    VerticalSpread: z.coerce
      .number()
      .min(0.5, 'Vertical spread must be at least 0.5.')
      .max(5.0, 'Vertical spread cannot exceed 5.0.'),
    BlurType: z.nativeEnum(BlurType),
    BlurRadius: z.coerce
      .number()
      .min(0, 'Blur radius cannot be negative.')
      .max(100, 'Blur radius cannot exceed 100.'),
    BlurAngle: z.coerce
      .number()
      .min(0, 'Blur angle cannot be negative.')
      .max(360, 'Blur angle cannot exceed 360.'),
    Feather: z.coerce
      .number()
      .min(0, 'Feather cannot be negative.')
      .max(1, 'Feather cannot exceed 1.0.'),

    // Color validations - these should be hex strings in the form
    HighlightColor: colorArraySchema,
    TextColor: colorArraySchema,
    BackgroundColor: colorArraySchema,

    // Provider and API validation
    Provider: z.enum(['openai', 'gemini'], {
      errorMap: () => ({ message: 'Please select a valid provider.' }),
    }),
    Model: z.string().min(1, 'Model cannot be empty.'),
    ApiKey: z.string().optional(),

    // Background implementation
    BackgroundImpl: z.enum(['color', 'image'], {
      errorMap: () => ({ message: 'Please select background type.' }),
    }),
    BackgroundImage: z.string().optional(),

    // File paths - optional but should be valid if provided
    Font: z.string().min(1, 'Font is required.'),
    Sfx: z.string().min(1, 'Sound effect is required.'),
    SoundEffectPath: z.string().optional(),
    OutputPath: z.string().optional(),

    // Optional flags
    Verbose: z.boolean().optional(),
  })
  .refine(data => data.MaxLines >= data.MinLines, {
    message: 'Max lines must be greater than or equal to Min lines.',
    path: ['MaxLines'],
  })
  .refine(
    data => {
      // If provider is set and not empty, API key should be required
      if (
        (data.Provider === 'openai' || data.Provider === 'gemini') &&
        (!data.ApiKey || data.ApiKey.trim() === '')
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'API key is required for the selected provider.',
      path: ['ApiKey'],
    }
  )
  .refine(
    data => {
      // If background implementation is image, background image should be provided
      if (
        data.BackgroundImpl === 'image' &&
        (!data.BackgroundImage || data.BackgroundImage.trim() === '')
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Background image is required when using image background.',
      path: ['BackgroundImage'],
    }
  );

export type ConfigFormData = z.infer<typeof configSchema>;
