import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import json


class AnalyticsEngine:
    """Provides advanced analytics and insights for fitness progress"""

    def __init__(self):
        self.data_processor = None
        self.photo_manager = None

    def set_dependencies(self, data_processor, photo_manager):
        """Set dependencies to avoid circular imports"""
        self.data_processor = data_processor
        self.photo_manager = photo_manager

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive metrics summary"""
        try:
            from ..data_processor.data_processor import DataProcessor
            if not self.data_processor:
                self.data_processor = DataProcessor()

            data = self.data_processor.get_body_composition_data()
            if not data:
                return {"error": "No data available"}

            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')

            # Key metrics
            metrics = [
                'weight_kg', 'bmi', 'body_fat_percent', 'muscle_mass_kg',
                'skeletal_muscle_percent', 'body_water_percent', 'basal_metabolic_rate',
                'visceral_fat', 'metabolic_age'
            ]

            summary = {
                'overview': {
                    'total_measurements': len(data),
                    'date_range': {
                        'start': df['date'].min().strftime('%Y-%m-%d'),
                        'end': df['date'].max().strftime('%Y-%m-%d'),
                        'duration_days': (df['date'].max() - df['date'].min()).days
                    },
                    'latest_measurement': data[0]['date'],
                    'measurement_frequency': self._calculate_measurement_frequency(df)
                },
                'current_stats': {},
                'trends': {},
                'achievements': self._identify_achievements(df),
                'health_insights': self._generate_health_insights(df)
            }

            # Current stats and trends for each metric
            for metric in metrics:
                if metric in df.columns:
                    current_value = df[metric].iloc[-1]

                    summary['current_stats'][metric] = {
                        'current': round(current_value, 2),
                        'min': round(df[metric].min(), 2),
                        'max': round(df[metric].max(), 2),
                        'avg': round(df[metric].mean(), 2),
                        'std': round(df[metric].std(), 2)
                    }

                    # Calculate trends for different periods
                    summary['trends'][metric] = {
                        'week': self._calculate_trend(df, metric, 7),
                        'month': self._calculate_trend(df, metric, 30),
                        'quarter': self._calculate_trend(df, metric, 90),
                        'year': self._calculate_trend(df, metric, 365)
                    }

            return summary

        except Exception as e:
            return {"error": f"Error generating metrics summary: {str(e)}"}

    def get_trend_analysis(
            self,
            start_date: str,
            end_date: str,
            metrics: List[str]
    ) -> Dict[str, Any]:
        """Comprehensive trend analysis for specified metrics and period"""
        try:
            from ..data_processor.data_processor import DataProcessor
            if not self.data_processor:
                self.data_processor = DataProcessor()

            data = self.data_processor.get_body_composition_data(start_date, end_date)
            if len(data) < 2:
                return {"error": "Insufficient data for trend analysis"}

            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')

            analysis = {
                'period': {
                    'start': start_date,
                    'end': end_date,
                    'duration_days': (pd.to_datetime(end_date) - pd.to_datetime(start_date)).days,
                    'data_points': len(data)
                },
                'metrics_analysis': {},
                'correlations': self._calculate_correlations(df, metrics),
                'change_velocity': {},
                'predictions': {}
            }

            for metric in metrics:
                if metric in df.columns and df[metric].notna().sum() > 1:
                    metric_analysis = self._analyze_metric_trend(df, metric)
                    analysis['metrics_analysis'][metric] = metric_analysis

                    # Calculate change velocity (rate of change)
                    analysis['change_velocity'][metric] = self._calculate_change_velocity(df, metric)

                    # Simple prediction for next 30 days
                    analysis['predictions'][metric] = self._predict_metric(df, metric, days_ahead=30)

            return analysis

        except Exception as e:
            return {"error": f"Error in trend analysis: {str(e)}"}

    def get_metric_correlations(self) -> Dict[str, Any]:
        """Calculate correlations between different metrics"""
        try:
            from ..data_processor import DataProcessor
            if not self.data_processor:
                self.data_processor = DataProcessor()

            data = self.data_processor.get_body_composition_data()
            if not data:
                return {"error": "No data available"}

            df = pd.DataFrame(data)

            # Numeric metrics for correlation
            numeric_metrics = [
                'weight_kg', 'bmi', 'body_fat_percent', 'muscle_mass_kg',
                'skeletal_muscle_percent', 'body_water_percent', 'basal_metabolic_rate',
                'visceral_fat', 'metabolic_age'
            ]

            # Filter existing columns
            available_metrics = [m for m in numeric_metrics if m in df.columns]
            correlation_df = df[available_metrics]

            # Calculate correlation matrix
            corr_matrix = correlation_df.corr()

            # Find strong correlations (|r| > 0.7)
            strong_correlations = []
            for i in range(len(corr_matrix.columns)):
                for j in range(i + 1, len(corr_matrix.columns)):
                    metric1 = corr_matrix.columns[i]
                    metric2 = corr_matrix.columns[j]
                    correlation = corr_matrix.iloc[i, j]

                    if abs(correlation) > 0.7:
                        strong_correlations.append({
                            'metric1': metric1,
                            'metric2': metric2,
                            'correlation': round(correlation, 3),
                            'strength': 'strong' if abs(correlation) > 0.8 else 'moderate',
                            'direction': 'positive' if correlation > 0 else 'negative'
                        })

            return {
                'correlation_matrix': corr_matrix.round(3).to_dict(),
                'strong_correlations': strong_correlations,
                'insights': self._interpret_correlations(strong_correlations)
            }

        except Exception as e:
            return {"error": f"Error calculating correlations: {str(e)}"}

    def get_progress_predictions(self, days_ahead: int = 30) -> Dict[str, Any]:
        """Predict progress for specified number of days"""
        try:
            from ..data_processor import DataProcessor
            if not self.data_processor:
                self.data_processor = DataProcessor()

            data = self.data_processor.get_body_composition_data(limit=90)  # Use last 90 days
            if len(data) < 10:
                return {"error": "Insufficient data for predictions"}

            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')

            # Key metrics to predict
            metrics_to_predict = ['weight_kg', 'body_fat_percent', 'muscle_mass_kg', 'bmi']

            predictions = {}

            for metric in metrics_to_predict:
                if metric in df.columns and df[metric].notna().sum() > 5:
                    prediction = self._predict_metric(df, metric, days_ahead)
                    if prediction:
                        predictions[metric] = prediction

            return {
                'prediction_period': days_ahead,
                'base_data_points': len(data),
                'predictions': predictions,
                'confidence_note': "Predictions are estimates based on recent trends and may vary with lifestyle changes"
            }

        except Exception as e:
            return {"error": f"Error generating predictions: {str(e)}"}

    def check_goal_progress(self, target_weight: float, target_date: str) -> Dict[str, Any]:
        """Check progress towards specific weight goal"""
        try:
            from ..data_processor import DataProcessor
            if not self.data_processor:
                self.data_processor = DataProcessor()

            latest_data = self.data_processor.get_latest_measurement()
            if not latest_data:
                return {"error": "No measurement data available"}

            current_weight = latest_data['weight_kg']
            current_date = datetime.strptime(latest_data['date'], '%Y-%m-%d %H:%M:%S')
            target_dt = datetime.strptime(target_date, '%Y-%m-%d')

            days_remaining = (target_dt - current_date).days
            weight_to_lose = current_weight - target_weight

            if days_remaining <= 0:
                return {"error": "Target date must be in the future"}

            # Calculate required weekly rate
            weeks_remaining = days_remaining / 7
            required_weekly_rate = weight_to_lose / weeks_remaining if weeks_remaining > 0 else 0

            # Get recent trend
            recent_data = self.data_processor.get_body_composition_data(limit=30)
            df = pd.DataFrame(recent_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')

            current_trend = self._calculate_trend(df, 'weight_kg', 30)

            # Assess feasibility
            feasibility = "realistic"
            if abs(required_weekly_rate) > 1.0:  # More than 1kg per week
                feasibility = "aggressive"
            elif abs(required_weekly_rate) > 0.5:
                feasibility = "challenging"
            elif abs(required_weekly_rate) < 0.2:
                feasibility = "conservative"

            return {
                'current_weight': current_weight,
                'target_weight': target_weight,
                'weight_to_change': round(weight_to_lose, 2),
                'days_remaining': days_remaining,
                'weeks_remaining': round(weeks_remaining, 1),
                'required_weekly_rate': round(required_weekly_rate, 2),
                'current_trend': current_trend,
                'feasibility': feasibility,
                'recommendation': self._get_goal_recommendation(
                    required_weekly_rate, current_trend, feasibility
                )
            }

        except Exception as e:
            return {"error": f"Error checking goal progress: {str(e)}"}

    def generate_progress_report(
            self,
            start_date: str,
            end_date: str,
            include_photos: bool = True
    ) -> Dict[str, Any]:
        """Generate comprehensive progress report"""
        try:
            # Get body composition data
            from ..data_processor import DataProcessor
            if not self.data_processor:
                self.data_processor = DataProcessor()

            data = self.data_processor.get_body_composition_data(start_date, end_date)

            if not data:
                return {"error": "No data available for the specified period"}

            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')

            # Get photos if requested
            photos = []
            if include_photos:
                from ..photo_manager import PhotoManager
                if not self.photo_manager:
                    self.photo_manager = PhotoManager()
                photos = self.photo_manager.get_photos(start_date, end_date)

            report = {
                'report_info': {
                    'period': f"{start_date} to {end_date}",
                    'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'duration_days': (pd.to_datetime(end_date) - pd.to_datetime(start_date)).days
                },
                'summary': {
                    'measurements_count': len(data),
                    'photos_count': len(photos),
                    'start_stats': self._get_period_stats(df.iloc[0]) if len(df) > 0 else {},
                    'end_stats': self._get_period_stats(df.iloc[-1]) if len(df) > 0 else {},
                },
                'key_changes': self._calculate_period_changes(df),
                'achievements': self._identify_achievements(df),
                'trends': self._get_period_trends(df),
                'health_insights': self._generate_health_insights(df),
                'photos_timeline': photos if include_photos else [],
                'recommendations': self._generate_recommendations(df)
            }

            return report

        except Exception as e:
            return {"error": f"Error generating progress report: {str(e)}"}

    # Helper methods

    def _calculate_measurement_frequency(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate how frequently measurements are taken"""
        if len(df) < 2:
            return {"frequency": "insufficient_data"}

        # Calculate days between measurements
        df = df.sort_values('date')
        intervals = df['date'].diff().dt.days.dropna()

        avg_interval = intervals.mean()

        if avg_interval <= 1:
            frequency = "daily"
        elif avg_interval <= 3:
            frequency = "frequent"
        elif avg_interval <= 7:
            frequency = "weekly"
        elif avg_interval <= 30:
            frequency = "monthly"
        else:
            frequency = "infrequent"

        return {
            "frequency": frequency,
            "avg_days_between": round(avg_interval, 1),
            "most_common_interval": intervals.mode().iloc[0] if len(intervals.mode()) > 0 else avg_interval
        }

    def _calculate_trend(self, df: pd.DataFrame, metric: str, days: int) -> Dict[str, Any]:
        """Calculate trend for a specific metric over specified days"""
        cutoff_date = df['date'].max() - timedelta(days=days)
        recent_df = df[df['date'] >= cutoff_date]

        if len(recent_df) < 2:
            return {"trend": "insufficient_data"}

        values = recent_df[metric].dropna()
        if len(values) < 2:
            return {"trend": "insufficient_data"}

        # Linear regression for trend
        x = np.arange(len(values)).reshape(-1, 1)
        model = LinearRegression().fit(x, values)
        slope = model.coef_[0]

        # Determine trend direction and magnitude
        threshold = values.std() * 0.1  # 10% of standard deviation

        if abs(slope) < threshold:
            direction = "stable"
        elif slope > 0:
            direction = "increasing"
        else:
            direction = "decreasing"

        # Calculate percentage change
        start_value = values.iloc[0]
        end_value = values.iloc[-1]
        pct_change = ((end_value - start_value) / start_value * 100) if start_value != 0 else 0

        return {
            "trend": direction,
            "slope": round(slope, 4),
            "change": round(end_value - start_value, 2),
            "percent_change": round(pct_change, 2),
            "data_points": len(values),
            "period_days": days
        }

    def _analyze_metric_trend(self, df: pd.DataFrame, metric: str) -> Dict[str, Any]:
        """Detailed analysis of a single metric"""
        values = df[metric].dropna()

        if len(values) < 2:
            return {"error": "Insufficient data"}

        # Basic statistics
        analysis = {
            "current": round(values.iloc[-1], 2),
            "start": round(values.iloc[0], 2),
            "min": round(values.min(), 2),
            "max": round(values.max(), 2),
            "mean": round(values.mean(), 2),
            "std": round(values.std(), 2),
            "total_change": round(values.iloc[-1] - values.iloc[0], 2),
            "total_change_percent": round(((values.iloc[-1] - values.iloc[0]) / values.iloc[0]) * 100, 2) if
            values.iloc[0] != 0 else 0
        }

        # Trend analysis
        x = np.arange(len(values)).reshape(-1, 1)
        model = LinearRegression().fit(x, values)
        analysis["trend_slope"] = round(model.coef_[0], 4)
        analysis["r_squared"] = round(model.score(x, values), 3)

        # Volatility
        daily_changes = values.diff().dropna()
        analysis["volatility"] = round(daily_changes.std(), 2)
        analysis["largest_daily_change"] = round(daily_changes.abs().max(), 2)

        return analysis

    def _calculate_correlations(self, df: pd.DataFrame, metrics: List[str]) -> Dict[str, Any]:
        """Calculate correlations between specified metrics"""
        available_metrics = [m for m in metrics if m in df.columns]

        if len(available_metrics) < 2:
            return {"error": "Need at least 2 metrics for correlation"}

        corr_df = df[available_metrics].corr()

        correlations = {}
        for i, metric1 in enumerate(available_metrics):
            for j, metric2 in enumerate(available_metrics):
                if i < j:  # Avoid duplicates
                    corr_value = corr_df.loc[metric1, metric2]
                    correlations[f"{metric1}_vs_{metric2}"] = round(corr_value, 3)

        return correlations

    def _calculate_change_velocity(self, df: pd.DataFrame, metric: str) -> Dict[str, Any]:
        """Calculate how quickly a metric is changing"""
        values = df[metric].dropna()
        dates = df.loc[values.index, 'date']

        if len(values) < 3:
            return {"error": "Insufficient data"}

        # Calculate changes per day
        changes = values.diff()
        time_diffs = dates.diff().dt.days

        daily_changes = changes / time_diffs
        daily_changes = daily_changes.dropna()

        return {
            "avg_daily_change": round(daily_changes.mean(), 4),
            "max_daily_change": round(daily_changes.max(), 4),
            "min_daily_change": round(daily_changes.min(), 4),
            "acceleration": round(daily_changes.diff().mean(), 6)  # Change in rate of change
        }

    def _predict_metric(self, df: pd.DataFrame, metric: str, days_ahead: int) -> Optional[Dict[str, Any]]:
        """Simple linear prediction for a metric"""
        try:
            values = df[metric].dropna()
            if len(values) < 5:
                return None

            # Use last 30 data points for prediction
            recent_values = values.tail(30)
            x = np.arange(len(recent_values)).reshape(-1, 1)

            model = LinearRegression().fit(x, recent_values)

            # Predict future values
            future_x = np.arange(len(recent_values), len(recent_values) + days_ahead).reshape(-1, 1)
            predictions = model.predict(future_x)

            current_value = values.iloc[-1]
            predicted_value = predictions[-1]

            return {
                "current_value": round(current_value, 2),
                "predicted_value": round(predicted_value, 2),
                "change": round(predicted_value - current_value, 2),
                "confidence": round(model.score(x, recent_values), 3),
                "trend": "increasing" if predicted_value > current_value else "decreasing" if predicted_value < current_value else "stable"
            }

        except Exception:
            return None

    def _identify_achievements(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Identify notable achievements and milestones"""
        achievements = []

        if len(df) < 2:
            return achievements

        # Weight milestones
        if 'weight_kg' in df.columns:
            weight_change = df['weight_kg'].iloc[-1] - df['weight_kg'].iloc[0]
            if weight_change < -5:
                achievements.append({
                    "type": "weight_loss",
                    "description": f"Lost {abs(weight_change):.1f} kg",
                    "value": abs(weight_change),
                    "category": "major" if abs(weight_change) > 10 else "significant"
                })
            elif weight_change > 2:  # Muscle gain
                achievements.append({
                    "type": "weight_gain",
                    "description": f"Gained {weight_change:.1f} kg",
                    "value": weight_change,
                    "category": "muscle_building"
                })

        # Body fat reduction
        if 'body_fat_percent' in df.columns:
            fat_change = df['body_fat_percent'].iloc[-1] - df['body_fat_percent'].iloc[0]
            if fat_change < -2:
                achievements.append({
                    "type": "fat_loss",
                    "description": f"Reduced body fat by {abs(fat_change):.1f}%",
                    "value": abs(fat_change),
                    "category": "major" if abs(fat_change) > 5 else "significant"
                })

        # Muscle mass increase
        if 'muscle_mass_kg' in df.columns:
            muscle_change = df['muscle_mass_kg'].iloc[-1] - df['muscle_mass_kg'].iloc[0]
            if muscle_change > 1:
                achievements.append({
                    "type": "muscle_gain",
                    "description": f"Gained {muscle_change:.1f} kg muscle mass",
                    "value": muscle_change,
                    "category": "muscle_building"
                })

        return achievements

    def _generate_health_insights(self, df: pd.DataFrame) -> List[str]:
        """Generate health insights based on data"""
        insights = []

        if len(df) < 2:
            return insights

        latest = df.iloc[-1]

        # BMI insights
        if 'bmi' in latest:
            bmi = latest['bmi']
            if bmi < 18.5:
                insights.append("Your BMI indicates you're underweight. Consider consulting a nutritionist.")
            elif 18.5 <= bmi < 25:
                insights.append("Your BMI is in the healthy range. Great job maintaining a healthy weight!")
            elif 25 <= bmi < 30:
                insights.append("Your BMI indicates you're overweight. Focus on creating a caloric deficit.")
            else:
                insights.append("Your BMI indicates obesity. Consider consulting a healthcare professional.")

        # Body fat insights
        if 'body_fat_percent' in latest:
            body_fat = latest['body_fat_percent']
            if body_fat < 10:  # Assuming male, adjust based on gender
                insights.append("Your body fat is very low. Ensure you're maintaining adequate nutrition.")
            elif 10 <= body_fat <= 15:
                insights.append("Excellent body fat percentage! You're in athletic range.")
            elif 16 <= body_fat <= 20:
                insights.append("Good body fat percentage. You're in the fitness range.")
            elif body_fat > 25:
                insights.append("Consider focusing on fat loss through diet and cardio exercise.")

        # Hydration insight
        if 'body_water_percent' in latest:
            water_pct = latest['body_water_percent']
            if water_pct < 50:
                insights.append("Your body water percentage seems low. Ensure adequate hydration.")
            elif water_pct > 65:
                insights.append("Your body water percentage is high, which is generally positive.")

        return insights

    def _get_goal_recommendation(self, required_rate: float, current_trend: Dict, feasibility: str) -> str:
        """Generate goal achievement recommendation"""
        if feasibility == "aggressive":
            return "This goal requires aggressive changes. Consider extending timeline or consulting a professional."
        elif feasibility == "challenging":
            return "This goal is challenging but achievable with consistent effort and proper planning."
        elif feasibility == "conservative":
            return "This goal is very achievable. Stay consistent with your current approach."
        else:
            return "This goal appears realistic. Monitor progress and adjust as needed."

    def _get_period_stats(self, row) -> Dict[str, Any]:
        """Extract key stats for a specific measurement"""
        return {
            "weight": row.get('weight_kg', 0),
            "body_fat": row.get('body_fat_percent', 0),
            "muscle_mass": row.get('muscle_mass_kg', 0),
            "bmi": row.get('bmi', 0)
        }

    def _calculate_period_changes(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate changes over the entire period"""
        if len(df) < 2:
            return {}

        start = df.iloc[0]
        end = df.iloc[-1]

        changes = {}
        key_metrics = ['weight_kg', 'body_fat_percent', 'muscle_mass_kg', 'bmi']

        for metric in key_metrics:
            if metric in df.columns:
                change = end[metric] - start[metric]
                pct_change = (change / start[metric] * 100) if start[metric] != 0 else 0
                changes[metric] = {
                    "absolute": round(change, 2),
                    "percent": round(pct_change, 2)
                }

        return changes

    def _get_period_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get trends for the entire period"""
        trends = {}
        key_metrics = ['weight_kg', 'body_fat_percent', 'muscle_mass_kg']

        for metric in key_metrics:
            if metric in df.columns:
                trend = self._calculate_trend(df, metric, len(df))
                trends[metric] = trend

        return trends

    def _generate_recommendations(self, df: pd.DataFrame) -> List[str]:
        """Generate actionable recommendations based on progress"""
        recommendations = []

        if len(df) < 2:
            return ["Collect more data for personalized recommendations"]

        # Analyze trends and provide recommendations
        if 'weight_kg' in df.columns:
            weight_trend = self._calculate_trend(df, 'weight_kg', 30)
            if weight_trend['trend'] == 'increasing' and weight_trend['percent_change'] > 2:
                recommendations.append(
                    "Weight is trending upward. Consider reviewing caloric intake and exercise routine.")
            elif weight_trend['trend'] == 'stable':
                recommendations.append("Weight is stable. Great for maintenance phase!")

        if 'body_fat_percent' in df.columns:
            fat_trend = self._calculate_trend(df, 'body_fat_percent', 30)
            if fat_trend['trend'] == 'decreasing':
                recommendations.append("Body fat is decreasing - excellent progress! Keep up the current routine.")
            elif fat_trend['trend'] == 'stable' and df['body_fat_percent'].iloc[-1] > 20:
                recommendations.append(
                    "Consider adding more cardio or creating a larger caloric deficit to reduce body fat.")

        return recommendations

    def _interpret_correlations(self, correlations: List[Dict]) -> List[str]:
        """Interpret correlation findings"""
        insights = []

        for corr in correlations:
            metric1 = corr['metric1'].replace('_', ' ').title()
            metric2 = corr['metric2'].replace('_', ' ').title()

            if corr['direction'] == 'positive':
                insights.append(f"{metric1} and {metric2} tend to increase/decrease together (r={corr['correlation']})")
            else:
                insights.append(f"As {metric1} increases, {metric2} tends to decrease (r={corr['correlation']})")

        return insights