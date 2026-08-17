import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import Icon from '../ui/Icon.jsx';
import { Brand } from './Header.jsx';
import NewsletterForm from '../forms/NewsletterForm.jsx';

const SOCIAL = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'x', label: 'X' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'tiktok', label: 'TikTok' },
];

const FooterColumn = ({ heading, items }) => {
  if (!items.length) return null;
  return (
    <div>
      <h2 className="footer__heading">{heading}</h2>
      <ul className="footer__list">
        {items.map((item) => (
          <li key={item.id || item.href}>
            {item.external ? (
              <a href={item.href} target="_blank" rel="noopener noreferrer">
                {item.label}
              </a>
            ) : (
              <Link to={item.href}>{item.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Footer = () => {
  const { settings, menu, feature } = useSite();
  const contact = settings.contact || {};
  const address = [contact.addressLine1, contact.addressLine2, contact.city, contact.postcode]
    .filter(Boolean)
    .join(', ');

  const socialLinks = SOCIAL.filter((item) => settings.social?.[item.key]);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <Brand settings={settings} inFooter />
            {settings.footer?.about ? <p className="footer__about">{settings.footer.about}</p> : null}

            {socialLinks.length ? (
              <div className="footer__social">
                {socialLinks.map((item) => (
                  <a
                    key={item.key}
                    href={settings.social[item.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    title={item.label}
                  >
                    <Icon name="globe" size={18} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <FooterColumn heading="Services" items={menu('footer-services')} />
          <FooterColumn heading="Company" items={menu('footer-company')} />
          <FooterColumn heading="Legal" items={menu('footer-legal')} />

          <div>
            <h2 className="footer__heading">Contact</h2>
            <div className="footer__list">
              {contact.phone ? (
                <div className="footer__contact-item">
                  <Icon name="phone" size={16} />
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a>
                </div>
              ) : null}
              {contact.email ? (
                <div className="footer__contact-item">
                  <Icon name="mail" size={16} />
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </div>
              ) : null}
              {address ? (
                <div className="footer__contact-item">
                  <Icon name="pin" size={16} />
                  <address style={{ fontStyle: 'normal' }}>{address}</address>
                </div>
              ) : null}
              {contact.openingHours ? (
                <div className="footer__contact-item">
                  <Icon name="clock" size={16} />
                  <span>{contact.openingHours}</span>
                </div>
              ) : null}
            </div>

            {feature('newsletterEnabled') ? (
              <div className="footer__newsletter">
                <h2 className="footer__heading">Travel guides by email</h2>
                <NewsletterForm />
              </div>
            ) : null}
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            {settings.footer?.copyright ||
              `© ${new Date().getFullYear()} ${settings.legalName || settings.brandName}. All rights reserved.`}
          </p>
          <ul className="footer__legal">
            {menu('footer-legal').map((item) => (
              <li key={`bottom-${item.id || item.href}`}>
                <Link to={item.href}>{item.label}</Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="btn btn--link"
                style={{ color: 'inherit', fontSize: 'inherit' }}
                onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-preferences'))}
              >
                Cookie preferences
              </button>
            </li>
          </ul>
        </div>

        {settings.company?.registrationNumber || settings.company?.vatNumber ? (
          <p style={{ fontSize: 'var(--text-xs)', paddingBottom: 'var(--space-6)', opacity: 0.7 }}>
            {settings.legalName}
            {settings.company.registrationNumber
              ? ` · Registered no. ${settings.company.registrationNumber}`
              : ''}
            {settings.company.vatNumber ? ` · VAT no. ${settings.company.vatNumber}` : ''}
            {settings.company.licenceNumber ? ` · Licence ${settings.company.licenceNumber}` : ''}
          </p>
        ) : null}
      </div>
    </footer>
  );
};

export default Footer;
