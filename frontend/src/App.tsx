import './App.css';
import 'react-photo-view/dist/react-photo-view.css';

import { ErrorBoundary } from 'react-error-boundary';
import StatusBar from './components/status-bar.component';
import { Toaster } from '@/components/ui/sonner';
import MainView from './main.view';
import Header from './components/header.web.component';
import { Button } from './components/ui/button';
import { ArrowDownIcon } from 'lucide-react';
import Drawer from './components/drawer.component';
import DrawerContent from './components/drawer-content.component';

function App() {
  return (
    <div className="w-full flex flex-col h-screen bg-card text-card-foreground">
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-4">Error message : {error.message}</p>
            <div className="flex flex-col mb-4">
              <p className="text-sm">Try resetting the app state.</p>
              <ArrowDownIcon className="m-auto mt-4" />
            </div>
            <Button
              onClick={() => {
                localStorage.removeItem('app');
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Reset App State
            </Button>
          </div>
        )}
      >
        {!__DESKTOP__ ? <Header /> : null}
        <div className="w-full h-full relative overflow-y-auto">
          <MainView
            drawer={
              <Drawer>
                <DrawerContent />
              </Drawer>
            }
          />
        </div>
        {__DESKTOP__ ? <StatusBar /> : null}
        {!__DESKTOP__ ? <Toaster /> : null}
      </ErrorBoundary>
    </div>
  );
}

export default App;
