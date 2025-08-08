import './App.css';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import { useState, useEffect } from 'react';
import {
  Run,
  RenderPreview,
  GetDefaultAssetsPath,
  ShowFileOnExplorer,
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
import {
  getDummySnippets,
  loadWasmBackend,
  loadFFmpeg,
  serializeState,
} from '@/lib/utils';
import ConfigForm from './components/config-form.component';
import toast from './lib/toast';
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
  const [videoOutputPath, setVideoOutputPath] = useState<string | null>(null);

  const loading = status === 'loading';
  useEffect(() => {
    async function writeAssets() {
      await ffmpeg.load();
      await ffmpeg.createDir('/vid');
      await ffmpeg.writeFile(
        '/shutter.wav',
        await fetchFile('/sfx/shutter.wav')
      );
      console.log('Assets written successfully');
    }
    async function initWeb() {
      try {
        await loadWasmBackend();
        await loadFFmpeg(ffmpeg);
        await ffmpeg.load();
        console.log('FFmpeg loaded successfully');
        await writeAssets();
        setStatus('ready');
      } catch (error) {
        console.error('Error initializing', error);
        toast({
          message: 'Failed to initialize the application',
          type: 'error',
          title: `Initialization Error : ${
            error instanceof Error ? error.message : `${String(error)}`
          }`,
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
    let saveInterval = setInterval(() => {
      console.log('Saving app state to localStorage...');
      localStorage.setItem('app', serializeState());
    }, 10000);

    return () => {
      clearInterval(saveInterval);
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, []);

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
      setProgress(p);
      setTimeout(() => {
        resolve();
      }, 50); // Ensure UI updates before resolving
    });
  }

  async function renderPreview() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc!);
      setVideoSrc(null);
    }
    try {
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
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc!);
      setVideoSrc(null);
    }
    try {
      const input = {
        frameNum: 1,
        config,
        aiSnippets: getDummySnippets(),
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
    try {
      const input = {
        frameNum: -1,
        config,
        aiSnippets: getDummySnippets(),
        highlightRadius: 400.0,
        totalFrames: 1,
      };

      for (let i = 0; i < 5; i++) {
        try {
          input.frameNum = i + 1; // Update frame number
          await renderFrameWeb(i, input);
        } catch (err) {
          console.error('Error calling WASM function:', err);
        }
      }

      const filterComplex = `format=yuv420p[v];[1:a]aloop=loop=${
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
      toast({
        title: 'Error',
        message: 'Failed to render video',
        type: 'error',
      });
      console.error('Error during rendering:', error);
    }
  }

  async function renderVideo() {
    console.log('Rendering video with config:', config);
    EventsOn('frame', args => {
      const { frameNum, totalFrames, frameData } = args;
      const p = (frameNum / totalFrames) * 100;
      setProgress(p);
      setPreview(`data:image/png;base64,${frameData}`);
    });
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
      setVideoSrc(null);
    }
    return await Run(config)
      .then(async res => {
        if (!res.success) {
          return toast({
            title: 'Error',
            message: res.error || 'Failed to render video',
            type: 'error',
          });
        }
        setPreview(null);
        setVideoSrc(`data:video/mp4;base64,${res.videoData!}`);
        setVideoOutputPath(res.path!);
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

  async function showVideoLocation() {
    ShowFileOnExplorer(videoOutputPath!);
  }

  return (
    <>
      <Card className="mx-auto select-none">
        <CardHeader>
          {!__DESKTOP__ && <CardTitle>Generate Text Cut Match</CardTitle>}
          <CardDescription className="w-[70%] m-auto">
            This tool generates a video with text cut matches based on the
            provided snippets. Change the settings below to customize the
            output.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 max-w-[1400px] m-auto rounded-lg p-4">
          <ConfigForm />
        </CardContent>

        <CardFooter className="m-auto h-[100px]">
          <div className="flex fixed bottom-[3rem] left-1/2 transform -translate-x-1/2 gap-2 backdrop-blur-sm bg-white/10 w-fit p-2 px-4 rounded-2xl">
            <Button
              variant="outline"
              className="max-w-sm cursor-pointer"
              disabled={loading}
              onClick={
                __DESKTOP__
                  ? actionStandalone(renderVideo)
                  : actionStandalone(renderVideoWeb, 250)
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
              className="max-w-sm cursor-pointer"
              title="Renders the first frame of the video"
              disabled={loading}
              onClick={
                __DESKTOP__
                  ? actionStandalone(renderPreview)
                  : actionStandalone(renderPreviewWeb, 250)
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
              className="max-w-sm cursor-pointer"
              disabled={loading}
              onClick={() => setOpenDrawer(!openDrawer)}
            >
              <ArrowUp />
              Open Drawer
            </Button>
          </div>
        </CardFooter>
      </Card>
      <Drawer>
        <PhotoProvider>
          <div className="m-auto">
            {!preview && !videoSrc ? (
              status === 'processing' ? (
                <>
                  <h2 className="text-center text-lg font-semibold mb-4">
                    Processing...
                  </h2>
                </>
              ) : (
                <>
                  <h2 className="text-center text-lg font-semibold mb-4">
                    Nothing to see here
                  </h2>
                  <p className="text-center text-sm text-muted-foreground">
                    Render a preview or video to see the results here.
                  </p>
                </>
              )
            ) : null}
            {preview ? (
              <>
                <h2 className="text-center text-lg font-semibold mb-4">
                  {status === 'processing' ? 'Processing...' : 'Preview'}
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
                      : actionStandalone(renderVideoWeb, 250)
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
                  {videoOutputPath ? 'Show Video Location' : 'Download Video'}
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
