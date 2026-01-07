'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  FolderKanban,
  Play,
  BarChart3,
  ArrowRight,
  Users,
  TrendingUp,
  Loader2,
  Terminal,
  Activity,
  Cpu,
} from 'lucide-react';
import { useProjects, useSimulations, useSimulationStats, useProductStats, useProducts } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data: projects, isLoading: projectsLoading } = useProjects({ limit: 5 });
  const { data: simulations, isLoading: simulationsLoading } = useSimulations({ limit: 5 });
  const { data: stats, isLoading: statsLoading } = useSimulationStats();
  const { data: productStats, isLoading: productStatsLoading } = useProductStats();
  const { data: products, isLoading: productsLoading } = useProducts({ limit: 5 });

  // Combine stats from both simulation runs and product runs
  const totalRuns = (stats?.completed_runs || 0) + (productStats?.completed_runs || 0);
  const totalAgents = (stats?.total_agents_simulated || 0) + (productStats?.total_agents || 0);
  const isStatsLoading = statsLoading || productStatsLoading;

  const dashboardStats = [
    {
      name: 'PROJECTS',
      value: projectsLoading ? '...' : String(projects?.length || 0),
      icon: FolderKanban,
    },
    {
      name: 'PRODUCTS',
      value: productStatsLoading ? '...' : String(productStats?.total_products || 0),
      icon: Activity,
    },
    {
      name: 'AGENTS',
      value: isStatsLoading ? '...' : formatNumber(totalAgents),
      icon: Users,
    },
    {
      name: 'RUNS',
      value: isStatsLoading ? '...' : String(totalRuns),
      icon: TrendingUp,
    },
  ];

  const quickActions = [
    {
      title: 'New Project',
      description: 'Initialize simulation project',
      href: '/dashboard/projects/new',
      icon: FolderKanban,
      key: 'P',
    },
    {
      title: 'Run Simulation',
      description: 'Execute scenario',
      href: '/dashboard/simulations/new',
      icon: Play,
      key: 'R',
    },
    {
      title: 'View Results',
      description: 'Analyze outputs',
      href: '/dashboard/results',
      icon: BarChart3,
      key: 'V',
    },
  ];

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="w-4 h-4 text-white/60" />
          <span className="text-xs font-mono text-white/40 uppercase tracking-wider">System Dashboard</span>
        </div>
        <h1 className="text-xl font-mono font-bold text-white">
          AgentVerse Control Panel
        </h1>
        <p className="text-sm font-mono text-white/50 mt-1">
          AI Simulation Engine v1.0
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {dashboardStats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white/5 border border-white/10 p-4 hover:bg-white/[0.07] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{stat.name}</p>
                <p className="text-2xl font-mono font-bold text-white mt-1">{stat.value}</p>
              </div>
              <stat.icon className="w-4 h-4 text-white/30" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-3 h-3 text-white/40" />
          <h2 className="text-xs font-mono text-white/40 uppercase tracking-wider">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group bg-white/5 border border-white/10 p-4 hover:bg-white/[0.07] hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <action.icon className="w-4 h-4 text-white/60" />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-white/30">[{action.key}]</span>
                  <ArrowRight className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" />
                </div>
              </div>
              <h3 className="text-sm font-mono font-medium text-white">{action.title}</h3>
              <p className="text-xs font-mono text-white/40 mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started - Only show if no projects */}
      {(!projects || projects.length === 0) && (
        <div className="bg-white/5 border border-white/10 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white flex items-center justify-center flex-shrink-0">
              <Terminal className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">Getting Started</div>
              <h2 className="text-lg font-mono font-bold text-white mb-2">Initialize First Simulation</h2>
              <p className="text-sm font-mono text-white/50 mb-4 max-w-xl">
                Configure AI agents. Define scenarios. Execute simulations. Analyze results.
              </p>
              <Link href="/dashboard/projects/new">
                <Button size="sm">
                  CREATE PROJECT
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Products */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-white/40" />
            <h2 className="text-xs font-mono text-white/40 uppercase tracking-wider">Recent Products</h2>
          </div>
          <Link href="/dashboard/products" className="text-xs font-mono text-white/40 hover:text-white/60 transition-colors">
            View All &rarr;
          </Link>
        </div>
        <div className="bg-white/5 border border-white/10">
          {productsLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-white/40" />
            </div>
          ) : products && products.length > 0 ? (
            <div className="divide-y divide-white/5">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/dashboard/products/${product.id}`}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <StatusIndicator status={product.status} />
                    <div>
                      <p className="text-sm font-mono text-white">
                        {product.name}
                      </p>
                      <p className="text-xs font-mono text-white/40">
                        {product.persona_count || 0} agents • {product.product_type?.toUpperCase()} / {product.sub_type?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xs font-mono uppercase",
                      product.status === 'completed' ? 'text-green-400' :
                      product.status === 'running' ? 'text-yellow-400' :
                      product.status === 'failed' ? 'text-red-400' :
                      product.status === 'draft' ? 'text-blue-400' : 'text-white/40'
                    )}>
                      {product.status}
                    </p>
                    <p className="text-[10px] font-mono text-white/30">
                      {new Date(product.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Play className="w-5 h-5 text-white/30" />
              </div>
              <p className="text-sm font-mono text-white/60 mb-1">No products created</p>
              <p className="text-xs font-mono text-white/30 mb-4">
                Create a product to start running AI simulations
              </p>
              <Link href="/dashboard/products/new">
                <Button variant="outline" size="sm" className="font-mono text-xs border-white/20 text-white/60 hover:bg-white/5 hover:text-white">
                  CREATE PRODUCT
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer Status */}
      <div className="mt-8 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] font-mono text-white/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>SYSTEM ONLINE</span>
            </div>
            <span>|</span>
            <span>API CONNECTED</span>
          </div>
          <span>AGENTVERSE v1.0.0</span>
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: string }) {
  const color = status === 'completed' ? 'bg-green-500' :
                status === 'running' ? 'bg-yellow-500' :
                status === 'failed' ? 'bg-red-500' : 'bg-white/30';

  return (
    <div className="w-8 h-8 bg-white/5 flex items-center justify-center">
      <div className={cn("w-2 h-2", color, status === 'running' && 'animate-pulse')} />
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return String(num);
}
