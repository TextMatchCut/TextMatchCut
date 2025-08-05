import useAppContext from '@/store';

export async function action(fn: () => Promise<void> | void) {
  const { setOpenDrawer, setStatus, setProgress } = useAppContext.getState();

  setOpenDrawer(true);
  setStatus('processing');
  setProgress(0);
  try {
    await fn();
  } catch (error) {
    console.error('Error during action:', error);
    setStatus('error');
  } finally {
    // setOpenDrawer(false);
    setProgress(100);
    // setTimeout(() => {
    //   setStatus('ready');
    // }, 1000); // Reset status after 1 second
  }
}

export function actionStandalone(fn: () => Promise<void>) {
  const { setOpenDrawer, setStatus, setProgress } = useAppContext.getState();

  return async () => {
    setOpenDrawer(true);
    setStatus('processing');
    setProgress(0);
    try {
      await fn();
    } catch (error) {
      console.error('Error during action:', error);
      setStatus('error');
    } finally {
      //   setOpenDrawer(false);
      setProgress(100);
      //   setTimeout(() => {
      //     setStatus('ready');
      //   }, 1000); // Reset status after 1 second
    }
  };
}
