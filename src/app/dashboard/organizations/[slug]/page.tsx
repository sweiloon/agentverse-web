'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Settings,
  Activity,
  BarChart3,
  Loader2,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api';
import { OrganizationSwitcher, MemberList, AuditLogTable } from '@/components/organization';

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', slug],
    queryFn: () => api.getOrganization(slug),
    enabled: !!slug,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['organization-stats', slug],
    queryFn: () => api.getOrganizationStats(slug),
    enabled: !!slug,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['organization-members', slug],
    queryFn: () => api.getOrganizationMembers(slug),
    enabled: !!slug,
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['organization-audit', slug],
    queryFn: () => api.getOrganizationAuditLogs(slug, { page_size: 5 }),
    enabled: !!slug,
  });

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-3 font-mono">Loading organization...</span>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="text-center py-20">
          <h2 className="text-xl font-mono font-bold mb-2">Organization Not Found</h2>
          <p className="text-white/60 font-mono">
            The organization you're looking for doesn't exist or you don't have access.
          </p>
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

  const members = membersData || [];
  const auditLogs = auditData?.items || [];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <button
            onClick={() => router.push('/dashboard/organizations')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-mono text-sm">All Organizations</span>
          </button>
          <div className="flex items-center gap-4">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="w-12 h-12 object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
                <span className="font-mono font-bold text-xl">
                  {org.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-mono font-bold">{org.name}</h1>
              {org.description && (
                <p className="text-white/60 text-sm font-mono mt-1">
                  {org.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <OrganizationSwitcher currentOrgSlug={slug} className="w-48" />
          <button
            onClick={() => router.push(`/dashboard/organizations/${slug}/settings`)}
            className="p-2 border border-white/20 hover:bg-white/5 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-white/10 p-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-mono">MEMBERS</span>
          </div>
          <p className="text-2xl font-mono font-bold">
            {statsLoading ? '...' : stats?.total_members || 0}
          </p>
          <p className="text-xs text-white/40 font-mono">
            of {org.max_members} max
          </p>
        </div>

        <div className="border border-white/10 p-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-mono">PROJECTS</span>
          </div>
          <p className="text-2xl font-mono font-bold">
            {statsLoading ? '...' : stats?.total_projects || 0}
          </p>
          <p className="text-xs text-white/40 font-mono">
            active projects
          </p>
        </div>

        <div className="border border-white/10 p-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-mono">SIMULATIONS</span>
          </div>
          <p className="text-2xl font-mono font-bold">
            {statsLoading ? '...' : stats?.simulations_this_month || 0}
          </p>
          <p className="text-xs text-white/40 font-mono">
            this month
          </p>
        </div>

        <div className="border border-white/10 p-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <span className="text-xs font-mono">PLAN</span>
          </div>
          <p className="text-2xl font-mono font-bold capitalize">
            {org.tier}
          </p>
          <p className="text-xs text-white/40 font-mono">
            {org.tier === 'free' ? 'Upgrade available' : 'Active'}
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Members Section */}
        <div className="border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono font-bold">TEAM MEMBERS</h2>
            <button
              onClick={() => router.push(`/dashboard/organizations/${slug}/members`)}
              className="flex items-center gap-1 text-white/60 hover:text-white text-sm font-mono transition-colors"
            >
              <Plus className="w-4 h-4" />
              Manage
            </button>
          </div>
          <MemberList
            members={members.slice(0, 5)}
            currentUserRole="viewer"
            isLoading={membersLoading}
          />
          {members.length > 5 && (
            <button
              onClick={() => router.push(`/dashboard/organizations/${slug}/members`)}
              className="w-full mt-4 py-2 text-center text-sm font-mono text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
            >
              View all {members.length} members
            </button>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono font-bold">RECENT ACTIVITY</h2>
            <button
              onClick={() => router.push(`/dashboard/organizations/${slug}/audit`)}
              className="text-white/60 hover:text-white text-sm font-mono transition-colors"
            >
              View all
            </button>
          </div>
          <AuditLogTable logs={auditLogs} isLoading={auditLoading} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 border border-white/10 p-6">
        <h2 className="font-mono font-bold mb-4">QUICK ACTIONS</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push(`/dashboard/organizations/${slug}/members`)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 hover:border-white/40 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="font-mono text-sm">Invite Member</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/projects/new')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 hover:border-white/40 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="font-mono text-sm">New Project</span>
          </button>
          <button
            onClick={() => router.push(`/dashboard/organizations/${slug}/settings`)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 hover:border-white/40 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="font-mono text-sm">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
