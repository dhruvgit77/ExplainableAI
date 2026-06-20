import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import EDA from './pages/EDA';
import ModelComparison from './pages/ModelComparison';
import Explainability from './pages/Explainability';
import BiasAudit from './pages/BiasAudit';
import Predict from './pages/Predict';
import BatchPredict from './pages/BatchPredict';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<ProtectedRoute role="teacher"><Home /></ProtectedRoute>} />
            <Route path="/eda" element={<ProtectedRoute role="teacher"><EDA /></ProtectedRoute>} />
            <Route path="/models" element={<ProtectedRoute role="teacher"><ModelComparison /></ProtectedRoute>} />
            <Route path="/explainability" element={<ProtectedRoute role="teacher"><Explainability /></ProtectedRoute>} />
            <Route path="/bias" element={<ProtectedRoute role="teacher"><BiasAudit /></ProtectedRoute>} />
            <Route path="/predict" element={<ProtectedRoute role="teacher"><Predict /></ProtectedRoute>} />
            <Route path="/batch" element={<ProtectedRoute role="teacher"><BatchPredict /></ProtectedRoute>} />
            <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
