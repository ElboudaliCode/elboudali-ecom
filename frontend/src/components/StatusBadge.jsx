import React from 'react';

const StatusBadge = ({ status }) => (
    <span className={`badge badge-${status.variant || 'secondary'}`}>
        {status.label}
    </span>
);

export default StatusBadge;
