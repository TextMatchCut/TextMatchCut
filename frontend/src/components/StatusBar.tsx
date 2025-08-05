import useAppContext from '@/store';

const StatusBar: React.FC = () => {
  const status = useAppContext(s => s.status);
  const elapsedTime = useAppContext(s => s.elapsedTime);
  return (
    <div className="w-full mt-auto bg-gray-800 text-white p-2 ">
      <div className="flex justify-between items-center">
        <div className="text-sm">Status: {status}</div>
        <div className="text-sm">Elapsed Time: {elapsedTime}</div>
      </div>
    </div>
  );
};

export default StatusBar;
