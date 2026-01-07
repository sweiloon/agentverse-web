'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import api, {
  Project,
  ProjectCreate,
  ProjectUpdate,
  Scenario,
  ScenarioCreate,
  ScenarioUpdate,
  SimulationRun,
  SimulationRunCreate,
  SimulationStats,
  DataSource,
  DataSourceCreate,
  DataSourceUpdate,
  DemographicDistribution,
  CensusProfile,
  RegionalProfile,
  PersonaTemplate,
  PersonaTemplateCreate,
  PersonaRecord,
  GeneratePersonasRequest,
  GeneratePersonasResponse,
  FileAnalysisResponse,
  UploadResult,
  AIResearchRequest,
  AIResearchJob,
  RegionInfo,
  Benchmark,
  BenchmarkCreate,
  ValidationRecord,
  ValidationCreate,
  AccuracyStats,
  ProductCreate,
  ProductUpdate,
  GenerateAIContentRequest,
} from '@/lib/api';

// Extended session user type for type safety
interface ExtendedSessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  accessToken?: string;
  role?: string;
  tier?: string;
}

// Set up API token from session
export function useApiAuth() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session?.user) {
      const user = session.user as ExtendedSessionUser;
      if (user.accessToken) {
        api.setAccessToken(user.accessToken);
      }
    } else {
      api.setAccessToken(null);
    }
  }, [session]);

  const isAuthenticated = !!session;
  const isLoading = status === 'loading';
  const isReady = !isLoading && isAuthenticated;

  return { isAuthenticated, isLoading, isReady };
}

// Cache time constants for better performance
const CACHE_TIMES = {
  SHORT: 2 * 60 * 1000,      // 2 minutes - for frequently changing data
  MEDIUM: 5 * 60 * 1000,     // 5 minutes - for user data
  LONG: 15 * 60 * 1000,      // 15 minutes - for semi-static data
  STATIC: 60 * 60 * 1000,    // 1 hour - for reference data
} as const;

// Project Hooks
export function useProjects(params?: {
  skip?: number;
  limit?: number;
  domain?: string;
  search?: string;
}) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => api.listProjects(params),
    enabled: isReady,
    staleTime: CACHE_TIMES.MEDIUM,
  });
}

export function useProject(projectId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: isReady && !!projectId,
    staleTime: CACHE_TIMES.MEDIUM,
  });
}

export function useProjectStats(projectId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['project', projectId, 'stats'],
    queryFn: () => api.getProjectStats(projectId),
    enabled: isReady && !!projectId,
    staleTime: CACHE_TIMES.SHORT,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (data: ProjectCreate) => api.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: ProjectUpdate }) =>
      api.updateProject(projectId, data),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.setQueryData(['project', project.id], project);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (projectId: string) => api.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDuplicateProject() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: ({ projectId, newName }: { projectId: string; newName?: string }) =>
      api.duplicateProject(projectId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Scenario Hooks
export function useScenarios(params?: {
  project_id?: string;
  skip?: number;
  limit?: number;
  status?: string;
  scenario_type?: string;
}) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['scenarios', params],
    queryFn: () => api.listScenarios(params),
    enabled: isReady && (!params?.project_id || !!params.project_id),
    staleTime: CACHE_TIMES.MEDIUM,
  });
}

export function useScenario(scenarioId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['scenario', scenarioId],
    queryFn: () => api.getScenario(scenarioId),
    enabled: isReady && !!scenarioId,
    staleTime: CACHE_TIMES.MEDIUM,
  });
}

export function useScenariosByProject(projectId: string | null) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['scenarios', { project_id: projectId }],
    queryFn: () => api.listScenarios({ project_id: projectId || undefined }),
    enabled: isReady && !!projectId,
    staleTime: CACHE_TIMES.MEDIUM,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (data: ScenarioCreate) => api.createScenario(data),
    onSuccess: (scenario) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['project', scenario.project_id, 'stats'] });
    },
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: ({ scenarioId, data }: { scenarioId: string; data: ScenarioUpdate }) =>
      api.updateScenario(scenarioId, data),
    onSuccess: (scenario) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.setQueryData(['scenario', scenario.id], scenario);
    },
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (scenarioId: string) => api.deleteScenario(scenarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });
}

export function useValidateScenario() {
  useApiAuth();

  return useMutation({
    mutationFn: (scenarioId: string) => api.validateScenario(scenarioId),
  });
}

// Simulation Hooks
export function useSimulations(params?: {
  scenario_id?: string;
  status?: string;
  skip?: number;
  limit?: number;
}) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['simulations', params],
    queryFn: () => api.listSimulations(params),
    enabled: isReady,
    staleTime: CACHE_TIMES.SHORT,
  });
}

export function useSimulation(runId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['simulation', runId],
    queryFn: () => api.getSimulation(runId),
    enabled: isReady && !!runId,
    refetchInterval: (query) => {
      // Poll every 2 seconds if simulation is running
      const data = query.state.data;
      if (data?.status === 'running' || data?.status === 'pending') {
        return 2000;
      }
      return false;
    },
  });
}

export function useSimulationStats() {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['simulationStats'],
    queryFn: () => api.getSimulationStats(),
    enabled: isReady,
  });
}

export function useCreateSimulation() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (data: SimulationRunCreate) => api.createSimulation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
    },
  });
}

export function useRunSimulation() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (runId: string) => api.runSimulation(runId),
    onSuccess: (simulation) => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      queryClient.setQueryData(['simulation', simulation.id], simulation);
    },
  });
}

export function useCancelSimulation() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (runId: string) => api.cancelSimulation(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
    },
  });
}

export function useSimulationResults(runId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['simulation', runId, 'results'],
    queryFn: () => api.getSimulationResults(runId),
    enabled: isReady && !!runId,
  });
}

export function useAgentResponses(
  runId: string,
  params?: {
    skip?: number;
    limit?: number;
    question_id?: string;
  }
) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['simulation', runId, 'agents', params],
    queryFn: () => api.getAgentResponses(runId, params),
    enabled: isReady && !!runId,
  });
}

export function useExportSimulation() {
  useApiAuth();

  return useMutation({
    mutationFn: ({ runId, format }: { runId: string; format?: 'csv' | 'json' }) =>
      api.exportSimulation(runId, format),
  });
}

// ========== Data Source Hooks ==========

export function useDataSources(params?: {
  skip?: number;
  limit?: number;
  source_type?: string;
}) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['dataSources', params],
    queryFn: () => api.listDataSources(params),
    enabled: isReady,
    staleTime: CACHE_TIMES.LONG,
  });
}

export function useDataSource(dataSourceId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['dataSource', dataSourceId],
    queryFn: () => api.getDataSource(dataSourceId),
    enabled: isReady && !!dataSourceId,
    staleTime: CACHE_TIMES.LONG,
  });
}

export function useCreateDataSource() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (data: DataSourceCreate) => api.createDataSource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] });
    },
  });
}

export function useUpdateDataSource() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: ({ dataSourceId, data }: { dataSourceId: string; data: DataSourceUpdate }) =>
      api.updateDataSource(dataSourceId, data),
    onSuccess: (dataSource) => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] });
      queryClient.setQueryData(['dataSource', dataSource.id], dataSource);
    },
  });
}

export function useDeleteDataSource() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (dataSourceId: string) => api.deleteDataSource(dataSourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] });
    },
  });
}

// ========== Census Data Hooks ==========

export function useUSStates() {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['usStates'],
    queryFn: () => api.getUSStates(),
    enabled: isReady,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour - state list rarely changes
  });
}

export function useCensusDemographics(
  category: 'age' | 'gender' | 'income' | 'education' | 'occupation',
  params?: {
    state?: string;
    county?: string;
    year?: number;
  }
) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['censusDemographics', category, params],
    queryFn: () => api.getCensusDemographics(category, params),
    enabled: isReady,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

export function useCensusProfile(params?: {
  state?: string;
  county?: string;
  year?: number;
}) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['censusProfile', params],
    queryFn: () => api.getCensusProfile(params),
    enabled: isReady,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

export function useSyncCensusData() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (data: { state?: string; county?: string; year?: number }) =>
      api.syncCensusData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] });
      queryClient.invalidateQueries({ queryKey: ['regionalProfiles'] });
    },
  });
}

// ========== Regional Profile Hooks ==========

export function useRegionalProfiles(params?: {
  skip?: number;
  limit?: number;
  region_type?: string;
}) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['regionalProfiles', params],
    queryFn: () => api.listRegionalProfiles(params),
    enabled: isReady,
  });
}

export function useRegionalProfile(regionCode: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['regionalProfile', regionCode],
    queryFn: () => api.getRegionalProfile(regionCode),
    enabled: isReady && !!regionCode,
  });
}

export function useBuildRegionalProfile() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (params: {
      region_code: string;
      region_name: string;
      state?: string;
      county?: string;
    }) => api.buildRegionalProfile(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regionalProfiles'] });
    },
  });
}

// ========== Persona Template Hooks ==========

export function usePersonaTemplates(params?: {
  skip?: number;
  limit?: number;
  region?: string;
  source_type?: string;
}) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['personaTemplates', params],
    queryFn: () => api.listPersonaTemplates(params),
    enabled: isReady,
  });
}

export function usePersonaTemplate(templateId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['personaTemplate', templateId],
    queryFn: () => api.getPersonaTemplate(templateId),
    enabled: isReady && !!templateId,
  });
}

export function useCreatePersonaTemplate() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (data: PersonaTemplateCreate) => api.createPersonaTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personaTemplates'] });
    },
  });
}

export function useDeletePersonaTemplate() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (templateId: string) => api.deletePersonaTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personaTemplates'] });
    },
  });
}

// ========== Persona Generation Hooks ==========

export function usePersonas(templateId: string, params?: { skip?: number; limit?: number }) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['personas', templateId, params],
    queryFn: () => api.listPersonas(templateId, params),
    enabled: isReady && !!templateId,
  });
}

export function useGeneratePersonas() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (data: GeneratePersonasRequest) => api.generatePersonas(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['personaTemplates'] });
      if (result.template_id) {
        queryClient.invalidateQueries({ queryKey: ['personas', result.template_id] });
      }
    },
  });
}

// ========== Persona Upload Hooks ==========

export function useAnalyzePersonaUpload() {
  useApiAuth();

  return useMutation({
    mutationFn: (file: File) => api.analyzePersonaUpload(file),
  });
}

export function useProcessPersonaUpload() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: ({
      file,
      mapping,
      templateId,
    }: {
      file: File;
      mapping: Record<string, string>;
      templateId?: string;
    }) => api.processPersonaUpload(file, mapping, templateId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['personaTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['personaUploads'] });
    },
  });
}

export function usePersonaUploads(params?: { skip?: number; limit?: number }) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['personaUploads', params],
    queryFn: () => api.listPersonaUploads(params),
    enabled: isReady,
  });
}

export function usePersonaUploadTemplateUrl() {
  return api.getPersonaUploadTemplateUrl();
}

// ========== AI Research Hooks ==========

export function useStartAIResearch() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (data: AIResearchRequest) => api.startAIResearch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiResearchJobs'] });
    },
  });
}

export function useAIResearchJob(jobId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['aiResearchJob', jobId],
    queryFn: () => api.getAIResearchJob(jobId),
    enabled: isReady && !!jobId,
    refetchInterval: (query) => {
      // Poll every 3 seconds if job is still running
      const data = query.state.data;
      if (data?.status === 'running' || data?.status === 'pending') {
        return 3000;
      }
      return false;
    },
  });
}

export function useAIResearchJobs(params?: { skip?: number; limit?: number }) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['aiResearchJobs', params],
    queryFn: () => api.listAIResearchJobs(params),
    enabled: isReady,
  });
}

// ========== Region Information Hooks ==========

export function useSupportedRegions() {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['supportedRegions'],
    queryFn: () => api.listSupportedRegions(),
    enabled: isReady,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour - region list rarely changes
  });
}

export function useRegionDemographics(
  regionCode: string,
  params?: {
    country?: string;
    sub_region?: string;
    year?: number;
  }
) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['regionDemographics', regionCode, params],
    queryFn: () => api.getRegionDemographics(regionCode, params),
    enabled: isReady && !!regionCode,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

// ========== Product Hooks ==========

export function useProducts(params?: {
  project_id?: string;
  product_type?: string;
  status?: string;
  skip?: number;
  limit?: number;
}) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.listProducts(params),
    enabled: isReady,
    staleTime: CACHE_TIMES.MEDIUM,
  });
}

export function useProduct(productId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.getProduct(productId),
    enabled: isReady && !!productId,
    staleTime: CACHE_TIMES.MEDIUM,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (data: ProductCreate) => api.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: ProductUpdate }) =>
      api.updateProduct(productId, data),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.setQueryData(['product', product.id], product);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (productId: string) => api.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useProductStats() {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['productStats'],
    queryFn: () => api.getProductStats(),
    enabled: isReady,
    staleTime: CACHE_TIMES.SHORT,
  });
}

export function useProductTypes() {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['productTypes'],
    queryFn: () => api.getProductTypes(),
    enabled: isReady,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Product Runs
export function useProductRuns(productId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['productRuns', productId],
    queryFn: () => api.listProductRuns(productId),
    enabled: isReady && !!productId,
  });
}

export function useCreateProductRun() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: ({ productId, name }: { productId: string; name?: string }) =>
      api.createProductRun(productId, name),
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: ['productRuns', run.product_id] });
      queryClient.invalidateQueries({ queryKey: ['product', run.product_id] });
    },
  });
}

export function useStartProductRun() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: ({ productId, runId }: { productId: string; runId: string }) =>
      api.startProductRun(productId, runId),
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: ['productRuns', run.product_id] });
      queryClient.invalidateQueries({ queryKey: ['product', run.product_id] });
    },
  });
}

export function useCancelProductRun() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: ({ productId, runId }: { productId: string; runId: string }) =>
      api.cancelProductRun(productId, runId),
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: ['productRuns', run.product_id] });
    },
  });
}

// Product Results
export function useProductResults(productId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['productResults', productId],
    queryFn: () => api.listProductResults(productId),
    enabled: isReady && !!productId,
  });
}

export function useProductResult(productId: string, resultId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['productResult', productId, resultId],
    queryFn: () => api.getProductResult(productId, resultId),
    enabled: isReady && !!productId && !!resultId,
  });
}

// ==================== Validation Hooks ====================

// Benchmarks
export function useBenchmarks(params?: {
  category?: string;
  region?: string;
  is_public?: boolean;
}) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['benchmarks', params],
    queryFn: () => api.listBenchmarks(params),
    enabled: isReady,
  });
}

export function useBenchmark(benchmarkId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['benchmark', benchmarkId],
    queryFn: () => api.getBenchmark(benchmarkId),
    enabled: isReady && !!benchmarkId,
  });
}

export function useCreateBenchmark() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (data: BenchmarkCreate) => api.createBenchmark(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
    },
  });
}

export function useDeleteBenchmark() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (benchmarkId: string) => api.deleteBenchmark(benchmarkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
    },
  });
}

export function useSeedElectionBenchmarks() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: () => api.seedElectionBenchmarks(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
    },
  });
}

export function useBenchmarkCategories() {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['benchmarkCategories'],
    queryFn: () => api.getBenchmarkCategories(),
    enabled: isReady,
  });
}

// Validation Records
export function useValidations(params?: {
  product_id?: string;
  benchmark_id?: string;
}) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['validations', params],
    queryFn: () => api.listValidations(params),
    enabled: isReady,
  });
}

export function useValidation(validationId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['validation', validationId],
    queryFn: () => api.getValidation(validationId),
    enabled: isReady && !!validationId,
  });
}

export function useValidatePrediction() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (data: ValidationCreate) => api.validatePrediction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validations'] });
      queryClient.invalidateQueries({ queryKey: ['accuracyStats'] });
    },
  });
}

// Accuracy Stats
export function useAccuracyStats(category?: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['accuracyStats', category],
    queryFn: () => api.getAccuracyStats(category),
    enabled: isReady,
  });
}

export function useGlobalAccuracyStats(category?: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['globalAccuracyStats', category],
    queryFn: () => api.getGlobalAccuracyStats(category),
    enabled: isReady,
  });
}

// ==================== AI Content Generation Hooks ====================

export function useAITemplates(category?: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['aiTemplates', category],
    queryFn: () => api.listAITemplates(category),
    enabled: isReady,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour - templates rarely change
  });
}

export function useAITemplate(templateId: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['aiTemplate', templateId],
    queryFn: () => api.getAITemplate(templateId),
    enabled: isReady && !!templateId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

export function useGenerateAIContent() {
  useApiAuth();

  return useMutation({
    mutationFn: (data: GenerateAIContentRequest) => api.generateAIContent(data),
  });
}

export function useAICategories() {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['aiCategories'],
    queryFn: () => api.getAICategories(),
    enabled: isReady,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// ==================== Marketplace Hooks ====================

import type {
  MarketplaceCategory,
  MarketplaceTemplateListItem,
  MarketplaceTemplateDetail,
  TemplateReview,
  MarketplaceTemplateCreate,
  MarketplaceTemplateUpdate,
  UseTemplateRequest,
} from '@/lib/api';

// Categories
export function useMarketplaceCategories() {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['marketplaceCategories'],
    queryFn: () => api.listMarketplaceCategories(),
    enabled: isReady,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Templates
export function useMarketplaceTemplates(params?: {
  query?: string;
  category_id?: string;
  category_slug?: string;
  scenario_type?: string;
  tags?: string;
  author_id?: string;
  is_featured?: boolean;
  is_verified?: boolean;
  is_premium?: boolean;
  min_rating?: number;
  min_usage?: number;
  sort_by?: 'popular' | 'newest' | 'rating' | 'usage' | 'name';
  page?: number;
  page_size?: number;
}) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['marketplaceTemplates', params],
    queryFn: () => api.listMarketplaceTemplates(params),
    enabled: isReady,
    staleTime: CACHE_TIMES.SHORT, // Marketplace can change frequently
  });
}

export function useFeaturedTemplates() {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['featuredTemplates'],
    queryFn: () => api.getFeaturedTemplates(),
    enabled: isReady,
    staleTime: CACHE_TIMES.MEDIUM, // Featured don't change as often
  });
}

export function useMarketplaceTemplate(slug: string) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['marketplaceTemplate', slug],
    queryFn: () => api.getMarketplaceTemplate(slug),
    enabled: isReady && !!slug,
    staleTime: CACHE_TIMES.MEDIUM,
  });
}

export function useMyTemplates(params?: { page?: number; page_size?: number }) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['myTemplates', params],
    queryFn: () => api.listMyTemplates(params),
    enabled: isReady,
    staleTime: CACHE_TIMES.MEDIUM,
  });
}

export function useCreateMarketplaceTemplate() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (data: MarketplaceTemplateCreate) => api.createMarketplaceTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['myTemplates'] });
    },
  });
}

export function useUpdateMarketplaceTemplate() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: MarketplaceTemplateUpdate }) =>
      api.updateMarketplaceTemplate(templateId, data),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['myTemplates'] });
      queryClient.setQueryData(['marketplaceTemplate', template.slug], template);
    },
  });
}

export function useDeleteMarketplaceTemplate() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (templateId: string) => api.deleteMarketplaceTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['myTemplates'] });
    },
  });
}

export function useUseMarketplaceTemplate() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: UseTemplateRequest }) =>
      api.useMarketplaceTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceTemplate'] });
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Likes
export function useToggleTemplateLike() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: (templateId: string) => api.toggleTemplateLike(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceTemplate'] });
    },
  });
}

// Reviews
export function useTemplateReviews(templateId: string, params?: { page?: number; page_size?: number; limit?: number }) {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['templateReviews', templateId, params],
    queryFn: () => api.listTemplateReviews(templateId, params),
    enabled: isReady && !!templateId,
    staleTime: CACHE_TIMES.SHORT,
  });
}

export function useCreateTemplateReview() {
  const queryClient = useQueryClient();
  useApiAuth();

  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string;
      data: { rating: number; title?: string; content?: string };
    }) => api.createTemplateReview(templateId, data),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: ['templateReviews', templateId] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceTemplate'] });
    },
  });
}

// Marketplace Stats
export function useMarketplaceStats() {
  const { isReady } = useApiAuth();

  return useQuery({
    queryKey: ['marketplaceStats'],
    queryFn: () => api.getMarketplaceStats(),
    enabled: isReady,
    staleTime: CACHE_TIMES.MEDIUM,
  });
}
