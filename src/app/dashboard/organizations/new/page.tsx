'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function NewOrganizationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => api.createOrganization({ name, slug: slug || undefined, description: description || undefined }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
      router.push(`/dashboard/organizations/${data.slug}`);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create organization');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }

    createMutation.mutate();
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug) {
      // Auto-generate slug from name if slug hasn't been manually edited
      setSlug(generateSlug(value));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-mono text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-mono font-bold">CREATE ORGANIZATION</h1>
        <p className="text-white/60 text-sm font-mono mt-1">
          Set up a new workspace for your team
        </p>
      </div>

      {/* Form */}
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-mono text-white/60 mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Research Labs"
              className="w-full bg-white/5 border border-white/20 px-4 py-3 font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-mono text-white/60 mb-2">
              URL Slug
            </label>
            <div className="flex items-center">
              <span className="text-white/40 font-mono text-sm mr-2">
                /organizations/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                placeholder="acme-research"
                className="flex-1 bg-white/5 border border-white/20 px-4 py-3 font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
              />
            </div>
            <p className="text-xs text-white/40 font-mono mt-1">
              Only lowercase letters, numbers, and hyphens
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-mono text-white/60 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your organization..."
              rows={3}
              className="w-full bg-white/5 border border-white/20 px-4 py-3 font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40 resize-none"
            />
          </div>

          {/* Plan Info */}
          <div className="bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-white/60" />
              <span className="font-mono font-medium">Free Plan</span>
            </div>
            <ul className="text-sm text-white/60 font-mono space-y-1 ml-8">
              <li>• Up to 5 team members</li>
              <li>• 100 simulations per month</li>
              <li>• Basic analytics</li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-3">
              <p className="text-xs font-mono text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-3 border border-white/20 font-mono text-sm hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-3 bg-white text-black font-mono text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
