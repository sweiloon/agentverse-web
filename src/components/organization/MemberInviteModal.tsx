'use client';

import { useState } from 'react';
import { X, Mail, Shield, User, Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<void>;
  maxMembers: number;
  currentMemberCount: number;
}

const roles = [
  { value: 'admin', label: 'Admin', icon: Shield, description: 'Can manage members and settings' },
  { value: 'member', label: 'Member', icon: User, description: 'Can create and run simulations' },
  { value: 'viewer', label: 'Viewer', icon: Eye, description: 'Can only view results' },
];

export function MemberInviteModal({
  isOpen,
  onClose,
  onInvite,
  maxMembers,
  currentMemberCount,
}: MemberInviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingSlots = maxMembers - currentMemberCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Email is required');
      return;
    }

    if (remainingSlots <= 0) {
      setError('No more member slots available');
      return;
    }

    try {
      setIsLoading(true);
      await onInvite(email, role);
      setEmail('');
      setRole('member');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-black border border-white/20 w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <h2 className="font-mono font-bold text-lg">INVITE MEMBER</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-mono text-white/60 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  className="w-full bg-white/5 border border-white/20 px-10 py-3 font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-mono text-white/60 mb-2">
                Role
              </label>
              <div className="space-y-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 border transition-colors text-left",
                      role === r.value
                        ? "border-white bg-white/10"
                        : "border-white/20 hover:border-white/40"
                    )}
                  >
                    <r.icon className="w-4 h-4" />
                    <div>
                      <p className="font-mono font-medium text-sm">{r.label}</p>
                      <p className="text-xs text-white/40">{r.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Member Limit Info */}
            <div className="bg-white/5 border border-white/10 p-3">
              <p className="text-xs font-mono text-white/60">
                {remainingSlots > 0 ? (
                  <>
                    <span className="text-white">{remainingSlots}</span> member slots remaining
                  </>
                ) : (
                  <span className="text-red-400">No member slots available. Upgrade your plan.</span>
                )}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-3">
                <p className="text-xs font-mono text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-white/20 font-mono text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || remainingSlots <= 0}
                className="flex-1 px-4 py-3 bg-white text-black font-mono text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
