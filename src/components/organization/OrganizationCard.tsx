'use client';

import { Building2, Users, Zap, Crown, Shield, User } from 'lucide-react';
import { Organization, UserOrganization } from '@/lib/api';
import { cn } from '@/lib/utils';

interface OrganizationCardProps {
  userOrg: UserOrganization;
  onClick?: () => void;
  isActive?: boolean;
}

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: User,
};

const tierColors: Record<string, string> = {
  free: 'text-white/60',
  team: 'text-blue-400',
  business: 'text-purple-400',
  enterprise: 'text-amber-400',
};

export function OrganizationCard({ userOrg, onClick, isActive }: OrganizationCardProps) {
  const { organization, role, joined_at } = userOrg;
  const RoleIcon = roleIcons[role] || User;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 border transition-all text-left",
        isActive
          ? "border-white bg-white/10"
          : "border-white/20 hover:border-white/40 hover:bg-white/5"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {organization.logo_url ? (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="w-10 h-10 object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white/60" />
            </div>
          )}
          <div>
            <h3 className="font-mono font-bold text-white">{organization.name}</h3>
            <p className="text-xs text-white/40 font-mono">/{organization.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-mono uppercase",
            tierColors[organization.tier] || 'text-white/60'
          )}>
            {organization.tier}
          </span>
        </div>
      </div>

      {organization.description && (
        <p className="mt-3 text-sm text-white/60 line-clamp-2">
          {organization.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-white/40 font-mono">
        <div className="flex items-center gap-1">
          <RoleIcon className="w-3 h-3" />
          <span className="capitalize">{role}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{organization.member_count || 1} members</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>
            {organization.current_month_simulations}/{organization.max_simulations_per_month}
          </span>
        </div>
      </div>
    </button>
  );
}
