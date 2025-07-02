import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './LoadingSpinner';
import PhotoUpload from './PhotoUpload';
import PhotoModal from './PhotoModal';
import './PhotoGallery.css';

const PhotoGallery = () => {
  const { photos, actions, isLoading, error } = useApp();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, timeline, comparison
  const [filterTags, setFilterTags] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const uploadRef = useRef(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      await actions.loadPhotos();
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handlePhotoUpload = async (files, tags, date) => {
    try {
      const uploadPromises = Array.from(files).map(file =>
        actions.uploadPhoto(file, date, tags)
      );

      await Promise.all(uploadPromises);
      setShowUpload(false);

      // Show success message
      // You could add a toast notification here
    } catch (error) {
      console.error('Error uploading photos:', error);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        await actions.removePhoto(photoId);
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
  };

  const handlePhotoSelect = (photoId) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const getFilteredAndSortedPhotos = () => {
    let filtered = photos;

    // Filter by tags
    if (filterTags) {
      const tags = filterTags.toLowerCase().split(',').map(tag => tag.trim());
      filtered = filtered.filter(photo =>
        photo.tags.some(tag =>
          tags.some(filterTag => tag.toLowerCase().includes(filterTag))
        )
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.date) - new Date(b.date);
        case 'date_desc':
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return filtered;
  };

  const groupPhotosByMonth = (photos) => {
    const groups = {};
    photos.forEach(photo => {
      const monthKey = photo.date.toISOString().slice(0, 7); // YYYY-MM
      const monthName = photo.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });

      if (!groups[monthKey]) {
        groups[monthKey] = {
          name: monthName,
          photos: []
        };
      }
      groups[monthKey].photos.push(photo);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, group]) => group);
  };

  const getAllTags = () => {
    const tagSet = new Set();
    photos.forEach(photo => {
      photo.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  };

  const filteredPhotos = getFilteredAndSortedPhotos();
  const photoGroups = viewMode === 'timeline' ? groupPhotosByMonth(filteredPhotos) : null;
  const availableTags = getAllTags();

  if (isLoading && photos.length === 0) {
    return (
      <div className="photo-gallery-loading">
        <LoadingSpinner size="large" />
        <p>Loading your progress photos...</p>
      </div>
    );
  }

  return (
    <div className="photo-gallery">
      <div className="gallery-header">
        <div className="header-content">
          <h1>Progress Photos 📸</h1>
          <p>
            {photos.length === 0
              ? 'Start your visual journey by uploading your first progress photo!'
              : `${photos.length} photos tracking your transformation`
            }
          </p>
        </div>

        <div className="header-actions">
          <button
            className="upload-button primary-button"
            onClick={() => setShowUpload(true)}
          >
            Upload Photos
          </button>

          {selectedPhotos.size > 1 && (
            <button
              className="compare-button secondary-button"
              onClick={() => setShowComparison(true)}
            >
              Compare Selected ({selectedPhotos.size})
            </button>
          )}
        </div>
      </div>

      {photos.length > 0 && (
        <div className="gallery-controls">
          <div className="view-controls">
            <div className="view-mode-selector">
              {['grid', 'timeline'].map(mode => (
                <button
                  key={mode}
                  className={`view-mode-button ${viewMode === mode ? 'active' : ''}`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === 'grid' ? '▦' : '📅'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            <div className="sort-control">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="filter-controls">
            <div className="tag-filter">
              <input
                type="text"
                placeholder="Filter by tags..."
                value={filterTags}
                onChange={(e) => setFilterTags(e.target.value)}
                className="tag-filter-input"
              />

              {availableTags.length > 0 && (
                <div className="available-tags">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      className="tag-chip"
                      onClick={() => setFilterTags(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>Error loading photos: {error}</p>
          <button onClick={loadPhotos} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="no-photos-state">
          <div className="no-photos-content">
            <div className="no-photos-icon">📷</div>
            <h2>No Progress Photos Yet</h2>
            <p>Start documenting your fitness journey with progress photos!</p>
            <button
              className="primary-button"
              onClick={() => setShowUpload(true)}
            >
              Upload Your First Photo
            </button>
            <div className="upload-tips">
              <h3>Photo Tips:</h3>
              <ul>
                <li>Take photos in good lighting</li>
                <li>Use the same poses and angles for comparison</li>
                <li>Tag photos with categories (front, side, back, etc.)</li>
                <li>Take photos regularly for best progress tracking</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="gallery-content">
          {viewMode === 'grid' ? (
            <div className="photos-grid">
              {filteredPhotos.map(photo => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  isSelected={selectedPhotos.has(photo.id)}
                  onSelect={handlePhotoSelect}
                  onView={setSelectedPhoto}
                  onDelete={handleDeletePhoto}
                />
              ))}
            </div>
          ) : (
            <div className="photos-timeline">
              {photoGroups.map((group, index) => (
                <div key={index} className="timeline-group">
                  <div className="timeline-header">
                    <h3>{group.name}</h3>
                    <span className="photo-count">
                      {group.photos.length} photo{group.photos.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="timeline-photos">
                    {group.photos.map(photo => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        isSelected={selectedPhotos.has(photo.id)}
                        onSelect={handlePhotoSelect}
                        onView={setSelectedPhoto}
                        onDelete={handleDeletePhoto}
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photo Upload Modal */}
      {showUpload && (
        <PhotoUpload
          onUpload={handlePhotoUpload}
          onClose={() => setShowUpload(false)}
          availableTags={availableTags}
        />
      )}

      {/* Photo View Modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          photos={filteredPhotos}
          onClose={() => setSelectedPhoto(null)}
          onNext={(photo) => setSelectedPhoto(photo)}
          onPrevious={(photo) => setSelectedPhoto(photo)}
          onDelete={handleDeletePhoto}
        />
      )}

      {/* Comparison View */}
      {showComparison && selectedPhotos.size > 1 && (
        <PhotoComparison
          photos={filteredPhotos.filter(photo => selectedPhotos.has(photo.id))}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
};

// PhotoCard component
const PhotoCard = ({ photo, isSelected, onSelect, onView, onDelete, compact = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => setImageError(true);

  return (
    <div className={`photo-card ${compact ? 'compact' : ''} ${isSelected ? 'selected' : ''}`}>
      <div className="photo-container">
        {!imageLoaded && !imageError && (
          <div className="photo-placeholder">
            <LoadingSpinner size="small" />
          </div>
        )}

        {imageError ? (
          <div className="photo-error">
            <span>❌</span>
            <p>Failed to load</p>
          </div>
        ) : (
          <img
            src={photo.thumbnailUrl}
            alt={`Progress photo from ${photo.displayDate}`}
            className="photo-image"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            onClick={() => onView(photo)}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
        )}

        <div className="photo-overlay">
          <div className="photo-actions">
            <button
              className="select-button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(photo.id);
              }}
              title={isSelected ? 'Deselect' : 'Select for comparison'}
            >
              {isSelected ? '✓' : '○'}
            </button>

            <button
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(photo.id);
              }}
              title="Delete photo"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div className="photo-info">
        <div className="photo-date">{photo.displayDate}</div>
        {photo.tags.length > 0 && (
          <div className="photo-tags">
            {photo.tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {photo.closest_measurement && (
          <div className="measurement-info">
            <span className="measurement-weight">
              {photo.closest_measurement.weight_kg}kg
            </span>
            <span className="measurement-distance">
              {photo.days_from_measurement === 0
                ? 'Same day measurement'
                : `${photo.days_from_measurement} days from measurement`
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple PhotoComparison component (could be expanded)
const PhotoComparison = ({ photos, onClose }) => {
  return (
    <div className="photo-comparison-modal">
      <div className="comparison-content">
        <div className="comparison-header">
          <h2>Photo Comparison</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="comparison-photos">
          {photos.map(photo => (
            <div key={photo.id} className="comparison-photo">
              <img src={photo.fullImageUrl} alt={`Photo from ${photo.displayDate}`} />
              <div className="comparison-info">
                <p className="comparison-date">{photo.displayDate}</p>
                {photo.closest_measurement && (
                  <p className="comparison-weight">{photo.closest_measurement.weight_kg}kg</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhotoGallery;