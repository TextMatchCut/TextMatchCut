import { cn } from '@/lib/utils';
import useAppContext from '@/store';
import GithubIcon from '@/components/github-icon.component';
import { OpenURL } from '../../wailsjs/go/main/App';
import { REPO_URL } from '@constants';

const StatusBar: React.FC = () => {
  const status = useAppContext(s => s.status);
  const elapsedTime = useAppContext(s => s.elapsedTime);
  return (
    <div className="w-full mt-auto bg-gray-800 text-white h-min text-xs z-99">
      <div className="flex justify-between items-center">
        <div className="px-2 py-1">Status: {status}</div>

        <div className="flex items-center justify-center">
          <div
            className="cursor-pointer hover:bg-gray-700 px-2 py-1"
            onClick={() => OpenURL('https://uncore.me/donate')}
          >
            Donate
          </div>
          <div
            className="flex items-center gap-2 px-2 py-1 hover:bg-gray-700 cursor-pointer"
            onClick={() => OpenURL(REPO_URL)}
          >
            Repo
            <GithubIcon className="w-4 h-4" />
          </div>
          <div className={cn({ hidden: !elapsedTime })}>
            Elapsed Time: {elapsedTime}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
