const BASE = '/api';
const AUTH_KEY = 'vs_auth';

function getToken() {
  try {
    const stored = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    return stored?.token || null;
  } catch {
    return null;
  }
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, { headers, ...options });

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
  getShapGlobal: (modelName = 'Combined') =>
    request(`/xai/shap/global?model_name=${modelName}`),
  getShapDependence: (modelName = 'Combined', topN = 6) =>
    request(`/xai/shap/dependence?model_name=${modelName}&top_n=${topN}`),
  getShapLocal: (studentIndex, modelName = 'Combined') =>
    request('/xai/shap/local', {
      method: 'POST',
      body: JSON.stringify({ student_index: studentIndex, model_name: modelName }),
    }),
  getLimeLocal: (studentIndex, modelName = 'Combined') =>
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

  predictBatch: (records, modelName = 'Combined') =>
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
  getTeachers: () => request('/auth/teachers'),
  me: () => request('/auth/me'),

  // Teacher
  getTeacherStudents: () => request('/teacher/students'),
  getTeacherStudent: (id) => request(`/teacher/students/${id}`),
  updateTeacherStudent: (id, data) =>
    request(`/teacher/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  generateReport: (id) =>
    request(`/teacher/students/${id}/generate-report`, { method: 'POST' }),

  // Student
  getMyReport: () => request('/student/me/report'),
};
