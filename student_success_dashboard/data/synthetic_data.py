import pandas as pd
import numpy as np
import os


def generate_synthetic_data(num_records=5000, random_seed=42):
    """Generate synthetic Indian student academic data for success prediction."""
    np.random.seed(random_seed)

    data = {}

    # ── 1. Demographics & Socioeconomic ──
    data['gender'] = np.random.choice(
        ['Male', 'Female', 'Other'],
        p=[0.52, 0.45, 0.03], size=num_records
    )
    data['region'] = np.random.choice(
        ['North', 'South', 'East', 'West', 'Northeast', 'Central'],
        p=[0.25, 0.22, 0.15, 0.18, 0.08, 0.12], size=num_records
    )
    data['board_type'] = np.random.choice(
        ['CBSE', 'ICSE', 'State Board', 'IB'],
        p=[0.40, 0.15, 0.40, 0.05], size=num_records
    )
    data['parent_education'] = np.random.choice(
        ['Below 10th', '10th Pass', '12th Pass', 'Graduate', 'Post-Graduate'],
        p=[0.15, 0.25, 0.25, 0.25, 0.10], size=num_records
    )
    data['medium_of_instruction'] = np.random.choice(
        ['English', 'Hindi', 'Regional'],
        p=[0.45, 0.30, 0.25], size=num_records
    )
    data['internet_quality'] = np.random.choice(
        ['No Access', '2G/Slow', '3G/Moderate', '4G/Good', '5G/Excellent'],
        p=[0.05, 0.10, 0.20, 0.45, 0.20], size=num_records
    )
    data['coaching_enrolled'] = np.random.choice(
        ['Yes', 'No'], p=[0.40, 0.60], size=num_records
    )
    data['financial_stress'] = np.random.randint(1, 11, size=num_records)

    # ── 2. Academic & Behavioral ──
    data['num_subjects'] = np.random.randint(4, 9, size=num_records)
    data['study_hours_per_week'] = np.round(
        np.random.normal(loc=18, scale=7, size=num_records).clip(0, 40), 1
    )
    data['attendance_rate'] = np.round(
        np.random.normal(loc=82, scale=12, size=num_records).clip(40, 100), 1
    )
    data['sleep_hours_avg'] = np.round(
        np.random.normal(loc=6.5, scale=1.5, size=num_records).clip(3, 12), 1
    )
    data['extracurricular_count'] = np.random.randint(0, 6, size=num_records)

    # ── 3. CGPA (1-10 UGC scale) with realistic biases ──
    # Attendance also influences base CGPA
    base_cgpa = (
        3.5
        + (data['study_hours_per_week'] / 40) * 2.5
        + (data['attendance_rate'] / 100) * 1.5
        + (data['sleep_hours_avg'] / 12) * 1.0
        - (data['financial_stress'] / 10) * 1.5
    )

    # Coaching boost
    coaching_mask = data['coaching_enrolled'] == 'Yes'
    base_cgpa[coaching_mask] += 0.6

    # Board bias (IB/ICSE slight advantage, State Board slight disadvantage)
    base_cgpa[data['board_type'] == 'IB'] += 0.4
    base_cgpa[data['board_type'] == 'ICSE'] += 0.2
    base_cgpa[data['board_type'] == 'State Board'] -= 0.3

    # Regional bias (Northeast, Central slightly lower due to infrastructure)
    base_cgpa[data['region'] == 'Northeast'] -= 0.4
    base_cgpa[data['region'] == 'Central'] -= 0.2

    # Parent education impact
    edu_boost = {
        'Below 10th': -0.5, '10th Pass': -0.2,
        '12th Pass': 0.0, 'Graduate': 0.3, 'Post-Graduate': 0.5,
    }
    for edu, boost in edu_boost.items():
        base_cgpa[data['parent_education'] == edu] += boost

    # Internet quality impact
    net_boost = {
        'No Access': -0.8, '2G/Slow': -0.4,
        '3G/Moderate': 0.0, '4G/Good': 0.2, '5G/Excellent': 0.3,
    }
    for net, boost in net_boost.items():
        base_cgpa[data['internet_quality'] == net] += boost

    # Medium of instruction (English medium slight advantage)
    base_cgpa[data['medium_of_instruction'] == 'English'] += 0.2
    base_cgpa[data['medium_of_instruction'] == 'Regional'] -= 0.2

    data['prev_cgpa'] = np.round(
        np.random.normal(loc=base_cgpa, scale=0.8).clip(1.0, 10.0), 2
    )

    # ── 4. Internal marks & assignment rate (partially correlated with CGPA) ──
    data['internal_marks_pct'] = np.round(
        (data['prev_cgpa'] / 10.0 * 70
         + np.random.normal(loc=15, scale=12, size=num_records)).clip(0, 100), 1
    )
    data['assignment_completion_pct'] = np.round(
        (data['prev_cgpa'] / 10.0 * 60
         + np.random.normal(loc=20, scale=14, size=num_records)).clip(0, 100), 1
    )

    df = pd.DataFrame(data)

    # ── 5. Target: Pass / At-Risk / Fail ──
    # ALL features contribute to the outcome score
    score = np.zeros(num_records, dtype=float)

    # Academic factors (46% weight)
    score += (df['prev_cgpa'] / 10.0) * 18
    score += (df['internal_marks_pct'] / 100) * 16
    score += (df['assignment_completion_pct'] / 100) * 12

    # Study behavior & Attendance (24% weight)
    score += (df['attendance_rate'] / 100) * 16       # 0-16 pts (MASSIVE factor)
    score += (df['study_hours_per_week'] / 40) * 8    # 0-8 pts
    
    # Optimal sleep is 7-8 hrs
    sleep_score = 1.0 - np.abs(df['sleep_hours_avg'] - 7.5) / 4.5
    score += sleep_score.clip(0, 1) * 5

    # Wellbeing & support (15% weight)
    score += (1 - df['financial_stress'] / 10) * 8
    score += np.where(df['coaching_enrolled'] == 'Yes', 4, 0)
    score += (df['extracurricular_count'] / 5) * 3

    # Education system (10% weight)
    board_score = np.select(
        [df['board_type'] == 'IB', df['board_type'] == 'ICSE',
         df['board_type'] == 'CBSE', df['board_type'] == 'State Board'],
        [4, 3, 2.5, 1.5], default=2
    )
    score += board_score
    medium_score = np.select([df['medium_of_instruction']=='English',df['medium_of_instruction']=='Hindi',df['medium_of_instruction']=='Regional'],[3,2,1],default=2)
    score += medium_score

    # Demographics (10% weight)
    parent_score = np.select([df['parent_education']=='Post-Graduate',df['parent_education']=='Graduate',df['parent_education']=='12th Pass',df['parent_education']=='10th Pass',df['parent_education']=='Below 10th'],[4,3,2,1,0],default=1)
    score += parent_score
    internet_score = np.select([df['internet_quality']=='5G/Excellent',df['internet_quality']=='4G/Good',df['internet_quality']=='3G/Moderate',df['internet_quality']=='2G/Slow',df['internet_quality']=='No Access'],[3,2.5,1.5,0.5,0],default=1)
    score += internet_score
    region_score = np.select([df['region']=='South',df['region']=='West',df['region']=='North',df['region']=='East',df['region']=='Central',df['region']=='Northeast'],[2,1.8,1.5,1,0.5,0.3],default=1)
    score += region_score

    # === CRITICAL NON-LINEAR PENALTIES ===
    # In real systems, low attendance forces a fail regardless of good marks.
    # If attendance < 75%, apply a 30% penalty to the total score.
    # If attendance < 60%, apply a 50% penalty to the total score.
    penalty_multiplier = np.ones(num_records)
    penalty_multiplier[df['attendance_rate'] < 75] = 0.70
    penalty_multiplier[df['attendance_rate'] < 60] = 0.50
    score *= penalty_multiplier

    # Add noise for realism
    score += np.random.normal(0, 3, size=num_records)

    # Thresholds calibrated
    conditions = [
        (score >= 60),
        (score >= 45) & (score < 60),
        (score < 45),
    ]
    choices = ['Pass', 'At-Risk', 'Fail']
    df['target'] = np.select(conditions, choices, default='Fail')

    return df


if __name__ == "__main__":
    df = generate_synthetic_data()
    output_path = os.path.join(os.path.dirname(__file__), 'student_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Generated Indian student dataset with {len(df)} records at {output_path}")
    print("\nClass Distribution:")
    print(df['target'].value_counts())
