import os

import numpy as np
import pandas as pd

try:
    from .real_modern import (
        load_real_modern, MODERN_NUMERIC, MODERN_CATEGORICAL,
    )
except ImportError:  # run as a script
    from real_modern import (
        load_real_modern, MODERN_NUMERIC, MODERN_CATEGORICAL,
    )


def generate_synthetic_data(num_records=6000, random_seed=42):
    """Build a unified student dataset that pairs SYNTHETIC traditional academic
    indicators with REAL modern AI-usage behaviour drawn from the survey
    (`Explainable Ai.csv`).

    Design:
      * Traditional features (CGPA, attendance, marks, demographics, …) are
        synthesised exactly as before — there is no real academic-grade data.
      * Modern features are NOT invented. For each synthetic student we sample a
        real survey respondent (with replacement) and copy their actual encoded
        AI-usage answers, so the joint distribution / correlations between the
        modern items are genuinely real.
      * The Pass / At-Risk / Fail outcome is a blend of BOTH signal groups. The
        modern contribution is anchored by the respondent's real self-reported
        "overall impact of AI on learning" (Q12) plus AI-health signals, so the
        Modern and Combined models have real predictive power and neither group
        alone determines the outcome.
    """
    np.random.seed(random_seed)
    n = num_records
    data = {}

    # ==================================================================
    # PART A — TRADITIONAL FEATURES (synthetic)
    # ==================================================================
    data['gender'] = np.random.choice(['Male', 'Female', 'Other'], p=[0.52, 0.45, 0.03], size=n)
    data['region'] = np.random.choice(
        ['North', 'South', 'East', 'West', 'Northeast', 'Central'],
        p=[0.25, 0.22, 0.15, 0.18, 0.08, 0.12], size=n)
    data['degree_type'] = np.random.choice(
        ['B.Tech', 'B.E.', 'BCA', 'MCA', 'M.Tech', 'B.Com'],
        p=[0.35, 0.20, 0.20, 0.10, 0.05, 0.10], size=n)
    data['parent_education'] = np.random.choice(
        ['Below 10th', '10th Pass', '12th Pass', 'Graduate', 'Post-Graduate'],
        p=[0.15, 0.25, 0.25, 0.25, 0.10], size=n)
    data['medium_of_instruction'] = np.random.choice(
        ['English', 'Hindi', 'Regional'], p=[0.45, 0.30, 0.25], size=n)
    data['internet_quality'] = np.random.choice(
        ['No Access', '2G/Slow', '3G/Moderate', '4G/Good', '5G/Excellent'],
        p=[0.05, 0.10, 0.20, 0.45, 0.20], size=n)
    data['coaching_enrolled'] = np.random.choice(['Yes', 'No'], p=[0.40, 0.60], size=n)
    data['financial_stress'] = np.random.randint(1, 11, size=n)

    data['num_subjects'] = np.random.randint(4, 9, size=n)
    data['study_hours_per_week'] = np.round(np.random.normal(18, 7, n).clip(0, 40), 1)
    data['attendance_rate'] = np.round(np.random.normal(82, 12, n).clip(40, 100), 1)
    data['sleep_hours_avg'] = np.round(np.random.normal(6.5, 1.5, n).clip(3, 12), 1)
    data['extracurricular_count'] = np.random.randint(0, 6, size=n)

    base_cgpa = (
        3.5
        + (data['study_hours_per_week'] / 40) * 2.5
        + (data['attendance_rate'] / 100) * 1.5
        + (data['sleep_hours_avg'] / 12) * 1.0
        - (data['financial_stress'] / 10) * 1.5
    )
    base_cgpa[data['coaching_enrolled'] == 'Yes'] += 0.6
    for deg, b in {'B.Tech': 0.2, 'B.E.': 0.1, 'B.Com': 0.4, 'MCA': -0.1, 'M.Tech': 0.3}.items():
        base_cgpa[data['degree_type'] == deg] += b
    base_cgpa[data['region'] == 'Northeast'] -= 0.4
    base_cgpa[data['region'] == 'Central'] -= 0.2
    for edu, b in {'Below 10th': -0.5, '10th Pass': -0.2, '12th Pass': 0.0,
                   'Graduate': 0.3, 'Post-Graduate': 0.5}.items():
        base_cgpa[data['parent_education'] == edu] += b
    for net, b in {'No Access': -0.8, '2G/Slow': -0.4, '3G/Moderate': 0.0,
                   '4G/Good': 0.2, '5G/Excellent': 0.3}.items():
        base_cgpa[data['internet_quality'] == net] += b
    base_cgpa[data['medium_of_instruction'] == 'English'] += 0.2
    base_cgpa[data['medium_of_instruction'] == 'Regional'] -= 0.2

    data['prev_cgpa'] = np.round(np.random.normal(base_cgpa, 0.8).clip(1.0, 10.0), 2)
    data['internal_marks_pct'] = np.round(
        (data['prev_cgpa'] / 10.0 * 70 + np.random.normal(15, 12, n)).clip(0, 100), 1)
    data['assignment_completion_pct'] = np.round(
        (data['prev_cgpa'] / 10.0 * 60 + np.random.normal(20, 14, n)).clip(0, 100), 1)

    df = pd.DataFrame(data)

    # ==================================================================
    # PART B — MODERN FEATURES (real, sampled from the survey)
    # ==================================================================
    real = load_real_modern()
    idx = np.random.randint(0, len(real), size=n)
    sampled = real.iloc[idx].reset_index(drop=True)

    for col in MODERN_NUMERIC + MODERN_CATEGORICAL:
        df[col] = sampled[col].values

    # ==================================================================
    # PART C — OUTCOME: blend of traditional + real-modern signal
    # ==================================================================

    # ----- Traditional sub-score (~0..100) -----
    t = np.zeros(n)
    t += (df['prev_cgpa'] / 10.0) * 18
    t += (df['internal_marks_pct'] / 100) * 16
    t += (df['assignment_completion_pct'] / 100) * 12
    t += (df['attendance_rate'] / 100) * 16
    t += (df['study_hours_per_week'] / 40) * 8
    t += (1.0 - np.abs(df['sleep_hours_avg'] - 7.5) / 4.5).clip(0, 1) * 5
    t += (1 - df['financial_stress'] / 10) * 8
    t += np.where(df['coaching_enrolled'] == 'Yes', 4, 0)
    t += (df['extracurricular_count'] / 5) * 3
    t += np.select(
        [df['degree_type'] == 'M.Tech', df['degree_type'] == 'B.Tech',
         df['degree_type'] == 'B.E.', df['degree_type'] == 'MCA',
         df['degree_type'] == 'BCA', df['degree_type'] == 'B.Com'],
        [4, 3.5, 3.0, 3.0, 2.5, 2.0], default=2.5)
    t += df['medium_of_instruction'].map({'English': 3, 'Hindi': 2, 'Regional': 1}).fillna(2).values
    t += df['parent_education'].map(
        {'Post-Graduate': 4, 'Graduate': 3, '12th Pass': 2, '10th Pass': 1, 'Below 10th': 0}).fillna(1).values
    t += df['internet_quality'].map(
        {'5G/Excellent': 3, '4G/Good': 2.5, '3G/Moderate': 1.5, '2G/Slow': 0.5, 'No Access': 0}).fillna(1).values
    t += df['region'].map(
        {'South': 2, 'West': 1.8, 'North': 1.5, 'East': 1, 'Central': 0.5, 'Northeast': 0.3}).fillna(1).values
    att_penalty = np.ones(n)
    att_penalty[df['attendance_rate'] < 75] = 0.70
    att_penalty[df['attendance_rate'] < 60] = 0.50
    traditional_score = t * att_penalty

    # ----- Modern sub-score (built ENTIRELY from the real survey features) -----
    # Positive = genuine, healthy AI-augmented learning. Negative = blind
    # outsourcing / digital distraction. Every term is a real model input, so the
    # relationship "AI-usage behaviour -> outcome" is genuinely learnable (no
    # leakage, no unrecoverable anchor).
    m = np.zeros(n)
    m += df['independent_after_ai'].values * 2.0      # can work without AI (good)
    m += df['verify_ai_answers'].values * 1.8         # checks AI output (good)
    m -= df['ai_reliance'].values * 1.4               # heavy dependence (bad)
    m -= df['ai_anxiety'].values * 1.2                # anxious without AI (bad)
    m -= df['reduced_thinking_effort'].values * 1.8   # AI killed effort (bad)
    m -= (df['ai_assignment_pct'].values / 100) * 8   # outsourcing assignments (bad)
    m -= df['multitask_studying'].values * 0.9        # distracted study (bad)
    m -= df['shortform_consumption'].values * 0.6
    m -= df['doomscroll_sleep'].values * 0.9
    m -= (df['nonstudy_screen_time'].values / 7) * 4  # screen time (bad)
    modern_score = m

    # ----- Combine (standardise so each group contributes by WEIGHT) -----
    def _z(x):
        return (x - np.mean(x)) / (np.std(x) + 1e-9)

    # Traditional academic record is a slightly stronger, cleaner driver of the
    # pass/fail outcome; modern AI-usage behaviour remains a major contributor.
    W_TRADITIONAL, W_MODERN = 0.58, 0.42
    combined = W_TRADITIONAL * _z(traditional_score) + W_MODERN * _z(modern_score)
    combined += np.random.normal(0, 0.06, n)  # irreducible noise -> realistic, not perfectly separable

    fail_cut, pass_cut = np.quantile(combined, [0.27, 0.60])
    conditions = [combined >= pass_cut, (combined >= fail_cut) & (combined < pass_cut), combined < fail_cut]
    df['target'] = np.select(conditions, ['Pass', 'At-Risk', 'Fail'], default='Fail')

    cols = [c for c in df.columns if c != 'target'] + ['target']
    return df[cols]


if __name__ == "__main__":
    df = generate_synthetic_data()
    output_path = os.path.join(os.path.dirname(__file__), 'student_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} records, {df.shape[1] - 1} features -> {output_path}")
    print("\nClass distribution:\n", df['target'].value_counts())
    print("\nColumns:\n", list(df.columns))
