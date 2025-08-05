import { cn } from '@/lib/utils';
import useAppContext from '@/store';
import React, { useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

const Drawer: React.FC<React.PropsWithChildren> = ({ children }) => {
  const setOpenDrawer = useAppContext(s => s.setOpenDrawer);
  const openDrawer = useAppContext(s => s.openDrawer);
  const progress = useAppContext(s => s.progress);
  const status = useAppContext(s => s.status);
  //   useEffect(() => {
  //     const handleKeyDown = (event: KeyboardEvent) => {
  //       if (event.key === 'Escape') {
  //         setOpenDrawer(!openDrawer);
  //       }
  //     };

  //     document.addEventListener('keydown', handleKeyDown);

  //     return () => {
  //       document.removeEventListener('keydown', handleKeyDown);
  //     };
  //   }, []);

  return (
    <div
      className={cn({
        hidden: !openDrawer,
      })}
    >
      <div
        className="absolute bg-black/35 w-full h-full bottom-0 left-0"
        onClick={() => setOpenDrawer(false)}
      ></div>
      <div
        className={cn(
          'absolute w-full flex h-[70vh] max-h-[500px] overflow-hidden bg-card bottom-0 left-0 justify-center items-center'
        )}
        style={{
          borderTopLeftRadius: '1rem',
          borderTopRightRadius: '1rem',
        }}
      >
        <Progress
          className={cn('w-full h-[2px] absolute top-0 left-0', {
            hidden: status !== 'processing',
          })}
          value={progress}
        />

        <div className="w-full h-full max-w-sm p-4">{children}</div>
      </div>
    </div>
  );
};

export default Drawer;
