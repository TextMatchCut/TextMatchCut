import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Howl } from 'howler';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Play } from 'lucide-react';
import { Label } from './ui/label';
import useAppContext from '@/store';
import toast from '@/lib/toast';

const INITIAL_SFX_OPTIONS = [
  'sfx/shutter.wav',
  'sfx/shutter1.wav',
  'sfx/shutter2.wav',
];
let cleanup: (() => void) | null = null;
const Sfx = () => {
  // const config = useAppContext(s => s.config);
  const [sfxOptions, setSfxOptions] = useState(INITIAL_SFX_OPTIONS);
  // const setConfig = useAppContext(s => s.setConfig);
  const ffmpeg = useAppContext(s => s.ffmpeg);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const howlerInstance = useRef<Howl | null>(null);

  // Initialize Howl instance only once when component mounts
  useEffect(() => {
    const init = async () => {
      await ffmpeg.load();
    };
    const howl = new Howl({
      src: ['sfx/shutter.wav'],
      preload: true,
      onload: () => {
        console.log('Audio loaded successfully');
      },
      onloaderror: (id, error) => {
        console.error('Failed to load audio:', error);
        toast({
          message: 'Failed to load the selected audio file',
          type: 'error',
          title: 'Error',
        });
      },
      onplayerror: (id, error) => {
        console.error('Failed to play audio:', error);
        toast({
          message: 'Failed to play the selected audio file',
          type: 'error',
          title: 'Error',
        });
      },
    });
    howlerInstance.current = howl;

    init();
    // Cleanup on unmount
    return () => {
      howl.unload();
    };
  }, []); // Empty dependency array = runs only once

  async function changeSfx(
    format: string,
    name: string,
    src: string,
    file = false
  ) {
    if (!howlerInstance.current) {
      return;
    }
    cleanup?.();
    if (file) {
      cleanup = () => {
        URL.revokeObjectURL(src);
      };
    }
    howlerInstance.current.unload();
    const howlerPromise = new Promise<void>((resolve, reject) => {
      howlerInstance.current = new Howl({
        src: [src],
        preload: true,
        format: [format], // Specify the format if needed
        onload: () => {
          resolve();
          // TODO : need to handle this better
          //   reject();
        },
        onloaderror: (id, error) => {
          console.error('Failed to load audio:', error);
          reject(error);
        },
        onplayerror: (id, error) => {
          console.error('Failed to play audio:', error);
          reject(error);
        },
      });
    });
    await Promise.all([howlerPromise, ffmpeg.writeFile(name, src)]);
  }

  const handleValueChange = async (value: string) => {
    if (value === 'Custom') {
      inputRef.current?.click();
      return;
    }

    const filePath = `sfx/${value}`;

    try {
      await changeSfx('wav', value, filePath);
      // setConfig(conf => ({ ...conf, Sfx: value }));
    } catch (error) {
      console.error('Error changing SFX:', error);
      toast({
        message: 'Failed to change sound effect',
        type: 'error',
        title: 'Error',
      });
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const src = URL.createObjectURL(file);
    const format = file.name.split('.').pop() || 'wav';
    const name = `${file.name}-Custom`;

    try {
      await changeSfx(format, name, src, true);
      setSfxOptions(prev => [
        ...prev.filter(p => INITIAL_SFX_OPTIONS.includes(p)),
        name,
      ]);
      // setConfig(conf => ({ ...conf, Sfx: name }));
    } catch (error) {
      console.error('Error picking audio file:', error);
      toast({
        message: 'Failed to load the selected audio file',
        type: 'error',
        title: 'Error',
      });
    }
  };

  return (
    <div className="flex flex-col flex-[0.25] items-center align-center mt-4">
      <Label htmlFor="sfx" className="self-start">
        Sfx
      </Label>
      <div className="flex gap-4">
        {/* <Select value={config.Sfx} onValueChange={handleValueChange}> */}
        <Select value={'sfx/shutter.wav'} onValueChange={handleValueChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a sound effect" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {[...sfxOptions, 'Custom'].map(option => (
                <SelectItem key={option} value={option}>
                  {INITIAL_SFX_OPTIONS.includes(option)
                    ? option.replace('sfx/', '')
                    : option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Button
        className="cursor-pointer mt-4"
        type="button"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          if (howlerInstance.current) {
            howlerInstance.current.play();
          }
        }}
      >
        <Play />
      </Button>
      <input
        className="hidden"
        type="file"
        accept="audio/*"
        ref={inputRef}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default Sfx;
