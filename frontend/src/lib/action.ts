import useAppContext from '@/store';

export function actionStandalone(fn: () => Promise<void>, delay = 0) {
  const { setOpenDrawer, setStatus, setProgress, setElapsedTime } =
    useAppContext.getState();
  const time = new Date().getTime();

  return () => {
    setOpenDrawer(true);
    setStatus('processing');
    setProgress(0);
    // this ensures ui updates before the action starts
    setTimeout(async () => {
      try {
        await fn();
      } catch (error) {
        console.error('Error during action:', error);
        setStatus('error');
      } finally {
        //   setOpenDrawer(false);
        setProgress(100);
        const endTime = new Date().getTime();
        const elapsed = (endTime - time) / 1000;
        console.log('Completed in', elapsed, 'seconds');
        setElapsedTime(elapsed);

        setTimeout(() => {
          setStatus('ready');
        }, 1000); // Reset status after 1 second
      }
    }, delay);
  };
}
