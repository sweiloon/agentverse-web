/**
 * API Client for AgentVerse Backend
 */

// Use empty string for relative URLs (production), fallback to localhost only if undefined
const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined
  ? process.env.NEXT_PUBLIC_API_URL
  : 'http://localhost:8000';

export interface ApiError {
  detail: string;
  status: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  company?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  role: string;
  tier: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description: string | null;
  domain: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  domain: string;
  settings?: Record<string, unknown>;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  domain?: string;
  settings?: Record<string, unknown>;
}

export interface ProjectStats {
  project_id: string;
  scenario_count: number;
  simulation_count: number;
  total_cost_usd: number;
}

// Scenario Types
export interface Question {
  id: string;
  text: string;
  type: 'open_ended' | 'multiple_choice' | 'yes_no' | 'scale';
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  required?: boolean;
}

export interface Demographics {
  age_distribution?: Record<string, number>;
  gender_distribution?: Record<string, number>;
  income_distribution?: Record<string, number>;
  education_distribution?: Record<string, number>;
  region_distribution?: Record<string, number>;
}

export interface Scenario {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  scenario_type: string;
  context: string;
  questions: Question[];
  variables: Record<string, unknown>;
  population_size: number;
  demographics: Demographics;
  persona_template: Record<string, unknown> | null;
  model_config_json: Record<string, unknown>;
  simulation_mode: string;
  status: 'draft' | 'ready' | 'running' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ScenarioCreate {
  project_id: string;
  name: string;
  description?: string;
  scenario_type: string;
  context: string;
  questions: Question[];
  variables?: Record<string, unknown>;
  population_size: number;
  demographics: Demographics;
  persona_template?: Record<string, unknown>;
  model_config_json?: Record<string, unknown>;
  simulation_mode?: string;
}

export interface ScenarioUpdate {
  name?: string;
  description?: string;
  context?: string;
  questions?: Question[];
  variables?: Record<string, unknown>;
  population_size?: number;
  demographics?: Demographics;
  persona_template?: Record<string, unknown>;
  model_config_json?: Record<string, unknown>;
  simulation_mode?: string;
  status?: string;
}

export interface ScenarioValidation {
  scenario_id: string;
  is_valid: boolean;
  status: string;
  errors: string[];
  warnings: string[];
}

// Simulation Types
export interface SimulationRun {
  id: string;
  scenario_id: string;
  user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  agent_count: number;
  model_used: string;
  run_config: Record<string, unknown>;
  results_summary: ResultsSummary | null;
  confidence_score: number | null;
  tokens_used: number;
  cost_usd: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface SimulationRunCreate {
  scenario_id: string;
  agent_count: number;
  model_used?: string;
  run_config?: Record<string, unknown>;
}

export interface ResultsSummary {
  total_agents: number;
  response_distribution: Record<string, number>;
  response_percentages: Record<string, number>;
  demographics_breakdown: Record<string, Record<string, Record<string, number>>>;
  confidence_score: number;
  top_response: string | null;
}

export interface AgentResponse {
  id: string;
  run_id: string;
  agent_index: number;
  persona: {
    demographics: Record<string, unknown>;
    psychographics: Record<string, unknown>;
  };
  question_id: string | null;
  response: Record<string, unknown>;
  reasoning: string | null;
  tokens_used: number;
  response_time_ms: number;
  model_used: string;
}

export interface SimulationStats {
  total_runs: number;
  completed_runs: number;
  total_agents_simulated: number;
  total_cost_usd: number;
  total_tokens_used: number;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  // Request deduplication map - prevents duplicate concurrent requests
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  // Request abort controllers for cancellation
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Generate cache key for request deduplication
  private getRequestKey(endpoint: string, options: RequestInit = {}): string {
    return `${options.method || 'GET'}:${endpoint}:${options.body || ''}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    deduplicate = true
  ): Promise<T> {
    const requestKey = this.getRequestKey(endpoint, options);

    // For GET requests, check if there's already a pending request
    if (deduplicate && (!options.method || options.method === 'GET')) {
      const pendingRequest = this.pendingRequests.get(requestKey);
      if (pendingRequest) {
        return pendingRequest as Promise<T>;
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Create abort controller for this request
    const abortController = new AbortController();
    this.abortControllers.set(requestKey, abortController);

    const requestPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
          signal: abortController.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
          throw {
            detail: error.detail || 'An error occurred',
            status: response.status,
          } as ApiError;
        }

        return response.json();
      } catch (error: unknown) {
        // Handle network errors (API unavailable, connection refused, etc.)
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw {
            detail: 'Unable to connect to server. Please check your connection and try again.',
            status: 0,
          } as ApiError;
        }
        // Handle abort errors
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw {
            detail: 'Request was cancelled',
            status: 0,
          } as ApiError;
        }
        // Re-throw ApiError
        if (error && typeof error === 'object' && 'detail' in error) {
          throw error;
        }
        // Handle other network errors
        throw {
          detail: 'Network error. Please check your connection and try again.',
          status: 0,
        } as ApiError;
      } finally {
        // Clean up after request completes
        this.pendingRequests.delete(requestKey);
        this.abortControllers.delete(requestKey);
      }
    })();

    // Store pending request for deduplication
    if (deduplicate && (!options.method || options.method === 'GET')) {
      this.pendingRequests.set(requestKey, requestPromise);
    }

    return requestPromise;
  }

  // Cancel all pending requests (useful on logout or navigation)
  cancelAllRequests() {
    this.abortControllers.forEach(controller => controller.abort());
    this.pendingRequests.clear();
    this.abortControllers.clear();
  }

  // Health check - returns true if API is available
  // Always uses relative URL to go through Next.js rewrites (avoids Mixed Content on HTTPS)
  async checkHealth(): Promise<{ healthy: boolean; version?: string; error?: string }> {
    try {
      // Always use relative path to go through Next.js rewrites
      // This avoids Mixed Content errors when site is served over HTTPS
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return { healthy: true, version: data.version };
      }
      return { healthy: false, error: `Server returned ${response.status}` };
    } catch {
      return { healthy: false, error: 'Unable to connect to server' };
    }
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<TokenResponse> {
    return this.request<TokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<UserResponse> {
    return this.request<UserResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/api/v1/auth/me');
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    return this.request<TokenResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async logout(): Promise<void> {
    await this.request('/api/v1/auth/logout', {
      method: 'POST',
    });
  }

  // Project endpoints
  async listProjects(params?: {
    skip?: number;
    limit?: number;
    domain?: string;
    search?: string;
  }): Promise<Project[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', String(params.skip));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.domain) searchParams.set('domain', params.domain);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<Project[]>(`/api/v1/projects${query ? `?${query}` : ''}`);
  }

  async createProject(data: ProjectCreate): Promise<Project> {
    return this.request<Project>('/api/v1/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProject(projectId: string): Promise<Project> {
    return this.request<Project>(`/api/v1/projects/${projectId}`);
  }

  async updateProject(projectId: string, data: ProjectUpdate): Promise<Project> {
    return this.request<Project>(`/api/v1/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(projectId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async duplicateProject(projectId: string, newName?: string): Promise<Project> {
    const params = newName ? `?new_name=${encodeURIComponent(newName)}` : '';
    return this.request<Project>(`/api/v1/projects/${projectId}/duplicate${params}`, {
      method: 'POST',
    });
  }

  async getProjectStats(projectId: string): Promise<ProjectStats> {
    return this.request<ProjectStats>(`/api/v1/projects/${projectId}/stats`);
  }

  // Scenario endpoints
  async listScenarios(params?: {
    project_id?: string;
    skip?: number;
    limit?: number;
    status?: string;
    scenario_type?: string;
  }): Promise<Scenario[]> {
    const searchParams = new URLSearchParams();
    if (params?.project_id) searchParams.set('project_id', params.project_id);
    if (params?.skip) searchParams.set('skip', String(params.skip));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status_filter', params.status);
    if (params?.scenario_type) searchParams.set('scenario_type', params.scenario_type);

    const query = searchParams.toString();
    return this.request<Scenario[]>(`/api/v1/scenarios${query ? `?${query}` : ''}`);
  }

  async createScenario(data: ScenarioCreate): Promise<Scenario> {
    return this.request<Scenario>('/api/v1/scenarios/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScenario(scenarioId: string): Promise<Scenario> {
    return this.request<Scenario>(`/api/v1/scenarios/${scenarioId}`);
  }

  async updateScenario(scenarioId: string, data: ScenarioUpdate): Promise<Scenario> {
    return this.request<Scenario>(`/api/v1/scenarios/${scenarioId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteScenario(scenarioId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/scenarios/${scenarioId}`, {
      method: 'DELETE',
    });
  }

  async duplicateScenario(
    scenarioId: string,
    newName?: string,
    targetProjectId?: string
  ): Promise<Scenario> {
    const params = new URLSearchParams();
    if (newName) params.set('new_name', newName);
    if (targetProjectId) params.set('target_project_id', targetProjectId);
    const query = params.toString();

    return this.request<Scenario>(`/api/v1/scenarios/${scenarioId}/duplicate${query ? `?${query}` : ''}`, {
      method: 'POST',
    });
  }

  async validateScenario(scenarioId: string): Promise<ScenarioValidation> {
    return this.request<ScenarioValidation>(`/api/v1/scenarios/${scenarioId}/validate`, {
      method: 'POST',
    });
  }

  // Simulation endpoints
  async listSimulations(params?: {
    scenario_id?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<SimulationRun[]> {
    const searchParams = new URLSearchParams();
    if (params?.scenario_id) searchParams.set('scenario_id', params.scenario_id);
    if (params?.status) searchParams.set('status_filter', params.status);
    if (params?.skip) searchParams.set('skip', String(params.skip));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    return this.request<SimulationRun[]>(`/api/v1/simulations${query ? `?${query}` : ''}`);
  }

  async createSimulation(data: SimulationRunCreate): Promise<SimulationRun> {
    return this.request<SimulationRun>('/api/v1/simulations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSimulation(runId: string): Promise<SimulationRun> {
    return this.request<SimulationRun>(`/api/v1/simulations/${runId}`);
  }

  async runSimulation(runId: string): Promise<SimulationRun> {
    return this.request<SimulationRun>(`/api/v1/simulations/${runId}/run`, {
      method: 'POST',
    });
  }

  async cancelSimulation(runId: string): Promise<{ message: string; run_id: string }> {
    return this.request<{ message: string; run_id: string }>(`/api/v1/simulations/${runId}/cancel`, {
      method: 'POST',
    });
  }

  async getSimulationResults(runId: string): Promise<{
    run_id: string;
    scenario_id: string;
    status: string;
    agent_count: number;
    model_used: string;
    results_summary: ResultsSummary;
    confidence_score: number;
    tokens_used: number;
    cost_usd: number;
    started_at: string | null;
    completed_at: string | null;
    duration_seconds: number | null;
  }> {
    return this.request(`/api/v1/simulations/${runId}/results`);
  }

  async getAgentResponses(
    runId: string,
    params?: {
      skip?: number;
      limit?: number;
      question_id?: string;
    }
  ): Promise<AgentResponse[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', String(params.skip));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.question_id) searchParams.set('question_id', params.question_id);

    const query = searchParams.toString();
    return this.request<AgentResponse[]>(`/api/v1/simulations/${runId}/agents${query ? `?${query}` : ''}`);
  }

  async exportSimulation(
    runId: string,
    format: 'csv' | 'json' | 'xlsx' = 'csv'
  ): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/v1/simulations/${runId}/export?format=${format}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Export failed' }));
      throw { detail: error.detail || 'Export failed', status: response.status };
    }

    return response.blob();
  }

  getExportUrl(runId: string, format: 'csv' | 'json' | 'xlsx' = 'csv'): string {
    return `${this.baseUrl}/api/v1/simulations/${runId}/export?format=${format}`;
  }

  async getSimulationStats(): Promise<SimulationStats> {
    return this.request<SimulationStats>('/api/v1/simulations/stats/overview');
  }

  // Stream simulation progress (SSE)
  streamSimulation(runId: string, token: string): EventSource {
    const url = `${this.baseUrl}/api/v1/simulations/${runId}/stream`;
    const eventSource = new EventSource(url);
    return eventSource;
  }

  // Get authorization headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  // ========== Data Source Endpoints ==========

  async listDataSources(params?: {
    skip?: number;
    limit?: number;
    source_type?: string;
  }): Promise<DataSource[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', String(params.skip));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.source_type) searchParams.set('source_type', params.source_type);

    const query = searchParams.toString();
    return this.request<DataSource[]>(`/api/v1/data-sources${query ? `?${query}` : ''}`);
  }

  async getDataSource(dataSourceId: string): Promise<DataSource> {
    return this.request<DataSource>(`/api/v1/data-sources/${dataSourceId}`);
  }

  async createDataSource(data: DataSourceCreate): Promise<DataSource> {
    return this.request<DataSource>('/api/v1/data-sources/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDataSource(dataSourceId: string, data: DataSourceUpdate): Promise<DataSource> {
    return this.request<DataSource>(`/api/v1/data-sources/${dataSourceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDataSource(dataSourceId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/data-sources/${dataSourceId}`, {
      method: 'DELETE',
    });
  }

  // Census Data Endpoints
  async getUSStates(): Promise<Record<string, string>> {
    return this.request<Record<string, string>>('/api/v1/data-sources/census/states');
  }

  async getCensusDemographics(
    category: 'age' | 'gender' | 'income' | 'education' | 'occupation',
    params?: {
      state?: string;
      county?: string;
      year?: number;
    }
  ): Promise<DemographicDistribution> {
    const searchParams = new URLSearchParams();
    if (params?.state) searchParams.set('state', params.state);
    if (params?.county) searchParams.set('county', params.county);
    if (params?.year) searchParams.set('year', String(params.year));

    const query = searchParams.toString();
    return this.request<DemographicDistribution>(
      `/api/v1/data-sources/census/demographics/${category}${query ? `?${query}` : ''}`
    );
  }

  async getCensusProfile(params?: {
    state?: string;
    county?: string;
    year?: number;
  }): Promise<CensusProfile> {
    const searchParams = new URLSearchParams();
    if (params?.state) searchParams.set('state', params.state);
    if (params?.county) searchParams.set('county', params.county);
    if (params?.year) searchParams.set('year', String(params.year));

    const query = searchParams.toString();
    return this.request<CensusProfile>(
      `/api/v1/data-sources/census/profile${query ? `?${query}` : ''}`
    );
  }

  async syncCensusData(data: {
    state?: string;
    county?: string;
    year?: number;
  }): Promise<CensusSyncResult> {
    return this.request<CensusSyncResult>('/api/v1/data-sources/census/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Regional Profile Endpoints
  async listRegionalProfiles(params?: {
    skip?: number;
    limit?: number;
    region_type?: string;
  }): Promise<RegionalProfile[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', String(params.skip));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.region_type) searchParams.set('region_type', params.region_type);

    const query = searchParams.toString();
    return this.request<RegionalProfile[]>(`/api/v1/data-sources/profiles/${query ? `?${query}` : ''}`);
  }

  async getRegionalProfile(regionCode: string): Promise<RegionalProfile> {
    return this.request<RegionalProfile>(`/api/v1/data-sources/profiles/${regionCode}`);
  }

  async buildRegionalProfile(params: {
    region_code: string;
    region_name: string;
    state?: string;
    county?: string;
  }): Promise<RegionalProfileBuildResult> {
    const searchParams = new URLSearchParams();
    searchParams.set('region_code', params.region_code);
    searchParams.set('region_name', params.region_name);
    if (params.state) searchParams.set('state', params.state);
    if (params.county) searchParams.set('county', params.county);

    return this.request<RegionalProfileBuildResult>(
      `/api/v1/data-sources/profiles/build?${searchParams.toString()}`,
      { method: 'POST' }
    );
  }

  // ========== Persona Endpoints ==========

  // Template Management
  async listPersonaTemplates(params?: {
    skip?: number;
    limit?: number;
    region?: string;
    source_type?: string;
  }): Promise<PersonaTemplate[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', String(params.skip));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.region) searchParams.set('region', params.region);
    if (params?.source_type) searchParams.set('source_type', params.source_type);

    const query = searchParams.toString();
    return this.request<PersonaTemplate[]>(`/api/v1/personas/templates${query ? `?${query}` : ''}`);
  }

  async createPersonaTemplate(data: PersonaTemplateCreate): Promise<PersonaTemplate> {
    return this.request<PersonaTemplate>('/api/v1/personas/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPersonaTemplate(templateId: string): Promise<PersonaTemplate> {
    return this.request<PersonaTemplate>(`/api/v1/personas/templates/${templateId}`);
  }

  async deletePersonaTemplate(templateId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/personas/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  // Persona Generation
  async generatePersonas(data: GeneratePersonasRequest): Promise<GeneratePersonasResponse> {
    return this.request<GeneratePersonasResponse>('/api/v1/personas/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listPersonas(
    templateId: string,
    params?: { skip?: number; limit?: number }
  ): Promise<PersonaRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', String(params.skip));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    return this.request<PersonaRecord[]>(
      `/api/v1/personas/templates/${templateId}/personas${query ? `?${query}` : ''}`
    );
  }

  // File Upload
  async analyzePersonaUpload(file: File): Promise<FileAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/v1/personas/upload/analyze`, {
      method: 'POST',
      headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
      throw { detail: error.detail, status: response.status };
    }

    return response.json();
  }

  async processPersonaUpload(
    file: File,
    mapping: Record<string, string>,
    templateId?: string
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    if (templateId) formData.append('template_id', templateId);

    const response = await fetch(`${this.baseUrl}/api/v1/personas/upload/process`, {
      method: 'POST',
      headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw { detail: error.detail, status: response.status };
    }

    return response.json();
  }

  getPersonaUploadTemplateUrl(): string {
    return `${this.baseUrl}/api/v1/personas/upload/template`;
  }

  async listPersonaUploads(params?: {
    skip?: number;
    limit?: number;
  }): Promise<Record<string, unknown>[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', String(params.skip));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    return this.request<Record<string, unknown>[]>(`/api/v1/personas/uploads${query ? `?${query}` : ''}`);
  }

  // AI Research
  async startAIResearch(data: AIResearchRequest): Promise<AIResearchJob> {
    return this.request<AIResearchJob>('/api/v1/personas/research', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAIResearchJob(jobId: string): Promise<AIResearchJob> {
    return this.request<AIResearchJob>(`/api/v1/personas/research/${jobId}`);
  }

  async listAIResearchJobs(params?: {
    skip?: number;
    limit?: number;
  }): Promise<AIResearchJob[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', String(params.skip));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    return this.request<AIResearchJob[]>(`/api/v1/personas/research${query ? `?${query}` : ''}`);
  }

  // Region Information
  async listSupportedRegions(): Promise<RegionInfo[]> {
    return this.request<RegionInfo[]>('/api/v1/personas/regions');
  }

  async getRegionDemographics(
    regionCode: string,
    params?: {
      country?: string;
      sub_region?: string;
      year?: number;
    }
  ): Promise<Record<string, unknown>> {
    const searchParams = new URLSearchParams();
    if (params?.country) searchParams.set('country', params.country);
    if (params?.sub_region) searchParams.set('sub_region', params.sub_region);
    if (params?.year) searchParams.set('year', String(params.year));

    const query = searchParams.toString();
    return this.request<Record<string, unknown>>(
      `/api/v1/personas/regions/${regionCode}/demographics${query ? `?${query}` : ''}`
    );
  }

  // ========== Product Endpoints ==========

  async listProducts(params?: {
    project_id?: string;
    product_type?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.project_id) searchParams.set('project_id', params.project_id);
    if (params?.product_type) searchParams.set('product_type', params.product_type);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.skip) searchParams.set('skip', String(params.skip));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    return this.request<Product[]>(`/api/v1/products${query ? `?${query}` : ''}`);
  }

  async createProduct(data: ProductCreate): Promise<Product> {
    return this.request<Product>('/api/v1/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProduct(productId: string): Promise<Product> {
    return this.request<Product>(`/api/v1/products/${productId}`);
  }

  async updateProduct(productId: string, data: ProductUpdate): Promise<Product> {
    return this.request<Product>(`/api/v1/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(productId: string): Promise<void> {
    return this.request<void>(`/api/v1/products/${productId}`, {
      method: 'DELETE',
    });
  }

  async getProductStats(): Promise<ProductStats> {
    return this.request<ProductStats>('/api/v1/products/stats');
  }

  async getProductTypes(): Promise<ProductTypesResponse> {
    return this.request<ProductTypesResponse>('/api/v1/products/types');
  }

  // Product Runs
  async listProductRuns(productId: string): Promise<ProductRun[]> {
    return this.request<ProductRun[]>(`/api/v1/products/${productId}/runs`);
  }

  async createProductRun(productId: string, name?: string): Promise<ProductRun> {
    return this.request<ProductRun>(`/api/v1/products/${productId}/runs`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async startProductRun(productId: string, runId: string): Promise<ProductRun> {
    return this.request<ProductRun>(`/api/v1/products/${productId}/runs/${runId}/start`, {
      method: 'POST',
    });
  }

  async cancelProductRun(productId: string, runId: string): Promise<ProductRun> {
    return this.request<ProductRun>(`/api/v1/products/${productId}/runs/${runId}/cancel`, {
      method: 'POST',
    });
  }

  // Product Results
  async listProductResults(productId: string): Promise<ProductResult[]> {
    return this.request<ProductResult[]>(`/api/v1/products/${productId}/results`);
  }

  async getProductResult(productId: string, resultId: string): Promise<ProductResult> {
    return this.request<ProductResult>(`/api/v1/products/${productId}/results/${resultId}`);
  }

  // Product Comparison & Analytics
  async compareProducts(productIds: string[], metrics?: string[]): Promise<ComparisonResponse> {
    return this.request<ComparisonResponse>('/api/v1/products/compare', {
      method: 'POST',
      body: JSON.stringify({
        product_ids: productIds,
        metrics: metrics || ['sentiment', 'demographics', 'purchase_likelihood'],
      }),
    });
  }

  async getProductTrends(productId: string): Promise<ProductTrendsResponse> {
    return this.request<ProductTrendsResponse>(`/api/v1/products/${productId}/trends`);
  }

  // ========== Validation ==========

  // Benchmarks
  async listBenchmarks(params?: {
    category?: string;
    region?: string;
    is_public?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Benchmark[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.region) queryParams.append('region', params.region);
    if (params?.is_public !== undefined) queryParams.append('is_public', String(params.is_public));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));
    const query = queryParams.toString();
    return this.request<Benchmark[]>(`/api/v1/validation/benchmarks${query ? `?${query}` : ''}`);
  }

  async getBenchmark(benchmarkId: string): Promise<Benchmark> {
    return this.request<Benchmark>(`/api/v1/validation/benchmarks/${benchmarkId}`);
  }

  async createBenchmark(data: BenchmarkCreate): Promise<Benchmark> {
    return this.request<Benchmark>('/api/v1/validation/benchmarks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteBenchmark(benchmarkId: string): Promise<void> {
    return this.request<void>(`/api/v1/validation/benchmarks/${benchmarkId}`, {
      method: 'DELETE',
    });
  }

  async seedElectionBenchmarks(): Promise<{ status: string; message: string; benchmarks: Array<{ id: string; name: string }> }> {
    return this.request('/api/v1/validation/benchmarks/seed-elections', {
      method: 'POST',
    });
  }

  async getBenchmarkCategories(): Promise<{ categories: BenchmarkCategory[] }> {
    return this.request('/api/v1/validation/categories');
  }

  // Validation Records
  async listValidations(params?: {
    product_id?: string;
    benchmark_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<ValidationRecord[]> {
    const queryParams = new URLSearchParams();
    if (params?.product_id) queryParams.append('product_id', params.product_id);
    if (params?.benchmark_id) queryParams.append('benchmark_id', params.benchmark_id);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));
    const query = queryParams.toString();
    return this.request<ValidationRecord[]>(`/api/v1/validation/records${query ? `?${query}` : ''}`);
  }

  async getValidation(validationId: string): Promise<ValidationRecord> {
    return this.request<ValidationRecord>(`/api/v1/validation/records/${validationId}`);
  }

  async validatePrediction(data: ValidationCreate): Promise<ValidationRecord> {
    return this.request<ValidationRecord>('/api/v1/validation/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Accuracy Stats
  async getAccuracyStats(category?: string): Promise<AccuracyStats> {
    const query = category ? `?category=${category}` : '';
    return this.request<AccuracyStats>(`/api/v1/validation/stats${query}`);
  }

  async getGlobalAccuracyStats(category?: string): Promise<AccuracyStats> {
    const query = category ? `?category=${category}` : '';
    return this.request<AccuracyStats>(`/api/v1/validation/stats/global${query}`);
  }

  // ========== AI Content Generation ==========

  async listAITemplates(category?: string): Promise<AITemplateListResponse> {
    const query = category ? `?category=${category}` : '';
    return this.request<AITemplateListResponse>(`/api/v1/ai/templates${query}`);
  }

  async getAITemplate(templateId: string): Promise<AIContentTemplate> {
    return this.request<AIContentTemplate>(`/api/v1/ai/templates/${templateId}`);
  }

  async generateAIContent(data: GenerateAIContentRequest): Promise<GenerateAIContentResponse> {
    return this.request<GenerateAIContentResponse>('/api/v1/ai/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAICategories(): Promise<{ categories: AICategory[] }> {
    return this.request<{ categories: AICategory[] }>('/api/v1/ai/categories');
  }

  // ========== Focus Group Endpoints ==========

  async listFocusGroupSessions(params?: {
    product_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<FocusGroupSession[]> {
    const searchParams = new URLSearchParams();
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return this.request<FocusGroupSession[]>(`/api/v1/focus-groups/sessions${query ? `?${query}` : ''}`);
  }

  async createFocusGroupSession(data: FocusGroupSessionCreate): Promise<FocusGroupSession> {
    return this.request<FocusGroupSession>('/api/v1/focus-groups/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFocusGroupSession(sessionId: string): Promise<FocusGroupSession> {
    return this.request<FocusGroupSession>(`/api/v1/focus-groups/sessions/${sessionId}`);
  }

  async updateFocusGroupSession(sessionId: string, data: FocusGroupSessionUpdate): Promise<FocusGroupSession> {
    return this.request<FocusGroupSession>(`/api/v1/focus-groups/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async endFocusGroupSession(sessionId: string): Promise<FocusGroupSession> {
    return this.request<FocusGroupSession>(`/api/v1/focus-groups/sessions/${sessionId}/end`, {
      method: 'POST',
    });
  }

  async interviewAgent(sessionId: string, data: InterviewRequest): Promise<InterviewResponse> {
    return this.request<InterviewResponse>(`/api/v1/focus-groups/sessions/${sessionId}/interview`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  streamInterviewAgent(sessionId: string, data: InterviewRequest): EventSource | null {
    if (typeof window === 'undefined') return null;

    // For streaming, we need to use fetch with event source
    // This is a simplified version - in production you'd want proper SSE handling
    const url = `${this.baseUrl}/api/v1/focus-groups/sessions/${sessionId}/interview/stream`;
    return null; // Will be handled by custom hook
  }

  async groupDiscussion(sessionId: string, data: GroupDiscussionRequest): Promise<GroupDiscussionResponse> {
    return this.request<GroupDiscussionResponse>(`/api/v1/focus-groups/sessions/${sessionId}/discuss`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFocusGroupMessages(sessionId: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<FocusGroupMessage[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return this.request<FocusGroupMessage[]>(`/api/v1/focus-groups/sessions/${sessionId}/messages${query ? `?${query}` : ''}`);
  }

  async getSessionSummary(sessionId: string): Promise<SessionSummaryResponse> {
    return this.request<SessionSummaryResponse>(`/api/v1/focus-groups/sessions/${sessionId}/summary`, {
      method: 'POST',
      body: JSON.stringify({ include_quotes: true, include_themes: true, include_sentiment: true }),
    });
  }

  async getAvailableAgents(productId: string, runId?: string): Promise<AvailableAgent[]> {
    const query = runId ? `?run_id=${runId}` : '';
    return this.request<AvailableAgent[]>(`/api/v1/focus-groups/products/${productId}/available-agents${query}`);
  }

  getStreamInterviewUrl(sessionId: string): string {
    return `${this.baseUrl}/api/v1/focus-groups/sessions/${sessionId}/interview/stream`;
  }

  // ========== Marketplace Endpoints ==========

  async listMarketplaceCategories(includeInactive?: boolean): Promise<MarketplaceCategory[]> {
    const query = includeInactive ? '?include_inactive=true' : '';
    return this.request<MarketplaceCategory[]>(`/api/v1/marketplace/categories${query}`);
  }

  async getMarketplaceCategoryTree(): Promise<MarketplaceCategoryWithChildren[]> {
    return this.request<MarketplaceCategoryWithChildren[]>('/api/v1/marketplace/categories/tree');
  }

  async createMarketplaceCategory(data: MarketplaceCategoryCreate): Promise<MarketplaceCategory> {
    return this.request<MarketplaceCategory>('/api/v1/marketplace/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMarketplaceCategory(categoryId: string, data: MarketplaceCategoryUpdate): Promise<MarketplaceCategory> {
    return this.request<MarketplaceCategory>(`/api/v1/marketplace/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async listMarketplaceTemplates(params?: {
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
  }): Promise<MarketplaceTemplateListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set('query', params.query);
    if (params?.category_id) searchParams.set('category_id', params.category_id);
    if (params?.category_slug) searchParams.set('category_slug', params.category_slug);
    if (params?.scenario_type) searchParams.set('scenario_type', params.scenario_type);
    if (params?.tags) searchParams.set('tags', params.tags);
    if (params?.author_id) searchParams.set('author_id', params.author_id);
    if (params?.is_featured !== undefined) searchParams.set('is_featured', String(params.is_featured));
    if (params?.is_verified !== undefined) searchParams.set('is_verified', String(params.is_verified));
    if (params?.is_premium !== undefined) searchParams.set('is_premium', String(params.is_premium));
    if (params?.min_rating) searchParams.set('min_rating', String(params.min_rating));
    if (params?.min_usage) searchParams.set('min_usage', String(params.min_usage));
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));

    const query = searchParams.toString();
    return this.request<MarketplaceTemplateListResponse>(`/api/v1/marketplace/templates${query ? `?${query}` : ''}`);
  }

  async getFeaturedTemplates(): Promise<FeaturedTemplatesResponse> {
    return this.request<FeaturedTemplatesResponse>('/api/v1/marketplace/templates/featured');
  }

  async getMarketplaceTemplate(slug: string): Promise<MarketplaceTemplateDetail> {
    return this.request<MarketplaceTemplateDetail>(`/api/v1/marketplace/templates/${slug}`);
  }

  async createMarketplaceTemplate(data: MarketplaceTemplateCreate): Promise<MarketplaceTemplateDetail> {
    return this.request<MarketplaceTemplateDetail>('/api/v1/marketplace/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createMarketplaceTemplateFromScenario(data: MarketplaceTemplateFromScenario): Promise<MarketplaceTemplateDetail> {
    return this.request<MarketplaceTemplateDetail>('/api/v1/marketplace/templates/from-scenario', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMarketplaceTemplate(templateId: string, data: MarketplaceTemplateUpdate): Promise<MarketplaceTemplateDetail> {
    return this.request<MarketplaceTemplateDetail>(`/api/v1/marketplace/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMarketplaceTemplate(templateId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/marketplace/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  async listMyTemplates(params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<MarketplaceTemplateListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status_filter', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));

    const query = searchParams.toString();
    return this.request<MarketplaceTemplateListResponse>(`/api/v1/marketplace/my-templates${query ? `?${query}` : ''}`);
  }

  async useMarketplaceTemplate(templateId: string, data: UseTemplateRequest): Promise<UseTemplateResponse> {
    return this.request<UseTemplateResponse>(`/api/v1/marketplace/templates/${templateId}/use`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleTemplateLike(templateId: string): Promise<{ liked: boolean; like_count: number }> {
    return this.request<{ liked: boolean; like_count: number }>(`/api/v1/marketplace/templates/${templateId}/like`, {
      method: 'POST',
    });
  }

  async listTemplateReviews(templateId: string, params?: {
    page?: number;
    page_size?: number;
  }): Promise<TemplateReviewListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));

    const query = searchParams.toString();
    return this.request<TemplateReviewListResponse>(`/api/v1/marketplace/templates/${templateId}/reviews${query ? `?${query}` : ''}`);
  }

  async createTemplateReview(templateId: string, data: TemplateReviewCreate): Promise<TemplateReview> {
    return this.request<TemplateReview>(`/api/v1/marketplace/templates/${templateId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplateReview(templateId: string, data: TemplateReviewUpdate): Promise<TemplateReview> {
    return this.request<TemplateReview>(`/api/v1/marketplace/templates/${templateId}/reviews`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplateReview(templateId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/marketplace/templates/${templateId}/reviews`, {
      method: 'DELETE',
    });
  }

  async getMarketplaceStats(): Promise<MarketplaceStats> {
    return this.request<MarketplaceStats>('/api/v1/marketplace/stats');
  }

  async getAuthorStats(authorId: string): Promise<AuthorStats> {
    return this.request<AuthorStats>(`/api/v1/marketplace/authors/${authorId}/stats`);
  }

  // ========== Vi World Endpoints ==========

  async getWorldByTemplate(templateId: string): Promise<WorldState> {
    return this.request<WorldState>(`/api/v1/world/by-template/${templateId}`);
  }

  async getWorld(worldId: string): Promise<WorldState> {
    return this.request<WorldState>(`/api/v1/world/${worldId}`);
  }

  async autoCreateWorld(templateId: string): Promise<WorldState> {
    return this.request<WorldState>(`/api/v1/world/auto-create/${templateId}`, {
      method: 'POST',
    });
  }

  async controlWorld(worldId: string, action: 'start' | 'pause' | 'resume' | 'stop' | 'reset', simulationSpeed?: number): Promise<WorldState> {
    return this.request<WorldState>(`/api/v1/world/${worldId}/control`, {
      method: 'POST',
      body: JSON.stringify({ action, simulation_speed: simulationSpeed }),
    });
  }

  async getWorldStats(worldId: string): Promise<WorldStats> {
    return this.request<WorldStats>(`/api/v1/world/${worldId}/stats`);
  }

  async getWorldChatHistory(worldId: string, page?: number, pageSize?: number): Promise<ChatHistoryResponse> {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (pageSize) params.set('page_size', String(pageSize));
    const query = params.toString();
    return this.request<ChatHistoryResponse>(`/api/v1/world/${worldId}/chat${query ? `?${query}` : ''}`);
  }

  async updateWorldNpcStates(worldId: string, npcStates: Record<string, NPCState>): Promise<WorldState> {
    return this.request<WorldState>(`/api/v1/world/${worldId}/npcs`, {
      method: 'PUT',
      body: JSON.stringify({ npc_states: npcStates }),
    });
  }
}

// Data Source Types
export interface DataSource {
  id: string;
  name: string;
  description: string | null;
  source_type: string;
  source_url: string | null;
  api_endpoint: string | null;
  coverage_region: string | null;
  coverage_year: number | null;
  status: string;
  is_enabled: boolean;
  accuracy_score: number | null;
  validation_status: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  config: Record<string, unknown>;
}

export interface DataSourceCreate {
  name: string;
  description?: string;
  source_type: string;
  source_url?: string;
  api_endpoint?: string;
  coverage_region?: string;
  coverage_year?: number;
  config?: Record<string, unknown>;
}

export interface DataSourceUpdate {
  name?: string;
  description?: string;
  source_url?: string;
  api_endpoint?: string;
  coverage_region?: string;
  coverage_year?: number;
  config?: Record<string, unknown>;
  is_enabled?: boolean;
}

export interface DemographicDistribution {
  category: string;
  distribution: Record<string, number>;
  total_population: number;
  source_year: number;
  source_survey: string;
  margin_of_error: number | null;
}

export interface CensusProfile {
  region: {
    state: string | null;
    county: string | null;
  };
  demographics: Record<string, {
    distribution: Record<string, number>;
    total_population: number;
    source_year: number;
    source_survey: string;
  }>;
  source: string;
  year: number;
}

export interface CensusSyncResult {
  message: string;
  records_created: number;
  data_source_id: string;
  region: {
    state: string | null;
    county: string | null;
  };
  year: number;
}

export interface RegionalProfile {
  id: string;
  data_source_id: string;
  region_code: string;
  region_name: string;
  region_type: string;
  demographics: Record<string, unknown>;
  psychographics: Record<string, unknown> | null;
  data_completeness: number;
  confidence_score: number;
  created_at: string;
}

export interface RegionalProfileBuildResult {
  message: string;
  profile_id: string;
  region_code: string;
  region_name: string;
  region_type: string;
  data_completeness: number;
  confidence_score: number;
}

// ========== Persona Types ==========

export interface PersonaTemplate {
  id: string;
  name: string;
  description: string | null;
  region: string;
  country: string | null;
  sub_region: string | null;
  industry: string | null;
  topic: string | null;
  keywords: string[] | null;
  source_type: string;
  data_completeness: number;
  confidence_score: number;
  is_active: boolean;
  is_public: boolean;
  persona_count: number;
  created_at: string;
  updated_at: string;
}

export interface PersonaTemplateCreate {
  name: string;
  description?: string;
  region: string;
  country?: string;
  sub_region?: string;
  industry?: string;
  topic?: string;
  keywords?: string[];
  source_type?: string;
}

export interface PersonaRecord {
  id: string;
  demographics: Record<string, unknown>;
  professional: Record<string, unknown>;
  psychographics: Record<string, unknown>;
  behavioral: Record<string, unknown>;
  interests: Record<string, unknown>;
  topic_knowledge: Record<string, unknown> | null;
  cultural_context: Record<string, unknown> | null;
  source_type: string;
  confidence_score: number;
  full_prompt: string | null;
  created_at: string;
}

export interface GeneratePersonasRequest {
  template_id?: string;
  region: string;
  country?: string;
  sub_region?: string;
  topic?: string;
  industry?: string;
  keywords?: string[];
  count?: number;
  include_psychographics?: boolean;
  include_behavioral?: boolean;
  include_cultural?: boolean;
  include_topic_knowledge?: boolean;
}

export interface GeneratePersonasResponse {
  count: number;
  template_id: string | null;
  sample_personas: Record<string, unknown>[];
  generation_config: Record<string, unknown>;
}

export interface FileAnalysisColumn {
  name: string;
  sample_values: string[];
  data_type: string;
  unique_count: number;
  null_count: number;
  suggested_mapping: string | null;
}

export interface FileAnalysisResponse {
  file_name: string;
  row_count: number;
  column_count: number;
  columns: FileAnalysisColumn[];
  suggested_mappings: Record<string, string>;
}

export interface UploadResult {
  upload_id: string;
  status: string;
  records_total: number;
  records_processed: number;
  records_failed: number;
  errors: Record<string, unknown>[];
  sample_records: Record<string, unknown>[];
}

export interface AIResearchRequest {
  topic: string;
  region: string;
  country?: string;
  industry?: string;
  keywords?: string[];
  research_depth?: 'quick' | 'standard' | 'comprehensive';
  target_persona_count?: number;
}

export interface AIResearchJob {
  id: string;
  topic: string;
  region: string;
  country: string | null;
  industry: string | null;
  status: string;
  progress: number;
  insights: Record<string, unknown> | null;
  personas_generated: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface RegionInfo {
  code: string;
  name: string;
  countries: string[];
  data_source: string;
}

// ========== Product Types ==========

export interface TargetMarket {
  regions: string[];
  countries: string[];
  demographics: Record<string, unknown>;
  sample_size: number;
}

export type ProductType = 'predict' | 'insight' | 'simulate' | 'oracle' | 'pulse' | 'prism';

export interface Product {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  product_type: ProductType;
  sub_type: string | null;
  target_market: TargetMarket;
  persona_template_id: string | null;
  persona_count: number;
  persona_source: string;
  configuration: Record<string, unknown>;
  stimulus_materials: Record<string, unknown> | null;
  methodology: Record<string, unknown> | null;
  confidence_target: number;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ProductCreate {
  project_id: string;
  name: string;
  description?: string;
  product_type: ProductType;
  sub_type?: string;
  target_market: TargetMarket;
  persona_template_id?: string;
  persona_count?: number;
  persona_source?: string;
  configuration?: Record<string, unknown>;
  stimulus_materials?: Record<string, unknown>;
  methodology?: Record<string, unknown>;
  confidence_target?: number;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  target_market?: TargetMarket;
  persona_template_id?: string;
  persona_count?: number;
  configuration?: Record<string, unknown>;
  stimulus_materials?: Record<string, unknown>;
  methodology?: Record<string, unknown>;
  confidence_target?: number;
}

export interface ProductRun {
  id: string;
  product_id: string;
  run_number: number;
  name: string | null;
  status: string;
  progress: number;
  agents_total: number;
  agents_completed: number;
  agents_failed: number;
  tokens_used: number;
  estimated_cost: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ProductResult {
  id: string;
  product_id: string;
  run_id: string | null;
  result_type: string;
  predictions: Record<string, unknown> | null;
  insights: Record<string, unknown> | null;
  simulation_outcomes: Record<string, unknown> | null;
  statistical_analysis: Record<string, unknown> | null;
  segment_analysis: Record<string, unknown> | null;
  // Advanced Model Analysis Fields
  oracle_analysis: Record<string, unknown> | null;  // ORACLE Market Intelligence
  pulse_analysis: Record<string, unknown> | null;   // PULSE Political Simulation
  prism_analysis: Record<string, unknown> | null;   // PRISM Public Sector Analytics
  confidence_score: number;
  executive_summary: string | null;
  key_takeaways: string[] | null;
  recommendations: string[] | null;
  visualizations: Record<string, unknown> | null;
  created_at: string;
}

export interface ProductStats {
  total_products: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  total_runs: number;
  active_runs: number;
  completed_runs: number;
  total_agents: number;
  avg_confidence: number;
}

export interface ProductSubType {
  value: string;
  name: string;
}

export interface ProductTypeInfo {
  type: string;
  name: string;
  description: string;
  sub_types: ProductSubType[];
}

export interface ProductTypesResponse {
  product_types: ProductTypeInfo[];
}

// Comparison Types
export interface ComparisonResultItem {
  product_id: string;
  product_name: string;
  result_id: string | null;
  data: Record<string, unknown>;
}

export interface ComparisonResponse {
  products: ComparisonResultItem[];
  comparison_metrics: Record<string, unknown[]>;
  statistical_significance: Record<string, {
    is_significant: boolean;
    p_value: number;
    description: string;
  }>;
}

export interface TrendDataPoint {
  name: string;
  value?: number;
  date?: string;
  positive_ratio?: number;
  likely_ratio?: number;
  distribution?: Record<string, number>;
}

export interface ProductTrendsResponse {
  product_id: string;
  product_name: string;
  total_runs: number;
  trends: {
    confidence_scores: TrendDataPoint[];
    sentiment_trends: TrendDataPoint[];
    purchase_likelihood_trends: TrendDataPoint[];
    run_dates: TrendDataPoint[];
  };
}

// Validation Types
export interface Benchmark {
  id: string;
  name: string;
  description: string | null;
  category: string;
  event_date: string | null;
  region: string;
  country: string | null;
  actual_outcome: Record<string, unknown>;
  source: string;
  source_url: string | null;
  verification_status: string;
  is_public: boolean;
  usage_count: number;
  created_at: string;
}

export interface BenchmarkCreate {
  name: string;
  description?: string;
  category: string;
  event_date?: string;
  region: string;
  country?: string;
  actual_outcome: Record<string, unknown>;
  source: string;
  source_url?: string;
  is_public?: boolean;
}

export interface ValidationRecord {
  id: string;
  product_id: string;
  benchmark_id: string;
  predicted_outcome: Record<string, unknown>;
  actual_outcome: Record<string, unknown>;
  accuracy_score: number;
  deviation: number;
  within_confidence_interval: boolean;
  analysis: Record<string, unknown> | null;
  validated_at: string;
}

export interface ValidationCreate {
  product_id: string;
  benchmark_id: string;
}

export interface AccuracyStats {
  total_validations: number;
  average_accuracy: number;
  median_accuracy: number;
  accuracy_by_category: Record<string, number>;
  accuracy_trend: Array<{ date: string; accuracy: number }>;
  within_ci_rate: number;
  best_performing_category: string | null;
  areas_for_improvement: string[];
}

export interface BenchmarkCategory {
  id: string;
  name: string;
  description: string;
}

// AI Content Generation Types
export interface AIContentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  context: string;
  questions: Array<{
    type: string;
    text: string;
    options?: string[];
  }>;
}

export interface AITemplateListResponse {
  templates: AIContentTemplate[];
  total: number;
}

export interface GenerateAIContentRequest {
  title: string;
  product_type?: string;
  sub_type?: string;
  target_market?: Record<string, unknown>;
}

export interface GeneratedContent {
  context: string | null;
  description: string | null;
  questions: Array<{
    type: string;
    text: string;
    options?: string[];
  }> | null;
  recommendations: string[] | null;
}

export interface GenerateAIContentResponse {
  success: boolean;
  content: GeneratedContent;
}

export interface AICategory {
  id: string;
  name: string;
  description: string;
}

// ========== Focus Group Types ==========

export interface FocusGroupSession {
  id: string;
  product_id: string;
  run_id: string | null;
  user_id: string;
  name: string;
  session_type: 'individual_interview' | 'group_discussion' | 'panel_interview' | 'free_form';
  topic: string | null;
  objectives: string[] | null;
  agent_ids: string[];
  agent_contexts: Record<string, AgentContext>;
  discussion_guide: Array<{ topic: string; questions: string[] }> | null;
  model_preset: string;
  temperature: number;
  moderator_style: string;
  message_count: number;
  total_tokens: number;
  estimated_cost: number;
  sentiment_trajectory: Array<{ timestamp: string; sentiment: number; agent_id: string }> | null;
  key_themes: string[] | null;
  insights_summary: string | null;
  status: 'active' | 'paused' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  ended_at: string | null;
}

export interface FocusGroupSessionCreate {
  product_id: string;
  run_id?: string;
  name: string;
  agent_ids: string[];
  session_type?: string;
  topic?: string;
  objectives?: string[];
  discussion_guide?: Array<{ topic: string; questions: string[] }>;
  model_preset?: string;
  temperature?: number;
  moderator_style?: string;
}

export interface FocusGroupSessionUpdate {
  name?: string;
  topic?: string;
  objectives?: string[];
  discussion_guide?: Array<{ topic: string; questions: string[] }>;
  model_preset?: string;
  temperature?: number;
  moderator_style?: string;
  status?: string;
  insights_summary?: string;
  key_themes?: string[];
}

export interface AgentContext {
  persona: Record<string, unknown>;
  previous_responses?: Record<string, unknown>;
  sentiment_baseline?: number;
  key_themes?: string[];
}

export interface FocusGroupMessage {
  id: string;
  session_id: string;
  sequence_number: number;
  role: 'moderator' | 'agent' | 'system';
  agent_id: string | null;
  agent_name: string | null;
  content: string;
  is_group_response: boolean;
  responding_agents: string[] | null;
  sentiment_score: number | null;
  emotion: string | null;
  confidence: number | null;
  key_points: string[] | null;
  themes: string[] | null;
  quotes: string[] | null;
  input_tokens: number;
  output_tokens: number;
  response_time_ms: number;
  created_at: string;
}

export interface InterviewRequest {
  question: string;
  target_agent_ids?: string[];
  context?: string;
  follow_up?: boolean;
}

export interface InterviewResponse {
  agent_id: string;
  agent_name: string;
  persona_summary: Record<string, unknown>;
  response: string;
  sentiment_score: number;
  emotion: string;
  confidence: number;
  key_points: string[];
  response_time_ms: number;
}

export interface StreamingInterviewChunk {
  agent_id: string;
  agent_name: string;
  chunk: string;
  is_final: boolean;
  sentiment_score?: number;
  emotion?: string;
}

export interface GroupDiscussionRequest {
  topic: string;
  initial_question: string;
  max_turns?: number;
  agent_ids?: string[];
}

export interface GroupDiscussionTurn {
  turn_number: number;
  agent_id: string;
  agent_name: string;
  response: string;
  responding_to: string | null;
  agreement_level: number | null;
  sentiment_score: number;
  emotion: string;
}

export interface GroupDiscussionResponse {
  topic: string;
  turns: GroupDiscussionTurn[];
  consensus_points: string[];
  disagreement_points: string[];
  key_themes: string[];
  sentiment_summary: {
    average: number;
    min: number;
    max: number;
  };
}

export interface SessionSummaryResponse {
  session_id: string;
  session_name: string;
  agent_count: number;
  message_count: number;
  duration_minutes: number | null;
  key_insights: string[];
  key_themes: string[];
  notable_quotes: Array<{ agent: string; quote: string }>;
  sentiment_trajectory: Array<{ timestamp: string; sentiment: number; agent_id: string }>;
  recommendations: string[];
  executive_summary: string;
}

export interface AvailableAgent {
  agent_id: string;
  agent_index: number;
  persona_summary: Record<string, unknown>;
  original_sentiment: number | null;
  key_themes: string[] | null;
}

// ========== Marketplace Types ==========

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  template_count: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceCategoryWithChildren extends MarketplaceCategory {
  children: MarketplaceCategoryWithChildren[];
}

export interface MarketplaceCategoryCreate {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  display_order?: number;
}

export interface MarketplaceCategoryUpdate {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface MarketplaceTemplateListItem {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  category_id: string | null;
  category_name: string | null;
  author_id: string;
  author_name: string | null;
  scenario_type: string;
  tags: string[];
  status: string;
  is_featured: boolean;
  is_verified: boolean;
  is_premium: boolean;
  price_usd: number | null;
  usage_count: number;
  rating_average: number;
  rating_count: number;
  like_count: number;
  preview_image_url: string | null;
  created_at: string;
  published_at: string | null;
}

export interface MarketplaceTemplateDetail extends MarketplaceTemplateListItem {
  description: string | null;
  context: string;
  questions: Array<Record<string, unknown>>;
  variables: Record<string, unknown>;
  demographics: Record<string, unknown>;
  persona_template: Record<string, unknown> | null;
  model_config: Record<string, unknown>;
  recommended_population_size: number;
  stimulus_materials: Record<string, unknown> | null;
  methodology: Record<string, unknown> | null;
  sample_results: Record<string, unknown> | null;
  version: string;
  view_count: number;
  updated_at: string;
  is_liked_by_user: boolean;
  user_review: TemplateReview | null;
}

export interface MarketplaceTemplateCreate {
  name: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  tags?: string[];
  scenario_type: string;
  context: string;
  questions?: Array<Record<string, unknown>>;
  variables?: Record<string, unknown>;
  demographics?: Record<string, unknown>;
  persona_template?: Record<string, unknown>;
  model_config?: Record<string, unknown>;
  recommended_population_size?: number;
  stimulus_materials?: Record<string, unknown>;
  methodology?: Record<string, unknown>;
  preview_image_url?: string;
  sample_results?: Record<string, unknown>;
  source_scenario_id?: string;
  is_premium?: boolean;
  price_usd?: number;
}

export interface MarketplaceTemplateFromScenario {
  scenario_id: string;
  name: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  tags?: string[];
  is_premium?: boolean;
  price_usd?: number;
}

export interface MarketplaceTemplateUpdate {
  name?: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  tags?: string[];
  context?: string;
  questions?: Array<Record<string, unknown>>;
  variables?: Record<string, unknown>;
  demographics?: Record<string, unknown>;
  persona_template?: Record<string, unknown>;
  model_config?: Record<string, unknown>;
  recommended_population_size?: number;
  stimulus_materials?: Record<string, unknown>;
  methodology?: Record<string, unknown>;
  preview_image_url?: string;
  sample_results?: Record<string, unknown>;
  is_premium?: boolean;
  price_usd?: number;
}

export interface MarketplaceTemplateListResponse {
  items: MarketplaceTemplateListItem[];
  total: number;
  page: number;
  page_size: number;
  categories?: MarketplaceCategory[];
}

export interface FeaturedTemplatesResponse {
  featured: MarketplaceTemplateListItem[];
  trending: MarketplaceTemplateListItem[];
  newest: MarketplaceTemplateListItem[];
  by_category: Record<string, MarketplaceTemplateListItem[]>;
}

export interface UseTemplateRequest {
  target_project_id?: string;
  create_type?: 'scenario' | 'product';
  customizations?: Record<string, unknown>;
  name?: string;
}

export interface UseTemplateResponse {
  usage_id: string;
  template_id: string;
  created_type: string;
  created_id: string;
  created_name: string;
  message: string;
}

export interface TemplateReview {
  id: string;
  template_id: string;
  user_id: string;
  user_name: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified_purchase: boolean;
  is_helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateReviewCreate {
  rating: number;
  title?: string;
  content?: string;
}

export interface TemplateReviewUpdate {
  rating?: number;
  title?: string;
  content?: string;
}

export interface TemplateReviewListResponse {
  items: TemplateReview[];
  total: number;
  page: number;
  page_size: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
}

export interface MarketplaceStats {
  total_templates: number;
  total_categories: number;
  total_usages: number;
  total_reviews: number;
  average_rating: number;
  top_categories: Array<{ name: string; slug: string; count: number }>;
  top_authors: Array<{ author_id: string; name: string; template_count: number; total_usage: number }>;
}

export interface AuthorStats {
  total_templates: number;
  total_usages: number;
  total_reviews: number;
  average_rating: number;
  total_likes: number;
  templates: MarketplaceTemplateListItem[];
}

// ========== Vi World Types ==========

export type WorldStatus = 'inactive' | 'running' | 'paused' | 'completed';

export interface NPCState {
  id: string;
  persona_id: string;
  name: string;
  position: { x: number; y: number };
  target_position?: { x: number; y: number } | null;
  direction: 'up' | 'down' | 'left' | 'right';
  state: 'idle' | 'walking' | 'chatting';
  speed: number;
  chat_cooldown?: number;
  current_chat_id?: string | null;
}

export interface WorldChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id?: string;
  message: string;
  timestamp: number;
}

export interface WorldState {
  id: string;
  template_id: string;
  user_id: string;
  name: string;
  status: WorldStatus;
  world_width: number;
  world_height: number;
  tile_size: number;
  npc_states: Record<string, NPCState>;
  chat_history: WorldChatMessage[];
  simulation_speed: number;
  started_at: string | null;
  last_tick_at: string | null;
  ticks_processed: number;
  total_messages: number;
  total_simulation_time: number;
  created_at: string;
  updated_at: string;
}

export interface WorldStats {
  world_id: string;
  status: WorldStatus;
  population: number;
  npcs_walking: number;
  npcs_chatting: number;
  npcs_idle: number;
  total_messages: number;
  ticks_processed: number;
  simulation_speed: number;
  uptime_seconds: number;
}

export interface ChatHistoryResponse {
  items: WorldChatMessage[];
  total: number;
  page: number;
  page_size: number;
}

export const api = new ApiClient(API_URL);
export default api;
