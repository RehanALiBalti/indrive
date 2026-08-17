import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useSite } from '../context/SiteContext.jsx';
import Seo, { breadcrumbSchema, faqSchema } from '../components/seo/Seo.jsx';
import RichText from '../components/ui/RichText.jsx';
import Image from '../components/ui/Image.jsx';
import Accordion from '../components/ui/Accordion.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Breadcrumbs, Avatar, Badge } from '../components/ui/Misc.jsx';
import { RouteLoading, ErrorState } from '../components/ui/States.jsx';
import { BlogCard } from '../components/cards/Cards.jsx';
import NewsletterForm from '../components/forms/NewsletterForm.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { buildBreadcrumbs } from '../lib/breadcrumbs.js';
import { env } from '../config/env.js';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * Builds a table of contents from the H2s the editor wrote, and gives each one
 * a stable id so the links work and headings can be deep-linked.
 */
const useHeadings = (html) =>
  useMemo(() => {
    if (!html || typeof window === 'undefined') return [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('h2')).map((heading, index) => ({
      id: heading.id || `section-${index + 1}`,
      text: heading.textContent.trim(),
    }));
  }, [html]);

const BlogPostPage = () => {
  const { slug } = useParams();
  const { settings } = useSite();
  const state = useApi(`/blog/${slug}`);
  const recent = useApi('/blog', { params: { limit: 4 } });
  const [progress, setProgress] = useState(0);

  const post = state.data;
  const headings = useHeadings(post?.content);

  useEffect(() => {
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? Math.min(100, (window.scrollY / height) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Give every H2 an id that matches the generated table of contents.
  useEffect(() => {
    if (!post?.content) return;
    document.querySelectorAll('.post__body h2').forEach((heading, index) => {
      if (!heading.id) heading.id = `section-${index + 1}`;
    });
  }, [post?.content]);

  if (state.loading) return <RouteLoading />;
  if (state.error) {
    if (state.error.isNotFound) return <NotFoundPage />;
    return (
      <div className="container section">
        <ErrorState error={state.error} onRetry={state.refetch} />
      </div>
    );
  }
  if (!post) return <NotFoundPage />;

  const base = (settings.seo?.siteUrl || env.siteUrl || '').replace(/\/+$/, '');
  const url = `${base}/blog/${post.slug}`;
  const crumbs = buildBreadcrumbs(`/blog/${post.slug}`, post.seo?.breadcrumbLabel || post.title);

  const relatedSlugs = post.relatedPostSlugs || [];
  const related = (recent.data || [])
    .filter((item) => item.slug !== post.slug)
    .sort((a, b) => relatedSlugs.indexOf(b.slug) - relatedSlugs.indexOf(a.slug))
    .slice(0, 3);

  return (
    <>
      <Seo
        title={post.seo?.title || post.title}
        description={post.seo?.description || post.excerpt}
        canonical={post.seo?.canonical || url}
        image={post.seo?.ogImage?.url || post.featuredImage?.url}
        imageAlt={post.featuredImage?.alt || post.title}
        noindex={post.seo?.noindex}
        keywords={post.seo?.keywords}
        type="article"
        publishedTime={post.publishedAt}
        modifiedTime={post.updatedAt}
        author={post.author?.name}
        jsonLd={[
          breadcrumbSchema(base, crumbs),
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: post.featuredImage?.url || undefined,
            datePublished: post.publishedAt || undefined,
            dateModified: post.updatedAt || post.publishedAt || undefined,
            author: { '@type': 'Person', name: post.author?.name || settings.brandName },
            publisher: { '@type': 'Organization', name: settings.brandName },
            mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          },
          faqSchema(post.faqs),
        ]}
      />

      <div
        className="read-progress"
        style={{ transform: `scaleX(${progress / 100})` }}
        aria-hidden="true"
      />

      <article className="section">
        <div className="container">
          <Breadcrumbs items={crumbs} />

          <header className="post__header">
            <div className="blog-card__meta">
              {post.category ? <Badge variant="accent">{post.category}</Badge> : null}
              {post.publishedAt ? (
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              ) : null}
              {post.readingMinutes ? <span>{post.readingMinutes} min read</span> : null}
            </div>
            <h1 className="section__title">{post.title}</h1>
            {post.excerpt ? <p className="section__subtitle">{post.excerpt}</p> : null}

            {post.author?.name ? (
              <div className="testimonial__author" style={{ marginTop: 'var(--space-6)' }}>
                <Avatar name={post.author.name} src={post.author.avatar?.url} size={48} />
                <div>
                  <div className="testimonial__name">{post.author.name}</div>
                  {post.author.role ? <div className="testimonial__meta">{post.author.role}</div> : null}
                </div>
              </div>
            ) : null}
          </header>

          {post.featuredImage?.url ? (
            <figure className="post__figure">
              <Image
                src={post.featuredImage.url}
                alt={post.featuredImage.alt || post.title}
                priority
                ratio="16/9"
              />
            </figure>
          ) : null}

          <div className="with-aside">
            <div>
              {headings.length > 2 ? (
                <nav className="toc" aria-label="On this page">
                  <h2 className="toc__title">On this page</h2>
                  <ol>
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a href={`#${heading.id}`}>{heading.text}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
              ) : null}

              <RichText html={post.content} className="post__body prose--full" />

              {post.faqs?.length ? (
                <section style={{ marginTop: 'var(--space-10)' }}>
                  <h2 className="section__title">Frequently asked questions</h2>
                  <div style={{ marginTop: 'var(--space-5)' }}>
                    <Accordion items={post.faqs} />
                  </div>
                </section>
              ) : null}

              {post.cta?.href ? (
                <div className="cta-band" style={{ marginTop: 'var(--space-10)' }}>
                  <div>
                    <h2 className="cta-band__title">{post.cta.label}</h2>
                    <p className="cta-band__text">
                      Get a fixed, all-inclusive price for your next journey.
                    </p>
                  </div>
                  <div className="cta-band__actions">
                    <Button to={post.cta.href} variant="accent" size="lg">
                      {post.cta.label}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="post__share">
                <span>Share this article</span>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on LinkedIn"
                >
                  <Icon name="globe" size={18} />
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(url)}`}
                  aria-label="Share by email"
                >
                  <Icon name="mail" size={18} />
                </a>
              </div>
            </div>

            <aside className="with-aside__aside stack">
              <div className="card">
                <div className="card__body">
                  <h2 className="card__title">Travelling soon?</h2>
                  <p className="card__text">
                    Tell us about your journey and we will come back with a fixed price.
                  </p>
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <Button to="/#enquiry" variant="primary" block>
                      Get a quote
                    </Button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card__body">
                  <h2 className="card__title">Guides by email</h2>
                  <NewsletterForm compact={false} inFooter={false} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {related.length ? (
        <section className="section section--muted">
          <div className="container">
            <header className="section__head section__head--center">
              <h2 className="section__title">Related reading</h2>
            </header>
            <div className="grid grid--3">
              {related.map((item) => (
                <BlogCard key={item.id} post={item} />
              ))}
            </div>
            <div className="section__actions section__head--center">
              <Link className="btn btn--outline" to="/blog">
                All travel guides
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
};

export default BlogPostPage;
