import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Resolution from '@/components/resolution.component';
import { Label } from '@/components/ui/label';
import { BlurType } from '@types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import Sfx from './sfx.component';
import SfxWeb from './sfx.web.component';
import BackgroundInput from './background-input.component';
import Font from './font.component';
import Prompt from './prompt.component';
import { useFormContext, Controller } from 'react-hook-form';
import { useEffect } from 'react';

// Error display component for reusability
const FieldError: React.FC<{ error?: any }> = ({ error }) => {
  if (!error) return null;
  return <p className="text-red-500 text-xs mt-1">{error.message as string}</p>;
};

const ConfigForm: React.FC<React.PropsWithChildren> = ({ children }) => {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();

  const highlightedText = watch('HighlightedText');
  const fontSize = watch('FontSize');

  useEffect(() => {
    // needed because HighlightRadius should be related to HighlightedText length and fontSize
    if (highlightedText && typeof fontSize === 'number' && fontSize > 0) {
      // const newRadius = fontSize * highlightedText.length;
      const newRadius = fontSize * highlightedText.length * 0.85;
      setValue('HighlightRadius', newRadius, { shouldValidate: true });
    }
  }, [highlightedText, fontSize]);

  return (
    <>
      <div className="flex gap-4 justify-between flex-col md:flex-row">
        <div className="flex gap-4 w-full">
          <div>
            <Label>Highlighted Text</Label>
            <Input
              {...register('HighlightedText')}
              className={cn({ 'border-red-500': errors.HighlightedText })}
            />
            <FieldError error={errors.HighlightedText} />
          </div>
          <div>
            <Label>Blur Type</Label>
            <div className="flex items-center justify-between space-x-2">
              <Controller
                control={control}
                name="BlurType"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger
                      className={cn('w-[180px]', {
                        'border-red-500': errors.BlurType,
                      })}
                    >
                      <SelectValue placeholder="Blur Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(BlurType).map(type => (
                        <SelectItem
                          key={type}
                          value={BlurType[type as keyof typeof BlurType]}
                        >
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <FieldError error={errors.BlurType} />
          </div>
        </div>
        <div className="flex w-full items-center space-x-4">
          <div className="w-full">
            <Label htmlFor="highlight-color">Highlight Color</Label>
            <Input
              className={cn('max-w-[85%]', {
                'border-red-500': errors.HighlightColor,
              })}
              type="color"
              {...register('HighlightColor')}
            />
            <FieldError error={errors.HighlightColor} />
          </div>
          <div className="w-full">
            <Label htmlFor="text-color">Text Color</Label>
            <Input
              className={cn('max-w-[85%]', {
                'border-red-500': errors.TextColor,
              })}
              type="color"
              {...register('TextColor')}
            />
            <FieldError error={errors.TextColor} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 m-4 justify-center">
        <div className="flex flex-col gap-1">
          <Label htmlFor="font-size">Font Size</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.FontSize })}
            type="number"
            {...register('FontSize', { valueAsNumber: true })}
          />
          <FieldError error={errors.FontSize} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="min-lines">Min Lines</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.MinLines })}
            type="number"
            {...register('MinLines', { valueAsNumber: true })}
          />
          <FieldError error={errors.MinLines} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Highlight Radius</Label>
          <Input
            className="w-20"
            type="number"
            {...register('HighlightRadius', { valueAsNumber: true })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Max Lines</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.MaxLines })}
            type="number"
            {...register('MaxLines', { valueAsNumber: true })}
          />
          <FieldError error={errors.MaxLines} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Vertical Spread</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.VerticalSpread })}
            type="number"
            step="0.1"
            {...register('VerticalSpread')}
          />
          <FieldError error={errors.VerticalSpread} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Feather</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.Feather })}
            type="number"
            step="0.1"
            {...register('Feather', { valueAsNumber: true })}
          />
          <FieldError error={errors.Feather} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Blur Radius</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.BlurRadius })}
            type="number"
            {...register('BlurRadius', { valueAsNumber: true })}
          />
          <FieldError error={errors.BlurRadius} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Blur Angle</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.BlurAngle })}
            type="number"
            {...register('BlurAngle', { valueAsNumber: true })}
          />
          <FieldError error={errors.BlurAngle} />
        </div>
      </div>

      <div
        className={cn('flex gap-4 flex-col md:flex-row', {
          'min-w-[800px]': __DESKTOP__,
        })}
      >
        <BackgroundInput />
        {__DESKTOP__ ? <Sfx /> : <SfxWeb />}
        <Font />
      </div>
      <div>
        <Prompt />
      </div>
      <Resolution />

      {children}
    </>
  );
};

export default ConfigForm;
