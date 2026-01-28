"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: "cyan" | "purple" | "orange" | "green";
  trend?: string;
}

const colorClasses = {
  cyan: "text-cyan bg-cyan/10 border-cyan/30",
  purple: "text-purple bg-purple/10 border-purple/30",
  orange: "text-orange bg-orange/10 border-orange/30",
  green: "text-green bg-green/10 border-green/30",
};

export function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-cyan/30 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted mb-1">{label}</p>
          <p className="text-3xl font-bold text-text">{value}</p>
          {trend && (
            <p className="text-xs text-green mt-1">{trend}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
