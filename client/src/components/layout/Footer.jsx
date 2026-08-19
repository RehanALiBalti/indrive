import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import Icon from '../ui/Icon.jsx';
import { Brand } from './Header.jsx';
import NewsletterForm from '../forms/NewsletterForm.jsx';

const SOCIAL = [
  { key: 'facebook', label: 'Facebook', icon: 'facebook' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { key: 'x', label: 'X', icon: 'x' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube' },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok' },
];

const FooterColumn = ({ heading, items }) => {
  if (!items.length) return null;
  return (
    <nav className="footer__col" aria-label={heading}>
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
    </nav>
  );
};

const Footer = () => {
  const { settings, menu, feature } = useSite();
  const contact = settings.contact || {};
  const address = [contact.addressLine1, contact.addressLine2, contact.city, contact.postcode]
    .filter(Boolean)
    .join(', ');

  const socialLinks = SOCIAL.filter((item) => settings.social?.[item.key]);
  const companyBits = [
    settings.legalName,
    settings.company?.registrationNumber ? `Registered no. ${settings.company.registrationNumber}` : '',
    settings.company?.vatNumber ? `VAT no. ${settings.company.vatNumber}` : '',
    settings.company?.licenceNumber ? `Licence ${settings.company.licenceNumber}` : '',
  ].filter(Boolean);

  return (
    <footer className="footer">
      <div className="footer__glow" aria-hidden="true" />
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand-col">
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
                    <Icon name={item.icon} size={16} />
                  </a>
                ))}
              </div>
            ) : null}

            {settings.footer?.paymentNote ? (
              <p className="footer__payment">{settings.footer.paymentNote}</p>
            ) : null}
          </div>

          <FooterColumn heading="Services" items={menu('footer-services')} />
          <FooterColumn heading="Company" items={menu('footer-company')} />
          <FooterColumn heading="Legal" items={menu('footer-legal')} />

          <div className="footer__contact-col">
            <h2 className="footer__heading">Contact</h2>
            <div className="footer__list">
              {contact.phone ? (
                <div className="footer__contact-item">
                  <span className="footer__contact-icon">
                    <Icon name="phone" size={16} />
                  </span>
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a>
                </div>
              ) : null}
              {contact.email ? (
                <div className="footer__contact-item">
                  <span className="footer__contact-icon">
                    <Icon name="mail" size={16} />
                  </span>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </div>
              ) : null}
              {address ? (
                <div className="footer__contact-item">
                  <span className="footer__contact-icon">
                    <Icon name="pin" size={16} />
                  </span>
                  <address>{address}</address>
                </div>
              ) : null}
              {contact.openingHours ? (
                <div className="footer__contact-item">
                  <span className="footer__contact-icon">
                    <Icon name="clock" size={16} />
                  </span>
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
          <div className="footer__bottom-copy">
            <p>
              {settings.footer?.copyright ||
                `© ${new Date().getFullYear()} ${settings.legalName || settings.brandName}. All rights reserved.`}
            </p>
            {companyBits.length ? <p className="footer__company">{companyBits.join(' · ')}</p> : null}
          </div>
          <ul className="footer__legal">
            {menu('footer-legal').map((item) => (
              <li key={`bottom-${item.id || item.href}`}>
                <Link to={item.href}>{item.label}</Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="footer__cookie-btn"
                onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-preferences'))}
              >
                Cookie preferences
              </button>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
