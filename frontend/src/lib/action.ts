import useAppContext from '@/store';

export function action(
  fn: (params?: any) => Promise<void>,
  options?: {
    delay?: number;
    before?: () => void;
    params?: any;
  }
) {
  const { setOpenDrawer, setStatus, setProgress, setElapsedTime } =
    useAppContext.getState();
  const time = new Date().getTime();

  setOpenDrawer(true);
  setStatus('processing');
  setProgress(0);
  options?.before?.();
  // this ensures ui updates before the action starts
  setTimeout(async () => {
    try {
      await fn(options?.params);
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
  }, options?.delay);
}
