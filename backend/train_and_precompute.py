import sys
# Prevent shadowed Linux bundle directories in backend/ from interfering with venv site-packages
if sys.path and (sys.path[0].replace('\\', '/').endswith('/backend') or sys.path[0].endswith('backend')):
    sys.path.pop(0)

import os
import json
import numpy as np
import pandas as pd
import psycopg2
import psycopg2.extras
from xgboost import XGBRegressor
import shap

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from risk_features import build_model_features, FEATURE_COLS
from risk_explain import aggregate_shap_to_groups, generate_explanation_sentence
from ground_truth_recovery import compute_data_level_recovery, compute_model_level_recovery

db_password = os.environ.get("DB_PASSWORD")
if not db_password:
    raise RuntimeError("DB_PASSWORD environment variable is required")

DB_CONFIG = dict(
    dbname=os.environ.get("DB_NAME", "ksp_crime"),
    user=os.environ.get("DB_USER", "postgres"),
    password=db_password,
    host=os.environ.get("DB_HOST", "localhost"),
    port=int(os.environ.get("DB_PORT", "5432")),
)

def main():
    print("Connecting to PostgreSQL to build station-week features...")
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=psycopg2.extras.RealDictCursor)
    df = build_model_features(conn)
    print(f"Features built: {len(df)} station-week records across {df['station_id'].nunique()} stations.")

    # Time-based train/test split (75% earlier weeks for train, 25% later weeks for test)
    split_week = df["week"].quantile(0.75, interpolation="nearest")
    train = df[df["week"] < split_week]
    test = df[df["week"] >= split_week]

    print(f"Training XGBoost model (Train rows: {len(train)}, Test rows: {len(test)})...")
    X_train, y_train = train[FEATURE_COLS], train["total_count"]
    X_test, y_test = test[FEATURE_COLS], test["total_count"]

    model = XGBRegressor(n_estimators=200, max_depth=4, learning_rate=0.05, random_state=42)
    model.fit(X_train, y_train)

    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f"Model trained! Train R²: {train_score:.3f}, Test R²: {test_score:.3f}")

    # Save trained model artifacts to backend directory
    model_path = os.path.join(backend_dir, "risk_model.json")
    model_df_path = os.path.join(backend_dir, "model_df.pkl")
    feature_cols_path = os.path.join(backend_dir, "feature_cols.json")

    model.save_model(model_path)
    df.to_pickle(model_df_path)
    with open(feature_cols_path, "w") as f:
        json.dump(FEATURE_COLS, f)
    print(f"Saved model artifacts: {model_path}, {model_df_path}, {feature_cols_path}")

    # Compute SHAP values for latest station risk scores
    print("Computing SHAP values for station predictions...")
    explainer = shap.TreeExplainer(model)
    exp_val = explainer.expected_value
    base_value = float(np.ravel(exp_val)[0]) if hasattr(exp_val, "__iter__") else float(exp_val)

    df["predicted"] = model.predict(df[FEATURE_COLS])
    shap_values = explainer.shap_values(df[FEATURE_COLS])

    # Latest week per station
    latest = df.sort_values("week").groupby("station_id").tail(1)

    results = []
    for idx, row in latest.iterrows():
        pos = df.index.get_loc(idx)
        grouped = aggregate_shap_to_groups(shap_values[pos], FEATURE_COLS)
        sentence = generate_explanation_sentence(row["station_name"], row["predicted"], base_value, grouped)
        results.append({
            "station_id": int(row["station_id"]),
            "station_name": row["station_name"],
            "district": row["district"],
            "week": row["week"].isoformat() if hasattr(row["week"], "isoformat") else str(row["week"]),
            "predicted_weekly_risk": round(float(row["predicted"]), 1),
            "baseline": round(base_value, 1),
            "shap_groups": grouped,
            "explanation": sentence,
        })

    results.sort(key=lambda r: r["predicted_weekly_risk"], reverse=True)
    risk_score_data = {"baseline": round(base_value, 1), "stations": results}

    precomputed_risk_path = os.path.join(backend_dir, "precomputed_risk_scores.json")
    with open(precomputed_risk_path, "w") as f:
        json.dump(risk_score_data, f, indent=2)
    print(f"Saved {len(results)} station risk scores to {precomputed_risk_path}")

    # Compute Ground Truth Recovery
    print("Computing Ground Truth Recovery for Maharashtra synthetic dataset...")
    data_level = compute_data_level_recovery(conn)
    conn.close()

    model_level = compute_model_level_recovery(model, df, FEATURE_COLS)
    gtr_data = {"data_level": data_level, "model_level": model_level}

    precomputed_gtr_path = os.path.join(backend_dir, "precomputed_gtr.json")
    with open(precomputed_gtr_path, "w") as f:
        json.dump(gtr_data, f, indent=2)
    print(f"Saved Ground Truth Recovery to {precomputed_gtr_path}")
    print("=" * 60)
    print("MAHARASHTRA MODEL TRAINING & PRECOMPUTATION COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
