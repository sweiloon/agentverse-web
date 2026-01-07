'use client';

import { useRouter } from 'next/navigation';
import { Plus, Building2, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, UserOrganization } from '@/lib/api';
import { useApiAuth } from '@/hooks/useApi';
import { OrganizationCard } from '@/components/organization';

export default function OrganizationsPage() {
  const router = useRouter();
  const { isReady } = useApiAuth();

  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: () => api.listMyOrganizations(),
    enabled: isReady,
  });

  const organizations = orgsData?.items || [];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono font-bold">ORGANIZATIONS</h1>
          <p className="text-white/60 text-sm font-mono mt-1">
            Manage your teams and workspaces
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard/organizations/new')}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-mono font-bold text-sm hover:bg-white/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Organization
        </button>
      </div>

      {/* Organizations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-3 font-mono">Loading organizations...</span>
        </div>
      ) : organizations.length === 0 ? (
        <div className="border border-white/10 p-8 text-center">
          <Building2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="font-mono font-bold mb-2">No Organizations</h3>
          <p className="text-white/40 text-sm font-mono mb-6 max-w-md mx-auto">
            Create an organization to collaborate with your team on simulations and research.
          </p>
          <button
            onClick={() => router.push('/dashboard/organizations/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-mono font-bold text-sm hover:bg-white/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Organization
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((userOrg: UserOrganization) => (
            <OrganizationCard
              key={userOrg.organization.id}
              userOrg={userOrg}
              onClick={() => router.push(`/dashboard/organizations/${userOrg.organization.slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
