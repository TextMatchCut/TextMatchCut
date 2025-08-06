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
import { PickAudioFile } from '../../wailsjs/go/main/App';
let cleanup: (() => void) | null = null;
const Sfx = () => {
  const config = useAppContext(s => s.config);
  const setConfig = useAppContext(s => s.setConfig);
  const setStatus = useAppContext(s => s.setStatus);
  const [filePath, setFilePath] = useState<string | null>(null);

  const howlerInstance = useRef<Howl | null>(null);

  // Initialize Howl instance only once when component mounts
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

    // If a file is provided, set up cleanup to reset the file path and revoke the object URL
    // this will run next time changeSfx is called
    if (file) {
      cleanup = () => {
        setFilePath(null);
        URL.revokeObjectURL(src);
      };
    }

    if (!howlerInstance.current) {
      return;
    }
    setConfig(conf => ({ ...conf, Sfx: name }));
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
  }

  async function handleFilePick() {
    try {
      const res = await PickAudioFile();
      if (res.success) {
        setFilePath(res.path!);
        changeSfx(
          res.path!.split('.').pop()!,
          'custom',
          `data:audio/${res.path!.split('.').pop()!};base64,${res.audioData!}`,
          true
        );
      }
      // changeSfx('wav', 'custom', folderPath);
    } catch (error) {
      console.error('Error picking audio file:', error);
      toast({
        message: 'Failed to pick audio file',
        type: 'error',
        title: 'Error',
      });
    }
  }

  return (
    <div className="flex flex-col items-center align-center mt-4">
      <Label htmlFor="sfx" className="self-start">
        Sfx
      </Label>
      <div className="flex gap-4">
        <Select
          value={config.Sfx}
          onValueChange={value => {
            setConfig(conf => ({ ...conf, Sfx: value }));
            if (value !== 'custom') changeSfx('wav', value, value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a sound effect" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="sfx/shutter.wav">Shutter</SelectItem>
              <SelectItem value="sfx/shutter1.wav">Shutter 1</SelectItem>
              <SelectItem value="sfx/shutter2.wav">Shutter 2</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {config.Sfx === 'custom' && filePath ? (
          <Button
            onClick={() => {
              if (howlerInstance.current) {
                howlerInstance.current.play();
              }
            }}
          >
            <Play />
            Play
          </Button>
        ) : config.Sfx !== 'custom' ? (
          <Button
            onClick={() => {
              if (howlerInstance.current) {
                howlerInstance.current.play();
              }
            }}
          >
            <Play />
            Play
          </Button>
        ) : null}
      </div>

      {config.Sfx === 'custom' ? (
        <div className="flex flex-col gap-4 max-w-sm items-center mt-4">
          {filePath ? (
            <p className="text-sm text-gray-500">Selected file: {filePath}</p>
          ) : null}
          <Button onClick={handleFilePick}>
            {filePath ? 'Change audio file' : 'Pick an audio file'}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default Sfx;
