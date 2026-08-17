import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useSite } from '../context/SiteContext.jsx';
import Seo, { breadcrumbSchema } from '../components/seo/Seo.jsx';
import PageHero from '../components/sections/PageHero.jsx';
import { BlogCard } from '../components/cards/Cards.jsx';
import { AsyncContent, SkeletonGrid } from '../components/ui/States.jsx';
import { Pagination } from '../components/ui/Misc.jsx';
import { Input } from '../components/ui/Field.jsx';
import NewsletterForm from '../components/forms/NewsletterForm.jsx';
import { buildBreadcrumbs } from '../lib/breadcrumbs.js';
import { env } from '../config/env.js';

const PAGE_SIZE = 9;

/**
 * Blog index. Pagination and filters live in the query string so a specific
 * page of results can be linked to, shared and crawled.
 */
const BlogPage = () => {
  const { settings } = useSite();
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get('search') || '');

  const page = Number(params.get('page') || 1);
  const category = params.get('category') || '';
  const search = params.get('search') || '';

  const cms = useApi('/pages/blog');
  const list = useApi('/blog', {
    params: { page, limit: PAGE_SIZE, category: category || undefined, search: search || undefined },
  });

  const posts = list.data || [];

  const categories = useMemo(
    () => Array.from(new Set(posts.map((post) => post.category).filter(Boolean))),
    [posts],
  );

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, String(value));
      else next.delete(key);
    }
    // Any filter change resets to the first page of results.
    if (!('page' in patch)) next.delete('page');
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const base = (settings.seo?.siteUrl || env.siteUrl || '').replace(/\/+$/, '');
  const crumbs = buildBreadcrumbs('/blog', cms.data?.seo?.breadcrumbLabel || 'Travel Guides');

  return (
    <>
      <Seo
        title={cms.data?.seo?.title || 'Travel Guides & News'}
        description={cms.data?.seo?.description}
        canonical={page > 1 ? `${base}/blog?page=${page}` : undefined}
        noindex={Boolean(search)}
        jsonLd={[breadcrumbSchema(base, crumbs)]}
      />

      <PageHero
        eyebrow="Travel guides"
        title={cms.data?.h1 || 'Travel guides and news'}
        lead={cms.data?.subtitle}
        image={cms.data?.heroImage}
        breadcrumbs={crumbs}
      />

      <section className="section">
        <div className="container">
          <form
            className="field-row"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              update({ search: searchInput });
            }}
          >
            <Input
              name="search"
              label="Search articles"
              placeholder="Airport tips, business travel, fleet…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </form>

          {categories.length > 1 || category ? (
            <div className="chip-row" style={{ margin: 'var(--space-5) 0' }}>
              <button
                type="button"
                className={`badge ${!category ? 'badge--dark' : ''}`.trim()}
                onClick={() => update({ category: '' })}
              >
                All topics
              </button>
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`badge ${category === item ? 'badge--dark' : ''}`.trim()}
                  onClick={() => update({ category: item })}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}

          <AsyncContent
            state={list}
            skeleton={<SkeletonGrid count={6} />}
            emptyTitle={search ? 'No articles match your search' : 'No articles published yet'}
            emptyText={
              search
                ? 'Try a different search term, or browse all of our travel guides.'
                : 'Our travel guides are on the way. Subscribe below and we will let you know when they land.'
            }
            emptyAction={search ? { label: 'Clear search', onClick: () => update({ search: '' }) } : undefined}
          >
            {(items) => (
              <>
                <div className="grid grid--3">
                  {items.map((post, index) => (
                    <BlogCard key={post.id} post={post} featured={index === 0 && page === 1 && !search} />
                  ))}
                </div>
                <Pagination meta={list.meta} onChange={(next) => update({ page: next })} />
              </>
            )}
          </AsyncContent>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <div className="card">
            <div className="card__body">
              <h2 className="card__title">Get our travel guides by email</h2>
              <p className="card__text">
                One short, practical email a month. No sales pitches, unsubscribe at any time.
              </p>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <NewsletterForm compact={false} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogPage;
