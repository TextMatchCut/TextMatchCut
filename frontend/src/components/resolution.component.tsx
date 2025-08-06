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
import useAppContext from '@/store';
import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

const Resolution = () => {
  const [custom, setCustom] = useState(false);
  const [config, setConfig] = useAppContext(
    useShallow(state => [state.config, state.setConfig])
  );

  function handleChangeWidthHeight(value: string) {
    if (value === 'custom') {
      setCustom(true);
      return;
    }
    setCustom(false);
    const [w, h] = value.split('x');
    setConfig({
      ...config,
      Width: parseInt(w),
      Height: parseInt(h),
    });
  }

  function setWidth(e: React.ChangeEvent<HTMLInputElement>) {
    const width = parseInt(e.target.value);
    if (isNaN(width)) return;
    setConfig({
      ...config,
      Width: width,
    });
  }
  function setHeight(e: React.ChangeEvent<HTMLInputElement>) {
    const height = parseInt(e.target.value);
    if (isNaN(height)) return;
    setConfig({
      ...config,
      Height: height,
    });
  }

  return (
    <div className="flex flex-col gap-2 m-auto mt-4">
      <Label className="self-center" htmlFor="width-height">
        Resolution & FPS & Duration
      </Label>
      <div className="flex items-center space-x-2 gap-4 mt-5">
        <Select
          value={custom ? 'custom' : `${config.Width}x${config.Height}`}
          onValueChange={handleChangeWidthHeight}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Orientation" />
          </SelectTrigger>
          <SelectContent>
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
          <div className="flex items-center gap-1">
            <Input
              type="number"
              id="width"
              placeholder="Width"
              value={config.Width}
              onChange={setWidth}
            />
            <span className="ml-1 text-sm text-muted-foreground relative -top-[1px]">
              Width
            </span>
          </div>
          <div>X</div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              id="height"
              placeholder="Height"
              value={config.Height}
              onChange={setHeight}
            />
            <span className="ml-1 text-sm text-muted-foreground relative -top-[1px]">
              Height
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Input
            className="max-w-[70px]"
            type="number"
            id="fps"
            placeholder="FPS"
            value={config.FPS}
            onChange={e => {
              const fps = parseInt(e.target.value);
              if (isNaN(fps)) return;
              setConfig({
                ...config,
                FPS: fps,
              });
            }}
          />
          <span className="ml-1 text-sm text-muted-foreground relative -top-[1px]">
            FPS
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Input
            className="max-w-[70px]"
            type="number"
            id="duration"
            placeholder="Duration (s)"
            value={config.Duration}
            onChange={e => {
              const duration = parseInt(e.target.value);
              if (isNaN(duration)) return;
              setConfig({
                ...config,
                Duration: duration,
              });
            }}
          />
          <span className="ml-1 text-sm text-muted-foreground relative -top-[1px]">
            Duration (s)
          </span>
        </div>
      </div>
    </div>
  );
};

export default Resolution;
