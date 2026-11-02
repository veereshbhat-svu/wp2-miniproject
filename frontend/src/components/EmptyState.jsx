import React from 'react';

/**
 * Reusable EmptyState / Action Notice Card
 * @param {React.Component} icon - Lucide Icon component
 * @param {string} iconColor - Hex color for the icon
 * @param {string} iconBg - Hex background for the circular icon container
 * @param {string} title - Main headline
 * @param {string|React.ReactNode} description - Subtext / details
 * @param {React.ReactNode} [actions] - Action buttons or primary button
 * @param {number} [maxWidth='640px'] - Max width of the card container
 */
export const EmptyState = ({
  icon: Icon,
  iconColor = '#4338ca',
  iconBg = '#eef2ff',
  title,
  description,
  actions,
  maxWidth = '640px',
}) => {
  return (
    <div className="page-enter" style={{ maxWidth, margin: '40px auto', textAlign: 'center' }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '48px 36px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        {Icon && (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Icon size={32} color={iconColor} />
          </div>
        )}

        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>
          {title}
        </h2>

        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: actions ? '28px' : 0 }}>
          {description}
        </p>

        {actions && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
