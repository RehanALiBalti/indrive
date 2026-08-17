import { Navigate, Route, Routes } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdminLayout from './components/AdminLayout.jsx';
import { ResourceListRoute } from './components/ResourceList.jsx';
import ResourceForm, { ResourceFormRoute } from './components/ResourceForm.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MediaPage from './pages/MediaPage.jsx';
import SubmissionsPage from './pages/SubmissionsPage.jsx';
import NavigationPage from './pages/NavigationPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import RedirectsPage from './pages/RedirectsPage.jsx';
import SeoPagesPage from './pages/SeoPagesPage.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';
import '../styles/admin.css';

/**
 * Admin CMS.
 *
 * Content types share one list and one form component driven by the resource
 * definitions, so the routing table stays small as collections are added.
 * Admin-only areas are guarded again here even though the API enforces roles
 * independently — the browser guard is purely for user experience.
 */
const AdminApp = () => (
  <>
    <Helmet>
      <title>Content management</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>

    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />

        <Route path="seo-pages" element={<SeoPagesPage />} />
        <Route path="seo-pages/:id" element={<ResourceForm resourceKey="seo-pages" />} />

        <Route path="media" element={<MediaPage />} />
        <Route path="submissions/:collection" element={<SubmissionsPage />} />
        <Route path="navigation" element={<NavigationPage />} />

        <Route
          path="settings"
          element={
            <ProtectedRoute role="admin">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute role="admin">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="redirects"
          element={
            <ProtectedRoute role="admin">
              <RedirectsPage />
            </ProtectedRoute>
          }
        />

        {/* Generic CRUD for pages, services, vehicles, blog, faqs,
            testimonials and seo-templates. */}
        <Route path=":resource" element={<ResourceListRoute />} />
        <Route path=":resource/:id" element={<ResourceFormRoute />} />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  </>
);

export default AdminApp;
