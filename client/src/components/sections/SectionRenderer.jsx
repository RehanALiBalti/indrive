import { Link, useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { useSite } from '../../context/SiteContext.jsx';

const SERVICE_PATH_RE = /^\/(airport-transfer|city-to-city-transfer|hourly-chauffeur|airport-transfers\/.+|chauffeur-service\/.+|city-to-city\/.+)$/;
const useIsServicePage = () => {
  const { pathname } = useLocation();
  return pathname === '/' || SERVICE_PATH_RE.test(pathname);
};
import Icon, { hasIcon } from '../ui/Icon.jsx';
import Image from '../ui/Image.jsx';
import Button from '../ui/Button.jsx';
import Accordion from '../ui/Accordion.jsx';
import RichText from '../ui/RichText.jsx';
import { AsyncContent, SkeletonGrid } from '../ui/States.jsx';
import { ServiceCard, VehicleCard, TestimonialCard, BlogCard, FeatureCard } from '../cards/Cards.jsx';
import BookingWidget from '../forms/BookingWidget.jsx';
import ContactForm from '../forms/ContactForm.jsx';
import CorporateForm from '../forms/CorporateForm.jsx';
import SupportForm from '../forms/SupportForm.jsx';

/* ------------------------------- primitives ------------------------------- */

const BACKGROUNDS = { default: '', muted: 'section--muted', dark: 'section--dark', accent: 'section--accent' };

const SectionShell = ({ section, children, className = '' }) => {
  const settings = section.settings || {};
  return (
    <section
      className={`section ${BACKGROUNDS[settings.background] || ''} ${className}`.trim()}
      id={settings.anchorId || section.id || undefined}
    >
      <div className="container">
        <SectionHead section={section} />
        {children}
      </div>
    </section>
  );
};

export const SectionHead = ({ section }) => {
  const centered = section.settings?.align === 'center';
  if (!section.eyebrow && !section.title && !section.subtitle) return null;

  return (
    <header className={`section__head ${centered ? 'section__head--center' : ''}`.trim()}>
      {section.eyebrow ? <span className="section__eyebrow">{section.eyebrow}</span> : null}
      {section.title ? <h2 className="section__title">{section.title}</h2> : null}
      {section.subtitle ? <p className="section__subtitle">{section.subtitle}</p> : null}
      {section.cta?.href || section.secondaryCta?.href ? (
        <div className="section__actions">
          {section.cta?.href ? (
            <Button to={section.cta.href} variant="primary">
              {section.cta.label}
            </Button>
          ) : null}
          {section.secondaryCta?.href ? (
            <Button to={section.secondaryCta.href} variant="outline">
              {section.secondaryCta.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
};

const gridClass = (columns = 3) => `grid grid--${Math.min(Math.max(columns, 1), 4)}`;

/* -------------------------------- sections -------------------------------- */

const HeroSection = ({ section, context }) => {
  const isServicePage = useIsServicePage();
  const showBooking = section.settings?.layout !== 'simple' && isServicePage;

  return (
    <section className="hero">
      {section.image?.url ? (
        <div className="hero__bg">
          <Image src={section.image.url} alt={section.image.alt || ''} priority objectFit="cover" />
        </div>
      ) : null}
      <div className="container">
        <div className={`hero__inner ${showBooking ? '' : 'hero__inner--simple'}`.trim()}>
          <div className="hero__content">
            {section.eyebrow ? (
              <span className="hero__eyebrow">
                <Icon name="sparkle" size={15} />
                {section.eyebrow}
              </span>
            ) : null}
            <h1 className="hero__title">{section.title}</h1>
            {section.subtitle ? <p className="hero__subtitle">{section.subtitle}</p> : null}

            {section.cta?.href || section.secondaryCta?.href ? (
              <div className="hero__actions">
                {section.cta?.href ? (
                  <Button to={section.cta.href} variant="accent" size="lg">
                    {section.cta.label}
                  </Button>
                ) : null}
                {section.secondaryCta?.href ? (
                  <Button to={section.secondaryCta.href} variant="outline" size="lg">
                    {section.secondaryCta.label}
                  </Button>
                ) : null}
              </div>
            ) : null}

            {section.items?.length ? (
              <ul className="hero__trust" aria-label="Why travellers choose us">
                {section.items.map((item, index) => (
                  <li className="hero__trust-item" key={item.id || `${item.title}-${index}`}>
                    <Icon name={hasIcon(item.icon) ? item.icon : 'check'} size={18} />
                    <span>{item.title}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {showBooking ? (
            <div className="hero__aside">
              <BookingWidget
                defaultTab={context?.defaultServiceTab || 'airport'}
                prefill={context?.prefill}
                seoPageSlug={context?.seoPageSlug}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

const BookingWidgetSection = ({ section, context }) => {
  const isServicePage = useIsServicePage();
  if (!isServicePage) return null;

  return (
    <SectionShell section={section}>
      <BookingWidget
        variant="inline"
        title={section.title ? undefined : 'Request your quote'}
        subtitle={section.subtitle ? undefined : ''}
        defaultTab={section.settings?.serviceType || context?.defaultServiceTab || 'airport'}
        lockTab={section.settings?.layout === 'locked'}
        prefill={context?.prefill}
        seoPageSlug={context?.seoPageSlug}
      />
    </SectionShell>
  );
};

const RichTextSection = ({ section }) => (
  <SectionShell section={section}>
    <RichText html={section.body} className={section.settings?.layout === 'full' ? 'prose--full' : ''} />
  </SectionShell>
);

const FeaturesSection = ({ section }) => (
  <SectionShell section={section}>
    <div className={gridClass(section.settings?.columns || 3)}>
      {section.items.map((item, index) => (
        <FeatureCard key={item.id || `${item.title}-${index}`} item={item} />
      ))}
    </div>
  </SectionShell>
);

const StepsSection = ({ section }) => (
  <SectionShell section={section}>
    <div className={`steps steps--${Math.min(section.items.length, 4)}`}>
      {section.items.map((item, index) => (
        <div className="step" key={item.id || `${item.title}-${index}`}>
          <span className="step__number">{index + 1}</span>
          <h3 className="step__title">{item.title}</h3>
          {item.description ? <p className="step__text">{item.description}</p> : null}
        </div>
      ))}
    </div>
  </SectionShell>
);

const StatsSection = ({ section }) => (
  <SectionShell section={section}>
    <div className="stats">
      {section.items.map((item, index) => (
        <div className="stat" key={item.id || `${item.value}-${index}`}>
          <div className="stat__value">{item.value}</div>
          <div className="stat__label">{item.title}</div>
        </div>
      ))}
    </div>
  </SectionShell>
);

const ImageTextSection = ({ section }) => {
  const position = section.settings?.imagePosition === 'left' ? 'left' : 'right';
  return (
    <section
      className={`section ${BACKGROUNDS[section.settings?.background] || ''}`.trim()}
      id={section.settings?.anchorId || section.id || undefined}
    >
      <div className="container">
        <div className={`image-text image-text--${position}`}>
          <div className="image-text__body">
            {section.eyebrow ? <span className="section__eyebrow">{section.eyebrow}</span> : null}
            {section.title ? <h2 className="section__title">{section.title}</h2> : null}
            {section.body ? <RichText html={section.body} /> : null}

            {section.items?.length ? (
              <ul className="image-text__list">
                {section.items.map((item, index) => (
                  <li key={item.id || `${item.title}-${index}`}>
                    <Icon name={hasIcon(item.icon) ? item.icon : 'check'} size={18} />
                    <span>
                      <strong>{item.title}</strong>
                      {item.description ? ` — ${item.description}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {section.cta?.href ? (
              <div className="section__actions">
                <Button to={section.cta.href} variant="primary">
                  {section.cta.label}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="image-text__media">
            <Image src={section.image?.url} alt={section.image?.alt || section.title || ''} ratio="4/3" />
          </div>
        </div>
      </div>
    </section>
  );
};

const ServicesSection = ({ section }) => {
  const state = useApi('/services', { params: { limit: section.settings?.limit || 6 } });
  return (
    <SectionShell section={section}>
      <AsyncContent
        state={state}
        skeleton={<SkeletonGrid count={3} />}
        emptyTitle="Services are being updated"
        emptyText="Our service list is currently being refreshed. Please check back shortly or contact our team."
      >
        {(services) => (
          <div className={gridClass(section.settings?.columns || 3)}>
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </AsyncContent>
    </SectionShell>
  );
};

const VehiclesSection = ({ section }) => {
  const state = useApi('/vehicles', {
    params: { limit: section.settings?.limit || 6, category: section.settings?.category || undefined },
  });
  return (
    <SectionShell section={section}>
      <AsyncContent
        state={state}
        skeleton={<SkeletonGrid count={3} />}
        emptyTitle="Fleet coming soon"
        emptyText="Our vehicle line-up is being updated. Contact us and we will confirm the right car for your journey."
      >
        {(vehicles) => (
          <div className={gridClass(section.settings?.columns || 3)}>
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </AsyncContent>
      <div className="section__actions">
        <Button to="/fleet" variant="outline" iconRight="arrowRight">
          View the full fleet
        </Button>
      </div>
    </SectionShell>
  );
};

const TestimonialsSection = ({ section }) => {
  const { feature } = useSite();
  const state = useApi(feature('testimonialsEnabled') ? '/testimonials' : null, {
    params: { limit: section.settings?.limit || 6 },
  });
  if (!feature('testimonialsEnabled')) return null;

  return (
    <SectionShell section={section}>
      <AsyncContent
        state={state}
        skeleton={<SkeletonGrid count={3} />}
        emptyTitle="No reviews published yet"
        emptyText="Customer reviews will appear here once published."
      >
        {(testimonials) => (
          <div className={gridClass(section.settings?.columns || 3)}>
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        )}
      </AsyncContent>
    </SectionShell>
  );
};

/**
 * FAQs come either from items authored directly on the section (used by SEO
 * landing pages) or from the shared FAQ collection filtered by category.
 */
const FaqSection = ({ section }) => {
  const inline = (section.items || []).filter((item) => item.title && item.body);
  const state = useApi(inline.length ? null : '/faqs', {
    params: { category: section.settings?.category || undefined, limit: section.settings?.limit || 12 },
  });

  const renderList = (faqs) => (
    <Accordion items={faqs.map((faq, index) => ({ id: faq.id || `faq-${index}`, question: faq.question, answer: faq.answer }))} />
  );

  return (
    <SectionShell section={section}>
      {inline.length ? (
        renderList(inline.map((item) => ({ id: item.id, question: item.title, answer: item.body })))
      ) : (
        <AsyncContent
          state={state}
          emptyTitle="No questions published yet"
          emptyText="Contact our team and we will answer any question about your journey."
        >
          {(faqs) => renderList(faqs)}
        </AsyncContent>
      )}
    </SectionShell>
  );
};

const CtaSection = ({ section }) => (
  <section className="section" id={section.settings?.anchorId || section.id || undefined}>
    <div className="container">
      <div className="cta-band">
        <div>
          <h2 className="cta-band__title">{section.title}</h2>
          {section.subtitle ? <p className="cta-band__text">{section.subtitle}</p> : null}
        </div>
        <div className="cta-band__actions">
          {section.cta?.href ? (
            <Button to={section.cta.href} variant="accent" size="lg">
              {section.cta.label}
            </Button>
          ) : null}
          {section.secondaryCta?.href ? (
            <Button to={section.secondaryCta.href} variant="outline" size="lg">
              {section.secondaryCta.label}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  </section>
);

const GallerySection = ({ section }) => (
  <SectionShell section={section}>
    <div className="gallery">
      {section.items
        .filter((item) => item.image?.url)
        .map((item, index) => (
          <Image
            key={item.id || `${item.image.url}-${index}`}
            src={item.image.url}
            alt={item.image.alt || item.title || ''}
          />
        ))}
    </div>
  </SectionShell>
);

const LogoStripSection = ({ section }) => (
  <SectionShell section={section} className="section--tight">
    <div className="logo-strip">
      {section.items
        .filter((item) => item.image?.url)
        .map((item, index) => (
          <img
            key={item.id || index}
            src={item.image.url}
            alt={item.image.alt || item.title || 'Client logo'}
            loading="lazy"
          />
        ))}
    </div>
  </SectionShell>
);

const ContactInfoSection = ({ section }) => {
  const { settings } = useSite();
  const contact = settings.contact || {};
  const address = [contact.addressLine1, contact.addressLine2, contact.city, contact.postcode]
    .filter(Boolean)
    .join(', ');

  const details = [
    contact.phone ? { icon: 'phone', label: 'Call us', value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}` } : null,
    contact.whatsapp ? { icon: 'phone', label: 'WhatsApp', value: contact.whatsapp, href: `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}` } : null,
    contact.email ? { icon: 'mail', label: 'Email', value: contact.email, href: `mailto:${contact.email}` } : null,
    address ? { icon: 'pin', label: 'Office', value: address } : null,
    contact.openingHours ? { icon: 'clock', label: 'Hours', value: contact.openingHours } : null,
  ].filter(Boolean);

  return (
    <SectionShell section={section}>
      <div className="contact-grid">
        <div>
          {details.map((detail) => (
            <div className="contact-detail" key={detail.label}>
              <span className="contact-detail__icon">
                <Icon name={detail.icon} size={20} />
              </span>
              <div>
                <div className="contact-detail__label">{detail.label}</div>
                <div className="contact-detail__value">
                  {detail.href ? <a href={detail.href}>{detail.value}</a> : detail.value}
                </div>
              </div>
            </div>
          ))}
        </div>
        {section.body ? <RichText html={section.body} /> : null}
      </div>
    </SectionShell>
  );
};

const FORMS = { contact: ContactForm, corporate: CorporateForm, support: SupportForm };

/** The CMS chooses which enquiry form a page shows via `settings.layout`. */
const ContactFormSection = ({ section }) => {
  const Form = FORMS[section.settings?.layout] || ContactForm;
  return (
    <SectionShell section={section}>
      <div style={{ maxWidth: 820, marginInline: section.settings?.align === 'center' ? 'auto' : undefined }}>
        <Form />
      </div>
    </SectionShell>
  );
};

const RelatedLinksSection = ({ section }) => (
  <SectionShell section={section}>
    <div className="link-grid">
      {section.items
        .filter((item) => item.link?.href || item.title)
        .map((item, index) => (
          <Link key={item.id || index} to={item.link?.href || '#'}>
            <span>{item.link?.label || item.title}</span>
            <Icon name="arrowRight" size={16} />
          </Link>
        ))}
    </div>
  </SectionShell>
);

const COVERAGE_GROUPS = [
  { key: 'airport', heading: 'Airport transfers' },
  { key: 'city', heading: 'Chauffeur service by city' },
  { key: 'city-to-city', heading: 'Popular routes' },
];

/**
 * Internal-linking block. When an editor has not authored links by hand it
 * builds itself from every published SEO landing page, so new locations are
 * linked from the site automatically the moment they go live.
 */
const CoverageSection = ({ section }) => {
  const authored = (section.items || []).filter((item) => item.link?.href);
  const state = useApi(authored.length ? null : '/seo-pages/index/all');

  if (authored.length) {
    return (
      <SectionShell section={section}>
        <div className="coverage">
          {authored.map((item, index) => (
            <Link key={item.id || index} to={item.link.href}>
              {item.link.label || item.title}
            </Link>
          ))}
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell section={section}>
      <AsyncContent
        state={state}
        emptyTitle="Coverage is being updated"
        emptyText="Our location pages are being published. Contact us for any destination in the meantime."
      >
        {(groups) => {
          const populated = COVERAGE_GROUPS.filter((group) => (groups?.[group.key] || []).length);
          if (!populated.length) {
            return (
              <p className="section__subtitle">
                We cover every major airport and city. <Link to="/contact">Ask us about your route.</Link>
              </p>
            );
          }
          return (
            <div className="stack">
              {populated.map((group) => (
                <div key={group.key}>
                  <h3 className="feature__title" style={{ marginBottom: 'var(--space-4)' }}>
                    {group.heading}
                  </h3>
                  <div className="coverage">
                    {groups[group.key].map((item) => (
                      <Link key={item.id} to={item.path}>
                        {item.h1 || item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        }}
      </AsyncContent>
    </SectionShell>
  );
};

const BlogListSection = ({ section }) => {
  const { feature } = useSite();
  const state = useApi(feature('blogEnabled') ? '/blog' : null, {
    params: { limit: section.settings?.limit || 3, category: section.settings?.category || undefined },
  });
  if (!feature('blogEnabled')) return null;

  return (
    <SectionShell section={section}>
      <AsyncContent
        state={state}
        skeleton={<SkeletonGrid count={3} />}
        emptyTitle="No articles yet"
        emptyText="Our travel guides are on the way. Check back soon."
      >
        {(posts) => (
          <div className={gridClass(section.settings?.columns || 3)}>
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </AsyncContent>
    </SectionShell>
  );
};

/* -------------------------------- registry -------------------------------- */

const REGISTRY = {
  hero: HeroSection,
  bookingWidget: BookingWidgetSection,
  richText: RichTextSection,
  features: FeaturesSection,
  steps: StepsSection,
  stats: StatsSection,
  imageText: ImageTextSection,
  services: ServicesSection,
  vehicles: VehiclesSection,
  testimonials: TestimonialsSection,
  faq: FaqSection,
  cta: CtaSection,
  gallery: GallerySection,
  logoStrip: LogoStripSection,
  contactInfo: ContactInfoSection,
  contactForm: ContactFormSection,
  relatedLinks: RelatedLinksSection,
  blogList: BlogListSection,
  coverage: CoverageSection,
};

export const SECTION_TYPES = Object.keys(REGISTRY);

/**
 * Renders an ordered list of CMS sections. Unknown or disabled sections are
 * skipped silently so removing a section type from the UI can never break a
 * published page.
 */
const SectionRenderer = ({ sections = [], context = {} }) => (
  <>
    {sections
      .filter((section) => section && section.enabled !== false && REGISTRY[section.type])
      .map((section, index) => {
        const Component = REGISTRY[section.type];
        return (
          <Component
            key={section.id || `${section.type}-${index}`}
            section={{ items: [], settings: {}, ...section }}
            context={context}
          />
        );
      })}
  </>
);

export default SectionRenderer;
