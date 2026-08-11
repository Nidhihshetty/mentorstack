import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'indigo';
  onClick?: () => void;
  loading?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    trend: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
    trend: 'text-green-600'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
    trend: 'text-purple-600'
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    border: 'border-orange-200',
    trend: 'text-orange-600'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
    trend: 'text-red-600'
  },
  teal: {
    bg: 'bg-teal-50',
    icon: 'text-teal-600',
    border: 'border-teal-200',
    trend: 'text-teal-600'
  },
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    border: 'border-indigo-200',
    trend: 'text-indigo-600'
  }
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'blue',
  onClick,
  loading = false
}: Readonly<StatCardProps>) {
  const colors = colorClasses[color];
  
  const cardClasses = `
    bg-white rounded-xl shadow-lg border-2 p-6 transition-all duration-200
    ${colors.border}
    ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105 hover:border-opacity-80' : ''}
    ${loading ? 'opacity-75' : ''}
  `;

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      } else if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div
      className={cardClasses}
      {...(onClick
        ? {
            role: 'button',
            tabIndex: 0,
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          }
        : {})}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-lg ${colors.bg}`}>
              <Icon className={`w-5 h-5 ${colors.icon}`} />
            </div>
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              {title}
            </h3>
          </div>
          
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">
              {loading ? (
                <span className="inline-block w-16 h-6 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                formatValue(value)
              )}
            </p>
            
            {description && !loading && (
              <p className="text-xs text-gray-500">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {trend && !loading && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 text-xs font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
            <span className="text-xs text-gray-500">{trend.label}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
      )}
    </div>
  );
}

// Additional utility components for different stat card layouts

interface MiniStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'indigo';
  onClick?: () => void;
}

export function MiniStatCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  onClick
}: Readonly<MiniStatCardProps>) {
  const colors = colorClasses[color];
  
  return (
    <div
      className={`bg-white rounded-lg shadow border p-4 transition-all duration-200 ${colors.border} ${
        onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''
      }`}
      {...(onClick
        ? {
            role: 'button',
            tabIndex: 0,
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          }
        : {})}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded ${colors.bg}`}>
          <Icon className={`w-4 h-4 ${colors.icon}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-lg font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </div>
  );
}

interface StatCardGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 4 | 6 | 8;
}

export function StatCardGrid({ 
  children, 
  cols = 4, 
  gap = 6 
}: Readonly<StatCardGridProps>) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  const gapClasses = {
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  };

  return (
    <div className={`grid ${gridClasses[cols]} ${gapClasses[gap]}`}>
      {children}
    </div>
  );
}
