import React from 'react';
import ReactDOM from 'react-dom/client';
// import App from './App';
import '@atlaskit/css-reset';
import Index from './Index';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Index />
  </React.StrictMode>,
);
