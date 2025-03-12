import React from 'react';
import ReactDOM from 'react-dom/client';
import FileTreeViewer from './components/FileTreeViewer';
import './assets/styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <FileTreeViewer />
  </React.StrictMode>
);