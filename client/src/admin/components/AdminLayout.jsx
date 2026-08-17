import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import Icon from '../../components/ui/Icon.jsx';
import Button from '../../components/ui/Button.jsx';
import { Avatar } from '../../components/ui/Misc.jsx';

const NAV = [
  {
    group: 'Overview',
    items: [{ to: '/admin', end: true, label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    group: 'Content',
    items: [
      { to: '/admin/pages', label: 'Pages', icon: 'file' },
      { to: '/admin/services', label: 'Services', icon: 'sparkle' },
      { to: '/admin/vehicles', label: 'Fleet', icon: 'car' },
      { to: '/admin/blog', label: 'Blog', icon: 'edit' },
      { to: '/admin/faqs', label: 'FAQs', icon: 'headset' },
      { to: '/admin/testimonials', label: 'Testimonials', icon: 'quote' },
      { to: '/admin/media', label: 'Media library', icon: 'image' },
    ],
  },
  {
    group: 'SEO',
    items: [
      { to: '/admin/seo-pages', label: 'Landing pages', icon: 'map' },
      { to: '/admin/seo-templates', label: 'Templates', icon: 'copy' },
      { to: '/admin/redirects', label: 'Redirects', icon: 'route', adminOnly: true },
    ],
  },
  {
    group: 'Enquiries',
    items: [
      { to: '/admin/submissions/booking', label: 'Journey enquiries', icon: 'calendar', badge: 'booking' },
      { to: '/admin/submissions/contact', label: 'Contact messages', icon: 'mail', badge: 'contact' },
      { to: '/admin/submissions/corporate', label: 'Corporate', icon: 'briefcase', badge: 'corporate' },
      { to: '/admin/submissions/support', label: 'Support', icon: 'tool', badge: 'support' },
      { to: '/admin/submissions/newsletter', label: 'Newsletter', icon: 'users' },
    ],
  },
  {
    group: 'Configuration',
    items: [
      { to: '/admin/navigation', label: 'Navigation', icon: 'menu' },
      { to: '/admin/settings', label: 'Site settings', icon: 'settings' },
      { to: '/admin/users', label: 'Users & roles', icon: 'user', adminOnly: true },
    ],
  },
];

const AdminLayout = () => {
  const { profile, user, signOut, isAdmin } = useAuth();
  const { settings } = useSite();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Counts of unread enquiries, refreshed whenever the admin navigates.
  const stats = useApi('/admin/stats', { auth: true });

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('is-locked', open);
    return () => document.body.classList.remove('is-locked');
  }, [open]);

  const badge = (key) => stats.data?.submissions?.[key]?.new || 0;

  return (
    <div className="admin">
      {open ? <div className="admin-backdrop" onClick={() => setOpen(false)} role="presentation" /> : null}

      <aside className={`admin-sidebar ${open ? 'is-open' : ''}`.trim()}>
        <Link to="/admin" className="admin-sidebar__brand">
          <Icon name="dashboard" size={20} />
          <span>{settings.brandName}</span>
        </Link>

        <nav className="admin-sidebar__nav" aria-label="Admin navigation">
          {NAV.map((group) => {
            const items = group.items.filter((item) => !item.adminOnly || isAdmin);
            if (!items.length) return null;
            return (
              <div key={group.group}>
                <div className="admin-sidebar__group">{group.group}</div>
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `admin-sidebar__link ${isActive ? 'is-active' : ''}`.trim()}
                  >
                    <Icon name={item.icon} size={17} />
                    <span>{item.label}</span>
                    {item.badge && badge(item.badge) ? (
                      <span className="admin-sidebar__count">{badge(item.badge)}</span>
                    ) : null}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <Link to="/" className="admin-sidebar__link" target="_blank" rel="noopener noreferrer">
            <Icon name="external" size={16} />
            <span>View the website</span>
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="nav-toggle"
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            aria-expanded={open}
          >
            <Icon name="menu" size={20} />
          </button>

          <span className="admin-topbar__title">Content management</span>

          <Button variant="ghost" size="sm" href="/" icon="external">
            View site
          </Button>

          <span title={user?.email}>
            <Avatar name={profile?.displayName || user?.email || 'Admin'} size={34} />
          </span>

          <Button variant="ghost" size="sm" icon="logout" onClick={signOut}>
            Sign out
          </Button>
        </header>

        <main className="admin-content">
          <Outlet context={{ stats }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
