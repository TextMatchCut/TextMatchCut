import './App.css';
import 'react-photo-view/dist/react-photo-view.css';

import StatusBar from './components/StatusBar';
import { Toaster } from '@/components/ui/sonner';
import MainView from './main.view';

function App() {
  return (
    <div className="w-full min-w-[100%] flex flex-col h-screen">
      <div className="w-full h-full bg-blue-500 min-w-[100%]  relative">
        <MainView />
      </div>
      {__DESKTOP__ ? <StatusBar /> : null}
      {!__DESKTOP__ ? <Toaster /> : null}
    </div>
  );
}

export default App;
