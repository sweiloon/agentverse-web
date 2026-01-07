'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Plus,
  UserCircle,
  MoreVertical,
  Trash2,
  Eye,
  Search,
  Loader2,
  Users,
  FileSpreadsheet,
  Brain,
  Sparkles,
  Terminal,
  Gamepad2,
} from 'lucide-react';
import { usePersonaTemplates, useDeletePersonaTemplate } from '@/hooks/useApi';
import { PersonaTemplate } from '@/lib/api';
import { cn } from '@/lib/utils';

const sourceTypeIcons: Record<string, React.ReactNode> = {
  ai_generated: <Sparkles className="w-3 h-3" />,
  file_upload: <FileSpreadsheet className="w-3 h-3" />,
  ai_research: <Brain className="w-3 h-3" />,
};

const sourceTypeLabels: Record<string, string> = {
  ai_generated: 'AI GEN',
  file_upload: 'UPLOAD',
  ai_research: 'RESEARCH',
};

export default function PersonasPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const { data: templates, isLoading, error, refetch } = usePersonaTemplates({
    region: regionFilter || undefined,
  });

  const filteredTemplates = templates?.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCircle className="w-4 h-4 text-white/60" />
            <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Persona Module</span>
          </div>
          <h1 className="text-xl font-mono font-bold text-white">AI Personas</h1>
          <p className="text-sm font-mono text-white/50 mt-1">
            Agent persona templates for simulations
          </p>
        </div>
        <Link href="/dashboard/personas/new">
          <Button size="sm">
            <Plus className="w-3 h-3 mr-2" />
            CREATE PERSONAS
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 bg-white/5 border border-white/10 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-3 py-1.5 bg-white/5 border border-white/10 text-xs font-mono text-white appearance-none focus:outline-none focus:border-white/30"
        >
          <option value="">All Regions</option>
          <option value="us">United States</option>
          <option value="europe">Europe</option>
          <option value="asia">Southeast Asia</option>
          <option value="china">China</option>
          <option value="latam">Latin America</option>
          <option value="middle_east">Middle East</option>
          <option value="africa">Africa</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3 h-3 text-white/40" />
            <span className="text-[10px] font-mono text-white/40 uppercase">TOTAL</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{templates?.length || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3 h-3 text-white/40" />
            <span className="text-[10px] font-mono text-white/40 uppercase">AI GEN</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">
            {templates?.filter((t) => t.source_type === 'ai_generated').length || 0}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-3 h-3 text-white/40" />
            <span className="text-[10px] font-mono text-white/40 uppercase">UPLOAD</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">
            {templates?.filter((t) => t.source_type === 'file_upload').length || 0}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-3 h-3 text-white/40" />
            <span className="text-[10px] font-mono text-white/40 uppercase">RESEARCH</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">
            {templates?.filter((t) => t.source_type === 'ai_research').length || 0}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-4 h-4 animate-spin text-white/40" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4">
          <p className="text-sm font-mono text-red-400">Failed to load personas</p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="mt-2 font-mono text-xs border-white/20 text-white/60 hover:bg-white/5"
          >
            RETRY
          </Button>
        </div>
      )}

      {/* Templates List */}
      {!isLoading && !error && (
        <>
          {(!filteredTemplates || filteredTemplates.length === 0) ? (
            <div className="bg-white/5 border border-white/10">
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <UserCircle className="w-5 h-5 text-white/30" />
                </div>
                <p className="text-sm font-mono text-white/60 mb-1">No personas</p>
                <p className="text-xs font-mono text-white/30 mb-4">
                  Create your first persona template
                </p>
                <Link href="/dashboard/personas/new">
                  <Button size="sm">
                    CREATE PERSONAS
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} onDelete={() => refetch()} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Footer Status */}
      <div className="mt-8 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] font-mono text-white/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              <span>PERSONA MODULE</span>
            </div>
          </div>
          <span>AGENTVERSE v1.0.0</span>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, onDelete }: { template: PersonaTemplate; onDelete: () => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const deleteTemplate = useDeletePersonaTemplate();

  const handleDelete = async () => {
    if (confirm('Delete this persona template?')) {
      try {
        await deleteTemplate.mutateAsync(template.id);
        onDelete();
      } catch {
        // Delete failed - mutation error is handled by react-query
      }
    }
    setShowMenu(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-8 h-8 bg-white/5 flex items-center justify-center">
            <UserCircle className="w-4 h-4 text-white/60" />
          </div>
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
                    href={`/dashboard/personas/${template.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-white/60 hover:bg-white/10"
                    onClick={() => setShowMenu(false)}
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Link>
                  {template.persona_count > 0 && (
                    <Link
                      href={`/dashboard/personas/${template.id}/world`}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-cyan-400 hover:bg-white/10"
                      onClick={() => setShowMenu(false)}
                    >
                      <Gamepad2 className="w-3 h-3" />
                      Vi World
                    </Link>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleteTemplate.isPending}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-mono text-red-400 hover:bg-white/10 disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <Link href={`/dashboard/personas/${template.id}`}>
          <h3 className="text-sm font-mono font-bold text-white mb-1 hover:text-white/80">
            {template.name}
          </h3>
        </Link>
        <p className="text-xs font-mono text-white/40 mb-3 line-clamp-2">
          {template.description || 'No description'}
        </p>

        {/* Metadata */}
        <div className="space-y-1 mb-3">
          {template.topic && (
            <div className="text-[10px] font-mono text-white/40">
              <span className="text-white/30">TOPIC:</span> {template.topic}
            </div>
          )}
          {template.industry && (
            <div className="text-[10px] font-mono text-white/40">
              <span className="text-white/30">INDUSTRY:</span> {template.industry}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-mono text-white/40 px-1.5 py-0.5 bg-white/5">
            {template.persona_count} personas
          </span>
          <span className="text-[10px] font-mono text-green-400 px-1.5 py-0.5 bg-green-500/10">
            {Math.round(template.confidence_score * 100)}%
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/40 uppercase px-1.5 py-0.5 bg-white/5">
              {template.region}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono text-white/40 px-1.5 py-0.5 bg-white/5">
              {sourceTypeIcons[template.source_type]}
              {sourceTypeLabels[template.source_type] || template.source_type}
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/30">
            {new Date(template.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
