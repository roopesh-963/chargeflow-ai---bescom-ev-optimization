/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, Routes } from 'react-router-dom';

import { SkeletonCard } from './components/shared/SkeletonCard';
import { AuthProvider } from './context/AuthContext';
import { ZoneProvider } from './context/ZoneContext';
const Dashboard = lazy(() => import('./components/Dashboard'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <>
      <Toaster position="bottom-right" />
      <AuthProvider>
        <ZoneProvider>
          <Suspense fallback={<div className="p-6"><SkeletonCard height="400px" /></div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Navigate to="/dashboard/overview" replace />} />
              <Route path="/dashboard/:pageId" element={<Dashboard />} />
            </Routes>
          </Suspense>
        </ZoneProvider>
      </AuthProvider>
    </>
  );
}
