import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number; // positive or negative percentage
  trendLabel?: string;
  color?: "accent" | "success" | "warning" | "danger" | "info";
}

export function StatCard({ title, value, icon, trend, trendLabel, color = "accent" }: StatCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  const colorStyles = {
    accent: "bg-[var(--accent-glow)] text-[var(--accent)]",
    success: "bg-[var(--success-bg)] text-[var(--success)]",
    warning: "bg-[var(--warning-bg)] text-[var(--warning)]",
    danger: "bg-[var(--danger-bg)] text-[var(--danger)]",
    info: "bg-[var(--info-bg)] text-[var(--info)]",
  };

  return (
    <div className="card p-5 flex flex-col hover:border-[var(--border-light)] transition-all">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[var(--text-secondary)] font-medium text-sm">{title}</h3>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorStyles[color]}`}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          {value}
        </div>
        
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-[var(--success)]' : isNegative ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
            {isPositive ? <ArrowUpRight size={16} /> : isNegative ? <ArrowDownRight size={16} /> : null}
            <span>{Math.abs(trend)}%</span>
            {trendLabel && <span className="text-xs text-[var(--text-muted)] ml-1 font-normal hidden sm:inline">{trendLabel}</span>}
          </div>
        )}
      </div>
      
      {/* Decorative pulse line */}
      <div className="w-full h-1 mt-5 bg-[var(--surface-active)] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full bg-[var(--${color})] opacity-30`}
          style={{ width: `${Math.min(Math.max((trend ? Math.abs(trend) : 50) + 30, 20), 100)}%` }}
        />
      </div>
    </div>
  );
}
