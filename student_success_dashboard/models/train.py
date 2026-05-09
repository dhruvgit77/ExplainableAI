import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score
from imblearn.over_sampling import SMOTE

def train_models():
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'student_data.csv')
    df = pd.read_csv(data_path)
    
    X = df.drop(columns=['target'])
    y = df['target']
    
    # Map target to integers for XGBoost
    target_mapping = {'Fail': 0, 'At-Risk': 1, 'Pass': 2}
    y_mapped = y.map(target_mapping)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y_mapped, test_size=0.2, random_state=42, stratify=y_mapped)
    
    numeric_features = ['num_courses_enrolled', 'study_hours_per_week', 'sleep_hours_avg', 
                        'extracurricular_count', 'prev_gpa', 'assignment_submission_rate', 
                        'midterm_score', 'financial_stress_index']
    categorical_features = ['gender', 'region', 'parent_education_level', 'internet_access_quality']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'), categorical_features)
        ])
    
    # Fit preprocessor on X_train and transform X_test
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    # Apply SMOTE to training data only
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train_processed, y_train)
    
    feature_names = numeric_features + list(preprocessor.named_transformers_['cat'].get_feature_names_out(categorical_features))
    
    # Define base models
    base_models = {
        'Random Forest': RandomForestClassifier(class_weight='balanced', random_state=42),
        'SVM': SVC(probability=True, class_weight='balanced', random_state=42),
        'Neural Network': MLPClassifier(max_iter=1000, random_state=42),
        'XGBoost': XGBClassifier(eval_metric='mlogloss', random_state=42)
    }
    
    # Define hyperparameter grids for RandomizedSearchCV
    param_grids = {
        'Random Forest': {
            'n_estimators': [100, 200, 300, 400],
            'max_depth': [None, 10, 15, 20],
            'min_samples_split': [2, 5, 10]
        },
        'SVM': {
            'C': [0.1, 1, 1.5, 10],
            'kernel': ['rbf', 'linear'],
            'gamma': ['scale', 'auto']
        },
        'Neural Network': {
            'hidden_layer_sizes': [(64,), (128, 64), (128, 64, 32)],
            'alpha': [0.0001, 0.001, 0.01],
            'learning_rate_init': [0.001, 0.01]
        },
        'XGBoost': {
            'n_estimators': [100, 200, 300, 400],
            'learning_rate': [0.01, 0.05, 0.1, 0.2],
            'max_depth': [3, 5, 8, 10],
            'subsample': [0.6, 0.8, 1.0],
            'colsample_bytree': [0.6, 0.8, 1.0]
        }
    }
    
    from sklearn.model_selection import RandomizedSearchCV
    
    trained_models = {}
    
    for name, model in base_models.items():
        print(f"Tuning and training {name} on balanced data...", flush=True)
        # Use fewer iterations for slower models
        n_iterations = 3 if name in ['SVM', 'Neural Network'] else 10
        random_search = RandomizedSearchCV(model, param_distributions=param_grids[name], 
                                           n_iter=n_iterations, cv=3, scoring='accuracy', n_jobs=-1, random_state=42)
        random_search.fit(X_train_resampled, y_train_resampled)
        
        best_model = random_search.best_estimator_
        y_pred = best_model.predict(X_test_processed)
        acc = accuracy_score(y_test, y_pred)
        print(f"Best params for {name}: {random_search.best_params_}", flush=True)
        print(f"{name} Accuracy: {acc:.4f}", flush=True)
        trained_models[name] = best_model
        
    # Save models, preprocessor, and feature names
    output_dir = os.path.dirname(__file__)
    joblib.dump(preprocessor, os.path.join(output_dir, 'preprocessor.joblib'))
    joblib.dump(trained_models, os.path.join(output_dir, 'models.joblib'))
    joblib.dump(feature_names, os.path.join(output_dir, 'feature_names.joblib'))
    
    # Save the test set for evaluation later
    pd.DataFrame(X_test_processed, columns=feature_names).to_csv(os.path.join(output_dir, 'X_test_processed.csv'), index=False)
    y_test.to_csv(os.path.join(output_dir, 'y_test.csv'), index=False)

if __name__ == "__main__":
    train_models()
