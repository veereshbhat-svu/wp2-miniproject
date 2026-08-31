import React from 'react';

/**
 * Reusable Metric / KPI Stat Card
 * @param {string} label - Title of the metric
 * @param {number|string} value - Numerical counter / value
 * @param {React.Component} icon - Lucide Icon component
 * @param {string} iconColor - Icon color
 * @param {string} iconBg - Icon background badge color
 */
export const StatCard = ({ label, value, icon: Icon, iconColor = '#4338ca', iconBg = '#eef2ff' }) => {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }}>
            {label}
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>
            {value}
          </div>
        </div>
        {Icon && (
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={22} color={iconColor} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
