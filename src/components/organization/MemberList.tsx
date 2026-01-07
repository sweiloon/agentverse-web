'use client';

import { useState } from 'react';
import { Crown, Shield, User, Eye, MoreHorizontal, Trash2, UserCog } from 'lucide-react';
import { MemberInfo } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MemberListProps {
  members: MemberInfo[];
  currentUserId?: string;
  currentUserRole?: string;
  ownerId?: string;
  onUpdateRole?: (userId: string, newRole: string) => void;
  onRemove?: (userId: string) => void;
  isLoading?: boolean;
}

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const roleColors: Record<string, string> = {
  owner: 'text-amber-400 bg-amber-400/10',
  admin: 'text-purple-400 bg-purple-400/10',
  member: 'text-blue-400 bg-blue-400/10',
  viewer: 'text-white/60 bg-white/10',
};

export function MemberList({
  members,
  currentUserId,
  currentUserRole,
  ownerId,
  onUpdateRole,
  onRemove,
  isLoading,
}: MemberListProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const canManageRoles = currentUserRole === 'owner' || currentUserRole === 'admin';

  const canModifyMember = (member: MemberInfo): boolean => {
    if (!canManageRoles) return false;
    if (member.id === currentUserId) return false;
    if (member.role === 'owner') return false;
    if (currentUserRole === 'admin' && member.role === 'admin') return false;
    return true;
  };

  const getAvailableRoles = (member: MemberInfo): string[] => {
    if (currentUserRole === 'owner') {
      return ['admin', 'member', 'viewer'];
    }
    if (currentUserRole === 'admin') {
      return ['member', 'viewer'];
    }
    return [];
  };

  return (
    <div className="divide-y divide-white/10">
      {members.map((member) => {
        const RoleIcon = roleIcons[member.role] || User;
        const isCurrentUser = member.id === currentUserId;
        const canModify = canModifyMember(member);
        const isMenuOpen = openMenu === member.id;

        return (
          <div
            key={member.id}
            className={cn(
              "flex items-center justify-between p-4",
              isCurrentUser && "bg-white/5"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center font-mono font-bold">
                {member.full_name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">
                    {member.full_name || member.email.split('@')[0]}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs text-white/40">(you)</span>
                  )}
                </div>
                <p className="text-xs text-white/40 font-mono">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs font-mono",
                roleColors[member.role]
              )}>
                <RoleIcon className="w-3 h-3" />
                <span className="capitalize">{member.role}</span>
              </div>

              {canModify && (
                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(isMenuOpen ? null : member.id)}
                    className="p-1 hover:bg-white/10 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-white/60" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpenMenu(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-black border border-white/20 z-50">
                        <div className="p-2 border-b border-white/10">
                          <p className="text-xs text-white/40 font-mono">Change role</p>
                        </div>
                        {getAvailableRoles(member).map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              onUpdateRole?.(member.id, role);
                              setOpenMenu(null);
                            }}
                            disabled={isLoading}
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm font-mono hover:bg-white/5 transition-colors flex items-center gap-2",
                              member.role === role && "text-white/40"
                            )}
                          >
                            <UserCog className="w-4 h-4" />
                            <span className="capitalize">{role}</span>
                          </button>
                        ))}
                        <div className="border-t border-white/10">
                          <button
                            onClick={() => {
                              onRemove?.(member.id);
                              setOpenMenu(null);
                            }}
                            disabled={isLoading}
                            className="w-full px-3 py-2 text-left text-sm font-mono text-red-400 hover:bg-red-400/10 transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove member
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
