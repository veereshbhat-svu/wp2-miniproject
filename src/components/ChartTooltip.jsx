import React from 'react';

/**
 * Reusable Recharts Dark Mode Tooltip
 * @param {boolean} active - Chart active state
 * @param {Array} payload - Hovered data points
 * @param {string} label - Axis label (e.g. time or date)
 * @param {string} [unit=''] - Suffix unit for single series
 */
export const ChartTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#1a1a2e',
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid #374151',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>
          {label}
        </p>

        {payload.map((item, idx) => {
          const itemUnit = item.name === 'pH' ? '' : (unit || 'mg/dL');
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                marginBottom: idx < payload.length - 1 ? '4px' : 0,
              }}
            >
              {payload.length > 1 && (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: item.color || '#4338ca',
                  }}
                />
              )}
              <span style={{ color: '#d1d5db' }}>
                {payload.length > 1 ? `${item.name}:` : ''}
              </span>
              <span style={{ fontWeight: 600 }}>
                {item.value} {payload.length === 1 ? (unit || 'Tests Completed') : itemUnit}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default ChartTooltip;
