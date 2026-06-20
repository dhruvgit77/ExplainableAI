# Student Success Prediction & Explainable AI Dashboard
## Comprehensive Project Report

---

### 1. Project Explanation & Overview
**Objective**: The primary goal of this project is to provide an intuitive, predictive, and transparent platform for educators and administrators to identify students at risk of academic failure or dropout. By leveraging socioeconomic, academic, and behavioral data, the system predicts student outcomes (Pass, At-Risk, Fail) and offers actionable insights.

**Core Innovation**: Unlike traditional black-box machine learning systems, this project integrates **Explainable AI (XAI)** and **Bias Auditing**. This ensures that predictions are transparent (explaining *why* a student is marked as at-risk) and fair (auditing models to ensure they do not exhibit bias across different demographic groups like gender or region).

**Target Audience for Evaluation**:
- **Educators/Professors**: Can see specific features holding a student back (e.g., Attendance Rate, Financial Stress).
- **University Administrators**: Can look at the macro-level bias audit and model performance to deploy college-wide interventions.
- **Data Scientists/Evaluators**: Can access detailed model benchmarks, hyperparameter tuning logs, and the fairness metrics.

---

### 2. Tools and Techniques Involved

#### **Data Processing & Machine Learning Pipeline**
- **Python**: Core programming language.
- **Scikit-Learn**: For data preprocessing (`StandardScaler`, `OneHotEncoder`), building foundational models (Decision Trees, SVM, Neural Networks), and hyperparameter tuning (`RandomizedSearchCV`).
- **XGBoost**: For advanced gradient boosting classification.
- **Imbalanced-Learn (SMOTE)**: Synthetic Minority Over-sampling Technique (SMOTE) is used to balance class distribution during training, ensuring the models do not become biased toward the majority class.

#### **Explainable AI (XAI) & Fairness Techniques**
- **SHAP (Shapley Additive exPlanations)**: Used for both global feature importance (which features matter most across all students) and local interpretability (why a specific student received a specific prediction).
- **LIME (Local Interpretable Model-agnostic Explanations)**: Provides an alternative local explanation by approximating the complex model with a simple, interpretable one around the specific prediction.
- **Fairlearn**: Used to audit the models for fairness and bias, calculating Demographic Parity and Equalized Odds across sensitive features like gender and region.

#### **Web Application & Dashboard Architectures**
The project features a dual-interface architecture:
1. **Interactive Streamlit Dashboard**: A Python-based rapid UI utilizing `streamlit`, `plotly`, and `matplotlib` for dynamic charts and fast iteration.
2. **Modern Full-Stack Implementation**:
   - **Backend**: **FastAPI** (Python) for serving robust REST APIs (Predictions, XAI, Models).
   - **Frontend**: **React** and **Vite** with **Three.js / React Three Fiber** for 3D visual elements, **GSAP** for smooth animations, and **Plotly.js** for interactive data visualizations.

---

### 3. Models Used and Their Performance (Accuracy)

During the model training and hyperparameter tuning phase (employing Stratified Splits and 3-fold Cross Validation), four primary algorithms were evaluated. Below are the benchmark results on the test set:

| Model | Accuracy | Weighted Precision | Weighted Recall | Weighted F1 Score | AUC-ROC (OVR) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Decision Tree** | 80.80% | 0.8070 | 0.8080 | 0.8072 | 0.8702 |
| **Support Vector Machine (SVM)** | 79.80% | 0.8018 | 0.7980 | 0.7992 | 0.9344 |
| **Neural Network (MLP)** | 82.60% | 0.8246 | 0.8260 | 0.8251 | 0.9413 |
| **XGBoost** | **86.90%** | **0.8664** | **0.8690** | **0.8658** | **0.9620** |

**Conclusion on Models**: **XGBoost** emerged as the best-performing model with the highest Accuracy (86.9%) and AUC-ROC (0.962), making it highly reliable in distinguishing between the classes ('Pass', 'At-Risk', 'Fail').

---

### 4. Features Included in the Dashboard

The dashboard is structured into five core functional modules:

1. **Data Insights (Exploratory Data Analysis - EDA)**
   - Visualizes the distribution of student data (e.g., study hours, attendance, financial stress).
   - Shows correlation heatmaps and feature distributions split by target outcomes.

2. **Model Bench (Model Comparison)**
   - A dedicated page allowing users to view side-by-side performance metrics of all trained models (Accuracy, Precision, Recall, F1, ROC Curves, and Confusion Matrices).

3. **Interpret AI (Explainability)**
   - **Global Explanations**: Visualizes SHAP summary plots showing the overall impact of features (like `attendance_rate` or `prev_cgpa`) on the model's decision-making process.
   - **Local Explanations**: LIME and SHAP force plots that break down the specific percentage contribution of each feature for an individual student prediction.

4. **Fairness Lab (Bias Audit)**
   - Analyzes model predictions across sensitive subgroups (e.g., checking if the model disproportionately predicts 'Fail' for a specific gender or region).
   - Displays Fairness Metrics (Demographic Parity Ratio, Equalized Odds Difference).

5. **Predict (Live Inference)**
   - A dynamic form where educators can input a student's real-time parameters.
   - Provides an immediate prediction (Fail/At-Risk/Pass).
   - Instantly generates personalized SHAP/LIME visual feedback highlighting exactly which parameters are driving the risk assessment, allowing for targeted intervention.
