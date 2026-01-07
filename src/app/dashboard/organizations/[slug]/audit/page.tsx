'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Download, Filter, Calendar } from 'lucide-react';
import { api, AuditAction } from '@/lib/api';
import { AuditLogTable } from '@/components/organization';

const actionFilters: { value: AuditAction | 'all'; label: string }[] = [
  { value: 'all', label: 'All Actions' },
  { value: 'org_created', label: 'Organization Created' },
  { value: 'org_updated', label: 'Organization Updated' },
  { value: 'member_invited', label: 'Member Invited' },
  { value: 'member_joined', label: 'Member Joined' },
  { value: 'member_removed', label: 'Member Removed' },
  { value: 'member_role_changed', label: 'Role Changed' },
  { value: 'project_created', label: 'Project Created' },
  { value: 'project_shared', label: 'Project Shared' },
  { value: 'simulation_run', label: 'Simulation Run' },
  { value: 'simulation_completed', label: 'Simulation Completed' },
];

export default function OrganizationAuditPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [selectedAction, setSelectedAction] = useState<AuditAction | 'all'>('all');
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', slug],
    queryFn: () => api.getOrganization(slug),
    enabled: !!slug,
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['organization-audit', slug, selectedAction, page],
    queryFn: () =>
      api.getOrganizationAuditLogs(slug, {
        action: selectedAction !== 'all' ? selectedAction : undefined,
        page: page + 1,
        page_size: limit,
      }),
    enabled: !!slug,
  });

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-3 font-mono">Loading...</span>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="text-center py-20">
          <h2 className="text-xl font-mono font-bold mb-2">Organization Not Found</h2>
          <button
            onClick={() => router.push('/dashboard/organizations')}
            className="mt-6 px-4 py-2 bg-white text-black font-mono text-sm font-bold"
          >
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  const logs = auditData?.items || [];
  const total = auditData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Action', 'User', 'Details', 'IP Address'];
    const rows = logs.map((log) => [
      new Date(log.created_at).toISOString(),
      log.action,
      log.user_email || 'System',
      JSON.stringify(log.details || {}),
      log.ip_address || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${org.slug}-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <button
            onClick={() => router.push(`/dashboard/organizations/${slug}`)}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-mono text-sm">{org.name}</span>
          </button>
          <h1 className="text-2xl font-mono font-bold">AUDIT LOG</h1>
          <p className="text-white/60 text-sm font-mono mt-1">
            Track all activity in your organization
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-white/20 font-mono text-sm hover:bg-white/5 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/60" />
          <span className="text-sm font-mono text-white/60">Filter:</span>
        </div>
        <select
          value={selectedAction}
          onChange={(e) => {
            setSelectedAction(e.target.value as AuditAction | 'all');
            setPage(0);
          }}
          className="bg-white/5 border border-white/20 px-3 py-2 font-mono text-sm focus:outline-none focus:border-white/40"
        >
          {actionFilters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 text-white/40 text-sm font-mono ml-auto">
          <Calendar className="w-4 h-4" />
          <span>{total} entries</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-white/10 p-6">
        <AuditLogTable logs={logs} isLoading={auditLoading} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <p className="text-sm text-white/40 font-mono">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-white/20 font-mono text-sm hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border border-white/20 font-mono text-sm hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-8 bg-white/5 border border-white/10 p-4">
        <p className="text-xs text-white/40 font-mono">
          Audit logs are retained for 90 days on the Free plan. Upgrade to Pro for unlimited retention and advanced filtering.
        </p>
      </div>
    </div>
  );
}
