from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
import json
from datetime import datetime, timedelta
from typing import List, Optional
import os
from pathlib import Path
import uvicorn

# Import our custom modules
from services.data_processor.data_processor import DataProcessor
from services.photo_manager.photo_manager import PhotoManager
from services.analytics.analytics import AnalyticsEngine
from models.schemas import (
    BodyCompositionData,
    ProgressPhoto,
    AnalyticsResponse,
    DateRangeRequest
)

app = FastAPI(
    title="Trackify API",
    description="A comprehensive fitness progress tracking system",
    version="1.0.0"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite and CRA defaults
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
os.makedirs("data", exist_ok=True)
os.makedirs("uploads/photos", exist_ok=True)
os.makedirs("static", exist_ok=True)

# Mount static files for photos
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize services
data_processor = DataProcessor()
photo_manager = PhotoManager()
analytics_engine = AnalyticsEngine()

# Set up dependencies for analytics engine to avoid circular imports
analytics_engine.set_dependencies(data_processor, photo_manager)


@app.get("/")
async def root():
    return {"message": "Welcome to Trackify API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}


# =============================================================================
# DATA ENDPOINTS
# =============================================================================

@app.post("/api/upload-excel")
async def upload_excel_data(file: UploadFile = File(...)):
    """Upload and process Excel file with body composition data"""
    try:
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only Excel files are allowed")

        # Save uploaded file
        file_path = f"data/{file.filename}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Process the data
        processed_data = data_processor.process_excel_file(file_path)

        return {
            "message": "File uploaded and processed successfully",
            "records_count": len(processed_data),
            "date_range": {
                "start": min(record["date"] for record in processed_data),
                "end": max(record["date"] for record in processed_data)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/body-composition", response_model=List[BodyCompositionData])
async def get_body_composition_data(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: Optional[int] = 100
):
    """Get body composition data with optional date filtering"""
    try:
        data = data_processor.get_body_composition_data(start_date, end_date, limit)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics-summary")
async def get_metrics_summary():
    """Get summary statistics for all metrics"""
    try:
        summary = analytics_engine.get_metrics_summary()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# PHOTO ENDPOINTS
# =============================================================================

@app.post("/api/upload-photo")
async def upload_progress_photo(
        file: UploadFile = File(...),
        date: str = None,
        tags: str = "progress"
):
    """Upload a progress photo with date and tags"""
    try:
        photo_data = await photo_manager.save_photo(file, date, tags)
        return photo_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/photos", response_model=List[ProgressPhoto])
async def get_progress_photos(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        tags: Optional[str] = None,
        limit: Optional[int] = None
):
    """Get progress photos with optional filtering"""
    try:
        photos = photo_manager.get_photos(start_date, end_date, tags)
        if limit:
            photos = photos[:limit]
        return photos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/photos/{photo_id}")
async def delete_progress_photo(photo_id: str):
    """Delete a progress photo"""
    try:
        result = photo_manager.delete_photo(photo_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@app.post("/api/analytics/trends", response_model=AnalyticsResponse)
async def get_trend_analysis(request: DateRangeRequest):
    """Get comprehensive trend analysis for specified date range"""
    try:
        analysis = analytics_engine.get_trend_analysis(
            request.start_date,
            request.end_date,
            request.metrics
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/correlations")
async def get_metric_correlations():
    """Get correlation matrix between different body composition metrics"""
    try:
        correlations = analytics_engine.get_metric_correlations()
        return correlations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/predictions")
async def get_progress_predictions(days_ahead: int = 30):
    """Get predicted progress for specified number of days"""
    try:
        predictions = analytics_engine.get_progress_predictions(days_ahead)
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/goals")
async def check_goal_progress(target_weight: float, target_date: str):
    """Check progress towards specific goals"""
    try:
        goal_analysis = analytics_engine.check_goal_progress(target_weight, target_date)
        return goal_analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# EXPORT ENDPOINTS
# =============================================================================

@app.get("/api/export/csv")
async def export_data_csv(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
):
    """Export data as CSV"""
    try:
        csv_path = data_processor.export_to_csv(start_date, end_date)
        return {"download_url": f"/static/{csv_path}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/export/report")
async def generate_progress_report(
        start_date: str,
        end_date: str,
        include_photos: bool = True
):
    """Generate a comprehensive progress report"""
    try:
        report = analytics_engine.generate_progress_report(
            start_date, end_date, include_photos
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)