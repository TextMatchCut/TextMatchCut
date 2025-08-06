import './App.css';
import 'react-photo-view/dist/react-photo-view.css';

import StatusBar from './components/status-bar.component';
import { Toaster } from '@/components/ui/sonner';
import MainView from './main.view';
import Header from './components/header.web.component';

function App() {
  return (
    <div className="w-full flex flex-col h-screen bg-card text-card-foreground">
      {!__DESKTOP__ ? <Header /> : null}
      <div className="w-full h-full relative overflow-y-auto">
        <MainView />
      </div>
      {__DESKTOP__ ? <StatusBar /> : null}
      {!__DESKTOP__ ? <Toaster /> : null}
    </div>
  );
}

export default App;
