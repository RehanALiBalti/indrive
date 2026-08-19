import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import SiteLayout from './components/layout/SiteLayout.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import { RouteLoading } from './components/ui/States.jsx';

/* Public pages are loaded eagerly enough to keep navigation instant, while the
   heavier admin bundle is split out so visitors never download it. */
import CmsPage from './pages/CmsPage.jsx';
import FleetPage from './pages/FleetPage.jsx';
import VehiclePage from './pages/VehiclePage.jsx';
import BlogPage from './pages/BlogPage.jsx';
import BlogPostPage from './pages/BlogPostPage.jsx';
import SeoLandingPage from './pages/SeoLandingPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

import LoginPage from './pages/auth/LoginPage.jsx';
import SignUpPage from './pages/auth/SignUpPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import AuthActionPage from './pages/auth/AuthActionPage.jsx';
import AccountPage from './pages/auth/AccountPage.jsx';
import ThankYouPage from './pages/ThankYouPage.jsx';

const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
const AdminLoginPage = lazy(() => import('./admin/pages/AdminLoginPage.jsx'));

const App = () => (
  <Routes>
    {/* Admin login sits outside the role guard so unauthenticated staff can reach it. */}
    <Route
      path="/admin/login"
      element={
        <Suspense fallback={<RouteLoading />}>
          <AdminLoginPage />
        </Suspense>
      }
    />

    {/* Admin is mounted outside the public chrome and behind a role guard. */}
    <Route
      path="/admin/*"
      element={
        <ProtectedRoute role="editor" redirectTo="/admin/login">
          <Suspense fallback={<RouteLoading />}>
            <AdminApp />
          </Suspense>
        </ProtectedRoute>
      }
    />

    <Route element={<SiteLayout />}>
      {/* Fixed routes take precedence over the CMS catch-all below. */}
      <Route path="/fleet" element={<FleetPage />} />
      <Route path="/fleet/:slug" element={<VehiclePage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />

      {/* SEO landing page templates — one component, unlimited CMS pages. */}
      <Route path="/airport-transfers/:slug" element={<SeoLandingPage type="airport" />} />
      <Route path="/chauffeur-service/:slug" element={<SeoLandingPage type="city" />} />
      <Route path="/city-to-city/:slug" element={<SeoLandingPage type="city-to-city" />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth-action" element={<AuthActionPage />} />
      <Route path="/verify-email" element={<AuthActionPage />} />
      <Route path="/thank-you" element={<ThankYouPage />} />

      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />

      <Route path="/404" element={<NotFoundPage />} />

      {/* Everything else is resolved against the CMS at request time, so new
          pages published in the admin area are live without a deployment. */}
      <Route path="*" element={<CmsPage />} />
    </Route>
  </Routes>
);

export default App;
