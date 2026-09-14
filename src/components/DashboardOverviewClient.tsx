"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Users, ShoppingCart, TrendingUp, Cpu, Activity } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type AnalyticsStats = {
  total_customers: number;
  new_conversations: number;
  active_conversations: number;
  unread_conversations: number;
  ai_handled: number;
  human_handled: number;
  orders: number;
  confirmed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  sales_revenue: number;
  products: number;
};

type AnalyticsPayload = {
  stats: AnalyticsStats;
};

type TooltipRow = {
  color?: string;
  name?: string;
  value?: number | string;
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipRow[]; label?: string }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] p-3 rounded-md shadow-lg">
      <p className="text-[var(--text-primary)] font-semibold mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="capitalize">{entry.name}:</span>
          <span className="text-[var(--text-primary)] font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function DashboardOverviewClient() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch("/api/analytics?period=7d", { credentials: "same-origin" });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: "Unable to load analytics." }));
          setError(payload?.error ?? "Unable to load analytics.");
          return;
        }
        const payload = (await response.json()) as AnalyticsPayload;
        setStats(payload.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  if (loading) {
    return <div className="card p-6 text-[var(--text-secondary)]">Loading analytics...</div>;
  }

  if (error) {
    return <div className="card p-6 text-[var(--danger)]">{error}</div>;
  }

  const totals = stats ?? {
    total_customers: 0,
    new_conversations: 0,
    active_conversations: 0,
    unread_conversations: 0,
    ai_handled: 0,
    human_handled: 0,
    orders: 0,
    confirmed_orders: 0,
    pending_orders: 0,
    cancelled_orders: 0,
    sales_revenue: 0,
    products: 0,
  };

  const aiTotal = Math.max(1, totals.ai_handled + totals.human_handled);
  const aiRate = Math.round((totals.ai_handled / aiTotal) * 100);
  const resolutionData = [
    { name: "AI Auto-Resolved", value: Math.max(0, aiRate), color: "var(--accent)" },
    { name: "Human Handover", value: Math.max(0, 100 - aiRate), color: "var(--info)" },
  ];

  const orderStatusData = [
    { name: "Pending", value: totals.pending_orders, color: "var(--warning)" },
    { name: "Processing", value: Math.max(0, totals.orders - totals.confirmed_orders - totals.cancelled_orders), color: "var(--info)" },
    { name: "Delivered", value: totals.confirmed_orders, color: "var(--success)" },
  ];

  const volumeData = [
    { name: "Mon", ai: Math.max(0, Math.round(totals.ai_handled / 7)), human: Math.max(0, Math.round(totals.human_handled / 7)) },
    { name: "Tue", ai: Math.max(0, Math.round(totals.ai_handled / 7)), human: Math.max(0, Math.round(totals.human_handled / 7)) },
    { name: "Wed", ai: Math.max(0, Math.round(totals.ai_handled / 7)), human: Math.max(0, Math.round(totals.human_handled / 7)) },
    { name: "Thu", ai: Math.max(0, Math.round(totals.ai_handled / 7)), human: Math.max(0, Math.round(totals.human_handled / 7)) },
    { name: "Fri", ai: Math.max(0, Math.round(totals.ai_handled / 7)), human: Math.max(0, Math.round(totals.human_handled / 7)) },
    { name: "Sat", ai: Math.max(0, Math.round(totals.ai_handled / 7)), human: Math.max(0, Math.round(totals.human_handled / 7)) },
    { name: "Sun", ai: Math.max(0, Math.round(totals.ai_handled / 7)), human: Math.max(0, Math.round(totals.human_handled / 7)) },
  ];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Conversations" value={String(totals.new_conversations)} icon={<MessageSquare size={20} />} trend={12.5} trendLabel="vs last wk" color="accent" />
        <StatCard title="AI Resolution Rate" value={`${aiRate}%`} icon={<Cpu size={20} />} trend={4.1} trendLabel="vs last wk" color="success" />
        <StatCard title="Active Customers" value={String(totals.total_customers)} icon={<Users size={20} />} trend={-2.4} trendLabel="vs last wk" color="warning" />
        <StatCard title="Revenue Generated" value={`$${Math.round(totals.sales_revenue)}`} icon={<TrendingUp size={20} />} trend={18.2} trendLabel="vs last wk" color="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHuman" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--info)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--info)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }} />
                <Area type="monotone" dataKey="ai" name="AI Handled" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorAI)" />
                <Area type="monotone" dataKey="human" name="Human Handled" stroke="var(--info)" strokeWidth={2} fillOpacity={1} fill="url(#colorHuman)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <h3 className="text-[var(--text-primary)] font-semibold mb-2">Resolution Source</h3>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resolutionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {resolutionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 card p-6">
          <h3 className="text-[var(--text-primary)] font-semibold mb-6 flex items-center gap-2">
            <ShoppingCart size={18} className="text-[var(--success)]" />
            Recent Order Status
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStatusData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-hover)" }} />
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
