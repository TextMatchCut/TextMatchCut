import useAppContext from '@/store';

const StatusBar: React.FC = () => {
  const status = useAppContext(s => s.status);
  const elapsedTime = useAppContext(s => s.elapsedTime);
  return (
    <div className="w-full mt-auto bg-gray-800 text-white p-2 h-min text-xs">
      <div className="flex justify-between items-center">
        <div>Status: {status}</div>
        <div>Elapsed Time: {elapsedTime}</div>
      </div>
    </div>
  );
};

export default StatusBar;
