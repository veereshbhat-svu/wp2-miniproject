import React from 'react';

const BADGE_CONFIGS = {
  normal:   { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', defaultLabel: 'Normal' },
  warning:  { bg: '#fffbeb', color: '#d97706', border: '#fde68a', defaultLabel: 'Warning' },
  abnormal: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', defaultLabel: 'Abnormal' },
};

/**
 * Reusable Clinical Status Badge Component
 * @param {string} status - 'Normal' | 'Warning' | 'Abnormal'
 * @param {boolean} [uppercase=false] - Whether to display text in UPPERCASE
 */
export const StatusBadge = ({ status, uppercase = false }) => {
  const key = (status || '').toLowerCase();
  const config = BADGE_CONFIGS[key] || {
    bg: '#f3f4f6',
    color: '#6b7280',
    border: '#e5e7eb',
    defaultLabel: status || 'Unknown',
  };

  const displayText = uppercase ? config.defaultLabel.toUpperCase() : (status || config.defaultLabel);

  return (
    <span
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        padding: '3px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        display: 'inline-block',
      }}
    >
      {displayText}
    </span>
  );
};

export default StatusBadge;
