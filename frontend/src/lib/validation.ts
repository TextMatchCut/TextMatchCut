import { z } from 'zod';
import { BlurType } from '@types';

// Helper schemas for color validation
const colorArraySchema = z.array(z.number().min(0).max(255)).length(4);
// const hexColorSchema = z
//   .string()
//   .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format');

const Providers = ['openai', 'gemini', 'anthropic'] as const;

export const configSchema = z
  .object({
    HighlightedText: z
      .string()
      .min(1, 'Highlighted text cannot be empty.')
      .max(100, 'Highlighted text too long.'),
    Width: z
      .number()
      .min(100, 'Width must be at least 100px.')
      .max(4000, 'Width cannot exceed 4000px.'),
    Height: z
      .number()
      .min(100, 'Height must be at least 100px.')
      .max(4000, 'Height cannot exceed 4000px.'),
    FPS: z
      .number()
      .min(1, 'FPS must be at least 1.')
      .max(60, 'FPS cannot exceed 60.'),
    Duration: z.number().min(1, 'Duration must be at least 1 second.'),
    FontSize: z
      .number()
      .min(8, 'Font size must be at least 8.')
      .max(200, 'Font size cannot exceed 200.'),
    MinLines: z
      .number()
      .min(1, 'Must have at least one line.')
      .max(20, 'Cannot exceed 20 lines.'),
    MaxLines: z
      .number()
      .min(1, 'Must have at least one line.')
      .max(20, 'Cannot exceed 20 lines.'),
    VerticalSpread: z
      .number()
      .min(0.5, 'Vertical spread must be at least 0.5.')
      .max(5.0, 'Vertical spread cannot exceed 5.0.'),
    // BlurType: z.enum(BlurType, {
    //   message: 'Please select a valid blur type.',
    // }),
    BlurType: z.string().min(1, 'Blur type is required.'),
    BlurRadius: z.number().min(0, 'Blur radius cannot be negative.'),
    HighlightRadius: z.number().min(0, 'Highlight radius cannot be negative.'),
    BlurAngle: z.number(),
    Feather: z.number(),

    // Color validations - these should be hex strings in the form
    HighlightColor: z
      .string()
      .min(1, 'Highlight color is required.')
      .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
    TextColor: z
      .string()
      .min(1, 'Text color is required.')
      .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
    BackgroundColor: z
      .string()
      .min(1, 'Background color is required.')
      .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),

    // Provider and API validation
    // Provider: z.enum(Providers, {
    //   message: 'Please select a valid provider.',
    // }),
    Prompt: z.string(),
    Provider: z.string().optional(),
    Model: z.string().optional(),
    ApiKey: z.string().optional(),
    AIEnabled: z.boolean(),

    // Background implementation
    // BackgroundImpl: z.enum(['color', 'image'], {
    //   message: 'Please select background type.',
    // }),

    BackgroundImpl: z.string().min(1, 'Background implementation is required.'),
    BackgroundImage: z.string(),

    // File paths - optional but should be valid if provided
    Font: z.string().min(1, 'Font is required.'),
    Sfx: z.string().min(1, 'Sound effect is required.'),
    SoundEffectPath: z.string().optional(),
    Type: z.enum(['preview', 'render'], {
      message: 'Please select a valid type.',
    }),
    // Optional flags
    Verbose: z.boolean().optional(),
  })
  .refine(data => data.MaxLines >= data.MinLines, {
    message: 'Max lines must be greater than or equal to Min lines.',
    path: ['MaxLines'],
  })
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
  )
  .superRefine((data, ctx) => {
    if (data.Type !== 'render') {
      return;
    }

    if (!data.AIEnabled) return;

    if (!data.Provider || data.Provider.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        message: 'Provider is required.',
        path: ['Provider'],
      });
    }

    if (!data.Model || data.Model.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        message: 'Model cannot be empty.',
        path: ['Model'],
      });
    }

    if (
      (data.Provider === 'openai' || data.Provider === 'gemini') &&
      (!data.ApiKey || data.ApiKey.trim() === '')
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'API key is required',
        path: ['ApiKey'],
      });
    }

    if (data.Prompt.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        message: 'Prompt cannot be empty.',
        path: ['Prompt'],
      });
    }
  });

// export type ConfigFormData = z.infer<typeof configSchema>;
