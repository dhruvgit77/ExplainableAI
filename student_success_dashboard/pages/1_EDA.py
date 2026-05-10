import streamlit as st
import pandas as pd
import plotly.express as px
import os

st.set_page_config(page_title="EDA", page_icon="📊", layout="wide")

# Inject same CSS for consistency
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    .stApp {
        background-color: #F8FAFC;
        color: #1E293B;
        font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .chart-container {
        background: #FFFFFF;
        padding: 24px;
        border-radius: 16px;
        border: 1px solid #E2E8F0;
        margin-bottom: 24px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .metric-container {
        background: #FFFFFF;
        padding: 24px;
        border-radius: 16px;
        border-left: 5px solid #E11D48;
        text-align: left;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        border-top: 1px solid #F1F5F9;
        border-right: 1px solid #F1F5F9;
        border-bottom: 1px solid #F1F5F9;
    }
    .metric-label { color: #64748B; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
    .metric-val { color: #0F172A; font-size: 2rem; font-weight: 800; margin-top: 5px; }
</style>
""", unsafe_allow_html=True)

st.title("📊 Exploratory Data Analysis")

@st.cache_data
def load_data():
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'student_data.csv')
    return pd.read_csv(data_path)

df = load_data()

# Summary Metrics
col1, col2, col3 = st.columns(3)

with col1:
    st.markdown(f'<div class="metric-container"><div class="metric-label">Total Records</div><div class="metric-val">{len(df)}</div></div>', unsafe_allow_html=True)
with col2:
    st.markdown(f'<div class="metric-container"><div class="metric-label">Features Analyzed</div><div class="metric-val">{len(df.columns) - 1}</div></div>', unsafe_allow_html=True)
with col3:
    st.markdown(f'<div class="metric-container"><div class="metric-label">Success Categories</div><div class="metric-val">{len(df["target"].unique())}</div></div>', unsafe_allow_html=True)

st.markdown("### 🔍 Dataset Preview")
st.dataframe(df.head(10), use_container_width=True)

st.markdown("---")

col_left, col_right = st.columns([1, 1])

with col_left:
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown("#### Outcome Distribution")
    fig_target = px.pie(df, names='target', hole=0.5,
                        color_discrete_sequence=['#E11D48', '#FB7185', '#FDA4AF'])
    fig_target.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', 
                             font_color="#1E293B", margin=dict(t=30, b=0, l=0, r=0))
    st.plotly_chart(fig_target, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

with col_right:
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown("#### Previous GPA vs Outcome")
    fig_gpa = px.box(df, x='target', y='prev_gpa', color='target',
                     color_discrete_sequence=['#E11D48', '#FB7185', '#F43F5E'])
    fig_gpa.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', 
                          font_color="#1E293B", showlegend=False)
    st.plotly_chart(fig_gpa, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

st.markdown('<div class="chart-container">', unsafe_allow_html=True)
st.markdown("#### Behavioral Correlation Matrix")
numeric_df = df.select_dtypes(include=['float64', 'int64'])
corr = numeric_df.corr()
fig_corr = px.imshow(corr, text_auto=".2f", aspect="auto", 
                     color_continuous_scale='Reds')
fig_corr.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color="#1E293B")
st.plotly_chart(fig_corr, use_container_width=True)
st.markdown('</div>', unsafe_allow_html=True)

