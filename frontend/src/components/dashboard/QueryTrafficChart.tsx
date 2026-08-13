'use client';

import React from 'react';

export function QueryTrafficChart() {
  // Simulated 24-hour DNS traffic sample points (percentage height 0-100)
  const hourlyData = [
    { hour: '00:00', queries: '45k', height: 35 },
    { hour: '02:00', queries: '38k', height: 28 },
    { hour: '04:00', queries: '25k', height: 20 },
    { hour: '06:00', queries: '55k', height: 45 },
    { hour: '08:00', queries: '85k', height: 75 },
    { hour: '10:00', queries: '110k', height: 95 },
    { hour: '12:00', queries: '105k', height: 90 },
    { hour: '14:00', queries: '120k', height: 100 },
    { hour: '16:00', queries: '98k', height: 85 },
    { hour: '18:00', queries: '80k', height: 70 },
    { hour: '20:00', queries: '65k', height: 55 },
    { hour: '22:00', queries: '50k', height: 40 },
  ];

  return (
    <div className="bg-white dark:bg-[#161e2e] p-4 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Global DNS Query Volume (Last 24 Hours)
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time resolution metrics across all AWS Anycast edge locations
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-block w-2.5 h-2.5 bg-[#ec7211] rounded-xs" />
          <span className="text-gray-600 dark:text-gray-400 font-medium">Standard queries</span>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-gray-100 dark:border-gray-800 px-2">
        {hourlyData.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip on hover */}
            <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-[2px] pointer-events-none whitespace-nowrap z-10 font-mono">
              {d.hour}: {d.queries}
            </div>
            {/* Bar */}
            <div
              style={{ height: `${d.height}%` }}
              className="w-full bg-[#ec7211]/80 group-hover:bg-[#ec7211] rounded-t-[2px] transition-all"
            />
            {/* Hour label */}
            <span className="text-[10px] text-gray-400 font-mono mt-1 scale-90">
              {d.hour}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div>Resolution latency: <span className="font-semibold text-emerald-600 dark:text-emerald-400">~12ms</span></div>
        <div>Query protocol: <span className="font-mono font-semibold">UDP/53 + DoH</span></div>
      </div>
    </div>
  );
}
