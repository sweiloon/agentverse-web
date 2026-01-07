'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { api, OrganizationRole, MemberInfo, Invitation } from '@/lib/api';
import { MemberList, MemberInviteModal } from '@/components/organization';

export default function OrganizationMembersPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const slug = params.slug as string;

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', slug],
    queryFn: () => api.getOrganization(slug),
    enabled: !!slug,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['organization-members', slug],
    queryFn: () => api.getOrganizationMembers(slug),
    enabled: !!slug,
  });

  const { data: invitationsData, isLoading: invitationsLoading } = useQuery({
    queryKey: ['organization-invitations', slug],
    queryFn: () => api.getOrganizationInvitations(slug),
    enabled: !!slug,
  });

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      api.inviteToOrganization(slug, { email, role: role as OrganizationRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', slug] });
      queryClient.invalidateQueries({ queryKey: ['organization-audit', slug] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.updateMemberRole(slug, memberId, role as OrganizationRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', slug] });
      queryClient.invalidateQueries({ queryKey: ['organization-audit', slug] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => api.removeMember(slug, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', slug] });
      queryClient.invalidateQueries({ queryKey: ['organization-stats', slug] });
      queryClient.invalidateQueries({ queryKey: ['organization-audit', slug] });
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => api.cancelInvitation(slug, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', slug] });
    },
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

  const members: MemberInfo[] = membersData || [];
  const invitations: Invitation[] = invitationsData?.items || [];
  const pendingInvitations = invitations.filter((inv: Invitation) => inv.status === 'pending');
  const currentMemberCount = members.length + pendingInvitations.length;

  // The user's role is determined based on organization ownership
  // TODO: Get actual role from auth context or organization membership data
  const isOwner = org.owner_id !== undefined; // Placeholder - would check against current user ID
  const currentUserRole: OrganizationRole = isOwner ? 'owner' : 'admin';

  const handleInvite = async (email: string, role: string) => {
    await inviteMutation.mutateAsync({ email, role });
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    await updateRoleMutation.mutateAsync({ memberId, role });
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMemberMutation.mutateAsync(memberId);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (confirm('Are you sure you want to cancel this invitation?')) {
      await cancelInvitationMutation.mutateAsync(invitationId);
    }
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
          <h1 className="text-2xl font-mono font-bold">TEAM MEMBERS</h1>
          <p className="text-white/60 text-sm font-mono mt-1">
            Manage who has access to {org.name}
          </p>
        </div>

        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-mono font-bold text-sm hover:bg-white/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Member Stats */}
      <div className="flex gap-4 mb-8">
        <div className="border border-white/10 px-4 py-3">
          <span className="text-2xl font-mono font-bold">{members.length}</span>
          <span className="text-white/60 font-mono text-sm ml-2">Members</span>
        </div>
        <div className="border border-white/10 px-4 py-3">
          <span className="text-2xl font-mono font-bold">{pendingInvitations.length}</span>
          <span className="text-white/60 font-mono text-sm ml-2">Pending</span>
        </div>
        <div className="border border-white/10 px-4 py-3">
          <span className="text-2xl font-mono font-bold">{org.max_members - currentMemberCount}</span>
          <span className="text-white/60 font-mono text-sm ml-2">Slots Available</span>
        </div>
      </div>

      {/* Members List */}
      <div className="border border-white/10 p-6 mb-8">
        <h2 className="font-mono font-bold mb-4">ACTIVE MEMBERS</h2>
        <MemberList
          members={members}
          currentUserRole={currentUserRole}
          isLoading={membersLoading}
          onUpdateRole={handleUpdateRole}
          onRemove={handleRemoveMember}
        />
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="border border-white/10 p-6">
          <h2 className="font-mono font-bold mb-4">PENDING INVITATIONS</h2>
          {invitationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-mono text-sm">{invitation.email}</p>
                    <p className="text-xs text-white/40 font-mono capitalize">
                      Invited as {invitation.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-yellow-500 font-mono">
                      Pending
                    </span>
                    {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="text-xs text-red-400 hover:text-red-300 font-mono"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <MemberInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInvite}
        maxMembers={org.max_members}
        currentMemberCount={currentMemberCount}
      />
    </div>
  );
}
