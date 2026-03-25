import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Ban, CheckCircle2, CircleHelp, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { AttestationStatus } from '@/lib/attestation';
import { cn } from '@/lib/utils';

interface AttestationStatusBadgeProps {
  status?: AttestationStatus;
  className?: string;
}

interface AttestationStatusLabelProps {
  status?: AttestationStatus;
  className?: string;
}

interface StatusUi {
  label: string;
  icon: LucideIcon;
  className: string;
}

const STATUS_UI: Record<AttestationStatus, StatusUi> = {
  valid: {
    label: 'valid',
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  },
  invalid: {
    label: 'invalid',
    icon: XCircle,
    className: 'border-rose-200 bg-rose-100 text-rose-800 hover:bg-rose-100',
  },
  verifying: {
    label: 'verifying',
    icon: AlertCircle,
    className: 'border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100',
  },
  revoked: {
    label: 'revoked',
    icon: Ban,
    className: 'border-red-200 bg-red-100 text-red-800 hover:bg-red-100',
  },
};

function getStatusUi(status?: AttestationStatus): StatusUi {
  if (!status) {
    return {
      label: 'unknown',
      icon: CircleHelp,
      className: 'border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100',
    };
  }

  return STATUS_UI[status];
}

export function AttestationStatusBadge({ status, className }: AttestationStatusBadgeProps) {
  const ui = getStatusUi(status);
  const Icon = ui.icon;

  return (
    <Badge className={cn('inline-flex items-center gap-1.5 border capitalize', ui.className, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {ui.label}
    </Badge>
  );
}

export function AttestationStatusLabel({ status, className }: AttestationStatusLabelProps) {
  const ui = getStatusUi(status);
  const Icon = ui.icon;

  return (
    <span className={cn('inline-flex items-center gap-2 capitalize', className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {ui.label}
    </span>
  );
}
