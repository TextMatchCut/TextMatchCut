import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useAppContext from '@/store';
import { rgbaToHex, hexToRgba } from '@/lib/utils';
import { Replace } from 'lucide-react';
import { DEFAULT_BACKGROUND_COLOR } from '@constants';

const BackgroundInput = () => {
  const [src, setSrc] = useState<string>('/img/test-bg.jpg');
  const config = useAppContext(s => s.config);
  const setConfig = useAppContext(s => s.setConfig);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (src) {
      URL.revokeObjectURL(src);
    }
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const base64Font = e.target?.result as string;
        setSrc(base64Font);
        setConfig(prevConfig => ({
          ...prevConfig,
          BackgroundImage: base64Font.split(',')[1],
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  useEffect(() => {
    const init = async () => {
      const img = await fetch('/img/test-bg.jpg');
      const blob = await img.blob();
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      setSrc(base64Image);
      setConfig(prevConfig => ({
        ...prevConfig,
        BackgroundImage: base64Image.split(',')[1],
      }));
    };
    init();
  }, []);

  return (
    <div className="flex flex-1 max-w-sm flex-col">
      <Label className="mb-2">Background</Label>
      <Tabs
        defaultValue="image"
        onValueChange={value => {
          if (value === 'image') {
            return setConfig(prevConfig => ({
              ...prevConfig,

              BackgroundImpl: 'image',
            }));
          }
          return setConfig(prevConfig => ({
            ...prevConfig,
            BackgroundImpl: 'solid',
          }));
        }}
      >
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
              <div className="relative">
                <img
                  src={src} // Fallback to a default image if no file is selected
                  alt="Background Preview"
                  className={cn(
                    'w-full h-auto mt-1 rounded-lg cursor-pointer',
                    {
                      hidden: !src,
                    }
                  )}
                />
                <div
                  className="absolute top-[-15%] left-[90%] transform -translate-y-1/2 hover:bg-gray-700 p-2 rounded-lg"
                  title="Replace"
                  onClick={e => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  <Replace className=" w-[20px] h-[20px]" />
                </div>
              </div>
            </PhotoView>
            <Input
              ref={inputRef}
              className="hidden"
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
