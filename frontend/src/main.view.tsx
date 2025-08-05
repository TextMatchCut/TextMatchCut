import { PhotoProvider, PhotoView } from 'react-photo-view';
import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Run, RenderPreview } from '../wailsjs/go/main/App';
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

const MainView = () => {
  const [preview, setPreview] = useState<string>();
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
  } = useAppContext(s => s);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const loading = status === 'loading';
  useEffect(() => {
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
      setStatus('ready');
    }
    __DESKTOP__ ? init() : initWeb();
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

    // 3. Display the resulting image
    console.log('Image frame rendered:', i + 1);
    return { frame, url: `data:image/png;base64,${base64String}` };
  }

  async function renderPreview() {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(undefined);
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
      setPreview(undefined);
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
      const { frame, url } = await renderFrameWeb(0, input, false);
      setPreview(url);
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
      const time = new Date().getTime();
      console.log('Generating image at', time);
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
      const frames: Record<string, string> = {};

      console.log('FFmpeg loaded, starting image generation...');
      for (let i = 0; i < 5; i++) {
        try {
          input.frameNum = i + 1; // Update frame number
          // 3. Display the resulting image
          const { frame, url } = await renderFrameWeb(i, input);
          frames[frame] = url;
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
      console.log('FFmpeg processing completed, reading output file...');

      const fileData = await ffmpeg.readFile('output.mp4');
      console.log('Output file read successfully:', fileData);
      //@ts-ignore
      const data = new Uint8Array(fileData as ArrayBuffer);
      setVideoSrc(
        URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
      );
      const endTime = new Date().getTime();
      const elapsed = (endTime - time) / 1000;
      console.log('Image generation completed in', elapsed, 'seconds');
      setElapsedTime(elapsed);
    } catch (error) {
      // await ffmpegRef.current.deleteDir('/vid');

      console.error('Error during image generation:', error);
    }
  }

  async function renderVideo() {
    Run(config)
      .then(async res => {
        console.log('WASM function executed successfully:', res);
        const time = new Date().getTime();
        console.log('Generating video at', time);
        // const fileData = await ffmpegRef.current.readFile('output.mp4');
        // console.log('Output file read successfully:', fileData);
        //@ts-ignore
        setVideoSrc(`data:video/mp4;base64,${res.videoData!}`);
        const endTime = new Date().getTime();
        const elapsed = (endTime - time) / 1000;
        console.log('Video generation completed in', elapsed, 'seconds');
        setElapsedTime(elapsed);
      })
      .catch(err => console.error('Error calling WASM function:', err));
  }
  return (
    <>
      <Card className="mx-auto">
        <CardHeader>
          <CardTitle>Generate Text Cut Match</CardTitle>
          <CardDescription className="w-[70%] m-auto">
            This tool generates a video with text cut matches based on the
            provided snippets. Change the settings below to customize the
            output.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 grid-cols-1 sm:grid-cols-2">
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
            // onClick={__DESKTOP__ ? renderVideo : renderVideoWeb}
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
                  <img src={preview} alt="Preview" />
                </PhotoView>

                <Button onClick={__DESKTOP__ ? renderVideo : renderVideoWeb}>
                  Render Video
                </Button>
              </>
            ) : null}
            {videoSrc ? (
              <video
                controls
                style={{ maxWidth: '100%', height: 'auto' }}
                src={videoSrc || undefined}
              ></video>
            ) : null}
          </div>
        </PhotoProvider>
      </Drawer>
    </>
  );
};

export default MainView;
