import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useAppContext from '@/store';
import { rgbaToHex, hexToRgba } from '@/lib/utils';

const BackgroundInput = () => {
  const [src, setSrc] = useState<string>('/img/test-bg.jpg');
  const config = useAppContext(s => s.config);
  const setConfig = useAppContext(s => s.setConfig);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (src) {
      URL.revokeObjectURL(src);
    }
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        setSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="flex w-[40%] max-w-sm flex-col ">
      <Label className="mb-2">Background</Label>
      <Tabs defaultValue="image">
        <TabsList>
          <TabsTrigger className="cursor-pointer" value="image">
            Image
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="solid">
            Solid Color
          </TabsTrigger>
        </TabsList>
        <TabsContent value="image">
          <PhotoProvider>
            <PhotoView src={src}>
              <img
                src={src} // Fallback to a default image if no file is selected
                alt="Background Preview"
                className={cn(
                  'max-w-[50%] h-auto mt-1 rounded-lg cursor-pointer',
                  {
                    hidden: !src,
                  }
                )}
              />
            </PhotoView>
            <Input
              className="mt-2"
              id="background"
              type="file"
              onChange={handleChange}
              accept="image/*"
            />
          </PhotoProvider>
        </TabsContent>
        <TabsContent value="solid">
          <Input
            id="background-color"
            type="color"
            value={rgbaToHex(
              config.BackgroundColor as [number, number, number, number],
              false
            )}
            onChange={e => {
              setConfig({
                ...config,
                BackgroundColor: hexToRgba(e.target.value),
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BackgroundInput;
