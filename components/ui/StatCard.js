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

  const colorStyles = {
    blue: {
      iconBg: 'bg-blue-500 text-white',
      border: 'border-blue-200',
      bg: 'bg-blue-50',
    },
    green: {
      iconBg: 'bg-green-500 text-white',
      border: 'border-green-200',
      bg: 'bg-green-50',
    },
    red: {
      iconBg: 'bg-red-500 text-white',
      border: 'border-red-200',
      bg: 'bg-red-50',
    },
    yellow: {
      iconBg: 'bg-amber-500 text-white',
      border: 'border-amber-200',
      bg: 'bg-amber-50',
    },
    gray: {
      iconBg: 'bg-gray-500 text-white',
      border: 'border-gray-200',
      bg: 'bg-gray-50',
    },
    purple: {
      iconBg: 'bg-indigo-500 text-white',
      border: 'border-indigo-200',
      bg: 'bg-indigo-50',
    },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-black mb-1">{title}</p>
          <p className="text-3xl font-semibold text-black mb-2">{value}</p>
          {trend && (
            <div className={clsx('flex items-center text-sm font-medium', trend.direction === 'up' ? 'text-green-600' : 'text-red-600')}>
              {trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="ml-1 text-black text-xs">{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={clsx('p-3 rounded-lg', style.iconBg)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

