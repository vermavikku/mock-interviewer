import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Providers } from './Providers';
import { router } from './Router';
import '../shared/styles/index.css';

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

export default App;
