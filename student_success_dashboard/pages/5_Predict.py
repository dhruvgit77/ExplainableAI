import streamlit as st
import pandas as pd
import numpy as np
import joblib
import os
import sys
import matplotlib.pyplot as plt
import shap

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from explainability.shap_explain import get_local_explanation

st.set_page_config(page_title="Live Prediction", page_icon="🔮", layout="wide")

st.title("🔮 Live Prediction & Intervention")

st.markdown("""
Use the form below to simulate a student's profile. The model will instantly predict their outcome and provide an AI-generated explanation of the key factors driving that prediction.
""")

@st.cache_resource
def load_assets():
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    models = joblib.load(os.path.join(model_dir, 'models.joblib'))
    preprocessor = joblib.load(os.path.join(model_dir, 'preprocessor.joblib'))
    feature_names = joblib.load(os.path.join(model_dir, 'feature_names.joblib'))
    return models['XGBoost'], preprocessor, feature_names

model, preprocessor, feature_names = load_assets()

# --- Input Form ---
with st.form("prediction_form"):
    st.subheader("Student Profile")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("**Academic Record**")
        prev_gpa = st.slider("Previous GPA", 1.0, 4.0, 3.2, 0.1)
        study_hours = st.slider("Study Hours / Week", 0, 40, 15, 1)
        midterm = st.slider("Midterm Score (%)", 0, 100, 75, 1)
        
    with col2:
        st.markdown("**Behavioral Indicators**")
        assignments = st.slider("Assignment Submission Rate (%)", 0, 100, 85, 1)
        courses = st.slider("Courses Enrolled", 3, 7, 5, 1)
        extracurricular = st.slider("Extracurricular Activities", 0, 4, 1, 1)
        
    with col3:
        st.markdown("**Demographics & Wellbeing**")
        sleep = st.slider("Average Sleep (Hours)", 3.0, 12.0, 7.0, 0.5)
        stress = st.slider("Financial Stress (1-10)", 1, 10, 5, 1)
        gender = st.selectbox("Gender", ['Male', 'Female', 'Non-binary'])
        region = st.selectbox("Region", ['Urban', 'Suburban', 'Rural'])
        parent_edu = st.selectbox("Parent Education", ['High School', 'Bachelors', 'Masters', 'PhD'])
        internet = st.selectbox("Internet Quality", ['Poor', 'Average', 'Good', 'Excellent'])
        
    submit_button = st.form_submit_button(label="Predict Student Outcome", use_container_width=True)

if submit_button:
    # Build dataframe
    input_data = pd.DataFrame({
        'gender': [gender],
        'region': [region],
        'parent_education_level': [parent_edu],
        'internet_access_quality': [internet],
        'num_courses_enrolled': [courses],
        'study_hours_per_week': [study_hours],
        'sleep_hours_avg': [sleep],
        'extracurricular_count': [extracurricular],
        'prev_gpa': [prev_gpa],
        'assignment_submission_rate': [assignments],
        'midterm_score': [midterm],
        'financial_stress_index': [stress]
    })
    
    # Preprocess
    with st.spinner("Processing..."):
        processed_data = preprocessor.transform(input_data)
        processed_df = pd.DataFrame(processed_data, columns=feature_names)
        
        # Predict
        pred_idx = model.predict(processed_df)[0]
        pred_probs = model.predict_proba(processed_df)[0]
        
        class_names = ['Fail', 'At-Risk', 'Pass']
        pred_class = class_names[pred_idx]
        confidence = pred_probs[pred_idx] * 100
        
    # Layout Results
    st.markdown("---")
    res_col1, res_col2 = st.columns([1, 2])
    
    with res_col1:
        st.markdown("### Prediction Result")
        
        color_map = {'Pass': '#00E5FF', 'At-Risk': '#FFB300', 'Fail': '#FF5252'}
        
        st.markdown(f"""
        <div style="background-color: #1E232E; padding: 30px; border-radius: 15px; text-align: center; border: 2px solid {color_map[pred_class]};">
            <h2 style="color: {color_map[pred_class]}; margin-bottom: 0;">{pred_class}</h2>
            <p style="color: #8B949E; font-size: 1.2rem;">Confidence: {confidence:.1f}%</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("### Suggested Interventions")
        if pred_class == 'Pass':
            st.success("Student is on track. Continue current support.")
        elif pred_class == 'At-Risk':
            st.warning("Early intervention recommended. Check assignment submission and midterm feedback.")
        else:
            st.error("Urgent intervention needed. Academic advising required immediately.")
            
    with res_col2:
        st.markdown("### Why? (SHAP Explanation)")
        with st.spinner("Generating SHAP visualization..."):
            explainer, local_shap_values = get_local_explanation(processed_df, "XGBoost")
            
            fig_waterfall, ax_w = plt.subplots(figsize=(8, 4))
            try:
                if isinstance(local_shap_values, list): # Older shap behavior
                    shap.waterfall_plot(shap.Explanation(values=local_shap_values[pred_idx][0], 
                                                         base_values=explainer.expected_value[pred_idx], 
                                                         data=processed_df.iloc[0], 
                                                         feature_names=feature_names), show=False)
                else: # Newer shap behavior (Explanation object)
                    shap.waterfall_plot(local_shap_values[0, :, pred_idx], show=False)
                st.pyplot(fig_waterfall, transparent=False)
            except Exception as e:
                st.warning("Could not render waterfall plot.")
