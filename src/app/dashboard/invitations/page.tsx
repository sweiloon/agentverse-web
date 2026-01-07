'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Loader2, Check, X, Mail } from 'lucide-react';
import { api, Invitation } from '@/lib/api';
import { useApiAuth } from '@/hooks/useApi';
import { formatDistanceToNow } from 'date-fns';

export default function InvitationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isReady } = useApiAuth();

  const { data: invitationsData, isLoading } = useQuery({
    queryKey: ['my-invitations'],
    queryFn: () => api.listMyInvitations(),
    enabled: isReady,
  });

  const acceptMutation = useMutation({
    mutationFn: (invitationId: string) => api.acceptInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (invitationId: string) => api.declineInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
    },
  });

  const invitations: Invitation[] = invitationsData?.items || [];
  const pendingInvitations = invitations.filter((inv: Invitation) => inv.status === 'pending');

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold">INVITATIONS</h1>
        <p className="text-white/60 text-sm font-mono mt-1">
          Pending invitations to join organizations
        </p>
      </div>

      {/* Invitations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-3 font-mono">Loading invitations...</span>
        </div>
      ) : pendingInvitations.length === 0 ? (
        <div className="border border-white/10 p-8 text-center">
          <Mail className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="font-mono font-bold mb-2">No Pending Invitations</h3>
          <p className="text-white/40 text-sm font-mono mb-6 max-w-md mx-auto">
            You don't have any pending invitations. When someone invites you to their organization, it will appear here.
          </p>
          <button
            onClick={() => router.push('/dashboard/organizations')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 font-mono text-sm hover:bg-white/5 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            View Your Organizations
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingInvitations.map((invitation: Invitation) => (
            <div
              key={invitation.id}
              className="border border-white/10 p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white/60" />
                </div>
                <div>
                  <h3 className="font-mono font-bold">
                    {invitation.organization_name || 'Organization'}
                  </h3>
                  <p className="text-sm text-white/60 font-mono">
                    Invited as <span className="capitalize">{invitation.role}</span>
                  </p>
                  <p className="text-xs text-white/40 font-mono mt-1">
                    Invited by {invitation.invited_by_email || 'Unknown'} •{' '}
                    {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => declineMutation.mutate(invitation.id)}
                  disabled={declineMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 border border-white/20 font-mono text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  {declineMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Decline
                </button>
                <button
                  onClick={() => acceptMutation.mutate(invitation.id)}
                  disabled={acceptMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black font-mono text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accepted/Declined History */}
      {invitations.filter((inv: Invitation) => inv.status !== 'pending').length > 0 && (
        <div className="mt-12">
          <h2 className="font-mono font-bold mb-4 text-white/60">HISTORY</h2>
          <div className="space-y-2">
            {invitations
              .filter((inv: Invitation) => inv.status !== 'pending')
              .slice(0, 5)
              .map((invitation: Invitation) => (
                <div
                  key={invitation.id}
                  className="border border-white/5 p-4 flex items-center justify-between bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-white/40" />
                    <span className="font-mono text-sm text-white/60">
                      {invitation.organization_name || 'Organization'}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono capitalize ${
                      invitation.status === 'accepted'
                        ? 'text-green-400'
                        : invitation.status === 'declined'
                        ? 'text-red-400'
                        : 'text-white/40'
                    }`}
                  >
                    {invitation.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
