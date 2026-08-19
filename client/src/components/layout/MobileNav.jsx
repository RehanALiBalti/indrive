import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Icon from '../ui/Icon.jsx';
import Button from '../ui/Button.jsx';

const SERVICE_PATH_RE = /^\/(airport-transfer|city-to-city-transfer|hourly-chauffeur|airport-transfers\/.+|chauffeur-service\/.+|city-to-city\/.+)$/;

/**
 * Off-canvas navigation for tablet and mobile. Purpose-built for touch rather
 * than a shrunken desktop menu: full-width targets, collapsible groups, and
 * contact actions pinned at the bottom where a thumb can reach them.
 */
const MobileNav = ({ open, onClose }) => {
  const { settings, menu } = useSite();
  const { isAuthenticated, isStaff, signOut } = useAuth();
  const { pathname } = useLocation();
  const isServicePage = pathname === '/' || SERVICE_PATH_RE.test(pathname);
  const [expanded, setExpanded] = useState(null);
  const panelRef = useRef(null);

  // The mobile menu is authored separately from the desktop menu so the CMS can
  // present a flatter, touch-friendly structure. It falls back to the header menu.
  const mobileItems = menu('mobile');
  const items = mobileItems.length ? mobileItems : menu('header');

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('is-locked');
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const timer = setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onKeyDown);
      clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  const phone = settings.contact?.phone;
  const email = settings.contact?.email;

  return (
    <>
      <div className="nav-mobile-backdrop" onClick={onClose} role="presentation" />
      <div
        id="mobile-navigation"
        className="nav-mobile"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="nav-mobile__header">
          <span className="brand__name">{settings.brandName}</span>
          <button type="button" className="nav-toggle" onClick={onClose} aria-label="Close menu">
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="nav-mobile__body" aria-label="Mobile navigation">
          {items.map((item) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;
            const key = item.id || item.href || item.label;

            if (!hasChildren) {
              return item.href?.startsWith('#') || item.href?.includes('#') ? (
                <a key={key} href={item.href} className="nav-mobile__link" onClick={onClose}>
                  {item.label}
                  <Icon name="chevronRight" size={16} />
                </a>
              ) : (
                <NavLink
                  key={key}
                  to={item.href}
                  className={({ isActive }) => `nav-mobile__link ${isActive ? 'is-active' : ''}`.trim()}
                  onClick={onClose}
                  end={item.href === '/'}
                >
                  {item.label}
                  <Icon name="chevronRight" size={16} />
                </NavLink>
              );
            }

            const isOpen = expanded === key;
            return (
              <div key={key}>
                <button
                  type="button"
                  className="nav-mobile__link"
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : key)}
                >
                  {item.label}
                  <Icon name={isOpen ? 'minus' : 'plus'} size={16} />
                </button>
                {isOpen ? (
                  <div className="nav-mobile__sub">
                    <Link to={item.href} onClick={onClose}>
                      Overview
                    </Link>
                    {item.children.map((child) => (
                      <Link key={child.id || child.href} to={child.href} onClick={onClose}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="nav-mobile__footer">
          {isServicePage ? (
            <Button variant="primary" block to="/#enquiry" onClick={onClose}>
              Get a fixed-price quote
            </Button>
          ) : (
            <Button variant="primary" block to="/contact" onClick={onClose}>
              Contact us
            </Button>
          )}

          <div className="nav-mobile__contact">
            {phone ? (
              <a href={`tel:${phone.replace(/\s/g, '')}`}>
                <Icon name="phone" size={16} />
                {phone}
              </a>
            ) : null}
            {email ? (
              <a href={`mailto:${email}`}>
                <Icon name="mail" size={16} />
                {email}
              </a>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {isStaff ? (
              <Button variant="outline" size="sm" to="/admin" onClick={onClose} icon="dashboard" block>
                Admin
              </Button>
            ) : null}
            {isAuthenticated ? (
              <>
                <Button variant="outline" size="sm" to="/account" onClick={onClose} icon="user" block>
                  My account
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="logout"
                  onClick={async () => {
                    await signOut();
                    onClose();
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" to="/login" onClick={onClose} block>
                  Sign in
                </Button>
                <Button variant="ghost" size="sm" to="/sign-up" onClick={onClose} block>
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNav;
