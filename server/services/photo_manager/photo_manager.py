import os
import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path
from PIL import Image, ExifTags
import shutil


class PhotoManager:
    """Handles progress photo upload, storage, and metadata management"""

    def __init__(self):
        self.photos_dir = "static/photos"
        self.thumbnails_dir = "static/thumbnails"
        self.metadata_file = "data/photos_metadata.json"
        self.ensure_directories()

    def ensure_directories(self):
        """Create necessary directories"""
        os.makedirs(self.photos_dir, exist_ok=True)
        os.makedirs(self.thumbnails_dir, exist_ok=True)
        os.makedirs("data", exist_ok=True)

    async def save_photo(
            self,
            file,
            date: Optional[str] = None,
            tags: str = "progress"
    ) -> Dict[str, Any]:
        """Save uploaded photo with metadata"""
        try:
            # Validate file type
            if not file.content_type.startswith('image/'):
                raise ValueError("File must be an image")

            # Generate unique filename
            file_extension = Path(file.filename).suffix.lower()
            if file_extension not in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                raise ValueError("Unsupported image format")

            photo_id = str(uuid.uuid4())
            filename = f"{photo_id}{file_extension}"
            file_path = os.path.join(self.photos_dir, filename)

            # Save original file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)

            # Extract EXIF data and create metadata
            metadata = self._extract_photo_metadata(file_path)

            # Use provided date or extract from EXIF or use current time
            if date:
                photo_date = datetime.strptime(date, '%Y-%m-%d').strftime('%Y-%m-%d %H:%M:%S')
            elif metadata.get('datetime_taken'):
                photo_date = metadata['datetime_taken']
            else:
                photo_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            # Create thumbnail
            thumbnail_path = self._create_thumbnail(file_path, photo_id + file_extension)

            # Prepare photo record
            photo_record = {
                'id': photo_id,
                'filename': filename,
                'original_filename': file.filename,
                'file_path': f"/static/photos/{filename}",
                'thumbnail_path': f"/static/thumbnails/{photo_id}_thumb{file_extension}",
                'date': photo_date,
                'tags': [tag.strip() for tag in tags.split(',')],
                'file_size': os.path.getsize(file_path),
                'width': metadata.get('width'),
                'height': metadata.get('height'),
                'upload_timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'metadata': metadata
            }

            # Save to metadata file
            self._save_photo_metadata(photo_record)

            return photo_record

        except Exception as e:
            # Clean up file if it was created
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
            raise Exception(f"Error saving photo: {str(e)}")

    def _extract_photo_metadata(self, file_path: str) -> Dict[str, Any]:
        """Extract metadata from photo including EXIF data"""
        metadata = {}

        try:
            with Image.open(file_path) as img:
                # Basic image info
                metadata['width'] = img.width
                metadata['height'] = img.height
                metadata['format'] = img.format
                metadata['mode'] = img.mode

                # Extract EXIF data
                if hasattr(img, '_getexif'):
                    exif_data = img._getexif()
                    if exif_data:
                        exif = {}
                        for tag_id, value in exif_data.items():
                            tag = ExifTags.TAGS.get(tag_id, tag_id)
                            exif[tag] = value

                        # Extract relevant EXIF fields
                        if 'DateTime' in exif:
                            try:
                                dt = datetime.strptime(exif['DateTime'], '%Y:%m:%d %H:%M:%S')
                                metadata['datetime_taken'] = dt.strftime('%Y-%m-%d %H:%M:%S')
                            except:
                                pass

                        if 'Make' in exif:
                            metadata['camera_make'] = exif['Make']
                        if 'Model' in exif:
                            metadata['camera_model'] = exif['Model']

                        metadata['exif'] = exif

        except Exception as e:
            print(f"Error extracting metadata: {e}")

        return metadata

    def _create_thumbnail(self, original_path: str, filename: str) -> str:
        """Create thumbnail for the photo"""
        try:
            thumbnail_size = (300, 300)
            thumbnail_filename = filename.rsplit('.', 1)[0] + '_thumb.' + filename.rsplit('.', 1)[1]
            thumbnail_path = os.path.join(self.thumbnails_dir, thumbnail_filename)

            with Image.open(original_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')

                # Create thumbnail maintaining aspect ratio
                img.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
                img.save(thumbnail_path, optimize=True, quality=85)

            return thumbnail_path

        except Exception as e:
            print(f"Error creating thumbnail: {e}")
            return ""

    def _save_photo_metadata(self, photo_record: Dict[str, Any]):
        """Save photo metadata to JSON file"""
        try:
            # Load existing metadata
            if os.path.exists(self.metadata_file):
                with open(self.metadata_file, 'r') as f:
                    metadata = json.load(f)
            else:
                metadata = []

            # Add new record
            metadata.append(photo_record)

            # Sort by date (newest first)
            metadata.sort(key=lambda x: x['date'], reverse=True)

            # Save back to file
            with open(self.metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)

        except Exception as e:
            raise Exception(f"Error saving photo metadata: {str(e)}")

    def get_photos(
            self,
            start_date: Optional[str] = None,
            end_date: Optional[str] = None,
            tags: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve photos with optional filtering"""
        try:
            if not os.path.exists(self.metadata_file):
                return []

            with open(self.metadata_file, 'r') as f:
                photos = json.load(f)

            # Filter by date range
            if start_date or end_date:
                filtered_photos = []
                for photo in photos:
                    photo_date = datetime.strptime(photo['date'], '%Y-%m-%d %H:%M:%S')

                    if start_date:
                        start = datetime.strptime(start_date, '%Y-%m-%d')
                        if photo_date < start:
                            continue

                    if end_date:
                        end = datetime.strptime(end_date, '%Y-%m-%d')
                        if photo_date > end:
                            continue

                    filtered_photos.append(photo)

                photos = filtered_photos

            # Filter by tags
            if tags:
                tag_list = [tag.strip().lower() for tag in tags.split(',')]
                photos = [
                    photo for photo in photos
                    if any(tag.lower() in [t.lower() for t in photo.get('tags', [])] for tag in tag_list)
                ]

            return photos

        except Exception as e:
            raise Exception(f"Error retrieving photos: {str(e)}")

    def delete_photo(self, photo_id: str) -> Dict[str, Any]:
        """Delete a photo and its metadata"""
        try:
            if not os.path.exists(self.metadata_file):
                raise Exception("No photos found")

            with open(self.metadata_file, 'r') as f:
                photos = json.load(f)

            # Find photo to delete
            photo_to_delete = None
            updated_photos = []

            for photo in photos:
                if photo['id'] == photo_id:
                    photo_to_delete = photo
                else:
                    updated_photos.append(photo)

            if not photo_to_delete:
                raise Exception("Photo not found")

            # Delete files
            original_path = os.path.join(self.photos_dir, photo_to_delete['filename'])
            if os.path.exists(original_path):
                os.remove(original_path)

            # Delete thumbnail
            thumbnail_filename = photo_to_delete['filename'].rsplit('.', 1)[0] + '_thumb.' + \
                                 photo_to_delete['filename'].rsplit('.', 1)[1]
            thumbnail_path = os.path.join(self.thumbnails_dir, thumbnail_filename)
            if os.path.exists(thumbnail_path):
                os.remove(thumbnail_path)

            # Update metadata file
            with open(self.metadata_file, 'w') as f:
                json.dump(updated_photos, f, indent=2)

            return {"message": "Photo deleted successfully", "deleted_id": photo_id}

        except Exception as e:
            raise Exception(f"Error deleting photo: {str(e)}")

    def get_photo_timeline(self) -> Dict[str, Any]:
        """Get photos organized by timeline for progress visualization"""
        try:
            photos = self.get_photos()

            # Group by month
            timeline = {}
            for photo in photos:
                date = datetime.strptime(photo['date'], '%Y-%m-%d %H:%M:%S')
                month_key = date.strftime('%Y-%m')

                if month_key not in timeline:
                    timeline[month_key] = {
                        'month': date.strftime('%B %Y'),
                        'photos': []
                    }

                timeline[month_key]['photos'].append(photo)

            # Sort months chronologically
            sorted_timeline = dict(sorted(timeline.items(), reverse=True))

            return {
                'timeline': sorted_timeline,
                'total_photos': len(photos),
                'date_range': {
                    'start': min(photo['date'] for photo in photos) if photos else None,
                    'end': max(photo['date'] for photo in photos) if photos else None
                }
            }

        except Exception as e:
            raise Exception(f"Error creating photo timeline: {str(e)}")

    def get_photos_for_date_range(self, start_date: str, end_date: str, data_processor=None) -> List[Dict[str, Any]]:
        """Get photos within a specific date range for correlation with body data"""
        try:
            photos = self.get_photos(start_date, end_date)

            # Add distance from measurement dates for better correlation
            if data_processor:
                measurements = data_processor.get_body_composition_data(start_date, end_date)

                for photo in photos:
                    photo_date = datetime.strptime(photo['date'], '%Y-%m-%d %H:%M:%S')

                    # Find closest measurement
                    closest_measurement = None
                    min_diff = None

                    for measurement in measurements:
                        measure_date = datetime.strptime(measurement['date'], '%Y-%m-%d %H:%M:%S')
                        diff = abs((photo_date - measure_date).days)

                        if min_diff is None or diff < min_diff:
                            min_diff = diff
                            closest_measurement = measurement

                    if closest_measurement:
                        photo['closest_measurement'] = closest_measurement
                        photo['days_from_measurement'] = min_diff

            return photos

        except Exception as e:
            raise Exception(f"Error getting photos for date range: {str(e)}")
