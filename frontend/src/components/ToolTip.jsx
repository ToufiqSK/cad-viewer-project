// Tooltip.js
import React from 'react';

const Tooltip = ({ children, message }) => {
  return (
    <div className="tooltip">
      {children}
      <span className="tooltip-text">{message}</span>
    </div>
  );
};

export default Tooltip;
