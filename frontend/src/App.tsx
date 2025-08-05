import './App.css';
import 'react-photo-view/dist/react-photo-view.css';

import StatusBar from './components/StatusBar';
import { Toaster } from '@/components/ui/sonner';
import MainView from './main.view';
import Header from './components/header.web.component';

function App() {
  console.log(window);
  return (
    <div className="w-full flex flex-col h-screen ">
      {!__DESKTOP__ ? <Header /> : null}
      <div className="w-full h-full relative overflow-scroll">
        <MainView />
      </div>
      {__DESKTOP__ ? <StatusBar /> : null}
      {!__DESKTOP__ ? <Toaster /> : null}
    </div>
  );
}

export default App;
