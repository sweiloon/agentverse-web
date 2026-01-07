'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function OrganizationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const slug = params.slug as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', slug],
    queryFn: () => api.getOrganization(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    if (org) {
      setName(org.name);
      setDescription(org.description || '');
      setLogoUrl(org.logo_url || '');
    }
  }, [org]);

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string; logo_url?: string }) =>
      api.updateOrganization(slug, data),
    onSuccess: (updatedOrg) => {
      queryClient.invalidateQueries({ queryKey: ['organization', slug] });
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization-audit', slug] });
      setSuccess('Organization settings updated successfully');
      setError(null);

      // If slug changed, redirect to new URL
      if (updatedOrg.slug !== slug) {
        router.replace(`/dashboard/organizations/${updatedOrg.slug}/settings`);
      }
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to update organization');
      setSuccess(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteOrganization(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
      router.push('/dashboard/organizations');
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to delete organization');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }

    updateMutation.mutate({
      name: name !== org.name ? name : undefined,
      description: description !== (org.description || '') ? description : undefined,
      logo_url: logoUrl !== (org.logo_url || '') ? logoUrl : undefined,
    });
  };

  const handleDelete = () => {
    if (deleteConfirmText === org.name) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/dashboard/organizations/${slug}`)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-mono text-sm">{org.name}</span>
        </button>
        <h1 className="text-2xl font-mono font-bold">ORGANIZATION SETTINGS</h1>
        <p className="text-white/60 text-sm font-mono mt-1">
          Manage your organization's settings and preferences
        </p>
      </div>

      <div className="max-w-2xl">
        {/* General Settings */}
        <form onSubmit={handleSubmit} className="border border-white/10 p-6 mb-8">
          <h2 className="font-mono font-bold mb-6">GENERAL</h2>

          <div className="space-y-6">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-mono text-white/60 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/20 px-4 py-3 font-mono text-sm focus:outline-none focus:border-white/40"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-mono text-white/60 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/20 px-4 py-3 font-mono text-sm focus:outline-none focus:border-white/40 resize-none"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-mono text-white/60 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full bg-white/5 border border-white/20 px-4 py-3 font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
              />
              {logoUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-white/40 font-mono">Preview:</span>
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="w-10 h-10 object-cover border border-white/20"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-3">
                <p className="text-xs font-mono text-red-400">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 p-3">
                <p className="text-xs font-mono text-green-400">{success}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-3 bg-white text-black font-mono text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>

        {/* Plan Info */}
        <div className="border border-white/10 p-6 mb-8">
          <h2 className="font-mono font-bold mb-4">CURRENT PLAN</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-lg capitalize">{org.tier} Plan</p>
              <p className="text-sm text-white/60 font-mono">
                {org.max_members} members • {org.tier === 'free' ? '100' : 'Unlimited'} simulations/month
              </p>
            </div>
            {org.tier === 'free' && (
              <button className="px-4 py-2 border border-white/20 font-mono text-sm hover:bg-white/5 transition-colors">
                Upgrade Plan
              </button>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-500/30 p-6">
          <h2 className="font-mono font-bold text-red-400 mb-4">DANGER ZONE</h2>

          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm">Delete Organization</p>
                <p className="text-xs text-white/40 font-mono">
                  This action cannot be undone. All data will be permanently deleted.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 font-mono text-sm hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-red-500/10 p-4">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-mono text-sm text-red-400">
                    This will permanently delete the organization "{org.name}" and all associated data.
                  </p>
                  <p className="text-xs text-white/60 font-mono mt-2">
                    Type <strong>{org.name}</strong> to confirm:
                  </p>
                </div>
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={org.name}
                className="w-full bg-white/5 border border-red-500/30 px-4 py-3 font-mono text-sm focus:outline-none focus:border-red-500/50"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 px-4 py-2 border border-white/20 font-mono text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== org.name || deleteMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-500 text-white font-mono text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Organization'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
