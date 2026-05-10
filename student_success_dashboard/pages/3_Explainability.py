import streamlit as st
import pandas as pd
import shap
import matplotlib.pyplot as plt
import os
import sys
import joblib

# Add parent directory to path to import local modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from explainability.shap_explain import load_explainer, get_local_explanation

st.set_page_config(page_title="Explainability (XAI)", page_icon="🔍", layout="wide")

# Inject same CSS for consistency
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    .stApp {
        background-color: #F8FAFC;
        color: #1E293B;
        font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .glass-card {
        background: #FFFFFF;
        padding: 24px;
        border-radius: 20px;
        border: 1px solid #E2E8F0;
        margin-bottom: 24px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .highlight {
        color: #E11D48;
        font-weight: 700;
    }
</style>
""", unsafe_allow_html=True)

st.title("🔍 Model Explainability (XAI)")

st.markdown("""
<div class="glass-card">
    Machine Learning models are often "black boxes". <b>Explainable AI (XAI)</b> techniques like SHAP help us understand <i>how</i> the model is making its decisions.
</div>
""", unsafe_allow_html=True)

@st.cache_resource
def get_explainer_data():
    return load_explainer("XGBoost")

with st.spinner("Calculating SHAP values..."):
    explainer, shap_values, X_test = get_explainer_data()

st.markdown("### 🌍 Global Interpretability")
st.info("What features drive the model's predictions the most across all students?")

with st.container():
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    # SHAP bar plot
    fig, ax = plt.subplots(figsize=(10, 6))
    plt.style.use('default')
    fig.patch.set_facecolor('none')
    ax.set_facecolor('none')
    
    shap.summary_plot(shap_values, X_test, plot_type="bar", show=False, color_bar_label="Feature Impact")
        
    st.pyplot(fig, transparent=True)
    st.markdown('</div>', unsafe_allow_html=True)


st.markdown("---")
st.markdown("### 🎯 Local Interpretability")
st.markdown("Analyze an individual student to understand their specific prediction.")

col1, col2 = st.columns([1, 2])

with col1:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    student_id = st.select_slider("Select Student Index:", options=range(len(X_test)), value=0)
    student_data = X_test.iloc[[student_id]]
    
    models = joblib.load(os.path.join(os.path.dirname(__file__), '..', 'models', 'models.joblib'))
    model = models["XGBoost"]
    pred_class_idx = model.predict(student_data)[0]
    class_names = ['Fail', 'At-Risk', 'Pass']
    pred_class_name = class_names[pred_class_idx]
    
    st.markdown(f"#### Predicted Outcome: <span class='highlight'>{pred_class_name}</span>", unsafe_allow_html=True)
    st.markdown("**Student Features:**")
    st.write(student_data.T)
    st.markdown('</div>', unsafe_allow_html=True)

with col2:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    with st.spinner("Generating local explanation..."):
        local_explainer, local_shap_values = get_local_explanation(student_data, "XGBoost")

    fig_waterfall, ax_w = plt.subplots(figsize=(10, 6))
    fig_waterfall.patch.set_facecolor('none')
    
    try:
        if isinstance(local_shap_values, list):
            shap.waterfall_plot(shap.Explanation(values=local_shap_values[pred_class_idx][0], 
                                                 base_values=local_explainer.expected_value[pred_class_idx], 
                                                 data=student_data.iloc[0], 
                                                 feature_names=X_test.columns), show=False)
        else:
            shap.waterfall_plot(local_shap_values[0, :, pred_class_idx], show=False)
        st.pyplot(fig_waterfall, transparent=True)
    except Exception as e:
        st.warning("Could not render waterfall plot.")
        st.write(str(e))
    st.markdown('</div>', unsafe_allow_html=True)
