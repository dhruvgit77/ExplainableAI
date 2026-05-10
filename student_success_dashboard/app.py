import streamlit as st

st.set_page_config(
    page_title="AI in Education Dashboard",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# SVG Icons (Improved Line Art)
GRAD_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path><circle cx="12" cy="10" r="1" fill="#E11D48"></circle></svg>'
EDA_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>'
MODEL_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
XAI_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
BIAS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'

# Custom CSS for Premium Light Theme (Rose Accent)
st.markdown(f"""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

    .stApp {{
        background-color: #F8FAFC;
        color: #1E293B;
        font-family: 'Plus Jakarta Sans', sans-serif;
    }}

    /* Light Sidebar */
    [data-testid="stSidebar"] {{
        background-color: #FFFFFF !important;
        border-right: 1px solid #E2E8F0;
    }}

    h1 {{
        color: #0F172A;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-bottom: 0.5rem;
    }}

    h3 {{
        color: #64748B;
        font-weight: 500;
    }}

    .metric-card {{
        background: #FFFFFF;
        padding: 40px 20px;
        border-radius: 20px;
        border: 1px solid #E2E8F0;
        text-align: center;
        transition: all 0.3s ease;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }}

    .metric-card:hover {{
        transform: translateY(-5px);
        border-color: #E11D48;
        box-shadow: 0 10px 20px rgba(0,0,0,0.05);
    }}

    .metric-title {{
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #94A3B8;
        margin-top: 15px;
    }}

    .metric-value {{
        font-size: 1.25rem;
        font-weight: 700;
        color: #0F172A;
        margin-top: 5px;
    }}

    /* Streamlit overrides for light theme */
    .stMetric {{
        background-color: #FFFFFF;
        padding: 15px;
        border-radius: 12px;
        border: 1px solid #E2E8F0;
    }}
</style>
""", unsafe_allow_html=True)

st.markdown(f"<h1>{GRAD_ICON} Student Success Platform</h1>", unsafe_allow_html=True)
st.markdown("### Explainable AI and Bias Auditing in Education")

st.markdown("<br>", unsafe_allow_html=True)

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown(f"""
    <a href="EDA" target="_self" style="text-decoration:none;">
    <div class="metric-card">
        {EDA_ICON}
        <div class="metric-value">Data Insights</div>
    </div>
    </a>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <a href="Model_Comparison" target="_self" style="text-decoration:none;">
    <div class="metric-card">
        {MODEL_ICON}
        <div class="metric-value">Model Bench</div>
    </div>
    </a>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <a href="Explainability" target="_self" style="text-decoration:none;">
    <div class="metric-card">
        {XAI_ICON}
        <div class="metric-value">Interpret AI</div>
    </div>
    </a>
    """, unsafe_allow_html=True)

with col4:
    st.markdown(f"""
    <a href="Bias_Audit" target="_self" style="text-decoration:none;">
    <div class="metric-card">
        {BIAS_ICON}
        <div class="metric-value">Fairness Lab</div>
    </div>
    </a>
    """, unsafe_allow_html=True)

st.markdown("""
### Platform Overview
The Student Success Platform leverages state-of-the-art Machine Learning models to analyze academic and socioeconomic indicators. 
It provides transparent, explainable predictions to help educators identify at-risk students early and intervene effectively.
""")

