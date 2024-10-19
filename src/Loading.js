// Loading.js
import React from 'react';
import './Loading.css'; // Optional: Create a separate CSS file for loading styles

const Loading = () => {
  return (
    <div className="loading">
      <p>Analyzing profile... <span className="cursor-blink"></span></p>
    </div>
  );
};

export default Loading;
