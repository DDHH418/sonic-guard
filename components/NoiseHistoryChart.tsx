
import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { DailySummary } from '../types';

interface Props {
  data: DailySummary[];
}

const NoiseHistoryChart: React.FC<Props> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center border border-dashed border-slate-700 rounded-xl">
        <p className="text-slate-500">No history data yet. Start recording!</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            fontSize={12} 
            tickFormatter={(val) => val.split('-').slice(1).join('/')}
          />
          <YAxis stroke="#64748b" fontSize={12} label={{ value: 'dB', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Area 
            type="monotone" 
            dataKey="averageDb" 
            name="Avg dB" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorDb)" 
          />
          <Area 
            type="monotone" 
            dataKey="peakDb" 
            name="Peak dB" 
            stroke="#f43f5e" 
            fillOpacity={1} 
            fill="url(#colorPeak)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NoiseHistoryChart;
