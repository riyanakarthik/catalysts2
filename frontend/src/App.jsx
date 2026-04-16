import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';

import Layout from './components/Layout';
import WelcomePage from './pages/WelcomePage';
import RegistrationPage from './pages/RegistrationPage';
import PlanSelectionPage from './pages/PlanSelectionPage';
import WorkerDashboardPage from './pages/WorkerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ClaimsListPage from './pages/ClaimsListPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />

          {/* Protected + Layout */}
          <Route element={<Layout />}>
            <Route
              path="/plan"
              element={
                <ProtectedRoute allowedRoles={['WORKER']}>
                  <PlanSelectionPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/worker"
              element={
                <ProtectedRoute allowedRoles={['WORKER']}>
                  <WorkerDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/claims"
              element={
                <ProtectedRoute allowedRoles={['WORKER', 'ADMIN']}>
                  <ClaimsListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}