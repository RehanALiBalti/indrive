import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Alert, Badge } from '../../components/ui/Misc.jsx';
import { AsyncContent, SkeletonRows } from '../../components/ui/States.jsx';
import { StatusBadge, dateTime } from '../components/AdminTable.jsx';
import { titleCase } from '../../lib/format.js';

const StatCard = ({ label, value, meta, to }) => {
  const content = (
    <>
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      {meta ? <span className="stat-card__meta">{meta}</span> : null}
    </>
  );
  return to ? (
    <Link className="stat-card" to={to}>
      {content}
    </Link>
  ) : (
    <div className="stat-card">{content}</div>
  );
};

const DashboardPage = () => {
  const { profile, isAdmin } = useAuth();
  const toast = useToast();
  const state = useApi('/admin/stats', { auth: true });

  const flushCache = async () => {
    try {
      await api.post('/admin/cache/flush', {}, { auth: true });
      toast.success('Cache cleared. The public site will show the latest content immediately.');
      state.refetch();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Welcome back{profile?.firstName ? `, ${profile.firstName}` : ''}</h1>
          <p>Everything on the public website is managed from here — content, fleet, SEO pages and enquiries.</p>
        </div>
        {isAdmin ? (
          <div className="admin-actions">
            <Button variant="outline" icon="refresh" onClick={flushCache}>
              Clear content cache
            </Button>
          </div>
        ) : null}
      </div>

      <AsyncContent state={state} skeleton={<SkeletonRows rows={4} />}>
        {(data) => (
          <>
            {!data.system?.storageEnabled ? (
              <Alert variant="warning" title="Firebase Storage is not set up">
                Image uploads are unavailable until Storage is enabled in the Firebase Console and
                FIREBASE_STORAGE_BUCKET is set in server/.env. Run <code>npm run check-storage --workspace server</code>{' '}
                to verify the bucket name.
              </Alert>
            ) : null}

            <h2 className="panel__title" style={{ marginBottom: 'var(--space-3)' }}>
              Enquiries
            </h2>
            <div className="stat-grid" style={{ marginBottom: 'var(--space-8)' }}>
              <StatCard
                label="Journey enquiries"
                value={data.submissions.booking.total}
                meta={`${data.submissions.booking.new} new`}
                to="/admin/submissions/booking"
              />
              <StatCard
                label="Contact messages"
                value={data.submissions.contact.total}
                meta={`${data.submissions.contact.new} new`}
                to="/admin/submissions/contact"
              />
              <StatCard
                label="Corporate enquiries"
                value={data.submissions.corporate.total}
                meta={`${data.submissions.corporate.new} new`}
                to="/admin/submissions/corporate"
              />
              <StatCard
                label="Support requests"
                value={data.submissions.support.total}
                meta={`${data.submissions.support.new} new`}
                to="/admin/submissions/support"
              />
              <StatCard
                label="Newsletter subscribers"
                value={data.submissions.newsletter.total}
                to="/admin/submissions/newsletter"
              />
            </div>

            <h2 className="panel__title" style={{ marginBottom: 'var(--space-3)' }}>
              Content
            </h2>
            <div className="stat-grid" style={{ marginBottom: 'var(--space-8)' }}>
              <StatCard
                label="Pages"
                value={data.content.pages.total}
                meta={`${data.content.pages.published} published`}
                to="/admin/pages"
              />
              <StatCard
                label="Services"
                value={data.content.services.total}
                meta={`${data.content.services.active} active`}
                to="/admin/services"
              />
              <StatCard
                label="Fleet"
                value={data.content.vehicles.total}
                meta={`${data.content.vehicles.active} active`}
                to="/admin/vehicles"
              />
              <StatCard
                label="Blog articles"
                value={data.content.blogPosts.total}
                meta={`${data.content.blogPosts.published} published`}
                to="/admin/blog"
              />
              <StatCard
                label="SEO landing pages"
                value={data.content.seoPages.total}
                meta={Object.entries(data.content.seoPages.byType || {})
                  .map(([type, count]) => `${count} ${titleCase(type)}`)
                  .join(' · ')}
                to="/admin/seo-pages"
              />
              <StatCard label="FAQs" value={data.content.faqs.total} to="/admin/faqs" />
              <StatCard label="Testimonials" value={data.content.testimonials.total} to="/admin/testimonials" />
              <StatCard label="Media files" value={data.content.media.total} to="/admin/media" />
            </div>

            <div className="panel">
              <div className="panel__head">
                <span className="panel__title">Latest journey enquiries</span>
                <Button variant="ghost" size="sm" to="/admin/submissions/booking" iconRight="arrowRight">
                  View all
                </Button>
              </div>

              {data.recentEnquiries?.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Customer</th>
                        <th>Journey</th>
                        <th>Travel date</th>
                        <th>Received</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentEnquiries.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <Link className="admin-table__primary" to={`/admin/submissions/booking?open=${item.id}`}>
                              {item.reference}
                            </Link>
                            <span className="admin-table__sub">
                              <Badge>{titleCase(item.serviceType)}</Badge>
                            </span>
                          </td>
                          <td>
                            {item.name}
                            <span className="admin-table__sub">{item.email}</span>
                          </td>
                          <td>
                            {item.pickup || '—'}
                            {item.destination ? (
                              <span className="admin-table__sub">
                                <Icon name="arrowRight" size={12} /> {item.destination}
                              </span>
                            ) : null}
                          </td>
                          <td>{item.date || '—'}</td>
                          <td>{dateTime(item.createdAt)}</td>
                          <td>
                            <StatusBadge status={item.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="panel__body" style={{ color: 'var(--slate-500)' }}>
                  No journey enquiries yet. They will appear here as soon as the first form is submitted.
                </div>
              )}
            </div>
          </>
        )}
      </AsyncContent>
    </>
  );
};

export default DashboardPage;
