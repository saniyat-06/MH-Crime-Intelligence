import os
import sys
import json
import subprocess

def precompute():
    print("Precalculating risk scores and ground truth recovery...")
    temp_dir = os.path.join(os.getcwd(), "temp_ml")

    # 1. Check if xgboost and shap are already installed
    try:
        import xgboost
        import shap
        print("xgboost and shap are already importable. Skipping dynamic install.")
    except ImportError:
        os.makedirs(temp_dir, exist_ok=True)
        print("Installing xgboost and shap inside container...")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install",
            "xgboost==2.0.3", "shap==0.44.0", "--target", temp_dir, "--quiet"
        ])
        sys.path.insert(0, temp_dir)

    # Add current directory to sys.path
    sys.path.insert(0, os.getcwd())

    # 2. Import libraries
    import pandas as pd
    from xgboost import XGBRegressor
    import shap
    import psycopg2
    import psycopg2.extras

    # Define features
    CRIME_TYPES = ["Assault", "Burglary", "Chain Snatching", "Cybercrime", "Robbery", "Theft", "Vehicle Theft"]
    FEATURE_COLS = [
        "lag1_total", "roll4_total", "roll8_total", "roll4_prev4_ratio",
        "lag_night_share", "lag_weekend_share", "is_festival_season"
    ] + [f"mix_{ct}" for ct in CRIME_TYPES]

    # 3. Load the XGBoost model
    print("Loading XGBoost model...")
    model = XGBRegressor()
    model.load_model("risk_model.json")

    print("Initializing SHAP TreeExplainer...")
    explainer = shap.TreeExplainer(model)
    base_value = float(explainer.expected_value)

    # 4. Resolve database credentials
    print("Resolving Supabase credentials...")
    db_password = os.environ.get("DB_PASSWORD")
    if not db_password:
        raise RuntimeError("DB_PASSWORD environment variable is required")

    db_config = dict(
        dbname=os.environ.get("DB_NAME"),
        user=os.environ.get("DB_USER"),
        password=db_password,
        host=os.environ.get("DB_HOST"),
        port=int(os.environ.get("DB_PORT", "5432")) if os.environ.get("DB_PORT") else None
    )
    if not db_config["dbname"] or not db_config["host"]:
        raise RuntimeError("DB_NAME and DB_HOST environment variables are required")

    print("Connecting to Supabase database...")
    conn = psycopg2.connect(**db_config, cursor_factory=psycopg2.extras.RealDictCursor)

    # 5. Calculate risk features and predict
    print("Building model features from database...")
    from risk_features import build_model_features
    df = build_model_features(conn)

    risk_score_data = {"baseline": round(base_value, 1), "stations": []}
    if not df.empty:
        print("Running risk predictions...")
        df["predicted"] = model.predict(df[FEATURE_COLS])
        shap_values = explainer.shap_values(df[FEATURE_COLS])

        # Take the most recent week per station
        latest = df.sort_values("week").groupby("station_id").tail(1)

        from risk_explain import aggregate_shap_to_groups, generate_explanation_sentence

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
        print(f"Computed risk scores for {len(results)} stations.")
    else:
        print("No features built, database might be empty.")

    # 6. Ground truth recovery calculations
    print("Computing ground truth recovery...")
    from ground_truth_recovery import compute_data_level_recovery, compute_model_level_recovery
    data_level = compute_data_level_recovery(conn)
    conn.close()

    print("Loading model_df.pkl...")
    model_df = pd.read_pickle("model_df.pkl")
    model_level = compute_model_level_recovery(model, model_df, FEATURE_COLS)

    gtr_data = {"data_level": data_level, "model_level": model_level}
    print("Computed ground truth recovery details.")

    # 7. Save files
    print("Saving static JSON assets...")
    with open("precomputed_risk_scores.json", "w") as f:
        json.dump(risk_score_data, f)
    with open("precomputed_gtr.json", "w") as f:
        json.dump(gtr_data, f)

    # 8. Clean up temp_dir if it was created
    if os.path.exists(temp_dir):
        print("Cleaning up temporary ML directory...")
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
    print("ML precalculation completed successfully!")

if __name__ == "__main__":
    try:
        precompute()
    except Exception as e:
        print(f"FATAL ERROR in precompute: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
