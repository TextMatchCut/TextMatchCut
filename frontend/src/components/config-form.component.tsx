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
  } = useFormContext();

  return (
    <>
      <div className="flex gap-4 justify-between flex-col md:flex-row">
        <div className="flex gap-4 w-full">
          <div>
            <Label htmlFor="highlighted-text">Highlighted Text</Label>
            <Input
              id="highlighted-text"
              {...register('HighlightedText')}
              className={cn({ 'border-red-500': errors.HighlightedText })}
            />
            <FieldError error={errors.HighlightedText} />
          </div>
          <div>
            <Label htmlFor="blur-type">Blur Type</Label>
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

      <div className="grid grid-cols-3 gap-4 m-4 items-center place-content-center justify-center">
        <div className="flex flex-col gap-1">
          <Label htmlFor="font-size">Font Size</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.FontSize })}
            type="number"
            {...register('FontSize')}
          />
          <FieldError error={errors.FontSize} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="min-lines">Min Lines</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.MinLines })}
            type="number"
            {...register('MinLines')}
          />
          <FieldError error={errors.MinLines} />
        </div>
        <div className="flex gap-2">
          <Label htmlFor="highlight-radius">Highlight Radius</Label>
          <Input className="w-20" {...register('HighlightRadius')} />
        </div>
        <div className="flex gap-2">
          <Label htmlFor="max-lines">Max Lines</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.MaxLines })}
            id="max-lines"
            type="number"
            {...register('MaxLines')}
          />
          <FieldError error={errors.MaxLines} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="duration">Duration (s)</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.Duration })}
            id="duration"
            type="number"
            {...register('Duration')}
          />
          <FieldError error={errors.Duration} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="vertical-spread">Vertical Spread</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.VerticalSpread })}
            id="vertical-spread"
            type="number"
            step="0.1"
            {...register('VerticalSpread')}
          />
          <FieldError error={errors.VerticalSpread} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="feather">Feather</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.Feather })}
            id="feather"
            type="number"
            step="0.1"
            {...register('Feather')}
          />
          <FieldError error={errors.Feather} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="blur-radius">Blur Radius</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.BlurRadius })}
            id="blur-radius"
            type="number"
            {...register('BlurRadius')}
          />
          <FieldError error={errors.BlurRadius} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="blur-angle">Blur Angle</Label>
          <Input
            className={cn('w-20', { 'border-red-500': errors.BlurAngle })}
            id="blur-angle"
            type="number"
            {...register('BlurAngle')}
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
