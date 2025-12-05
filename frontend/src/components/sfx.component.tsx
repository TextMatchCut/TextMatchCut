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
import toast from '@/lib/toast';
import { PickAudioFile } from '../../wailsjs/go/main/App';
import { useFormContext } from 'react-hook-form';

const INITIAL_SFX_OPTIONS = ['sfx/shutter.wav', 'sfx/shutter1.wav'];
let cleanup: (() => void) | null = null;
const Sfx = () => {
  const { setValue, watch } = useFormContext();
  const [sfxOptions, setSfxOptions] = useState(INITIAL_SFX_OPTIONS);
  const value = watch('Sfx');

  const howlerInstance = useRef<Howl | null>(null);

  useEffect(() => {
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

    // Cleanup on unmount
    return () => {
      howl.unload();
    };
  }, []); // Empty dependency array = runs only once

  async function changeSfx(
    format: string,
    name: string,
    src: string,
    file: boolean = false
  ) {
    cleanup?.();

    // If a file is provided, set up cleanup to revoke the object URL
    // this will run next time changeSfx is called
    if (file) {
      cleanup = () => {
        URL.revokeObjectURL(src);
      };
    }

    if (!howlerInstance.current) {
      return;
    }
    setValue('Sfx', name);
    howlerInstance.current.unload();
    howlerInstance.current = new Howl({
      src: [src],
      preload: true,
      format: [format], // Specify the format if needed
      onload: () => {
        console.log('Audio loaded successfully');
      },
      onloaderror: (id, error) => {
        console.error('Failed to load audio:', error);
        // toast({
        //   message: 'Failed to load the selected audio file',
        //   type: 'error',
        //   title: 'Error',
        // });
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
  }

  const handleValueChange = async (value: string) => {
    try {
      if (value === 'Custom') {
        const res = await PickAudioFile();
        if (res.success && res.path) {
          setSfxOptions(prev => [...prev, res.path!]);
          setValue('Sfx', res.path!);

          // FIXME: this needs work
          changeSfx(
            res.path!.split('.').pop()!,
            'custom',
            `data:audio/${res
              .path!.split('.')
              .pop()!};base64,${res.audioData!}`,
            true
          );
        }
        return;
      }
      changeSfx('wav', value, value);
    } catch (error) {
      console.error('Error picking audio file:', error);
      // toast({
      //   message: 'Failed to pick audio file',
      //   type: 'error',
      //   title: 'Error',
      // });
    }
  };

  return (
    <div className="flex flex-col flex-[0.25] items-center align-center mt-4">
      <Label htmlFor="sfx" className="self-start">
        Sfx
      </Label>
      <div className="flex gap-4">
        <Select value={value} onValueChange={handleValueChange}>
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
    </div>
  );
};

export default Sfx;
