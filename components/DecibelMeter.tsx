
import React from 'react';

interface Props {
  db: number;
}

const DecibelMeter: React.FC<Props> = ({ db }) => {
  const getLevelColor = (val: number) => {
    if (val < 50) return 'text-green-400';
    if (val < 75) return 'text-yellow-400';
    if (val < 85) return 'text-orange-500';
    return 'text-red-500';
  };

  const getLevelBg = (val: number) => {
    if (val < 50) return 'bg-green-500/20 border-green-500/50';
    if (val < 75) return 'bg-yellow-500/20 border-yellow-500/50';
    if (val < 85) return 'bg-orange-500/20 border-orange-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  const normalizedDb = Math.min(Math.max(db, 0), 120);
  const percentage = (normalizedDb / 120) * 100;

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 ${getLevelBg(db)}`}>
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium uppercase tracking-wider opacity-60">Current Noise Level</span>
        <div className="flex items-baseline mt-2">
          <span className={`text-6xl font-bold mono ${getLevelColor(db)}`}>
            {Math.round(db)}
          </span>
          <span className="ml-2 text-xl opacity-60">dB</span>
        </div>
        
        <div className="w-full bg-slate-800 h-4 rounded-full mt-6 overflow-hidden border border-slate-700">
          <div 
            className={`h-full transition-all duration-100 ease-linear rounded-full ${getLevelColor(db).replace('text', 'bg')}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="flex justify-between w-full mt-2 text-[10px] uppercase font-bold opacity-40">
          <span>0dB</span>
          <span>60dB</span>
          <span>120dB</span>
        </div>
      </div>
    </div>
  );
};

export default DecibelMeter;
