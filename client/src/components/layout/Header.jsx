import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Icon from '../ui/Icon.jsx';
import Button from '../ui/Button.jsx';
import MobileNav from './MobileNav.jsx';

const BrandMark = () => (
  <span className="brand__mark" aria-hidden="true">
    <Icon name="car" size={22} />
  </span>
);

export const Brand = ({ settings, inFooter = false }) => (
  <Link to="/" className={`brand ${inFooter ? 'footer__brand' : ''}`.trim()} aria-label={`${settings.brandName} — home`}>
    {settings.logo?.url ? (
      <img
        className="brand__logo"
        src={settings.logo.url}
        alt={settings.logo.alt || settings.brandName}
        height={40}
      />
    ) : (
      <BrandMark />
    )}
    <span className="brand__text">
      <span className="brand__name">{settings.brandName}</span>
      {settings.tagline ? <span className="brand__tagline">{settings.tagline}</span> : null}
    </span>
  </Link>
);

const DesktopItem = ({ item }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const closeTimer = useRef(null);
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;

  useEffect(() => {
    if (!open) return undefined;
    const onClickAway = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const onEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  if (!hasChildren) {
    return (
      <div className="nav-desktop__item">
        <NavLink
          to={item.href}
          className={({ isActive }) => `nav-desktop__link ${isActive ? 'is-active' : ''}`.trim()}
        >
          {item.label}
        </NavLink>
      </div>
    );
  }

  return (
    <div
      className="nav-desktop__item"
      ref={wrapperRef}
      onMouseEnter={() => {
        clearTimeout(closeTimer.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        closeTimer.current = setTimeout(() => setOpen(false), 150);
      }}
    >
      <button
        type="button"
        className="nav-desktop__link"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
      >
        {item.label}
        <Icon name="chevronDown" size={15} />
      </button>
      {open ? (
        <div className="nav-dropdown" role="menu">
          {item.children.map((child) => (
            <Link
              key={child.id || child.href}
              to={child.href}
              className="nav-dropdown__link"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="nav-dropdown__label">{child.label}</span>
              {child.description ? <span className="nav-dropdown__desc">{child.description}</span> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const Header = () => {
  const { settings, menu } = useSite();
  const { isAuthenticated, isStaff } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const items = menu('header');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const primaryCta = items.find((item) => item.highlight);
  const phone = settings.contact?.phone;

  return (
    <>
      <header className={`header ${scrolled ? 'header--scrolled' : ''}`.trim()}>
        <div className="container header__inner">
          <Brand settings={settings} />

          <nav className="nav-desktop" aria-label="Main navigation">
            {items
              .filter((item) => !item.highlight)
              .map((item) => (
                <DesktopItem key={item.id || item.href} item={item} />
              ))}
          </nav>

          <div className="header__actions">
            {phone ? (
              <a className="header__phone" href={`tel:${phone.replace(/\s/g, '')}`}>
                <Icon name="phone" size={16} />
                <span>{phone}</span>
              </a>
            ) : null}

            {isStaff ? (
              <Button className="header__cta" variant="ghost" size="sm" to="/admin" icon="dashboard">
                Admin
              </Button>
            ) : null}

            {!isStaff ? (
              <Button
                className="header__cta"
                variant="ghost"
                size="sm"
                to={isAuthenticated ? '/account' : '/login'}
                icon="user"
              >
                {isAuthenticated ? 'Account' : 'Sign in'}
              </Button>
            ) : null}

            <Button className="header__cta" variant="primary" size="sm" to={primaryCta?.href || '/#enquiry'}>
              {primaryCta?.label || 'Get a Quote'}
            </Button>

            <button
              type="button"
              className="nav-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              <Icon name="menu" size={22} />
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};

export default Header;
