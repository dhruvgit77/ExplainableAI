const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
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

  // Explainability
  getShapGlobal: (modelName = 'XGBoost') =>
    request(`/xai/shap/global?model_name=${modelName}`),
  getShapDependence: (modelName = 'XGBoost', topN = 6) =>
    request(`/xai/shap/dependence?model_name=${modelName}&top_n=${topN}`),
  getShapLocal: (studentIndex, modelName = 'XGBoost') =>
    request('/xai/shap/local', {
      method: 'POST',
      body: JSON.stringify({ student_index: studentIndex, model_name: modelName }),
    }),
  getLimeLocal: (studentIndex, modelName = 'XGBoost') =>
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

  predictBatch: (records, modelName = 'XGBoost') =>
    request('/predict/batch', {
      method: 'POST',
      body: JSON.stringify({ records, model_name: modelName }),
    }),

  getCounterfactual: (data) =>
    request('/predict/counterfactual', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
