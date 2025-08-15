import { PhotoProvider, PhotoView } from 'react-photo-view';
import useAppContext from '@/store';
import { Button } from '@/components/ui/button';
import { useFormContext } from 'react-hook-form';

import { ShowFileOnExplorer } from '../../wailsjs/go/main/App';
import { useShallow } from 'zustand/react/shallow';

const DrawerContent = () => {
  const { status, preview, videoSrc, videoOutputPath } = useAppContext(
    useShallow(s => ({
      status: s.status,
      preview: s.preview,
      videoSrc: s.videoSrc,
      videoOutputPath: s.videoOutputPath,
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
    link.download = `output-${getValues().HighlightedText}-${Date.now()}.mp4`;
    link.click();
  }

  return (
    <>
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
                type="submit"
                onClick={() => {
                  setValue('Type', 'render' as const);
                }}
              >
                Render Full Video
              </Button>
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
                onClick={__DESKTOP__ ? showVideoLocation : downloadVideoWeb}
              >
                {videoOutputPath ? 'Show Video Location' : 'Download Video'}
              </Button>
            </>
          ) : null}
        </div>
      </PhotoProvider>
    </>
  );
};

export default DrawerContent;
