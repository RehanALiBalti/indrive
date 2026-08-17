import { Link } from 'react-router-dom';
import Icon, { hasIcon } from '../ui/Icon.jsx';
import Image from '../ui/Image.jsx';
import Button from '../ui/Button.jsx';
import { Badge, Rating, Avatar } from '../ui/Misc.jsx';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

/* ------------------------------ Service card ------------------------------ */

export const ServiceCard = ({ service }) => {
  const href = service.landingPath || `/${service.slug}`;
  return (
    <article className="card card--interactive">
      {service.image?.url ? (
        <Link to={href} className="card__media" aria-hidden="true" tabIndex={-1}>
          <Image src={service.image.url} alt={service.image.alt || service.name} ratio="16/10" />
        </Link>
      ) : null}
      <div className="card__body">
        {hasIcon(service.icon) ? (
          <span className="service-card__icon">
            <Icon name={service.icon} size={24} />
          </span>
        ) : null}
        <h3 className="card__title">
          <Link to={href}>{service.name}</Link>
        </h3>
        <p className="card__text">{service.shortDescription}</p>
      </div>
      <div className="card__footer">
        <Button variant="link" to={href} iconRight="arrowRight">
          Learn more
        </Button>
        {service.startingPriceLabel ? <span className="badge">{service.startingPriceLabel}</span> : null}
      </div>
    </article>
  );
};

/* ------------------------------ Vehicle card ------------------------------ */

export const VehicleCard = ({ vehicle, showCta = true }) => {
  const image = vehicle.images?.[0];
  const href = `/fleet/${vehicle.slug}`;

  return (
    <article className="card card--interactive">
      <Link to={href} className="card__media" tabIndex={-1} aria-hidden="true">
        <Image src={image?.url} alt={image?.alt || vehicle.name} ratio="16/10" />
      </Link>
      <div className="card__body">
        {vehicle.category ? <span className="card__eyebrow">{vehicle.category}</span> : null}
        <h3 className="card__title">
          <Link to={href}>{vehicle.name}</Link>
        </h3>
        {vehicle.shortDescription ? <p className="card__text">{vehicle.shortDescription}</p> : null}

        <div className="vehicle-card__specs">
          <span className="vehicle-card__spec">
            <Icon name="users" size={16} />
            {vehicle.passengers} passengers
          </span>
          <span className="vehicle-card__spec">
            <Icon name="luggage" size={16} />
            {vehicle.luggage} bags
          </span>
        </div>

        {vehicle.features?.length ? (
          <div className="vehicle-card__features">
            {vehicle.features.slice(0, 3).map((feature) => (
              <Badge key={feature}>{feature}</Badge>
            ))}
            {vehicle.features.length > 3 ? <Badge>+{vehicle.features.length - 3} more</Badge> : null}
          </div>
        ) : null}
      </div>
      {showCta ? (
        <div className="card__footer">
          <Button variant="link" to={href} iconRight="arrowRight">
            View details
          </Button>
          <Button variant="outline" size="sm" to={`/#enquiry`}>
            Get a quote
          </Button>
        </div>
      ) : null}
    </article>
  );
};

/* ---------------------------- Testimonial card ---------------------------- */

export const TestimonialCard = ({ testimonial }) => (
  <article className="card">
    <div className="card__body testimonial">
      {testimonial.rating ? <Rating value={testimonial.rating} /> : null}
      <blockquote className="testimonial__quote">“{testimonial.quote}”</blockquote>
      <div className="testimonial__author">
        <Avatar name={testimonial.author} src={testimonial.avatar?.url} />
        <div>
          <div className="testimonial__name">{testimonial.author}</div>
          <div className="testimonial__meta">
            {[testimonial.role, testimonial.company, testimonial.location].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>
    </div>
  </article>
);

/* -------------------------------- Blog card ------------------------------- */

export const BlogCard = ({ post, featured = false }) => {
  const href = `/blog/${post.slug}`;
  return (
    <article className={`card card--interactive ${featured ? 'card--featured' : ''}`.trim()}>
      <Link to={href} className="card__media" tabIndex={-1} aria-hidden="true">
        <Image
          src={post.featuredImage?.url}
          alt={post.featuredImage?.alt || post.title}
          ratio={featured ? '16/9' : '16/10'}
        />
      </Link>
      <div className="card__body">
        <div className="blog-card__meta">
          {post.category ? <span>{post.category}</span> : null}
          {post.publishedAt ? <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> : null}
          {post.readingMinutes ? <span>{post.readingMinutes} min read</span> : null}
        </div>
        <h3 className="card__title">
          <Link to={href}>{post.title}</Link>
        </h3>
        <p className="card__text">{post.excerpt}</p>
      </div>
      <div className="card__footer">
        <Button variant="link" to={href} iconRight="arrowRight">
          Read article
        </Button>
      </div>
    </article>
  );
};

/* ------------------------------ Feature card ------------------------------ */

export const FeatureCard = ({ item }) => (
  <div className="feature">
    {hasIcon(item.icon) ? (
      <span className="icon-circle">
        <Icon name={item.icon} size={22} />
      </span>
    ) : null}
    <h3 className="feature__title">{item.title}</h3>
    {item.description ? <p className="feature__text">{item.description}</p> : null}
    {item.link?.href ? (
      <Button variant="link" to={item.link.href} iconRight="arrowRight">
        {item.link.label || 'Find out more'}
      </Button>
    ) : null}
  </div>
);

export default { ServiceCard, VehicleCard, TestimonialCard, BlogCard, FeatureCard };
