"use client";

import { MessageSquare, Users, ShoppingCart, TrendingUp, Cpu, Activity } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

// Mock Data
const volumeData = [
  { name: 'Mon', ai: 400, human: 240 },
  { name: 'Tue', ai: 300, human: 139 },
  { name: 'Wed', ai: 200, human: 980 },
  { name: 'Thu', ai: 278, human: 390 },
  { name: 'Fri', ai: 189, human: 480 },
  { name: 'Sat', ai: 239, human: 380 },
  { name: 'Sun', ai: 349, human: 430 },
];

const resolutionData = [
  { name: 'AI Auto-Resolved', value: 75, color: 'var(--accent)' },
  { name: 'Human Handover', value: 25, color: 'var(--info)' },
];

const orderStatusData = [
  { name: 'Pending', value: 45, color: 'var(--warning)' },
  { name: 'Processing', value: 30, color: 'var(--info)' },
  { name: 'Delivered', value: 120, color: 'var(--success)' },
];

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] p-3 rounded-md shadow-lg">
        <p className="text-[var(--text-primary)] font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="capitalize">{entry.name}:</span>
            <span className="text-[var(--text-primary)] font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardOverview() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Overview</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track AI performance and conversation metrics.
          </p>
        </div>
        <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-md p-1">
          <button className="px-3 py-1 text-xs font-semibold rounded bg-[var(--surface-active)] text-[var(--text-primary)]">7D</button>
          <button className="px-3 py-1 text-xs font-semibold rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]">30D</button>
          <button className="px-3 py-1 text-xs font-semibold rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]">All</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Conversations" 
          value="4,291" 
          icon={<MessageSquare size={20} />} 
          trend={12.5} 
          trendLabel="vs last wk" 
          color="accent" 
        />
        <StatCard 
          title="AI Resolution Rate" 
          value="75.2%" 
          icon={<Cpu size={20} />} 
          trend={4.1} 
          trendLabel="vs last wk" 
          color="success" 
        />
        <StatCard 
          title="Active Customers" 
          value="1,842" 
          icon={<Users size={20} />} 
          trend={-2.4} 
          trendLabel="vs last wk" 
          color="warning" 
        />
        <StatCard 
          title="Revenue Generated" 
          value="$12.4k" 
          icon={<TrendingUp size={20} />} 
          trend={18.2} 
          trendLabel="vs last wk" 
          color="info" 
        />
      </div>

      {/* Charts Array */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-[var(--text-primary)] font-semibold mb-6 flex items-center gap-2">
            <Activity size={18} className="text-[var(--accent)]" />
            Message Volume
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHuman" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--info)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--info)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)', fontSize: 12}} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }}/>
                <Area type="monotone" dataKey="ai" name="AI Handled" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorAI)" />
                <Area type="monotone" dataKey="human" name="Human Handled" stroke="var(--info)" strokeWidth={2} fillOpacity={1} fill="url(#colorHuman)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* resolution Donut */}
        <div className="card p-6 flex flex-col">
          <h3 className="text-[var(--text-primary)] font-semibold mb-2">Resolution Source</h3>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resolutionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {resolutionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Bar */}
        <div className="lg:col-span-3 card p-6">
          <h3 className="text-[var(--text-primary)] font-semibold mb-6 flex items-center gap-2">
            <ShoppingCart size={18} className="text-[var(--success)]" />
            Recent Order Status
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStatusData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)', fontSize: 12}} axisLine={false} tickLine={false} width={80} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'var(--surface-hover)'}} />
                <Bar dataKey="value" name="Orders" radius={[0, 4, 4, 0]} maxBarSize={40}>
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
