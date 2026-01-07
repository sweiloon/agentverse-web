'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  UserPlus,
  UserMinus,
  Settings,
  Building2,
  Play,
  Check,
  Users,
  Shield,
} from 'lucide-react';
import { AuditLog } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
}

const actionIcons: Record<string, typeof UserPlus> = {
  org_created: Building2,
  org_updated: Settings,
  org_deleted: Building2,
  member_invited: UserPlus,
  member_joined: Users,
  member_removed: UserMinus,
  member_role_changed: Shield,
  project_created: Building2,
  project_shared: Users,
  project_unshared: Users,
  simulation_run: Play,
  simulation_completed: Check,
  settings_updated: Settings,
  api_key_generated: Shield,
};

const actionLabels: Record<string, string> = {
  org_created: 'Created organization',
  org_updated: 'Updated organization',
  org_deleted: 'Deleted organization',
  member_invited: 'Invited member',
  member_joined: 'Joined organization',
  member_removed: 'Removed member',
  member_role_changed: 'Changed member role',
  project_created: 'Created project',
  project_shared: 'Shared project',
  project_unshared: 'Unshared project',
  simulation_run: 'Started simulation',
  simulation_completed: 'Completed simulation',
  settings_updated: 'Updated settings',
  api_key_generated: 'Generated API key',
};

function getActionDetails(log: AuditLog): string | null {
  const details = log.details;
  if (!details || typeof details !== 'object') return null;

  switch (log.action) {
    case 'member_invited':
      return `Invited ${details.invited_email || 'user'} as ${details.role || 'member'}`;
    case 'member_role_changed':
      return `Changed role from ${details.old_role || '?'} to ${details.new_role || '?'}`;
    case 'member_removed':
      return `Removed ${details.removed_email || 'user'}`;
    case 'org_updated':
      const changes = details.changes as Record<string, unknown>;
      if (changes) {
        const keys = Object.keys(changes);
        if (keys.length > 0) {
          return `Updated ${keys.join(', ')}`;
        }
      }
      return null;
    case 'simulation_run':
      return `${details.scenario_name || 'Scenario'} with ${details.agent_count || '?'} agents`;
    default:
      return null;
  }
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-white/5" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-white/40 font-mono text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/10">
      {logs.map((log) => {
        const Icon = actionIcons[log.action] || Settings;
        const label = actionLabels[log.action] || log.action;
        const details = getActionDetails(log);

        return (
          <div
            key={log.id}
            className="flex items-start gap-3 py-3"
          >
            <div className="w-8 h-8 bg-white/5 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{label}</span>
                {log.user_email && (
                  <>
                    <span className="text-white/40">by</span>
                    <span className="font-mono text-sm text-white/60">
                      {log.user_email}
                    </span>
                  </>
                )}
              </div>
              {details && (
                <p className="text-xs text-white/40 font-mono mt-0.5">{details}</p>
              )}
              <p className="text-xs text-white/30 font-mono mt-1">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                {log.ip_address && (
                  <span className="ml-2">from {log.ip_address}</span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
