import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({ title = 'Aucune donnee', description, actionLabel, actionTo }) => (
    <div className="empty-state">
        <div className="empty-state-mark">E</div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
        {actionLabel && actionTo && <Link to={actionTo} className="btn-cart empty-state-action">{actionLabel}</Link>}
    </div>
);

export default EmptyState;
