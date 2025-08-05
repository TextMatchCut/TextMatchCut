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

const Sfx = () => {
  const config = useAppContext(s => s.config);
  const setConfig = useAppContext(s => s.setConfig);
  const setStatus = useAppContext(s => s.setStatus);
  const [filePath, setFilePath] = useState<string | null>(null);

  const howlerInstance = useRef<Howl | null>(null);

  // Initialize Howl instance only once when component mounts
  useEffect(() => {
    const howl = new Howl({
      src: ['shutter.wav'],
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

  async function changeSfx(format: string, name: string, src: string) {
    if (!howlerInstance.current) {
      return;
    }
    console.log(
      'Changing SFX to:',
      name,
      'with format:',
      format,
      'and source:',
      src
    );
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

  async function handleFolderPick() {
    try {
      const res = await PickAudioFile();
      if (res.success) {
        setFilePath(res.path!);
        changeSfx(
          res.path!.split('.').pop()!,
          'custom',
          `data:audio/${res.path!.split('.').pop()!};base64,${res.audioData!}`
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
    <div>
      <Label htmlFor="sfx">Sfx</Label>

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
            <SelectItem value="shutter.wav">Shutter</SelectItem>
            <SelectItem value="shutter1.wav">Shutter 1</SelectItem>
            <SelectItem value="shutter2.wav">Shutter 2</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button
        onClick={() => {
          if (howlerInstance.current) {
            howlerInstance.current.play();
          }
        }}
      >
        <Play />
        Play Sound
      </Button>
      {config.Sfx === 'custom' ? (
        <div className="w-full max-w-sm items-center gap-3">
          <Button onClick={handleFolderPick}>Pick an audio file</Button>
          {filePath ? (
            <p className="text-sm text-gray-500">Selected file: {filePath}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default Sfx;
