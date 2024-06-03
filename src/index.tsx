import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.scss';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';

const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);

import { injectStore } from './api/axios';
injectStore(store);

if (process.env.NODE_ENV !== 'development') {
  console.log = function () {};
}

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
);
