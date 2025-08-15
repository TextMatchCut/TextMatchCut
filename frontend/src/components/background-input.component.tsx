import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Replace } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

const BackgroundInput = () => {
  const [src, setSrc] = useState<string>('/img/bg-1.jpg');
  const { setValue, register } = useFormContext();
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
        setValue('BackgroundImage', base64Font.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  }

  useEffect(() => {
    const init = async () => {
      const img = await fetch('/img/bg-1.jpg');
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
      setValue('BackgroundImage', base64Image.split(',')[1]);
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
            return setValue('BackgroundImpl', 'image');
          }
          return setValue('BackgroundImpl', 'solid');
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
                    'w-[90%] md:w-full h-auto mt-1 rounded-lg cursor-pointer',
                    {
                      hidden: !src,
                    }
                  )}
                />
                <div
                  className="absolute top-[-1.5rem] left-[70%]  md:left-[90%] transform -translate-y-1/2 hover:bg-gray-700 p-2 rounded-lg"
                  title="Replace background image"
                  onClick={e => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  <Replace className="w-[20px] h-[20px]" />
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
            {...register('BackgroundColor')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BackgroundInput;
