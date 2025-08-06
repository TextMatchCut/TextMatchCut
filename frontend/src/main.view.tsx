import { PhotoProvider, PhotoView } from 'react-photo-view';
import { useState, useEffect, useRef } from 'react';
import './App.css';
import {
  Run,
  RenderPreview,
  GetDefaultAssetsPath,
} from '../wailsjs/go/main/App';
import { fetchFile } from '@ffmpeg/util';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { actionStandalone } from '@/lib/action';

import { ArrowUp, Loader2Icon } from 'lucide-react';
import useAppContext from '@/store';
import clsx from 'clsx';
import 'react-photo-view/dist/react-photo-view.css';
import Drawer from '@/components/drawer.component';
import { getDummySnippets, loadWasmBackend, loadFFmpeg } from '@/lib/utils';
import ConfigForm from './components/config-form.component';
import toast from './lib/toast';
import path from 'path';
import { EventsOn, EventsOff } from '../wailsjs/runtime';
const MainView = () => {
  const {
    config,
    openDrawer,
    setOpenDrawer,
    setConfig,
    setElapsedTime,
    setStatus,
    elapsedTime,
    status,
    ffmpeg,
    setProgress,
    preview,
    setPreview,
  } = useAppContext(s => s);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const loading = status === 'loading';
  useEffect(() => {
    EventsOn('frame', args => {
      const { frameNum, totalFrames, frameData } = args;
      const p = (frameNum / totalFrames) * 100;
      setProgress(p);
      setPreview(`data:image/png;base64,${frameData}`);
    });
    async function writeAssets() {
      await ffmpeg.load();
      await ffmpeg.createDir('/vid');
      await ffmpeg.writeFile('/shutter.wav', await fetchFile('/shutter.wav'));
      console.log('Assets written successfully');
    }
    async function initWeb() {
      try {
        await loadWasmBackend();
        await loadFFmpeg(ffmpeg);
        await ffmpeg.load();
        await writeAssets();
        setStatus('ready');
      } catch (error) {
        console.error('Error initializing', error);
        toast({
          message: 'Failed to initialize the application',
          type: 'error',
          title: 'Initialization Error',
        });
        setStatus('error');
      }
    }

    async function init() {
      const res = await GetDefaultAssetsPath();
      if (!res.success) {
        console.error('Failed to get default assets path:', res.error);
        toast({
          message: 'Failed to get default assets path',
          type: 'error',
          title: 'Error',
        });
      }
      // function type of setConfig seems to not work for some reason
      // setConfig({
      //   ...config,
      //   Sfx: path.join(res.path!, 'sfx', 'shutter.wav'),
      //   // assetsPath: res.path,
      // });
      // get sfx and bg img path
      setStatus('ready');
    }
    __DESKTOP__ ? init() : initWeb();
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, []);

  // async function cleanUp(){
  //   if (!videoRef.current?.src) {
  //     console.warn('No video source to clean up.');
  //     return;
  //   }
  // }

  async function renderFrame(input: any) {
    console.log('Rendering frame with input:', input);
    const res = await RenderPreview(input);

    if (!res.success) {
      return toast({
        title: 'Error',
        message: res.error || 'Failed to render preview',
        type: 'error',
      });
    }
    setPreview(`data:image/png;base64,${res.frameData!}`);
  }

  async function renderFrameWeb(i: number, input: any, write: boolean = true) {
    return new Promise<void>(async (resolve, reject) => {
      const frame = `/vid/frame-${i + 1}.png`;
      console.log({ input });
      const base64String = (window as any).GenerateFrameFromJSON(
        JSON.stringify(input)
      );
      if (write) {
        await ffmpeg.writeFile(
          frame,
          Uint8Array.from(atob(base64String), c => c.charCodeAt(0))
        );
      }

      console.log('Image frame rendered:', i + 1);
      setPreview(`data:image/png;base64,${base64String}`);
      const p = ((i + 1) / 5) * 100;
      console.log({ p, status });
      setProgress(p);
      setTimeout(() => {
        resolve();
      }, 50); // Ensure UI updates before resolving //react was a wrong pick for this project - i realized it once it's too late
    });
  }

  async function renderPreview() {
    if (preview) {
      URL.revokeObjectURL(preview);
      setVideoSrc(null);
    }
    try {
      // const input = {
      //   frameNum: 1,
      //   config,
      //   aiSnippets: getDummySnippets(),
      //   fontFiles: ['embedded'], // Use the embedded font
      //   highlightRadius: 400.0,
      //   totalFrames: 1,
      // };
      await renderFrame(config);
    } catch (err) {
      setStatus('error');
      toast({
        title: 'Error',
        message: 'Failed to render preview',
        type: 'error',
      });
      console.error('Error calling renderFrame:', err);
    }
  }

  async function renderPreviewWeb() {
    if (preview) {
      URL.revokeObjectURL(preview);
      setVideoSrc(null);
    }
    // await ffmpegRef.current.load();
    try {
      const input = {
        frameNum: 1,
        config,
        aiSnippets: getDummySnippets(),
        fontFiles: ['embedded'], // Use the embedded font
        highlightRadius: 400.0,
        totalFrames: 1,
      };
      await renderFrameWeb(0, input, false);
    } catch (err) {
      setStatus('error');
      toast({
        title: 'Error',
        message: 'Failed to render preview',
        type: 'error',
      });
      console.error('Error calling renderFrame:', err);
    }
  }
  async function renderVideoWeb() {
    // if (!isWasmReady) {
    //   console.error('WASM is not ready yet.');
    //   return;
    // }

    try {
      const input = {
        frameNum: -1,
        config,
        aiSnippets: getDummySnippets(),
        fontFiles: ['embedded'], // Use the embedded font
        highlightRadius: 400.0,
        totalFrames: 1,
      };
      // await writeAssets();
      // if (true) {
      //   await ffmpegRef.current.createDir('/vid');

      //   // URL.revokeObjectURL(videoSrc);
      //   /* ffmpeg does not seem to support deleting non-empty directories */
      //   await ffmpegRef.current.listDir('/vid').then(async files => {
      //     console.log('Files in /vid:', files);
      //     for (const file of files) {
      //       if (file.isDir) continue;
      //       await ffmpegRef.current.deleteFile(`/vid/${file.name}`);
      //     }
      //   });
      // }

      console.log('FFmpeg loaded, starting image generation...');
      for (let i = 0; i < 5; i++) {
        try {
          input.frameNum = i + 1; // Update frame number
          await renderFrameWeb(i, input);
        } catch (err) {
          console.error('Error calling WASM function:', err);
        }
      }

      const filterComplex = `[0:v]scale=1920:1080,format=yuv420p[v];[1:a]aloop=loop=${
        5 - 1
      }:size=48000[a]`;
      await ffmpeg.exec([
        '-r',
        '3',
        '-i',
        `/vid/frame-%d.png`,
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
        'output.mp4',
      ]);

      const fileData = await ffmpeg.readFile('output.mp4');
      console.log('Output file read successfully:', fileData);
      //@ts-ignore
      const data = new Uint8Array(fileData as ArrayBuffer);
      setPreview(null);
      setVideoSrc(
        URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
      );
    } catch (error) {
      // await ffmpegRef.current.deleteDir('/vid');

      console.error('Error during image generation:', error);
    }
  }

  async function renderVideo() {
    return await Run(config)
      .then(async res => {
        setPreview(null);
        setVideoSrc(`data:video/mp4;base64,${res.videoData!}`);
      })
      .finally(() => {
        EventsOff('frameRendered');
      });
  }

  async function downloadVideoWeb() {
    if (!videoSrc) return;

    const link = document.createElement('a');
    link.href = videoSrc;
    link.download = `output-${config.HighlightedText}-${Date.now()}.mp4`;
    link.click();
  }

  async function showVideoLocation() {}

  return (
    <>
      <Card className="h-screen mx-auto">
        <CardHeader>
          <CardTitle>Generate Text Cut Match</CardTitle>
          <CardDescription className="w-[70%] m-auto">
            This tool generates a video with text cut matches based on the
            provided snippets. Change the settings below to customize the
            output.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 max-w-[1400px] m-auto">
          <ConfigForm />
        </CardContent>

        <CardFooter className="m-auto flex gap-4">
          <Button
            variant="outline"
            className="max-w-sm"
            disabled={loading}
            onClick={
              __DESKTOP__
                ? actionStandalone(renderVideo)
                : actionStandalone(renderVideoWeb)
            }
          >
            <Loader2Icon
              className={clsx('animate-spin', {
                hidden: !loading,
              })}
            />
            Render
          </Button>

          <Button
            variant="outline"
            className="max-w-sm"
            title="Renders the first frame of the video"
            disabled={loading}
            onClick={
              __DESKTOP__
                ? actionStandalone(renderPreview)
                : actionStandalone(renderPreviewWeb)
            }
          >
            <Loader2Icon
              className={clsx('animate-spin', {
                hidden: !loading,
              })}
            />
            Preview
          </Button>

          <Button
            variant="outline"
            className="max-w-sm"
            disabled={loading}
            onClick={() => setOpenDrawer(!openDrawer)}
          >
            <ArrowUp />
            Open Drawer
          </Button>
          <div>
            <p ref={messageRef} className="text-sm text-muted-foreground">
              {loading
                ? 'Loading...'
                : status === 'error'
                ? 'Error occurred while rendering.'
                : null}
            </p>
          </div>
        </CardFooter>
      </Card>
      <Drawer>
        <PhotoProvider>
          <div className="m-auto">
            {!preview && !videoSrc ? (
              <>
                <h2 className="text-center text-lg font-semibold mb-4">
                  Nothing to see here
                </h2>
                <p className="text-center text-sm text-muted-foreground">
                  Render a preview or video to see the results here.
                </p>
              </>
            ) : null}
            {preview ? (
              <>
                <h2 className="text-center text-lg font-semibold mb-4">
                  Preview
                </h2>

                <PhotoView src={preview}>
                  <div className="rounded-md overflow-hidden">
                    <img
                      src={preview}
                      data-preview-img
                      alt="Preview"
                      className="cursor-pointer object-cover"
                    />
                  </div>
                </PhotoView>

                <Button
                  className="mt-4"
                  onClick={
                    __DESKTOP__
                      ? actionStandalone(renderVideo)
                      : actionStandalone(renderVideoWeb)
                  }
                >
                  Render Full Video
                </Button>
              </>
            ) : null}
            {videoSrc ? (
              <>
                <h2 className="text-center text-lg font-semibold mb-4">
                  Output
                </h2>
                <video
                  controls
                  style={{ maxWidth: '100%', height: 'auto' }}
                  src={videoSrc || undefined}
                ></video>
                <Button
                  className="mt-4"
                  onClick={__DESKTOP__ ? showVideoLocation : downloadVideoWeb}
                >
                  Download
                </Button>
              </>
            ) : null}
          </div>
        </PhotoProvider>
      </Drawer>
    </>
  );
};

export default MainView;
