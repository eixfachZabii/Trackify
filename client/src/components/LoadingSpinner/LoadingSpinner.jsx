import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({
  size = 'medium',
  color = 'primary',
  text = null,
  inline = false
}) => {
  const spinnerClasses = [
    'loading-spinner',
    `spinner-${size}`,
    `spinner-${color}`,
    inline ? 'spinner-inline' : ''
  ].filter(Boolean).join(' ');

  if (inline) {
    return <div className={spinnerClasses} />;
  }

  return (
    <div className="loading-container">
      <div className={spinnerClasses} />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;