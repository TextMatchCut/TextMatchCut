import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import clsx from 'clsx';
import { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';

const Resolution = () => {
  const {
    control,
    formState: { errors },
    watch,
    setValue,
    register,
  } = useFormContext();

  const [custom, setCustom] = useState(false);

  // Watch the current width and height values
  const currentWidth = watch('Width');
  const currentHeight = watch('Height');

  // Determine current resolution preset
  const getCurrentResolution = () => {
    const resolution = `${currentWidth}x${currentHeight}`;
    const presets = ['1920x1080', '1080x1920', '1024x768', '1080x1080'];
    return presets.includes(resolution) ? resolution : 'custom';
  };

  function handleChangeWidthHeight(value: string) {
    if (value === 'custom') {
      setCustom(true);
      return;
    }
    setCustom(false);
    const [w, h] = value.split('x');
    setValue('Width', parseInt(w));
    setValue('Height', parseInt(h));
  }

  return (
    <div className="flex flex-col gap-2 m-auto mt-4">
      <Label className="self-center" htmlFor="width-height">
        Resolution & FPS
      </Label>
      <div className="flex items-center space-x-2 gap-4 mt-5">
        <Select
          value={!custom ? getCurrentResolution() : 'custom'}
          onValueChange={handleChangeWidthHeight}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Orientation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3840x2160">3840x2160 [16:9]</SelectItem>
            <SelectItem value="2560x1440">2560x1440 [16:9]</SelectItem>
            <SelectItem value="1920x1080">1920x1080 [16:9]</SelectItem>
            <SelectItem value="1080x1920">1080x1920 [9:16]</SelectItem>
            <SelectItem value="1024x768">1024x768 [4:3]</SelectItem>
            <SelectItem value="1080x1080">1080x1080 [1:1]</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <div
          className={clsx('flex w-full max-w-sm items-center gap-3', {
            hidden: !custom,
          })}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="ml-1 text-sm text-muted-foreground relative -top-[1px]">
              Width
            </span>
            <Input
              type="number"
              placeholder="Width"
              {...register('Width', { valueAsNumber: true })}
              className={cn({ 'border-red-500': errors.Width })}
            />
          </div>
          <div>X</div>
          <div className="flex flex-col items-center gap-1">
            <span className="ml-1 text-sm text-muted-foreground relative -top-[1px]">
              Height
            </span>
            <Input
              type="number"
              placeholder="Height"
              {...register('Height', { valueAsNumber: true })}
              className={cn({ 'border-red-500': errors.Height })}
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            {...register('FPS', {
              valueAsNumber: true,
            })}
            className={cn('max-w-[70px]', { 'border-red-500': errors.FPS })}
          />
          <span className="ml-1 text-sm text-muted-foreground relative -top-[1px]">
            FPS
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            {...register('Duration', {
              valueAsNumber: true,
            })}
            className={cn('max-w-[70px]', {
              'border-red-500': errors.Duration,
            })}
          />
          <span className="ml-1 text-sm text-muted-foreground relative -top-[1px]">
            Duration
          </span>
        </div>
      </div>
    </div>
  );
};

export default Resolution;
