import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NetworkStatusBanner } from './components/common/NetworkStatusBanner';
import { SessionExpiryModal } from './components/common/SessionExpiryModal';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const HomePage = React.lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const JobsPage = React.lazy(() => import('./pages/JobsPage').then((module) => ({ default: module.JobsPage })));
const JobDetailPage = React.lazy(() => import('./pages/JobDetailPage').then((module) => ({ default: module.JobDetailPage })));
const CandidateDashboardPage = React.lazy(() => import('./pages/CandidateDashboardPage').then((module) => ({ default: module.CandidateDashboardPage })));
const CandidateInterviewsPage = React.lazy(() => import('./pages/CandidateInterviewsPage').then((module) => ({ default: module.CandidateInterviewsPage })));
const CandidateOffersPage = React.lazy(() => import('./pages/CandidateOffersPage').then((module) => ({ default: module.CandidateOffersPage })));
const HrJobsPage = React.lazy(() => import('./pages/hr/HrJobsPage').then((module) => ({ default: module.HrJobsPage })));
const HrPipelinePage = React.lazy(() => import('./pages/hr/HrPipelinePage').then((module) => ({ default: module.HrPipelinePage })));
const HrInterviewsPage = React.lazy(() => import('./pages/hr/HrInterviewsPage').then((module) => ({ default: module.HrInterviewsPage })));
const HrOffersPage = React.lazy(() => import('./pages/hr/HrOffersPage').then((module) => ({ default: module.HrOffersPage })));
const HrAnalyticsPage = React.lazy(() => import('./pages/hr/HrAnalyticsPage').then((module) => ({ default: module.HrAnalyticsPage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
const ForbiddenPage = React.lazy(() => import('./pages/ForbiddenPage').then((module) => ({ default: module.ForbiddenPage })));

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <NetworkStatusBanner />
        <AuthProvider>
          <BrowserRouter>
            <SessionExpiryModal />
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center" role="status">
                  Loading page...
                </div>
              }
            >
              <Routes>
                <Route element={<AppLayout />}>
                  {/* Public Routes */}
                  <Route path={ROUTES.HOME} element={<HomePage />} />
                  <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                  <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                  <Route path={ROUTES.JOBS} element={<JobsPage />} />
                  <Route path={ROUTES.JOB_DETAIL} element={<JobDetailPage />} />
                  <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />

                  {/* Candidate Portal (Authenticated) */}
                  <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'HR', 'RECRUITER', 'CANDIDATE']} />}>
                    <Route path={ROUTES.CANDIDATE} element={<CandidateDashboardPage />} />
                    <Route path={ROUTES.CANDIDATE_INTERVIEWS} element={<CandidateInterviewsPage />} />
                    <Route path={ROUTES.CANDIDATE_OFFERS} element={<CandidateOffersPage />} />
                  </Route>

                  {/* HR Workspace Routes (HR, RECRUITER and ADMIN) */}
                  <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'HR', 'RECRUITER']} />}>
                    <Route path={ROUTES.HR_JOBS} element={<HrJobsPage />} />
                    <Route path={ROUTES.HR_PIPELINE} element={<HrPipelinePage />} />
                    <Route path={ROUTES.HR_INTERVIEWS} element={<HrInterviewsPage />} />
                    <Route path={ROUTES.HR_OFFERS} element={<HrOffersPage />} />
                    <Route path={ROUTES.HR_ANALYTICS} element={<HrAnalyticsPage />} />
                  </Route>

                  {/* Admin Security Routes (ADMIN only) */}
                  <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
                    <Route path={ROUTES.ADMIN} element={<AdminPage />} />
                  </Route>

                  {/* Fallback 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
