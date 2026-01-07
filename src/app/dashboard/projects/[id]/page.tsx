'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Plus,
  Play,
  Settings,
  MoreVertical,
  Calendar,
  Users,
  BarChart3,
  Loader2,
  FileText,
  Trash2,
  Edit,
  FolderKanban,
  Terminal,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProject, useScenarios } from '@/hooks/useApi';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId);
  const { data: scenarios, isLoading: scenariosLoading } = useScenarios({ project_id: projectId });

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="bg-red-500/10 border border-red-500/30 p-6 text-center">
          <h2 className="text-lg font-mono font-bold text-red-400 mb-2">PROJECT NOT FOUND</h2>
          <p className="text-sm font-mono text-red-400/70 mb-4">The requested project could not be loaded.</p>
          <Link href="/dashboard/projects">
            <Button variant="outline" className="font-mono text-xs border-white/20 text-white/60 hover:bg-white/5">
              BACK TO PROJECTS
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban className="w-4 h-4 text-white/60" />
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Project Detail</span>
            </div>
            <h1 className="text-xl font-mono font-bold text-white">{project.name}</h1>
            <p className="text-sm font-mono text-white/50 mt-1">{project.description || 'No description'}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="px-2 py-0.5 bg-white/10 text-white/60 text-[10px] font-mono uppercase">
                {project.domain}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-white/30">
                <Calendar className="w-3 h-3" />
                Created {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="font-mono text-[10px] border-white/20 text-white/60 hover:bg-white/5">
              <Settings className="w-3 h-3 mr-2" />
              SETTINGS
            </Button>
            <Link href={`/dashboard/projects/${projectId}/scenarios/new`}>
              <Button size="sm">
                <Plus className="w-3 h-3 mr-2" />
                NEW SCENARIO
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-white/40 uppercase">Scenarios</p>
              <p className="text-xl font-mono font-bold text-white">{scenarios?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-white/40 uppercase">Simulations Run</p>
              <p className="text-xl font-mono font-bold text-white">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-white/40 uppercase">Total Agents</p>
              <p className="text-xl font-mono font-bold text-white">
                {scenarios?.reduce((acc: number, s: any) => acc + (s.population_size || 0), 0).toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div>
        <h2 className="text-sm font-mono font-bold text-white mb-4 uppercase">Scenarios</h2>

        {scenariosLoading ? (
          <div className="bg-white/5 border border-white/10 p-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-white/40" />
          </div>
        ) : !scenarios || scenarios.length === 0 ? (
          <div className="bg-white/5 border border-white/10">
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-white/5 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-5 h-5 text-white/30" />
              </div>
              <h3 className="font-mono font-bold text-white text-sm mb-1">NO SCENARIOS YET</h3>
              <p className="text-xs font-mono text-white/40 mb-4">
                Create your first scenario to start simulating
              </p>
              <Link href={`/dashboard/projects/${projectId}/scenarios/new`}>
                <Button >
                  <Plus className="w-3 h-3 mr-2" />
                  CREATE SCENARIO
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {scenarios.map((scenario: any) => (
              <ScenarioCard key={scenario.id} scenario={scenario} projectId={projectId} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="mt-8 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] font-mono text-white/30">
          <div className="flex items-center gap-1">
            <Terminal className="w-3 h-3" />
            <span>PROJECT DETAIL MODULE</span>
          </div>
          <span>AGENTVERSE v1.0.0</span>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, projectId }: { scenario: any; projectId: string }) {
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig: Record<string, { className: string; label: string }> = {
    draft: { className: 'bg-white/10 text-white/50', label: 'DRAFT' },
    ready: { className: 'bg-blue-500/20 text-blue-400', label: 'READY' },
    running: { className: 'bg-yellow-500/20 text-yellow-400 animate-pulse', label: 'RUNNING' },
    completed: { className: 'bg-green-500/20 text-green-400', label: 'DONE' },
  };

  const status = statusConfig[scenario.status] || statusConfig.draft;

  return (
    <div className="bg-white/5 border border-white/10 p-4 hover:bg-white/[0.07] hover:border-white/20 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-mono font-bold text-white text-sm">{scenario.name}</h3>
            <span className={cn('px-1.5 py-0.5 text-[10px] font-mono uppercase', status.className)}>
              {status.label}
            </span>
          </div>
          <p className="text-xs font-mono text-white/40 mb-2">
            {scenario.description || 'No description'}
          </p>
          <div className="flex items-center gap-4 text-[10px] font-mono text-white/30">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {(scenario.population_size || 0).toLocaleString()} agents
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(scenario.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/simulations/new?scenario=${scenario.id}`}>
            <Button size="sm" variant="outline" className="font-mono text-[10px] border-white/20 text-white/60 hover:bg-white/5 h-7">
              <Play className="w-3 h-3 mr-1" />
              RUN
            </Button>
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-3 h-3 text-white/40" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-32 bg-black border border-white/20 py-1 z-20">
                  <Link
                    href={`/dashboard/projects/${projectId}/scenarios/${scenario.id}/edit`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-white/60 hover:bg-white/10"
                    onClick={() => setShowMenu(false)}
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Link>
                  <Link
                    href={`/dashboard/results?scenario=${scenario.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-white/60 hover:bg-white/10"
                    onClick={() => setShowMenu(false)}
                  >
                    <Eye className="w-3 h-3" />
                    Results
                  </Link>
                  <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-mono text-red-400 hover:bg-white/10">
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
