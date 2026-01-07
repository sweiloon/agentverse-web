'use client';

import { useState, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, Plus, Check, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, UserOrganization } from '@/lib/api';
import { useApiAuth } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

interface OrganizationSwitcherProps {
  currentOrgSlug?: string;
  className?: string;
}

export const OrganizationSwitcher = memo(function OrganizationSwitcher({ currentOrgSlug, className }: OrganizationSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { isReady } = useApiAuth();

  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: () => api.listMyOrganizations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isReady,
  });

  const organizations = orgsData?.items || [];
  const currentOrg = organizations.find(
    (o: UserOrganization) => o.organization.slug === currentOrgSlug
  );

  const handleSelect = (slug: string) => {
    router.push(`/dashboard/organizations/${slug}`);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    router.push('/dashboard/organizations/new');
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-white/20 hover:border-white/40 transition-colors w-full"
      >
        {currentOrg ? (
          <>
            {currentOrg.organization.logo_url ? (
              <img
                src={currentOrg.organization.logo_url}
                alt={currentOrg.organization.name}
                className="w-5 h-5 object-cover"
              />
            ) : (
              <Building2 className="w-5 h-5 text-white/60" />
            )}
            <span className="font-mono text-sm flex-1 text-left truncate">
              {currentOrg.organization.name}
            </span>
          </>
        ) : (
          <>
            <Building2 className="w-5 h-5 text-white/40" />
            <span className="font-mono text-sm text-white/40 flex-1 text-left">
              {isLoading ? 'Loading...' : 'Select organization'}
            </span>
          </>
        )}
        <ChevronDown className={cn(
          "w-4 h-4 text-white/60 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full mt-1 bg-black border border-white/20 z-50 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-white/60" />
              </div>
            ) : organizations.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-white/40 font-mono">No organizations</p>
              </div>
            ) : (
              organizations.map((userOrg: UserOrganization) => (
                <button
                  key={userOrg.organization.id}
                  onClick={() => handleSelect(userOrg.organization.slug)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors",
                    currentOrgSlug === userOrg.organization.slug && "bg-white/10"
                  )}
                >
                  {userOrg.organization.logo_url ? (
                    <img
                      src={userOrg.organization.logo_url}
                      alt={userOrg.organization.name}
                      className="w-5 h-5 object-cover"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-white/60" />
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-mono text-sm">{userOrg.organization.name}</p>
                    <p className="text-xs text-white/40 font-mono capitalize">{userOrg.role}</p>
                  </div>
                  {currentOrgSlug === userOrg.organization.slug && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))
            )}

            <div className="border-t border-white/10">
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors text-white/60 hover:text-white"
              >
                <Plus className="w-5 h-5" />
                <span className="font-mono text-sm">Create organization</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
