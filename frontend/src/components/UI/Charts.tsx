'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const AXIS_COLOR = '#9ca3af';
const GRID_COLOR = '#e5eaf2';
const BRAND = '#6a9cfd';
const BRAND_SOFT = '#8bb4fe';

interface ChartDatum {
  [key: string]: string | number | undefined;
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5eaf2',
    borderRadius: 12,
    color: '#1f2937',
    fontSize: 12,
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  },
  labelStyle: { color: '#6b7280' },
  cursor: { fill: 'rgba(106,156,253,0.08)' },
};

interface SimpleAreaChartProps {
  data: ChartDatum[];
  dataKey: string;
  secondaryKey?: string;
  xKey?: string;
  height?: number;
  color?: string;
  secondaryColor?: string;
}

export function SimpleAreaChart({
  data,
  dataKey,
  secondaryKey,
  xKey = 'month',
  height = 260,
  color = BRAND,
  secondaryColor = BRAND_SOFT,
}: SimpleAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          {secondaryKey && (
            <linearGradient id={`fill-${secondaryKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={secondaryColor} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: GRID_COLOR }}
        />
        <YAxis
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#fill-${dataKey})`} strokeWidth={2} />
        {secondaryKey && (
          <Area
            type="monotone"
            dataKey={secondaryKey}
            stroke={secondaryColor}
            fill={`url(#fill-${secondaryKey})`}
            strokeWidth={2}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface SimpleBarChartProps {
  data: ChartDatum[];
  dataKey: string;
  xKey?: string;
  height?: number;
  color?: string;
}

export function SimpleBarChart({
  data,
  dataKey,
  xKey = 'month',
  height = 260,
  color = BRAND,
}: SimpleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: GRID_COLOR }}
        />
        <YAxis
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface SimpleLineChartProps {
  data: ChartDatum[];
  dataKey: string;
  secondaryKey?: string;
  xKey?: string;
  height?: number;
  color?: string;
  secondaryColor?: string;
}

export function SimpleLineChart({
  data,
  dataKey,
  secondaryKey,
  xKey = 'month',
  height = 260,
  color = BRAND,
  secondaryColor = BRAND_SOFT,
}: SimpleLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: GRID_COLOR }}
        />
        <YAxis
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip {...tooltipStyle} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        {secondaryKey && (
          <Line type="monotone" dataKey={secondaryKey} stroke={secondaryColor} strokeWidth={2} dot={false} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
