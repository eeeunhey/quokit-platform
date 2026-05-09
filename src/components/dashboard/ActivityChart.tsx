'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts';

interface ActivityWeek {
  date: string;
  commits: number;
}

interface Props {
  data: ActivityWeek[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-line p-3 shadow-md rounded-lg">
        <p className="text-xs font-semibold text-text-secondary mb-1.5">Week of {label}</p>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-text-tertiary">Commits:</span>
          <span className="font-mono text-text-primary">{payload[0].value.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function ActivityChart({ data }: Props) {
  if (!data || data.length === 0) return (
    <div className="bg-surface border border-line rounded-xl p-5 w-full flex items-center justify-center h-[100px]">
      <span className="text-sm text-text-tertiary">활동량 데이터를 불러오는 중이거나 데이터가 없습니다.</span>
    </div>
  );

  return (
    <div className="bg-surface border border-line rounded-xl p-5 w-full">
      <div className="mb-4">
        <h4 className="text-sm font-bold text-text-primary">14-Week Commit Pulse</h4>
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8B949E" strokeOpacity={0.15} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: '#8B949E' }} 
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#8B949E' }} 
              tickLine={false} 
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8B949E', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area 
              type="monotone" 
              dataKey="commits" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCommits)" 
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
