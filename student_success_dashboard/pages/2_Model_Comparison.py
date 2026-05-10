import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import sys
import os

# Add parent directory to path to import local modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from models.evaluate import evaluate_models

st.set_page_config(page_title="Model Comparison", page_icon="📈", layout="wide")

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
    .stTable {
        background-color: transparent !important;
    }
</style>
""", unsafe_allow_html=True)

st.title("📈 Model Comparison")

@st.cache_data
def get_evaluation_results():
    return evaluate_models()

with st.spinner("Evaluating models on test set..."):
    results, cms, curves = get_evaluation_results()

st.markdown("### 📊 Performance Metrics")
st.markdown('<div class="glass-card">', unsafe_allow_html=True)
# Convert results to DataFrame
metrics_df = pd.DataFrame(results).T
metrics_df = metrics_df.reset_index().rename(columns={'index': 'Model'})

# Display metrics table with styling
st.dataframe(metrics_df.style.highlight_max(axis=0, subset=['Accuracy', 'F1 Score (Weighted)'], color='#FFE4E6'), use_container_width=True)
st.markdown('</div>', unsafe_allow_html=True)

st.markdown("---")

col_radar, col_insight = st.columns([2, 1])

with col_radar:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    st.markdown("#### Radar Chart Comparison")
    categories = ['Accuracy', 'Precision (Weighted)', 'Recall (Weighted)', 'F1 Score (Weighted)', 'AUC-ROC (OVR)']
    fig_radar = go.Figure()
    for index, row in metrics_df.iterrows():
        fig_radar.add_trace(go.Scatterpolar(
            r=[row[cat] for cat in categories],
            theta=categories,
            fill='toself',
            name=row['Model']
        ))
    fig_radar.update_layout(
        polar=dict(radialaxis=dict(visible=True, range=[0.8, 1.0], gridcolor="#E2E8F0")),
        showlegend=True,
        template="plotly_white",
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font_color="#1E293B",
        margin=dict(t=40, b=40, l=40, r=40),
        colorway=['#E11D48', '#FB7185', '#F43F5E', '#FDA4AF']
    )
    st.plotly_chart(fig_radar, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

with col_insight:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    st.markdown("#### 💡 Model Insights")
    st.write("""
    - **XGBoost**: Leading performance in accuracy and F1-Score.
    - **SVM**: Robust but computationally heavier for large datasets.
    - **Neural Network**: Shows high potential but requires careful tuning.
    - **Decision Tree**: Most interpretable but prone to variance.
    """)
    st.markdown('</div>', unsafe_allow_html=True)

st.markdown("### 🧩 Confusion Matrices")
st.markdown('<div class="glass-card">', unsafe_allow_html=True)
cols = st.columns(2)
for i, (name, cm) in enumerate(cms.items()):
    with cols[i % 2]:
        st.markdown(f"**{name}**")
        fig_cm = px.imshow(cm, text_auto=True, 
                           color_continuous_scale='Reds',
                           labels=dict(x="Predicted", y="Actual", color="Count"),
                           x=['Fail', 'At-Risk', 'Pass'],
                           y=['Fail', 'At-Risk', 'Pass'])
        fig_cm.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color="#1E293B")
        st.plotly_chart(fig_cm, use_container_width=True)
st.markdown('</div>', unsafe_allow_html=True)

