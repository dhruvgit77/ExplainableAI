const BASE = '/api';
const AUTH_KEY = 'vs_auth';

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  // Session lives in an httpOnly cookie set by the server; the browser
  // attaches it automatically as long as we ask it to via credentials.
  const res = await fetch(`${BASE}${url}`, { headers, credentials: 'include', ...options });

  if (res.status === 401) {
    localStorage.removeItem(AUTH_KEY);
    if (window.location.pathname !== '/login') window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // EDA
  getEdaSummary: () => request('/eda/summary'),
  getEdaPreview: () => request('/eda/preview'),
  getEdaDistribution: () => request('/eda/distribution'),
  getEdaBoxplot: () => request('/eda/boxplot'),
  getEdaCorrelation: () => request('/eda/correlation'),
  getFeatureDistributions: () => request('/eda/feature-distributions'),
  getCategoricalDistributions: () => request('/eda/categorical-distributions'),

  // Models
  getModelEvaluation: () => request('/models/evaluate'),
  getModelList: () => request('/models/list'),
  getFeatureWeights: () => request('/models/feature-weights'),

  // Explainability
  getShapGlobal: (modelName = 'Full') =>
    request(`/xai/shap/global?model_name=${modelName}`),
  getShapDependence: (modelName = 'Full', topN = 6) =>
    request(`/xai/shap/dependence?model_name=${modelName}&top_n=${topN}`),
  getShapLocal: (studentIndex, modelName = 'Full') =>
    request('/xai/shap/local', {
      method: 'POST',
      body: JSON.stringify({ student_index: studentIndex, model_name: modelName }),
    }),
  getLimeLocal: (studentIndex, modelName = 'Full') =>
    request('/xai/lime/local', {
      method: 'POST',
      body: JSON.stringify({ student_index: studentIndex, model_name: modelName }),
    }),

  // Bias
  getBiasAudit: () => request('/bias/audit'),

  // Predict
  predict: (data) =>
    request('/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  predictBatch: (records, modelName = 'Full') =>
    request('/predict/batch', {
      method: 'POST',
      body: JSON.stringify({ records, model_name: modelName }),
    }),

  getCounterfactual: (data) =>
    request('/predict/counterfactual', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Auth
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  signup: (payload) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getTeachers: () => request('/auth/teachers'),
  me: () => request('/auth/me'),

  // Teacher
  getTeacherStudents: () => request('/teacher/students'),
  getTeacherStudent: (id) => request(`/teacher/students/${id}`),
  updateTeacherStudent: (id, data) =>
    request(`/teacher/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  generateReport: (id) =>
    request(`/teacher/students/${id}/generate-report`, { method: 'POST' }),

  // Artifacts — real agentic Tier-3 extraction from uploaded student work
  getExtractionStatus: () => request('/artifacts/status'),
  extractArtifacts: async (files, profile) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    if (profile) fd.append('profile', JSON.stringify(profile));
    // No Content-Type header — the browser sets the multipart boundary itself.
    const res = await fetch(`${BASE}/artifacts/extract`, {
      method: 'POST', body: fd, credentials: 'include',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail || `API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  },

  // Student
  getMyReport: () => request('/student/me/report'),

  // News
  getNews: () => request('/news/feed'),
};
