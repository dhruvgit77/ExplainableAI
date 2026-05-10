import streamlit as st
import pandas as pd
import plotly.express as px
import os
import sys

# Add parent directory to path to import local modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from bias.bias_audit import audit_bias

st.set_page_config(page_title="Bias Audit", page_icon="⚖️", layout="wide")

# SVG Icon
BIAS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h18"></path></svg>'

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
    .bias-flag {
        background: rgba(225, 29, 72, 0.05);
        border: 1px solid #FECACA;
        padding: 10px;
        border-radius: 8px;
        color: #E11D48;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

st.markdown(f"<h1>{BIAS_SVG} Fairness and Bias Audit</h1>", unsafe_allow_html=True)

st.markdown("""
<div class="glass-card">
    AI models can unintentionally learn biases present in the training data. This page audits the <b>XGBoost</b> model to ensure equitable performance across different demographic groups.
</div>
""", unsafe_allow_html=True)

with st.spinner("Calculating fairness metrics..."):
    results_df = audit_bias()

st.markdown("### 📋 Audit Scorecard")
st.markdown('<div class="glass-card">', unsafe_allow_html=True)

# Highlight rows where accuracy or pass rate is significantly lower
def highlight_bias(row):
    if row['Accuracy'] < 0.90 or row['Predicted Pass Rate'] < 0.1:
        return ['background-color: #FEF2F2'] * len(row)
    return [''] * len(row)

st.dataframe(results_df.style.apply(highlight_bias, axis=1).format({
    'Accuracy': '{:.2%}',
    'Predicted Pass Rate': '{:.2%}',
    'Equal Opportunity (Pass Recall)': '{:.2%}'
}), use_container_width=True)
st.markdown('</div>', unsafe_allow_html=True)

st.markdown("---")
st.markdown("### 📊 Visualizing Disparities")

col1, col2 = st.columns(2)

with col1:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    fig_acc = px.bar(results_df, x='Group', y='Accuracy', color='Attribute', 
                     title='Model Accuracy by Subgroup', barmode='group',
                     color_discrete_sequence=['#E11D48', '#FB7185'])
    fig_acc.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color="#1E293B")
    fig_acc.add_hline(y=0.97, line_dash="dot", annotation_text="Overall Avg", annotation_position="bottom right")
    st.plotly_chart(fig_acc, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

with col2:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    fig_pass = px.bar(results_df, x='Group', y='Predicted Pass Rate', color='Attribute', 
                      title='Predicted "Pass" Rate by Subgroup', barmode='group',
                      color_discrete_sequence=['#E11D48', '#FB7185'])
    fig_pass.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color="#1E293B")
    st.plotly_chart(fig_pass, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

st.info("💡 **Next Step:** Based on these results, we can apply **Sample Re-weighting** or **Adversarial Debiasing** to improve fairness for identified groups.")
