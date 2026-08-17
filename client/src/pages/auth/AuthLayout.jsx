import { useSite } from '../../context/SiteContext.jsx';
import Icon from '../../components/ui/Icon.jsx';

const HIGHLIGHTS = [
  'Save your details for faster enquiries',
  'Track the status of every request in one place',
  'Manage corporate travellers and cost centres',
  'Access invoices and journey history',
];

/**
 * Shared shell for the sign-in, sign-up and password screens: form on the left,
 * reassurance panel on the right (hidden below 1024px so mobile stays focused).
 */
const AuthLayout = ({ title, lead, children, footer }) => {
  const { settings } = useSite();

  return (
    <div className="auth">
      <div className="auth__panel">
        <div className="auth__card">
          <h1 className="auth__title">{title}</h1>
          {lead ? <p className="auth__lead">{lead}</p> : null}
          {children}
          {footer ? <div className="auth__footer">{footer}</div> : null}
        </div>
      </div>

      <aside className="auth__aside">
        <h2>Your account with {settings.brandName}</h2>
        <ul className="tick-list">
          {HIGHLIGHTS.map((item) => (
            <li key={item}>
              <Icon name="check" size={18} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 'var(--space-8)', fontSize: 'var(--text-sm)', opacity: 0.7 }}>
          You do not need an account to request a quote — but it makes repeat bookings much quicker.
        </p>
      </aside>
    </div>
  );
};

export default AuthLayout;
