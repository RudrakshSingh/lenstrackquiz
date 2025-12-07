import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = 'blue',
}) {
  const colors = {
    blue: 'bg-primary-light text-primary',
    green: 'bg-green-100 text-success',
    red: 'bg-red-100 text-danger',
    yellow: 'bg-yellow-100 text-warning',
    gray: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border-l-4 hover-lift animate-fade-in" style={{ borderLeftColor: color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : color === 'red' ? '#EF4444' : color === 'purple' ? '#8B5CF6' : '#6B7280' }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 transition-transform duration-300 hover:scale-105">{value}</p>
          {trend && (
            <div className={clsx('mt-2 flex items-center text-sm font-medium animate-slide-in', trend.direction === 'up' ? 'text-success' : 'text-danger')}>
              {trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4 mr-1 animate-pulse-slow" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1 animate-pulse-slow" />
              )}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="ml-1 text-gray-500 font-normal">{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={clsx('p-3 rounded-lg transition-transform duration-300 hover:scale-110 hover:rotate-3', colors[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

