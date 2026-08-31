import React from 'react';

/**
 * Reusable 10-Pad Urine Reagent Strip Tracker
 * @param {Array} pads - Array of pad definition objects [{ id, name, sampleHex }]
 * @param {number} [activePad=-1] - Currently processing pad index during CV scan
 * @param {string} [mode='grid'] - 'grid' for full scan tracker, 'strip' for horizontal compact mockup
 */
export const PadTracker = ({ pads = [], activePad = -1, mode = 'grid' }) => {
  if (mode === 'strip') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#ffffff',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', marginRight: '6px' }}>
          PADS:
        </span>
        {pads.map((pad, idx) => (
          <div
            key={pad.id || idx}
            title={`Pad ${idx + 1}: ${pad.name}`}
            style={{
              width: '18px',
              height: '28px',
              borderRadius: '3px',
              backgroundColor: pad.sampleHex,
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)',
        gap: '8px',
        background: '#ffffff',
        padding: '16px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
      }}
    >
      {pads.map((pad, index) => {
        const isDone = activePad >= index;
        const isCurrent = activePad === index;
        return (
          <div
            key={pad.id || index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '52px',
                backgroundColor: pad.sampleHex,
                borderRadius: '6px',
                position: 'relative',
                border: isCurrent
                  ? '3px solid #22c55e'
                  : isDone
                  ? '2px solid #10b981'
                  : '1px solid #cbd5e1',
                boxShadow: isCurrent ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isDone && (
                <div
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                  }}
                >
                  ✓
                </div>
              )}
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isDone ? '#1e293b' : '#94a3b8',
              }}
            >
              {pad.id}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PadTracker;
