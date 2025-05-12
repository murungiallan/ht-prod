import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
import json
import sys
import warnings
warnings.filterwarnings('ignore')

def predict_calories(csv_path, output_path):
    try:
        # Load and preprocess data
        df = pd.read_csv(csv_path)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        df = df['calories'].resample('D').sum().fillna(method='ffill')

        # Pad data if fewer than 7 days
        if len(df) < 7:
            # Extend with mean calories
            mean_calories = df.mean() if not df.empty else 2000
            last_date = df.index[-1] if not df.empty else pd.Timestamp.now().floor('D')
            additional_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=7-len(df), freq='D')
            additional_data = pd.Series([mean_calories] * (7-len(df)), index=additional_dates)
            df = pd.concat([df, additional_data])

        # Fit ARIMA model (p=5, d=1, q=0) or simpler if very few data points
        order = (min(5, len(df)-1), 1, 0) if len(df) > 1 else (0, 0, 0)
        model = ARIMA(df, order=order)
        model_fit = model.fit()

        # Forecast next 7 days
        forecast = model_fit.forecast(steps=7)
        forecast_dates = pd.date_range(start=df.index[-1] + pd.Timedelta(days=1), periods=7, freq='D')

        # Prepare output
        predictions = [
            {'date': date.strftime('%Y-%m-%d'), 'value': round(value, 2)}
            for date, value in zip(forecast_dates, forecast)
        ]

        # Save predictions
        with open(output_path, 'w') as f:
            json.dump(predictions, f)

    except Exception as e:
        print(f"Error in ARIMA prediction: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python arima_predict.py <input_csv> <output_json>", file=sys.stderr)
        sys.exit(1)
    predict_calories(sys.argv[1], sys.argv[2])