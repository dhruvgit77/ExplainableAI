import { renderToString } from 'react-dom/server';
import React from 'react';
import EDA from './src/pages/EDA.jsx';

try {
  const html = renderToString(<EDA />);
  console.log("Rendered OK length:", html.length);
} catch (e) {
  console.error("REACT RENDER ERROR:", e);
}
