import React from 'react';
import { VerificationStatus } from '../../types/artist';
import { ShieldCheck, Clock, AlertTriangle, XCircle, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: VerificationStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, showIcon = true, size = 'sm', className = '' }: StatusBadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      case 'approved':
        return {
          label: size === 'sm' ? 'Live' : 'Live & Verified',
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          dot: 'bg-emerald-500',
          icon: ShieldCheck,
        };
      case 'under_review':
        return {
          label: 'Under Review',
          bg: 'bg-sky-50',
          text: 'text-sky-700',
          border: 'border-sky-200',
          dot: 'bg-sky-500',
          icon: Clock,
        };
      case 'rejected':
        return {
          label: 'Needs Updates',
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          dot: 'bg-rose-500',
          icon: XCircle,
        };
      case 'suspended':
        return {
          label: 'Suspended',
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-300',
          dot: 'bg-slate-500',
          icon: Ban,
        };
      case 'pending':
      default:
        return {
          label: 'Pending Review',
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-[11px]',
    lg: 'px-3.5 py-1.5 text-xs',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border ${sizeClasses} ${config.bg} ${config.text} ${config.border} shadow-xs ${className}`}
    >
      {showIcon ? (
        <Icon className="w-3 h-3 flex-shrink-0" />
      ) : (
        <span className="relative flex h-2 w-2 flex-shrink-0">
          {status === 'approved' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
        </span>
      )}
      <span className="tracking-tight">{config.label}</span>
    </span>
  );
}
