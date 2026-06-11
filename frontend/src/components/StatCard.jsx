import React from 'react';

const StatCard = ({ title, value, hint, color = '#F59E0B' }) => (
    <div className="stat-card" style={{ borderLeftColor: color }}>
        <h4>{title}</h4>
        <div className="stat-number" style={{ color }}>{value}</div>
        {hint && <p>{hint}</p>}
    </div>
);

export default StatCard;
