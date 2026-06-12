import React, { useState } from 'react';

const PasswordField = ({
    label,
    value,
    onChange,
    placeholder = '********',
    required = false,
    name,
    autoComplete,
    groupStyle,
}) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className="form-group" style={groupStyle}>
            {label && <label>{label}</label>}
            <div className="password-input-wrap">
                <input
                    type={visible ? 'text' : 'password'}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                    autoComplete={autoComplete}
                />
                <button type="button" onClick={() => setVisible((current) => !current)}>
                    {visible ? 'Masquer' : 'Afficher'}
                </button>
            </div>
        </div>
    );
};

export default PasswordField;
