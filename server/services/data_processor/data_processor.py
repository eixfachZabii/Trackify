import pandas as pd
import json
import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import numpy as np
from pathlib import Path


class DataProcessor:
    """Handles all data processing operations for body composition data"""

    def __init__(self):
        self.data_file = "data/processed_data.json"
        self.ensure_data_directory()

    def ensure_data_directory(self):
        """Create data directory if it doesn't exist"""
        os.makedirs("data", exist_ok=True)

    def process_excel_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Process uploaded Excel file and convert to standardized format"""
        try:
            # Read Excel file
            df = pd.read_excel(file_path)

            # Map German column names to English
            column_mapping = {
                'Messdatum': 'date',
                'Gewicht(kg)': 'weight_kg',
                'BMI': 'bmi',
                'Körperfett(%)': 'body_fat_percent',
                'Fettfreies Körpergewicht(kg)': 'fat_free_weight_kg',
                'Subkutanes Fett(%)': 'subcutaneous_fat_percent',
                'Viszeralfett': 'visceral_fat',
                'Körperwasser(%)': 'body_water_percent',
                'Skelettmuskel(%)': 'skeletal_muscle_percent',
                'Muskelmasse(kg)': 'muscle_mass_kg',
                'Knochenmasse(kg)': 'bone_mass_kg',
                'Protein(%)': 'protein_percent',
                'Grundumsatz(kcal)': 'basal_metabolic_rate',
                'Stoffwechselalter': 'metabolic_age',
                'Bemerkungen': 'notes'
            }

            # Rename columns
            df = df.rename(columns=column_mapping)

            # Process dates - handle German date format
            df['date'] = pd.to_datetime(df['date'], format='%d.%m.%Y, %H:%M:%S')
            df['date'] = df['date'].dt.strftime('%Y-%m-%d %H:%M:%S')

            # Sort by date (newest first for display, but we'll also need chronological)
            df = df.sort_values('date', ascending=False)

            # Convert to list of dictionaries
            processed_data = df.to_dict('records')

            # Add derived metrics
            for record in processed_data:
                record.update(self._calculate_derived_metrics(record))

            # Save processed data
            self._save_processed_data(processed_data)

            return processed_data

        except Exception as e:
            raise Exception(f"Error processing Excel file: {str(e)}")

    def _calculate_derived_metrics(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate additional derived metrics"""
        derived = {}

        try:
            # Body composition ratios
            if record.get('weight_kg') and record.get('muscle_mass_kg'):
                derived['muscle_to_weight_ratio'] = round(
                    (record['muscle_mass_kg'] / record['weight_kg']) * 100, 2
                )

            # Fat to muscle ratio
            if record.get('body_fat_percent') and record.get('skeletal_muscle_percent'):
                derived['fat_muscle_ratio'] = round(
                    record['body_fat_percent'] / record['skeletal_muscle_percent'], 2
                )

            # BMI category
            bmi = record.get('bmi')
            if bmi:
                if bmi < 18.5:
                    derived['bmi_category'] = 'underweight'
                elif bmi < 25:
                    derived['bmi_category'] = 'normal'
                elif bmi < 30:
                    derived['bmi_category'] = 'overweight'
                else:
                    derived['bmi_category'] = 'obese'

            # Fitness score (simple composite)
            if all(key in record for key in ['skeletal_muscle_percent', 'body_fat_percent', 'body_water_percent']):
                fitness_score = (
                        record['skeletal_muscle_percent'] * 0.4 +
                        (100 - record['body_fat_percent']) * 0.4 +
                        record['body_water_percent'] * 0.2
                )
                derived['fitness_score'] = round(fitness_score, 1)

        except Exception as e:
            print(f"Error calculating derived metrics: {e}")

        return derived

    def _save_processed_data(self, data: List[Dict[str, Any]]):
        """Save processed data to JSON file"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            raise Exception(f"Error saving processed data: {str(e)}")

    def get_body_composition_data(
            self,
            start_date: Optional[str] = None,
            end_date: Optional[str] = None,
            limit: Optional[int] = 100
    ) -> List[Dict[str, Any]]:
        """Retrieve body composition data with optional filtering"""
        try:
            if not os.path.exists(self.data_file):
                return []

            with open(self.data_file, 'r') as f:
                data = json.load(f)

            # Filter by date range if provided
            if start_date or end_date:
                filtered_data = []
                for record in data:
                    record_date = datetime.strptime(record['date'], '%Y-%m-%d %H:%M:%S')

                    if start_date:
                        start = datetime.strptime(start_date, '%Y-%m-%d')
                        if record_date < start:
                            continue

                    if end_date:
                        end = datetime.strptime(end_date, '%Y-%m-%d')
                        if record_date > end:
                            continue

                    filtered_data.append(record)

                data = filtered_data

            # Apply limit
            if limit:
                data = data[:limit]

            return data

        except Exception as e:
            raise Exception(f"Error retrieving data: {str(e)}")

    def get_latest_measurement(self) -> Optional[Dict[str, Any]]:
        """Get the most recent measurement"""
        try:
            data = self.get_body_composition_data(limit=1)
            return data[0] if data else None
        except Exception as e:
            print(f"Error getting latest measurement: {e}")
            return None

    def get_measurement_by_date(self, target_date: str) -> Optional[Dict[str, Any]]:
        """Get measurement closest to target date"""
        try:
            data = self.get_body_composition_data()
            target = datetime.strptime(target_date, '%Y-%m-%d')

            closest_record = None
            min_diff = timedelta.max

            for record in data:
                record_date = datetime.strptime(record['date'], '%Y-%m-%d %H:%M:%S')
                diff = abs(record_date - target)

                if diff < min_diff:
                    min_diff = diff
                    closest_record = record

            return closest_record

        except Exception as e:
            print(f"Error getting measurement by date: {e}")
            return None

    def get_data_summary(self) -> Dict[str, Any]:
        """Get summary statistics of the data"""
        try:
            data = self.get_body_composition_data()
            if not data:
                return {}

            df = pd.DataFrame(data)

            # Numeric columns for statistics
            numeric_cols = [
                'weight_kg', 'bmi', 'body_fat_percent', 'muscle_mass_kg',
                'skeletal_muscle_percent', 'body_water_percent', 'basal_metabolic_rate'
            ]

            summary = {
                'total_records': len(data),
                'date_range': {
                    'start': min(record['date'] for record in data),
                    'end': max(record['date'] for record in data)
                },
                'statistics': {}
            }

            for col in numeric_cols:
                if col in df.columns:
                    summary['statistics'][col] = {
                        'min': float(df[col].min()),
                        'max': float(df[col].max()),
                        'mean': float(df[col].mean()),
                        'current': float(data[0].get(col, 0))  # Most recent value
                    }

            return summary

        except Exception as e:
            raise Exception(f"Error getting data summary: {str(e)}")

    def export_to_csv(
            self,
            start_date: Optional[str] = None,
            end_date: Optional[str] = None
    ) -> str:
        """Export data to CSV file"""
        try:
            data = self.get_body_composition_data(start_date, end_date)
            if not data:
                raise Exception("No data to export")

            df = pd.DataFrame(data)

            # Create filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"trackify_export_{timestamp}.csv"
            filepath = f"static/{filename}"

            # Ensure static directory exists
            os.makedirs("static", exist_ok=True)

            # Export to CSV
            df.to_csv(filepath, index=False)

            return filename

        except Exception as e:
            raise Exception(f"Error exporting to CSV: {str(e)}")

    def calculate_trends(
            self,
            metric: str,
            days: int = 30
    ) -> Dict[str, Any]:
        """Calculate trends for a specific metric over specified days"""
        try:
            # Get data for the specified period
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)

            data = self.get_body_composition_data(
                start_date=start_date.strftime('%Y-%m-%d'),
                end_date=end_date.strftime('%Y-%m-%d')
            )

            if len(data) < 2:
                return {'trend': 'insufficient_data'}

            # Sort chronologically for trend calculation
            data.sort(key=lambda x: x['date'])

            values = [record.get(metric) for record in data if record.get(metric) is not None]

            if len(values) < 2:
                return {'trend': 'insufficient_data'}

            # Calculate trend
            first_value = values[0]
            last_value = values[-1]
            change = last_value - first_value
            percent_change = (change / first_value) * 100 if first_value != 0 else 0

            # Determine trend direction
            if abs(percent_change) < 1:
                trend = 'stable'
            elif percent_change > 0:
                trend = 'increasing'
            else:
                trend = 'decreasing'

            return {
                'trend': trend,
                'change': round(change, 2),
                'percent_change': round(percent_change, 2),
                'start_value': first_value,
                'end_value': last_value,
                'period_days': days,
                'data_points': len(values)
            }

        except Exception as e:
            print(f"Error calculating trends: {e}")
            return {'trend': 'error', 'message': str(e)}