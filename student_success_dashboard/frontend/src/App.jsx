import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import EDA from './pages/EDA';
import ModelComparison from './pages/ModelComparison';
import Explainability from './pages/Explainability';
import BiasAudit from './pages/BiasAudit';
import Predict from './pages/Predict';
import BatchPredict from './pages/BatchPredict';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/eda" element={<EDA />} />
          <Route path="/models" element={<ModelComparison />} />
          <Route path="/explainability" element={<Explainability />} />
          <Route path="/bias" element={<BiasAudit />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/batch" element={<BatchPredict />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
