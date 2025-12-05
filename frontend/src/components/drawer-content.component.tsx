import { PhotoProvider, PhotoView } from 'react-photo-view';
import useAppContext from '@/store';
import { Button } from '@/components/ui/button';
import { useFormContext } from 'react-hook-form';

import { ShowFileOnExplorer } from '../../wailsjs/go/main/App';
import { useShallow } from 'zustand/react/shallow';
import { Spinner } from './ui/spinner';

const DrawerContent: React.FC<{
  cancelFunc: () => void;
}> = ({ cancelFunc }) => {
  const { status, preview, videoSrc, videoOutputPath, snippetsReady } =
    useAppContext(
      useShallow(s => ({
        status: s.status,
        preview: s.preview,
        videoSrc: s.videoSrc,
        videoOutputPath: s.videoOutputPath,
        snippetsReady: s.snippetsReady,
      }))
    );
  const { getValues, setValue } = useFormContext();

  async function showVideoLocation() {
    ShowFileOnExplorer(videoOutputPath!);
  }

  async function downloadVideoWeb() {
    if (!videoSrc) return;

    const link = document.createElement('a');
    link.href = videoSrc;
    // FIXME: if highlighted text changes,it is going to reflect here
    link.download = `text-match-cut-${
      getValues().HighlightedText
    }-${Date.now()}.mp4`;
    link.click();
  }

  return (
    <>
      <PhotoProvider>
        <div className="m-auto">
          {!preview && !videoSrc ? (
            status === 'processing' ? (
              <div className="flex gap-2 items-center justify-center mb-4">
                {snippetsReady ? (
                  <h2 className="text-center text-lg font-semibold">
                    Generating
                  </h2>
                ) : (
                  <h2 className="flex gap-2 text-center text-lg font-semibold">
                    Generating Text Snippets
                  </h2>
                )}
                <Spinner />
              </div>
            ) : (
              <>
                <h2 className="text-center text-lg font-semibold mb-4">
                  Nothing to see here
                </h2>
                <p className="text-center text-sm text-muted-foreground">
                  Render a preview or video to see the results here. Previews
                  use random text snippets.
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
              {status === 'processing' ? null : (
                <div className="flex gap-4 mt-4 items-center justify-center">
                  <Button
                    variant="outline"
                    className="max-w-sm cursor-pointer"
                    title="Try the last action again"
                    type="submit"
                  >
                    Try again
                  </Button>
                  <Button
                    className="max-w-sm cursor-pointer"
                    type="submit"
                    onClick={() => {
                      setValue('Type', 'render' as const);
                    }}
                  >
                    Render Full Video
                  </Button>
                </div>
              )}
            </>
          ) : null}
          {videoSrc ? (
            <>
              <h2 className="text-center text-lg font-semibold mb-4">Output</h2>
              <video
                controls
                style={{ maxWidth: '100%', height: 'auto' }}
                src={videoSrc || undefined}
              ></video>
              <Button
                className="mt-4"
                type="button"
                onClick={__DESKTOP__ ? showVideoLocation : downloadVideoWeb}
              >
                {videoOutputPath ? 'Show Video Location' : 'Download Video'}
              </Button>
            </>
          ) : null}

          {status === 'processing' ? (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                className="max-w-sm cursor-pointer"
                onClick={cancelFunc}
              >
                Cancel
              </Button>
            </div>
          ) : null}
        </div>
      </PhotoProvider>
    </>
  );
};

export default DrawerContent;
