from datetime import datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field


class BodyCompositionData(BaseModel):
    """Model for body composition measurement data"""
    date: str = Field(..., description="Measurement date in YYYY-MM-DD HH:MM:SS format")
    weight_kg: float = Field(..., description="Weight in kilograms")
    bmi: float = Field(..., description="Body Mass Index")
    body_fat_percent: float = Field(..., description="Body fat percentage")
    fat_free_weight_kg: float = Field(..., description="Fat-free body weight in kg")
    subcutaneous_fat_percent: Optional[float] = Field(None, description="Subcutaneous fat percentage")
    visceral_fat: Optional[int] = Field(None, description="Visceral fat level")
    body_water_percent: float = Field(..., description="Body water percentage")
    skeletal_muscle_percent: float = Field(..., description="Skeletal muscle percentage")
    muscle_mass_kg: float = Field(..., description="Muscle mass in kilograms")
    bone_mass_kg: float = Field(..., description="Bone mass in kilograms")
    protein_percent: Optional[float] = Field(None, description="Protein percentage")
    basal_metabolic_rate: int = Field(..., description="Basal metabolic rate in kcal")
    metabolic_age: Optional[int] = Field(None, description="Metabolic age")
    notes: Optional[str] = Field(None, description="Additional notes")

    # Derived metrics
    muscle_to_weight_ratio: Optional[float] = Field(None, description="Muscle to weight ratio")
    fat_muscle_ratio: Optional[float] = Field(None, description="Fat to muscle ratio")
    bmi_category: Optional[str] = Field(None, description="BMI category")
    fitness_score: Optional[float] = Field(None, description="Composite fitness score")


class ProgressPhoto(BaseModel):
    """Model for progress photos"""
    id: str = Field(..., description="Unique photo identifier")
    filename: str = Field(..., description="Photo filename")
    original_filename: str = Field(..., description="Original uploaded filename")
    file_path: str = Field(..., description="Path to photo file")
    thumbnail_path: str = Field(..., description="Path to thumbnail")
    date: str = Field(..., description="Photo date in YYYY-MM-DD HH:MM:SS format")
    tags: List[str] = Field(default=[], description="Photo tags")
    file_size: int = Field(..., description="File size in bytes")
    width: Optional[int] = Field(None, description="Image width in pixels")
    height: Optional[int] = Field(None, description="Image height in pixels")
    upload_timestamp: str = Field(..., description="Upload timestamp")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    closest_measurement: Optional[BodyCompositionData] = Field(None, description="Closest body measurement")
    days_from_measurement: Optional[int] = Field(None, description="Days from closest measurement")


class DateRangeRequest(BaseModel):
    """Model for date range requests"""
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    metrics: Optional[List[str]] = Field(
        default=['weight_kg', 'body_fat_percent', 'muscle_mass_kg'],
        description="Metrics to analyze"
    )


class TrendAnalysis(BaseModel):
    """Model for trend analysis results"""
    trend: str = Field(..., description="Trend direction: increasing, decreasing, or stable")
    slope: Optional[float] = Field(None, description="Trend slope")
    change: float = Field(..., description="Absolute change over period")
    percent_change: float = Field(..., description="Percentage change over period")
    data_points: int = Field(..., description="Number of data points used")
    period_days: int = Field(..., description="Period length in days")


class MetricAnalysis(BaseModel):
    """Model for detailed metric analysis"""
    current: float = Field(..., description="Current value")
    start: float = Field(..., description="Starting value")
    min: float = Field(..., description="Minimum value in period")
    max: float = Field(..., description="Maximum value in period")
    mean: float = Field(..., description="Average value")
    std: float = Field(..., description="Standard deviation")
    total_change: float = Field(..., description="Total change over period")
    total_change_percent: float = Field(..., description="Total percentage change")
    trend_slope: float = Field(..., description="Linear trend slope")
    r_squared: float = Field(..., description="R-squared value for trend")
    volatility: float = Field(..., description="Volatility measure")
    largest_daily_change: float = Field(..., description="Largest single-day change")


class ChangeVelocity(BaseModel):
    """Model for change velocity analysis"""
    avg_daily_change: float = Field(..., description="Average daily change")
    max_daily_change: float = Field(..., description="Maximum daily change")
    min_daily_change: float = Field(..., description="Minimum daily change")
    acceleration: float = Field(..., description="Change in rate of change")


class Prediction(BaseModel):
    """Model for metric predictions"""
    current_value: float = Field(..., description="Current metric value")
    predicted_value: float = Field(..., description="Predicted value")
    change: float = Field(..., description="Predicted change")
    confidence: float = Field(..., description="Prediction confidence (R-squared)")
    trend: str = Field(..., description="Predicted trend direction")


class AnalyticsResponse(BaseModel):
    """Model for comprehensive analytics response"""
    period: Dict[str, Any] = Field(..., description="Analysis period information")
    metrics_analysis: Dict[str, MetricAnalysis] = Field(..., description="Detailed metric analysis")
    correlations: Dict[str, float] = Field(..., description="Metric correlations")
    change_velocity: Dict[str, ChangeVelocity] = Field(..., description="Change velocity analysis")
    predictions: Dict[str, Prediction] = Field(..., description="Metric predictions")


class Achievement(BaseModel):
    """Model for achievements and milestones"""
    type: str = Field(..., description="Achievement type")
    description: str = Field(..., description="Achievement description")
    value: float = Field(..., description="Achievement value")
    category: str = Field(..., description="Achievement category")


class MetricsSummary(BaseModel):
    """Model for comprehensive metrics summary"""
    overview: Dict[str, Any] = Field(..., description="Overview statistics")
    current_stats: Dict[str, Dict[str, float]] = Field(..., description="Current statistics")
    trends: Dict[str, Dict[str, TrendAnalysis]] = Field(..., description="Trend analysis")
    achievements: List[Achievement] = Field(..., description="Identified achievements")
    health_insights: List[str] = Field(..., description="Health insights")


class CorrelationAnalysis(BaseModel):
    """Model for correlation analysis"""
    correlation_matrix: Dict[str, Dict[str, float]] = Field(..., description="Correlation matrix")
    strong_correlations: List[Dict[str, Any]] = Field(..., description="Strong correlations")
    insights: List[str] = Field(..., description="Correlation insights")


class GoalProgress(BaseModel):
    """Model for goal progress tracking"""
    current_weight: float = Field(..., description="Current weight")
    target_weight: float = Field(..., description="Target weight")
    weight_to_change: float = Field(..., description="Weight to lose/gain")
    days_remaining: int = Field(..., description="Days remaining to target")
    weeks_remaining: float = Field(..., description="Weeks remaining to target")
    required_weekly_rate: float = Field(..., description="Required weekly change rate")
    current_trend: TrendAnalysis = Field(..., description="Current weight trend")
    feasibility: str = Field(..., description="Goal feasibility assessment")
    recommendation: str = Field(..., description="Goal recommendation")


class ProgressReport(BaseModel):
    """Model for comprehensive progress report"""
    report_info: Dict[str, Any] = Field(..., description="Report metadata")
    summary: Dict[str, Any] = Field(..., description="Period summary")
    key_changes: Dict[str, Dict[str, float]] = Field(..., description="Key metric changes")
    achievements: List[Achievement] = Field(..., description="Achievements during period")
    trends: Dict[str, TrendAnalysis] = Field(..., description="Period trends")
    health_insights: List[str] = Field(..., description="Health insights")
    photos_timeline: List[ProgressPhoto] = Field(..., description="Photos from period")
    recommendations: List[str] = Field(..., description="Actionable recommendations")


class PhotoTimeline(BaseModel):
    """Model for photo timeline view"""
    timeline: Dict[str, Dict[str, Any]] = Field(..., description="Timeline organized by month")
    total_photos: int = Field(..., description="Total number of photos")
    date_range: Dict[str, Optional[str]] = Field(..., description="Date range of photos")


class ExportResponse(BaseModel):
    """Model for export responses"""
    download_url: str = Field(..., description="Download URL for exported file")
    filename: Optional[str] = Field(None, description="Exported filename")
    format: Optional[str] = Field(None, description="Export format")
    records_count: Optional[int] = Field(None, description="Number of records exported")


class UploadResponse(BaseModel):
    """Model for file upload responses"""
    message: str = Field(..., description="Upload status message")
    records_count: Optional[int] = Field(None, description="Number of records processed")
    date_range: Optional[Dict[str, str]] = Field(None, description="Date range of uploaded data")
    filename: Optional[str] = Field(None, description="Uploaded filename")


class HealthCheckResponse(BaseModel):
    """Model for health check response"""
    status: str = Field(..., description="API health status")
    timestamp: datetime = Field(..., description="Health check timestamp")
    version: Optional[str] = Field(None, description="API version")


class ErrorResponse(BaseModel):
    """Model for error responses"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: Optional[datetime] = Field(None, description="Error timestamp")


# Request models for photo uploads
class PhotoUploadRequest(BaseModel):
    """Model for photo upload requests"""
    date: Optional[str] = Field(None, description="Photo date in YYYY-MM-DD format")
    tags: str = Field(default="progress", description="Comma-separated tags")


# Configuration models
class AppConfig(BaseModel):
    """Model for application configuration"""
    max_file_size: int = Field(default=50_000_000, description="Maximum file size in bytes")
    allowed_image_formats: List[str] = Field(
        default=['.jpg', '.jpeg', '.png', '.bmp', '.tiff'],
        description="Allowed image formats"
    )
    thumbnail_size: tuple = Field(default=(300, 300), description="Thumbnail dimensions")
    data_retention_days: int = Field(default=365, description="Data retention period in days")


# Validation models
class DateRange(BaseModel):
    """Model for date range validation"""
    start_date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Start date YYYY-MM-DD")
    end_date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="End date YYYY-MM-DD")

    def validate_date_range(self):
        """Validate that end_date is after start_date"""
        start = datetime.strptime(self.start_date, '%Y-%m-%d')
        end = datetime.strptime(self.end_date, '%Y-%m-%d')
        if end <= start:
            raise ValueError("End date must be after start date")
        return self


# Response wrapper
class APIResponse(BaseModel):
    """Generic API response wrapper"""
    success: bool = Field(..., description="Response success status")
    data: Optional[Any] = Field(None, description="Response data")
    message: Optional[str] = Field(None, description="Response message")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
