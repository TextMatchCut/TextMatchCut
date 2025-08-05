import './App.css';
import 'react-photo-view/dist/react-photo-view.css';

import StatusBar from './components/StatusBar';
import { Toaster } from '@/components/ui/sonner';
import MainView from './main.view';

function App() {
  return (
    <div className="w-full h-full flex flex-col h-screen">
      <div className="w-full h-full relative">
        <MainView />
      </div>
      {__DESKTOP__ ? <StatusBar /> : null}
      {!__DESKTOP__ ? <Toaster /> : null}
    </div>
  );
}

export default App;
