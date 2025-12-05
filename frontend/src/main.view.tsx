import './App.css';
import { useEffect, useRef } from 'react';
import {
  Run,
  RenderPreview,
  GetDefaultAssetsPath,
  Cancel,
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
import { GetSnippetsWeb } from '@/lib/snippet';
import Drawer from './components/drawer.component';
import DrawerContent from './components/drawer-content.component';

const MainView: React.FC = () => {
  const {
    toggleDrawer,
    setStatus,
    status,
    ffmpeg,
    setProgress,
    setPreview,
    setVideoOutputPath,
    setVideoSrc,
    setSnippetsReady,
    canceled,
    setCanceled,
  } = useAppContext(
    useShallow(s => ({
      toggleDrawer: s.toggleDrawer,
      setStatus: s.setStatus,
      status: s.status,
      ffmpeg: s.ffmpeg,
      canceled: s.canceled,
      setProgress: s.setProgress,
      setPreview: s.setPreview,
      setVideoOutputPath: s.setVideoOutputPath,
      setVideoSrc: s.setVideoSrc,
      setSnippetsReady: s.setSnippetsReady,
      setCanceled: s.setCanceled,
    }))
  );
  // TODO: add cancellation support for web
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
      console.log('App is ready');
      setStatus('ready');
    }
    console.log('Is desktop:', __DESKTOP__);
    __DESKTOP__ ? init() : initWeb();
    // let saveInterval = setInterval(() => {
    //   console.log('Saving app state to localStorage...');
    //   localStorage.setItem('app', serializeState());
    // }, 10000);

    return () => {
      // clearInterval(saveInterval);
    };
  }, []);

  const handleCancel = () => {
    console.log('Cancellation requested.');
    setCanceled(true);
    if (__DESKTOP__) {
      Cancel();
    } else {
      abortControllerRef.current?.abort();
    }
    setStatus('ready');
    setProgress(0);
    setPreview(null);
  };

  async function renderFrame(input: any) {
    console.log('Rendering frame with input:', input);
    const res = await RenderPreview(input);

    console.log('State after renderFrame call:', useAppContext.getState());
    if (
      abortControllerRef.current?.signal.aborted ||
      useAppContext.getState().canceled
    ) {
      return;
    }

    if (!res.success) {
      if (res.error?.includes('cancelled')) return;
      return toast({
        title: 'Error',
        message: res.error || 'Failed to render preview',
        type: 'error',
      });
    }
    console.log('Setting preview');

    setPreview(`data:image/png;base64,${res.frameData!}`);
  }

  async function renderFrameWeb(
    i: number,
    input: GO_RenderFrameWeb_Input,
    /*JSON*/
    snippets: any,
    write: boolean = true
  ) {
    if (
      abortControllerRef.current?.signal.aborted ||
      useAppContext.getState().canceled
    ) {
      return;
    }

    const frame = `/vid/frame-${i + 1}.png`;
    console.log({ input });
    const base64String = await wasmWorkerRef.current!.renderFrameWeb(
      input,
      snippets
    );
    if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    if (write) {
      try {
        await ffmpeg.writeFile(
          frame,
          Uint8Array.from(atob(base64String), c => c.charCodeAt(0))
        );
      } catch (error) {
        console.error('Error writing frame to ffmpeg FS:', error);
      }
    }

    if (abortControllerRef.current?.signal.aborted) {
      return;
    }
    console.log('Image frame rendered:', i + 1);
    setPreview(`data:image/png;base64,${base64String}`);
    // FIXME:devided by 5 ?
    const p = ((i + 1) / 5) * 100;
    setProgress(p);
  }

  async function renderPreview(config: Config) {
    console.log('Rendering preview with config:', config);
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
      await renderFrameWeb(0, input, '', false);
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
    const signal = abortControllerRef.current?.signal;
    if (!signal) return;
    try {
      const input = {
        FrameNum: -1,
        Config: config,
      };

      // Get snippets once before the loop
      const snippets = await GetSnippetsWeb(input.Config, signal);
      if (!snippets || !Array.isArray(snippets) || snippets.length === 0) {
        return toast({
          title: 'Error',
          message: 'No snippets available, check your api key and prompt.',
          type: 'error',
        });
      }
      setSnippetsReady(true);

      const totalFrames = config.Duration! * (config.FPS || 3);

      // Generate all frames
      for (let i = 0; i < totalFrames; i++) {
        if (signal.aborted) {
          throw new DOMException('Aborted by user', 'AbortError');
        }
        try {
          input.FrameNum = i + 1;
          await renderFrameWeb(i, input, snippets);
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

      const filterComplexParts: string[] = [];
      let amixInputs = '';

      // Create delayed audio streams for each frame (matching Go logic)
      for (let i = 0; i < totalFrames; i++) {
        const delayMs = Math.floor((i * 1000) / (config.FPS || 3));
        const outputStream = `a${i}`;
        // [1:a] refers to the audio stream from the second input file (shutter.wav)
        filterComplexParts.push(
          `[1:a]adelay=${delayMs}|${delayMs}[${outputStream}]`
        );
        amixInputs += `[${outputStream}]`;
      }

      // Mix all delayed audio streams
      const amixFilter = `${amixInputs}amix=inputs=${totalFrames}[a]`;
      filterComplexParts.push(amixFilter);
      const filterComplex = filterComplexParts.join(';');

      await ffmpeg.exec(
        [
          '-y', // Overwrite output file
          '-framerate',
          String(config.FPS || 3),
          '-i',
          '/vid/frame-%d.png', // Video input pattern
          '-i',
          '/shutter.wav', // Audio input
          '-filter_complex',
          filterComplex,
          '-map',
          '0:v', // Map video from first input
          '-map',
          '[a]', // Map audio from filtergraph
          '-c:v',
          'libx264',
          '-preset',
          'medium',
          '-pix_fmt',
          'yuv420p',
          '-r',
          String(config.FPS || 3),
          '-shortest', // End when shortest stream (video) ends
          'output.mp4',
        ],
        undefined,
        { signal }
      );

      const fileData = await ffmpeg.readFile('output.mp4');
      console.log('Output file read successfully:', fileData);
      //@ts-ignore
      const data = new Uint8Array(fileData as ArrayBuffer);
      setPreview(null);
      setVideoSrc(
        URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Render video (web) cancelled successfully.');
        return; // Suppress error toast on cancellation
      }
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
    const unsub = EventsOn('frame', args => {
      if (useAppContext.getState().canceled) return;
      const { frameNum, totalFrames, frameData } = args;
      const p = (frameNum / totalFrames) * 100;
      setProgress(p);
      setPreview(`data:image/png;base64,${frameData}`);
    });

    return await Run(config)
      .then(async res => {
        if (!res.success) {
          if (res.error?.includes('cancelled')) {
            console.log('Desktop operation cancelled.');
            unsub();
            return;
          }
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
      .finally(unsub);
  }

  const onValidSubmit = (config: Config) => {
    console.log('Form is valid, proceeding with config:', config);
    abortControllerRef.current = new AbortController();
    setCanceled(false);

    const clean = () => {
      const { preview, videoSrc } = useAppContext.getState();
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc!);
        setVideoSrc(null);
      }
      setSnippetsReady(false);
      setProgress(0);
    };

    if (config.Type === 'preview') {
      if (__DESKTOP__)
        return action(renderPreview, {
          before: clean,
          params: config,
        });

      //! Web
      action(renderPreviewWeb, {
        delay: 250,
        before: clean,
        params: config,
      });
      return;
    }

    if (__DESKTOP__)
      return action(renderVideo, {
        before: clean,
        params: config,
      });

    //! Web
    action(renderVideoWeb, {
      delay: 250,
      before: clean,
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
              This app generates a video with text cut matches based on the
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
                Preview Frame
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
            </div>
          </CardFooter>
        </Card>
        <Drawer>
          <DrawerContent cancelFunc={handleCancel} />
        </Drawer>
      </form>
    </FormProvider>
  );
};

export default MainView;
