import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Howl } from 'howler';
import { useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Play } from 'lucide-react';
import { Label } from './ui/label';
import useAppContext from '@/store';
import toast from '@/lib/toast';

const Sfx = () => {
  const config = useAppContext(s => s.config);
  const setConfig = useAppContext(s => s.setConfig);
  const setStatus = useAppContext(s => s.setStatus);
  const ffmpeg = useAppContext(s => s.ffmpeg);

  const howlerInstance = useRef(
    new Howl({
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
    })
  );

  async function changeSfx(format: string, name: string, src: string) {
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

  return (
    <div>
      <Label htmlFor="sfx">Sfx</Label>

      <Select
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

      <Button onClick={() => howlerInstance.current.play()}>
        <Play />
        Play Sound
      </Button>
      {config.Sfx === 'custom' ? (
        <div className="w-full max-w-sm items-center gap-3">
          <Label htmlFor="sfx">Sfx</Label>
          <Input
            id="sfx"
            type="file"
            accept="audio/*"
            onChange={async e => {
              setStatus('loading');

              if (!e.target.files || e.target.files.length === 0) return;

              const newSrc = e.target.files[0];
              if (newSrc) {
                // const f = new FileReader();
                const src = URL.createObjectURL(newSrc);
                const format = newSrc.name.split('.').pop();
                if (!format) {
                  alert('Invalid file format');
                  return;
                }
                await changeSfx(format, newSrc.name, src)
                  .then(() => {
                    setStatus('ready');
                  })
                  .catch(error => {
                    console.error('Error changing SFX:', error);
                    setStatus('error');
                    toast({
                      message: 'Failed to change the sound effect',
                      type: 'error',
                      title: 'Error',
                    });
                  });
              }
            }}
            placeholder="Drag and drop a sound file here or click to select"
          />
        </div>
      ) : null}
    </div>
  );
};

export default Sfx;
