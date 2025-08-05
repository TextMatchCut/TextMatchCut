import useAppContext from '@/store';

const StatusBar: React.FC = () => {
  const status = useAppContext(s => s.status);
  const elapsedTime = useAppContext(s => s.elapsedTime);
  return (
    <div className="w-full mt-auto bg-gray-800 text-white px-2 py-1 h-min text-xs z-99">
      <div className="flex justify-between items-center">
        <div>Status: {status}</div>
        <div>Elapsed Time: {elapsedTime}</div>
      </div>
    </div>
  );
};

export default StatusBar;
