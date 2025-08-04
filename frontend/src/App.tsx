import { PhotoProvider, PhotoView } from 'react-photo-view';
import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Greet, Run } from '../wailsjs/go/main/App';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import WidthHeight from './width-hight.component';
import { BlurType } from '@types';
import { Loader2Icon } from 'lucide-react';
import useAppContext from '@/store';
import clsx from 'clsx';
import { Input } from './components/ui/input';
import 'react-photo-view/dist/react-photo-view.css';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

declare const Go: any;

function getDummySnippets() {
  const snippets = [
    {
      text: 'Web Dev is a dynamic field that constantly evolves with new technologies and frameworks. Staying updated is crucial for anyone looking to excel in this area. From front-end user interfaces to back-end server logic and database management, the scope is vast. Learning about responsive design ensures your websites look great on any device. Performance optimization is another key aspect that users greatly appreciate, leading to better engagement and lower bounce rates. Accessibility should also be a top priority for all projects.',
    },
    {
      text: 'Building interactive and engaging user experiences is at the core of modern software development. Many developers focus on mobile applications, but the reach and versatility of the web remain unparalleled. Understanding various programming languages like JavaScript, Python, or Ruby is fundamental. Mastering concepts such as API integration, server-side rendering, and client-side scripting empowers a developer. The continuous learning journey in Web Dev involves exploring new tools and best practices to deliver high-quality solutions. Security considerations are paramount to protect user data and ensure robust applications.',
    },
    {
      text: "The journey to becoming a proficient developer involves countless hours of practice and problem-solving. It's not just about writing code; it's about understanding complex systems and designing elegant solutions. Version control systems like Git are indispensable for collaborative projects, allowing teams to manage changes effectively. Debugging skills are equally important, helping to identify and fix issues efficiently. From design principles to deployment strategies, every stage requires attention to detail. Exploring different architectural patterns can significantly improve scalability and maintainability. A passion for continuous learning is what truly defines a successful professional in Web Dev.",
    },
    {
      text: 'Starting a career in technology often involves choosing a specialization. Many aspiring professionals gravitate towards mobile app development, while others find their niche in data science or cybersecurity. However, the foundational skills acquired in Web Dev are often transferable across multiple domains. This versatile skill set makes it a popular choice for many, offering a broad range of career opportunities in various industries.',
    },
    {
      text: 'Creating robust and scalable web applications requires a deep understanding of both client-side and server-side technologies. From choosing the right database to designing an intuitive user interface, every decision impacts the final product. Frameworks like React, Angular, and Vue.js have revolutionized front-end development, making complex interactions easier to manage. On the back-end, Node.js, Django, and Ruby on Rails provide powerful tools for building APIs and handling business logic. Continuous integration and continuous deployment (CI/CD) pipelines streamline the development process, ensuring faster releases. The demand for skilled professionals in Web Dev continues to grow globally, driven by the increasing digitalization of businesses.',
    },
  ];
  return snippets.map(snippet => {
    const Lines = snippet.text.split('. ').map(line => line.trim());
    return {
      HighlightIndex: Lines.findIndex(line => line.includes('Web Dev')),
      Lines,
    };
  });
}

function App() {
  const [name, setName] = useState('');
  const [preview, setPreview] = useState<string>();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const {
    config,
    setConfig,
    setIsWasmBackendError,
    setIsWasmBackendLoading,
    setIsFfmpegLoading,
    setIsFfmpegError,
    isWasmBackendLoading,
    isFfmpegLoading,
    isWasmBackendError,
    isFfmpegError,
  } = useAppContext(s => s);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const assetsWritten = useRef(false);
  useEffect(() => {
    async function init() {
      await loadWasmBackend().catch(err => {
        console.error('Error loading WASM backend:', err);
        setIsWasmBackendError(String(err));
      });
      setIsWasmBackendLoading(false);
      if (isWasmBackendError) {
        console.error('WASM backend error:', isWasmBackendError);
        return;
      }
      await loadFFmpeg(ffmpegRef.current).catch(err => {
        console.error('Error loading FFmpeg:', err);
        setIsFfmpegError(String(err));
      });
      setIsFfmpegLoading(false);
    }
    init();
  }, []);
  async function writeAssets() {
    if (assetsWritten.current) {
      console.log('Assets already written, skipping...');
      return;
    }
    await ffmpegRef.current.load();
    await ffmpegRef.current.writeFile(
      '/shutter.wav',
      await fetchFile('/shutter.wav')
    );
    assetsWritten.current = true;
  }
  // async function cleanUp(){
  //   if (!videoRef.current?.src) {
  //     console.warn('No video source to clean up.');
  //     return;
  //   }
  // }

  async function renderFrame(i: number, input: any, write: boolean = true) {
    const frame = `/vid/frame-${i + 1}.png`;
    const base64String = (window as any).GenerateFrameFromJSON(
      JSON.stringify(input)
    );
    if (write) {
      await ffmpegRef.current.writeFile(
        frame,
        Uint8Array.from(atob(base64String), c => c.charCodeAt(0))
      );
    }

    // 3. Display the resulting image
    console.log('Image frame rendered:', i + 1);
    return { frame, url: `data:image/png;base64,${base64String}` };
  }
  async function renderPreview() {
    if (!videoRef.current) return;
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(undefined);
    }
    await ffmpegRef.current.load();
    await writeAssets();
    try {
      const input = {
        frameNum: 1,
        config,
        aiSnippets: getDummySnippets(),
        fontFiles: ['embedded'], // Use the embedded font
        highlightRadius: 400.0,
        totalFrames: 1,
      };
      const { frame, url } = await renderFrame(0, input, false);
      setPreview(url);
      console.log('Preview rendered:', frame);
    } catch (err) {
      console.error('Error calling WASM function:', err);
    }
  }
  async function renderVideo() {
    if (!videoRef.current) return;
    // if (!isWasmReady) {
    //   console.error('WASM is not ready yet.');
    //   return;
    // }
    try {
      const time = new Date().getTime();
      console.log('Generating image at', time);
      const input = {
        frameNum: -1,
        config: {
          Width: 1920,
          Height: 1080,
          FPS: 1,
          HighlightedText: 'Web Dev',
          HighlightColor: 'yellow',
          TextColor: 'black',
          BackgroundColor: 'white',
          // BlurType: 'gaussian-feather',
          BlurAngle: 45.0, // Directional blur
          // BlurType: 'gaussian-no-feather',
          BlurType: 'directional',
          BlurRadius: 5.0,
          FontSize: 60,
          MinLines: 5,
          MaxLines: 10,
          VerticalSpread: 1.5,
          Feather: 0.5,
        },
        aiSnippets: getDummySnippets(),
        fontFiles: ['embedded'], // Use the embedded font
        highlightRadius: 400.0,
        totalFrames: 1,
      };
      if (videoRef.current.src) {
        URL.revokeObjectURL(videoRef.current.src);
        /* ffmpeg does not seem to support deleting non-empty directories */
        await ffmpegRef.current.listDir('/vid').then(async files => {
          console.log('Files in /vid:', files);
          for (const file of files) {
            if (file.isDir) continue;
            await ffmpegRef.current.deleteFile(`/vid/${file.name}`);
          }
        });
      }
      const frames: Record<string, string> = {};
      await ffmpegRef.current.load();

      await writeAssets();

      console.log('FFmpeg loaded, starting image generation...');
      await ffmpegRef.current.createDir('/vid');
      for (let i = 0; i < 5; i++) {
        try {
          input.frameNum = i + 1; // Update frame number
          // 3. Display the resulting image
          const { frame, url } = await renderFrame(i, input);
          frames[frame] = url;
        } catch (err) {
          console.error('Error calling WASM function:', err);
        }
      }

      const filterComplex = `[0:v]scale=1920:1080,format=yuv420p[v];[1:a]aloop=loop=${
        5 - 1
      }:size=48000[a]`;
      await ffmpegRef.current.exec([
        '-r',
        '3',
        '-i',
        `vid/frame-%d.png`,
        '-i',
        '/shutter.wav',
        '-filter_complex',
        filterComplex,
        '-map',
        '[v]',
        '-map',
        '[a]',
        '-c:v',
        'libx264',
        '-c:a',
        'aac',
        '-y',
        '/vid/output.mp4',
      ]);

      const fileData = await ffmpegRef.current.readFile('/vid/output.mp4');
      //@ts-ignore
      const data = new Uint8Array(fileData as ArrayBuffer);
      videoRef.current.src = URL.createObjectURL(
        new Blob([data.buffer], { type: 'video/mp4' })
      );
      const endTime = new Date().getTime();
      const elapsed = (endTime - time) / 1000;
      console.log('Image generation completed in', elapsed, 'seconds');
      setElapsedTime(elapsed);
    } catch (error) {
      await ffmpegRef.current.deleteDir('/vid');

      console.error('Error during image generation:', error);
    }
  }

  return (
    <div id="App">
      <Card className="w-[50%] mx-auto">
        <CardHeader>
          <CardTitle>Generate Text Cut Match</CardTitle>
          <CardDescription className="w-[70%] m-auto">
            This tool generates a video with text cut matches based on the
            provided snippets. Change the settings below to customize the
            output.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="blur-type">Blur Type</Label>
            <Select
              defaultValue={BlurType.Horizontal}
              onValueChange={value => {
                setConfig({
                  ...config,
                  BlurType: value as BlurType,
                });
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Blur Type" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(BlurType).map(type => (
                  <SelectItem
                    key={type}
                    value={BlurType[type as keyof typeof BlurType]}
                  >
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <WidthHeight />
          <div>
            <Label htmlFor="highlighted-text">Highlighted Text</Label>
            <Input
              id="highlighted-text"
              value={config.HighlightedText}
              onChange={e =>
                setConfig({
                  ...config,
                  HighlightedText: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="highlight-color">Highlight Color</Label>
            <Input
              id="highlight-color"
              type="color"
              value={config.HighlightColor}
              onChange={e =>
                setConfig({
                  ...config,
                  HighlightColor: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="text-color">Text Color</Label>
            <Input
              id="text-color"
              type="color"
              value={config.TextColor}
              onChange={e =>
                setConfig({
                  ...config,
                  TextColor: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="background-color">Background Color</Label>
            <Input
              id="background-color"
              type="color"
              value={config.BackgroundColor}
              onChange={e =>
                setConfig({
                  ...config,
                  BackgroundColor: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="font-size">Font Size</Label>
            <Input
              id="font-size"
              type="number"
              value={config.FontSize}
              onChange={e =>
                setConfig({
                  ...config,
                  FontSize: parseInt(e.target.value, 10),
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="min-lines">Min Lines</Label>
            <Input
              id="min-lines"
              type="number"
              value={config.MinLines}
              onChange={e =>
                setConfig({
                  ...config,
                  MinLines: parseInt(e.target.value, 10),
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="max-lines">Max Lines</Label>
            <Input
              id="max-lines"
              type="number"
              value={config.MaxLines}
              onChange={e =>
                setConfig({
                  ...config,
                  MaxLines: parseInt(e.target.value, 10),
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="vertical-spread">Vertical Spread</Label>
            <Input
              id="vertical-spread"
              type="number"
              value={config.VerticalSpread}
              onChange={e =>
                setConfig({
                  ...config,
                  VerticalSpread: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="feather">Feather</Label>
            <Input
              id="feather"
              type="number"
              value={config.Feather}
              onChange={e =>
                setConfig({
                  ...config,
                  Feather: parseFloat(e.target.value),
                })
              }
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button
            variant="outline"
            className="max-w-sm"
            disabled={isWasmBackendLoading || isFfmpegLoading}
            onClick={renderVideo}
          >
            <Loader2Icon
              className={clsx('animate-spin', {
                hidden: !(isWasmBackendLoading || isFfmpegLoading),
              })}
            />
            Render
          </Button>

          <Button
            variant="outline"
            className="max-w-sm"
            title="Renders the first frame of the video"
            disabled={isWasmBackendLoading || isFfmpegLoading}
            onClick={renderPreview}
          >
            <Loader2Icon
              className={clsx('animate-spin', {
                hidden: !(isWasmBackendLoading || isFfmpegLoading),
              })}
            />
            Preview
          </Button>
          <div>
            <p ref={messageRef} className="text-sm text-muted-foreground">
              {isWasmBackendLoading && 'Loading WASM backend...'}
              {isFfmpegLoading && 'Loading FFmpeg...'}
              {isWasmBackendError && `WASM Error: ${isWasmBackendError}`}
              {isFfmpegError && `FFmpeg Error: ${isFfmpegError}`}
            </p>
          </div>
          <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
            <DrawerTrigger asChild>
              <Button variant="outline">Open Drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>Render finished</DrawerTitle>
                  <DrawerDescription>
                    Time elapsed: {elapsedTime}
                  </DrawerDescription>
                </DrawerHeader>
                <PhotoProvider>
                  <div className="max-w-sm m-auto">
                    <PhotoView src={preview}>
                      <img src={preview} alt="Preview" />
                    </PhotoView>
                  </div>
                </PhotoProvider>
                <DrawerFooter>
                  <Button>Submit</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </CardFooter>
      </Card>
      <video
        ref={videoRef}
        controls
        style={{ maxWidth: '100%', height: 'auto' }}
      ></video>
    </div>
  );
}

export default App;

async function loadWasmBackend() {
  const go = new Go();
  await WebAssembly.instantiateStreaming(
    fetch('lib.wasm'),
    go.importObject
  ).then(result => {
    console.log('WASM loaded successfully');
    go.run(result.instance);
  });
}

const loadFFmpeg = async (ffmpeg: FFmpeg) => {
  const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.10/dist/esm';
  // ffmpeg.on('log', ({ message }) => {
  //   if (messageRef.current) messageRef.current.innerHTML = message;
  // });
  // toBlobURL is used to bypass CORS issue, urls with the same
  // domain can be used directly.
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.worker.js`,
      'text/javascript'
    ),
  });
  console.log('FFmpeg loaded successfully');
};
