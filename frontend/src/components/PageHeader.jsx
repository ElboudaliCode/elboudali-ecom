import React from 'react';
import { Link } from 'react-router-dom';

const PageHeader = ({ eyebrow, title, subtitle, backTo = '/', backLabel = 'Accueil', actions }) => (
    <div className="page-header">
        <div>
            <div className="page-breadcrumb">
                <Link to={backTo}>{backLabel}</Link>
                {eyebrow && <span> / {eyebrow}</span>}
            </div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
    </div>
);

export default PageHeader;
