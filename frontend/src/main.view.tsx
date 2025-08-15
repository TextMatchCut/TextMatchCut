import './App.css';
import { useEffect, useRef } from 'react';
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
import { action } from '@/lib/action';
import * as Comlink from 'comlink';
import { ArrowUp, Loader2Icon } from 'lucide-react';
import useAppContext from '@/store';
import clsx from 'clsx';
import 'react-photo-view/dist/react-photo-view.css';
import { loadFFmpeg } from '@/lib/utils';
import ConfigForm from './components/config-form.component';
import toast from './lib/toast';
import { EventsOn, EventsOff } from '../wailsjs/runtime';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { configSchema } from '@/lib/validation';
import { DEFAULT_CONFIG } from '@constants';
import { Config, GO_RenderFrameWeb_Input, GOWorkerType } from '@types';
import { useShallow } from 'zustand/react/shallow';
import GOWorker from './worker.ts?worker';
const MainView: React.FC<{ drawer: React.ReactNode }> = ({ drawer }) => {
  const {
    toggleDrawer,
    setStatus,
    status,
    ffmpeg,
    setProgress,
    setPreview,
    setVideoOutputPath,
    setVideoSrc,
  } = useAppContext(
    useShallow(s => ({
      toggleDrawer: s.toggleDrawer,
      setStatus: s.setStatus,
      status: s.status,
      ffmpeg: s.ffmpeg,
      setProgress: s.setProgress,
      setPreview: s.setPreview,
      setVideoOutputPath: s.setVideoOutputPath,
      setVideoSrc: s.setVideoSrc,
    }))
  );
  const abortControllerRef = useRef<AbortController | null>(null); // For web cancellation
  const methods = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: { ...DEFAULT_CONFIG, Type: 'render' as const },
    mode: 'onChange',
  });

  const wasmWorkerRef = useRef<Comlink.Remote<GOWorkerType> | null>(null);
  const { getValues, setValue } = methods;
  const loading = status === 'loading' || status === 'processing';
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

    async function initComlinkWorker() {
      return new Promise<void>((resolve, reject) => {
        const worker = Comlink.wrap<GOWorkerType>(new GOWorker());

        worker
          .init()
          .then(() => {
            wasmWorkerRef.current = worker;
            resolve();
          })
          .catch(error => {
            console.error('Error initializing WASM worker:', error);
            reject(error);
          });
      });
    }

    async function initWeb() {
      try {
        await Promise.all([
          initComlinkWorker(),
          new Promise<void>(async (resolve, reject) => {
            try {
              await loadFFmpeg(ffmpeg);
              await ffmpeg.load();
              await writeAssets();
              resolve();
            } catch (error) {
              reject(error);
            }
          }),
        ]);
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
      setStatus('ready');
    }
    __DESKTOP__ ? init() : initWeb();
    // let saveInterval = setInterval(() => {
    //   console.log('Saving app state to localStorage...');
    //   localStorage.setItem('app', serializeState());
    // }, 10000);

    return () => {
      // clearInterval(saveInterval);
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

  async function renderFrameWeb(
    i: number,
    input: GO_RenderFrameWeb_Input,
    write: boolean = true
  ) {
    const frame = `/vid/frame-${i + 1}.png`;
    console.log({ input });
    const base64String = await wasmWorkerRef.current!.renderFrameWeb(input);
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
  }

  async function renderPreview(config: Config) {
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

  async function renderPreviewWeb(config: Config) {
    try {
      const input = {
        FrameNum: 1,
        Config: config,
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
  async function renderVideoWeb(config: Config) {
    try {
      const input = {
        FrameNum: -1,
        Config: config,
      };

      for (let i = 0; i < 5; i++) {
        try {
          input.FrameNum = i + 1; // Update frame number
          await renderFrameWeb(i, input);
        } catch (err) {
          console.error('Error calling WASM function:', err);

          return toast({
            title: 'Error',
            message: `Failed to render frame ${i + 1}: ${
              err instanceof Error ? err.message : String(err)
            }`,
            type: 'error',
          });
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

  async function renderVideo(config: Config) {
    console.log('Rendering video with config:', config);
    EventsOn('frame', args => {
      const { frameNum, totalFrames, frameData } = args;
      const p = (frameNum / totalFrames) * 100;
      setProgress(p);
      setPreview(`data:image/png;base64,${frameData}`);
    });

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

  const onValidSubmit = (config: Config) => {
    console.log('Form is valid, proceeding with config:', config);

    const cleanVideoAndPreview = () => {
      const { preview, videoSrc } = useAppContext.getState();
      if (preview) {
        URL.revokeObjectURL(preview);
        setVideoSrc(null);
      }
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc!);
        setVideoSrc(null);
      }
    };

    if (config.Type === 'preview') {
      if (__DESKTOP__)
        return action(renderPreview, {
          before: cleanVideoAndPreview,
          params: config,
        });

      //! Web
      action(renderPreviewWeb, {
        delay: 250,
        before: cleanVideoAndPreview,
        params: config,
      });
      return;
    }

    if (__DESKTOP__)
      return action(renderVideo, {
        before: cleanVideoAndPreview,
        params: config,
      });

    //! Web
    action(renderVideoWeb, {
      delay: 250,
      before: cleanVideoAndPreview,
      params: config,
    });
  };

  const onInvalidSubmit = (errors: any) => {
    console.log('Form is invalid:', errors);

    // Find the first error message to display
    const firstErrorField = Object.keys(errors)[0];
    const firstError = errors[firstErrorField];
    const errorMessage =
      firstError?.message || 'Please fix the form errors before proceeding.';

    toast({
      title: 'Invalid Configuration',
      message: `${firstErrorField}: ${errorMessage}`,
      type: 'error',
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onValidSubmit, onInvalidSubmit)}>
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
                onClick={() => {
                  setValue('Type', 'render');
                }}
                type="submit"
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
                type="submit"
                onClick={() => setValue('Type', 'preview')}
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
                type="button"
                onClick={toggleDrawer}
              >
                <ArrowUp />
                Open Drawer
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  wasmWorkerRef
                    .current!.getSnippets(getValues())
                    .then(snippets => {
                      console.log('Received snippets from worker:', snippets);
                      // Handle the received snippets as needed
                    })
                    .catch(error => {
                      console.error(
                        'Error getting snippets from worker:',
                        error
                      );
                      toast({
                        title: 'Error',
                        message: `Failed to get snippets: ${error.message}`,
                        type: 'error',
                      });
                    });
                }}
              >
                Get Snippets
              </Button>
            </div>
          </CardFooter>
        </Card>
        {drawer}
      </form>
    </FormProvider>
  );
};

export default MainView;
