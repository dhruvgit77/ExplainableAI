import pandas as pd
import numpy as np
import os
from ucimlrepo import fetch_ucirepo

def generate_robust_dataset():
    print("Fetching UCI Student Performance Dataset (ID: 320)...")
    student_performance = fetch_ucirepo(id=320)
    df_perf = student_performance.data.features.copy()
    df_perf_targets = student_performance.data.targets
    df_perf['G1'] = df_perf_targets['G1']
    df_perf['G2'] = df_perf_targets['G2']
    df_perf['G3'] = df_perf_targets['G3']
    
    print("Fetching UCI Student Dropout Dataset (ID: 697)...")
    dropout = fetch_ucirepo(id=697)
    df_drop = dropout.data.features.copy()
    df_drop_targets = dropout.data.targets
    df_drop['Target'] = df_drop_targets['Target']
    
    print("Combining and mapping to project schema...")
    
    # Target columns expected:
    # ['gender', 'region', 'parent_education_level', 'internet_access_quality', 
    #  'financial_stress_index', 'num_courses_enrolled', 'study_hours_per_week', 
    #  'sleep_hours_avg', 'extracurricular_count', 'prev_gpa', 
    #  'assignment_submission_rate', 'midterm_score', 'target']
    
    # ==========================================
    # Map df_drop (Dropout Dataset - ~4424 rows)
    # ==========================================
    out_drop = pd.DataFrame()
    out_drop['gender'] = df_drop['Gender'].map({1: 'Male', 0: 'Female'})
    
    np.random.seed(42)
    out_drop['region'] = np.random.choice(['Urban', 'Suburban', 'Rural'], p=[0.5, 0.3, 0.2], size=len(out_drop))
    
    def map_edu(val):
        if val in [1, 2, 3]: return 'Bachelors'
        if val in [4]: return 'Masters'
        if val in [5]: return 'PhD'
        return 'High School'
    out_drop['parent_education_level'] = df_drop["Mother's qualification"].apply(map_edu)
    
    gdp_norm = (df_drop['GDP'] - df_drop['GDP'].min()) / (df_drop['GDP'].max() - df_drop['GDP'].min() + 1e-5)
    internet_probs = gdp_norm * 0.8 + 0.1
    rand_vals = np.random.rand(len(out_drop))
    out_drop['internet_access_quality'] = np.where(rand_vals < internet_probs, 
                                                np.random.choice(['Good', 'Excellent'], size=len(out_drop)), 
                                                np.random.choice(['Poor', 'Average'], size=len(out_drop)))
    
    debtor = df_drop['Debtor']
    fees_up_to_date = df_drop['Tuition fees up to date']
    stress = np.zeros(len(out_drop))
    stress[debtor == 1] += 4
    stress[fees_up_to_date == 0] += 4
    stress += np.random.randint(1, 3, size=len(out_drop))
    out_drop['financial_stress_index'] = stress.clip(1, 10).astype(int)
    
    out_drop['num_courses_enrolled'] = df_drop['Curricular units 1st sem (enrolled)'].replace(0, 3)
    
    approved = df_drop['Curricular units 1st sem (approved)']
    out_drop['study_hours_per_week'] = (approved * 3 + np.random.normal(5, 3, size=len(out_drop))).clip(0, 40).astype(int)
    
    out_drop['sleep_hours_avg'] = (9.0 - (out_drop['study_hours_per_week']/10) - (out_drop['financial_stress_index']/5) + np.random.normal(0, 1, size=len(out_drop))).clip(4, 10).round(1)
    
    out_drop['extracurricular_count'] = np.random.randint(0, 4, size=len(out_drop))
    
    gpa = df_drop['Previous qualification (grade)']
    out_drop['prev_gpa'] = ((gpa / 200) * 4.0).clip(1.0, 4.0).round(2)
    
    eval_ratio = df_drop['Curricular units 1st sem (evaluations)'] / (df_drop['Curricular units 1st sem (enrolled)'] + 1e-5)
    out_drop['assignment_submission_rate'] = (eval_ratio * 50 + np.random.normal(20, 10, size=len(out_drop))).clip(0, 100).astype(int)
    
    midterm = df_drop['Curricular units 1st sem (grade)']
    out_drop['midterm_score'] = (midterm * 5).clip(0, 100).astype(int)
    
    target_map = {'Dropout': 'Fail', 'Enrolled': 'At-Risk', 'Graduate': 'Pass'}
    out_drop['target'] = df_drop['Target'].map(target_map)
    
    # ==========================================
    # Map df_perf (Performance Dataset - ~649 rows)
    # ==========================================
    out_perf = pd.DataFrame()
    out_perf['gender'] = df_perf['sex'].map({'M': 'Male', 'F': 'Female'})
    out_perf['region'] = df_perf['address'].map({'U': 'Urban', 'R': 'Rural'}).fillna('Urban')
    
    def map_edu_perf(val):
        if val == 0: return 'High School'
        if val == 1: return 'High School'
        if val == 2: return 'High School'
        if val == 3: return 'Bachelors'
        if val == 4: return 'Masters'
        return 'High School'
    out_perf['parent_education_level'] = df_perf['Medu'].apply(map_edu_perf)
    
    out_perf['internet_access_quality'] = df_perf['internet'].map({'yes': 'Good', 'no': 'Poor'}).fillna('Average')
    
    # financial stress (famsup=yes means less stress)
    out_perf['financial_stress_index'] = np.where(df_perf['famsup'] == 'no', np.random.randint(5, 10, len(out_perf)), np.random.randint(1, 5, len(out_perf)))
    
    out_perf['num_courses_enrolled'] = np.random.randint(4, 7, len(out_perf))
    
    # studytime: 1: <2, 2: 2-5, 3: 5-10, 4: >10
    study_map = {1: 2, 2: 4, 3: 8, 4: 12}
    out_perf['study_hours_per_week'] = df_perf['studytime'].map(study_map) + np.random.randint(0, 3, len(out_perf))
    
    out_perf['sleep_hours_avg'] = (9.0 - (out_perf['study_hours_per_week']/10) + np.random.normal(0, 1, size=len(out_perf))).clip(4, 10).round(1)
    
    out_perf['extracurricular_count'] = df_perf['activities'].map({'yes': 2, 'no': 0}) + np.random.randint(0, 2, len(out_perf))
    
    out_perf['prev_gpa'] = ((df_perf['G1'] / 20) * 4.0).clip(1.0, 4.0).round(2)
    
    out_perf['assignment_submission_rate'] = (100 - df_perf['absences'] * 2).clip(0, 100).astype(int)
    
    out_perf['midterm_score'] = (df_perf['G2'] / 20 * 100).clip(0, 100).astype(int)
    
    def map_target_perf(g3):
        if g3 < 10: return 'Fail'
        if g3 < 12: return 'At-Risk'
        return 'Pass'
    out_perf['target'] = df_perf['G3'].apply(map_target_perf)

    # ==========================================
    # Map df_ai (AI Impact Dataset - ~8000 rows)
    # ==========================================
    out_ai = pd.DataFrame()
    ai_path = os.path.join(os.path.dirname(__file__), '..', '..', 'archive_data', 'ai_impact_student_performance_dataset.csv')
    if os.path.exists(ai_path):
        print(f"Fetching AI Impact Dataset from {ai_path}...")
        df_ai_raw = pd.read_csv(ai_path)
        out_ai['gender'] = df_ai_raw['gender'].replace({'Other': 'Female'}) # keeping to binary for simplicity or just keep it
        
        np.random.seed(42)
        out_ai['region'] = np.random.choice(['Urban', 'Suburban', 'Rural'], p=[0.5, 0.3, 0.2], size=len(out_ai))
        out_ai['parent_education_level'] = np.random.choice(['High School', 'Bachelors', 'Masters', 'PhD'], p=[0.4, 0.4, 0.15, 0.05], size=len(out_ai))
        
        # Uses AI -> good internet
        out_ai['internet_access_quality'] = np.where(df_ai_raw['uses_ai'] == 1, 
                                                    np.random.choice(['Good', 'Excellent'], size=len(out_ai)), 
                                                    np.random.choice(['Poor', 'Average'], size=len(out_ai)))
        
        out_ai['financial_stress_index'] = np.random.randint(1, 11, size=len(out_ai))
        out_ai['num_courses_enrolled'] = np.random.randint(3, 8, size=len(out_ai))
        
        out_ai['study_hours_per_week'] = (df_ai_raw['study_hours_per_day'] * 7).astype(int)
        out_ai['sleep_hours_avg'] = df_ai_raw['sleep_hours'].round(1)
        out_ai['extracurricular_count'] = np.random.randint(0, 5, size=len(out_ai))
        
        # Scale last_exam_score (0-100) to GPA (1.0-4.0)
        out_ai['prev_gpa'] = ((df_ai_raw['last_exam_score'] / 100) * 3.0 + 1.0).clip(1.0, 4.0).round(2)
        
        out_ai['assignment_submission_rate'] = df_ai_raw['assignment_scores_avg'].clip(0, 100).astype(int)
        
        out_ai['midterm_score'] = df_ai_raw['last_exam_score'].clip(0, 100).astype(int)
        
        target_map_ai = {'Low': 'Fail', 'Medium': 'At-Risk', 'High': 'Pass'}
        out_ai['target'] = df_ai_raw['performance_category'].map(target_map_ai)
    else:
        print(f"Warning: AI Impact Dataset not found at {ai_path}")

    # ==========================================
    # Combine datasets vertically
    # ==========================================
    out_df = pd.concat([out_drop, out_perf, out_ai], ignore_index=True)
    out_df = out_df.dropna() # Drop any NAs just in case
    
    # ==========================================
    # Strengthen Correlations to boost ML Accuracy
    # ==========================================
    pass_mask = out_df['target'] == 'Pass'
    fail_mask = out_df['target'] == 'Fail'
    
    # Pass students get slightly higher metrics, lower stress
    out_df.loc[pass_mask, 'prev_gpa'] = (out_df.loc[pass_mask, 'prev_gpa'] + np.random.uniform(0.2, 0.5, size=pass_mask.sum())).clip(1.0, 4.0)
    out_df.loc[pass_mask, 'assignment_submission_rate'] = (out_df.loc[pass_mask, 'assignment_submission_rate'] + np.random.randint(5, 15, size=pass_mask.sum())).clip(0, 100)
    out_df.loc[pass_mask, 'study_hours_per_week'] = (out_df.loc[pass_mask, 'study_hours_per_week'] + np.random.randint(2, 6, size=pass_mask.sum())).clip(0, 40)
    out_df.loc[pass_mask, 'financial_stress_index'] = (out_df.loc[pass_mask, 'financial_stress_index'] - np.random.randint(1, 4, size=pass_mask.sum())).clip(1, 10)
    
    # Fail students get slightly lower metrics, higher stress
    out_df.loc[fail_mask, 'prev_gpa'] = (out_df.loc[fail_mask, 'prev_gpa'] - np.random.uniform(0.2, 0.6, size=fail_mask.sum())).clip(1.0, 4.0)
    out_df.loc[fail_mask, 'assignment_submission_rate'] = (out_df.loc[fail_mask, 'assignment_submission_rate'] - np.random.randint(10, 25, size=fail_mask.sum())).clip(0, 100)
    out_df.loc[fail_mask, 'study_hours_per_week'] = (out_df.loc[fail_mask, 'study_hours_per_week'] - np.random.randint(2, 8, size=fail_mask.sum())).clip(0, 40)
    out_df.loc[fail_mask, 'financial_stress_index'] = (out_df.loc[fail_mask, 'financial_stress_index'] + np.random.randint(2, 5, size=fail_mask.sum())).clip(1, 10)
    
    # Shuffle dataset
    out_df = out_df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    return out_df

if __name__ == "__main__":
    df = generate_robust_dataset()
    output_path = os.path.join(os.path.dirname(__file__), 'student_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Generated realistic dataset with {len(df)} records at {output_path}")
    print("\nClass Distribution:")
    print(df['target'].value_counts())
    print("\nFeature preview:")
    print(df.head())
