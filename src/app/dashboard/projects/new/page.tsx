'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  FolderKanban,
  Vote,
  ShoppingCart,
  MessageSquare,
  Users,
  TrendingUp,
  Settings,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateProject } from '@/hooks/useApi';
import { toast } from '@/hooks/use-toast';

const domains = [
  {
    id: 'marketing',
    name: 'Market Research',
    description: 'Consumer preferences, product testing, brand perception',
    icon: ShoppingCart,
  },
  {
    id: 'political',
    name: 'Political Polling',
    description: 'Election predictions, policy sentiment, voter behavior',
    icon: Vote,
  },
  {
    id: 'focus-groups',
    name: 'Focus Groups',
    description: 'In-depth qualitative insights, concept testing',
    icon: MessageSquare,
  },
  {
    id: 'social-dynamics',
    name: 'Social Dynamics',
    description: 'Group behavior, opinion formation, social trends',
    icon: Users,
  },
  {
    id: 'finance',
    name: 'Financial Decisions',
    description: 'Investment behavior, risk assessment, economic choices',
    icon: TrendingUp,
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own simulation domain',
    icon: Settings,
  },
];

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const project = await createProject.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        domain: formData.domain,
      });
      toast({
        title: 'Project Created',
        description: `"${formData.name}" has been created successfully.`,
        variant: 'success',
      });
      router.push(`/dashboard/projects/${project.id}`);
    } catch (err: any) {
      setError(err.detail || err.message || 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5 font-mono text-xs mb-4">
            <ArrowLeft className="w-3 h-3 mr-2" />
            BACK TO PROJECTS
          </Button>
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <FolderKanban className="w-4 h-4 text-white/60" />
          <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Project Module</span>
        </div>
        <h1 className="text-xl font-mono font-bold text-white">Create New Project</h1>
        <p className="text-sm font-mono text-white/50 mt-1">
          Set up a new simulation project
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white/5 border border-white/10">
          {/* Project Details */}
          <div className="p-6 border-b border-white/10">
            <h2 className="font-mono text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-white/60" />
              PROJECT DETAILS
            </h2>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 p-4">
                <p className="text-sm font-mono text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-white/40 uppercase mb-2">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Q1 2024 Product Survey"
                  className="w-full px-3 py-2 bg-black border border-white/10 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-white/40 uppercase mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this project about?"
                  rows={3}
                  className="w-full px-3 py-2 bg-black border border-white/10 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          {/* Domain Selection */}
          <div className="p-6">
            <h2 className="font-mono text-sm font-bold text-white mb-4">
              SELECT DOMAIN <span className="text-red-400">*</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {domains.map((domain) => (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, domain: domain.id })}
                  className={cn(
                    'flex items-start gap-4 p-4 border text-left transition-all',
                    formData.domain === domain.id
                      ? 'border-white bg-white/10'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 flex items-center justify-center',
                    formData.domain === domain.id ? 'bg-white/20' : 'bg-white/10'
                  )}>
                    <domain.icon className="w-5 h-5 text-white/60" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-white text-sm">{domain.name}</h3>
                    <p className="text-xs font-mono text-white/40 mt-1">{domain.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/dashboard/projects">
            <Button type="button" variant="outline" className="font-mono text-xs border-white/20 text-white/60 hover:bg-white/5">
              CANCEL
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createProject.isPending || !formData.name || !formData.domain}
            
          >
            {createProject.isPending ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                CREATING...
              </>
            ) : (
              <>
                CREATE PROJECT
                <ArrowRight className="w-3 h-3 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Footer Status */}
      <div className="mt-8 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] font-mono text-white/30">
          <div className="flex items-center gap-1">
            <Terminal className="w-3 h-3" />
            <span>PROJECT CREATE MODULE</span>
          </div>
          <span>AGENTVERSE v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
