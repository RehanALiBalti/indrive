import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Input, Select, Checkbox } from '../../components/ui/Field.jsx';
import { Badge } from '../../components/ui/Misc.jsx';
import RichTextEditor from './RichTextEditor.jsx';
import { ImageField } from './MediaPicker.jsx';
import { FieldRenderer, CtaField } from './FormFields.jsx';
import { getPath, setPath } from '../utils/objectPath.js';

/**
 * Catalogue of layout blocks the public site can render.
 *
 * Every entry maps 1:1 to a case in `SectionRenderer`, and the `fields` list
 * decides what an editor can change. Adding a block to the site therefore means
 * adding it here — never editing a page component.
 */
export const SECTION_TYPES = [
  {
    type: 'hero',
    label: 'Hero banner',
    description: 'Large opening banner with heading, text, image and buttons.',
    icon: 'image',
    uses: ['eyebrow', 'title', 'subtitle', 'body', 'image', 'cta', 'secondaryCta', 'items'],
    itemsLabel: 'Trust points',
  },
  {
    type: 'bookingWidget',
    label: 'Booking / enquiry widget',
    description: 'The three-tab journey enquiry form.',
    icon: 'calendar',
    uses: ['title', 'subtitle'],
  },
  {
    type: 'richText',
    label: 'Rich text',
    description: 'Free-form content with headings, lists, tables and links.',
    icon: 'file',
    uses: ['eyebrow', 'title', 'subtitle', 'body'],
  },
  {
    type: 'features',
    label: 'Feature grid',
    description: 'Icon, title and description cards.',
    icon: 'sparkle',
    uses: ['eyebrow', 'title', 'subtitle', 'items', 'cta'],
    itemsLabel: 'Features',
  },
  {
    type: 'steps',
    label: 'How it works steps',
    description: 'Numbered steps explaining a process.',
    icon: 'route',
    uses: ['eyebrow', 'title', 'subtitle', 'items'],
    itemsLabel: 'Steps',
  },
  {
    type: 'stats',
    label: 'Statistics band',
    description: 'Headline numbers such as journeys completed.',
    icon: 'badge',
    uses: ['title', 'subtitle', 'items'],
    itemsLabel: 'Statistics',
  },
  {
    type: 'imageText',
    label: 'Image and text',
    description: 'Split section with an image beside copy.',
    icon: 'image',
    uses: ['eyebrow', 'title', 'subtitle', 'body', 'image', 'cta', 'items'],
    itemsLabel: 'Bullet points',
  },
  {
    type: 'services',
    label: 'Services',
    description: 'Cards pulled live from the Services collection.',
    icon: 'car',
    uses: ['eyebrow', 'title', 'subtitle', 'cta'],
  },
  {
    type: 'vehicles',
    label: 'Fleet',
    description: 'Vehicle cards pulled live from the Fleet collection.',
    icon: 'car',
    uses: ['eyebrow', 'title', 'subtitle', 'cta'],
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    description: 'Customer reviews pulled from the Testimonials collection.',
    icon: 'quote',
    uses: ['eyebrow', 'title', 'subtitle'],
  },
  {
    type: 'faq',
    label: 'FAQ accordion',
    description: 'Questions authored here, or pulled from the FAQ collection by category.',
    icon: 'headset',
    uses: ['eyebrow', 'title', 'subtitle', 'items', 'cta'],
    itemsLabel: 'Questions',
  },
  {
    type: 'cta',
    label: 'Call-to-action band',
    description: 'Full-width prompt with one or two buttons.',
    icon: 'sparkle',
    uses: ['eyebrow', 'title', 'subtitle', 'cta', 'secondaryCta'],
  },
  {
    type: 'gallery',
    label: 'Image gallery',
    description: 'Grid of images.',
    icon: 'image',
    uses: ['eyebrow', 'title', 'subtitle', 'items'],
    itemsLabel: 'Images',
  },
  {
    type: 'logoStrip',
    label: 'Logo strip',
    description: 'Client or partner logos.',
    icon: 'briefcase',
    uses: ['title', 'items'],
    itemsLabel: 'Logos',
  },
  {
    type: 'contactInfo',
    label: 'Contact details',
    description: 'Phone, email, address and opening hours from site settings.',
    icon: 'phone',
    uses: ['eyebrow', 'title', 'subtitle'],
  },
  {
    type: 'contactForm',
    label: 'Form',
    description: 'Contact, corporate or support form.',
    icon: 'mail',
    uses: ['eyebrow', 'title', 'subtitle'],
  },
  {
    type: 'relatedLinks',
    label: 'Related links',
    description: 'Internal links for SEO and navigation.',
    icon: 'route',
    uses: ['eyebrow', 'title', 'subtitle', 'items'],
    itemsLabel: 'Links',
  },
  {
    type: 'blogList',
    label: 'Latest articles',
    description: 'Most recent published blog posts.',
    icon: 'edit',
    uses: ['eyebrow', 'title', 'subtitle', 'cta'],
  },
  {
    type: 'coverage',
    label: 'Coverage / locations',
    description: 'Automatic index of published airport, city and route landing pages.',
    icon: 'map',
    uses: ['eyebrow', 'title', 'subtitle', 'items'],
    itemsLabel: 'Manual links (optional)',
  },
];

const ITEM_FIELDS = [
  { name: 'title', label: 'Title' },
  { name: 'subtitle', label: 'Subtitle' },
  { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
  { name: 'body', label: 'Body content', type: 'richtext', rows: 8 },
  { name: 'icon', label: 'Icon', type: 'icon' },
  { name: 'value', label: 'Value', hint: 'Used by statistics blocks, e.g. "12,000+".' },
  { name: 'image', label: 'Image', type: 'image', folder: 'pages' },
  { name: 'link', label: 'Link', type: 'cta' },
];

const BACKGROUNDS = [
  { value: 'default', label: 'White' },
  { value: 'muted', label: 'Light grey' },
  { value: 'dark', label: 'Dark' },
  { value: 'accent', label: 'Accent' },
];

const FORM_LAYOUTS = [
  { value: 'contact', label: 'Contact form' },
  { value: 'corporate', label: 'Corporate enquiry form' },
  { value: 'support', label: 'Support request form' },
];

const uniqueId = () => `s_${Math.random().toString(36).slice(2, 9)}`;

const definitionFor = (type) => SECTION_TYPES.find((entry) => entry.type === type) || SECTION_TYPES[2];

const SectionCard = ({ section, index, total, onChange, onRemove, onMove, onDuplicate }) => {
  const [open, setOpen] = useState(false);
  const definition = definitionFor(section.type);
  const uses = (key) => definition.uses.includes(key);

  const set = (path, value) => onChange(setPath(section, path, value));

  return (
    <div className="repeater__item">
      <div className="repeater__head">
        <button type="button" className="repeater__handle" onClick={() => setOpen(!open)} aria-expanded={open}>
          <Icon name="chevronDown" size={15} style={{ transform: open ? 'none' : 'rotate(-90deg)' }} />
          <Icon name={definition.icon} size={16} />
          {section.title || definition.label}
        </button>

        <Badge variant={section.enabled === false ? 'default' : 'success'}>
          {section.enabled === false ? 'Hidden' : 'Visible'}
        </Badge>

        <button
          type="button"
          className="icon-btn"
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          aria-label="Move section up"
        >
          <Icon name="chevronDown" size={15} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => onMove(index, 1)}
          disabled={index === total - 1}
          aria-label="Move section down"
        >
          <Icon name="chevronDown" size={15} />
        </button>
        <button type="button" className="icon-btn" onClick={onDuplicate} aria-label="Duplicate section">
          <Icon name="copy" size={15} />
        </button>
        <button type="button" className="icon-btn icon-btn--danger" onClick={onRemove} aria-label="Remove section">
          <Icon name="trash" size={15} />
        </button>
      </div>

      {open ? (
        <div className="repeater__body">
          <div className="form-grid form-grid--2">
            <Checkbox
              name={`enabled-${index}`}
              label="Show this section on the live site"
              checked={section.enabled !== false}
              onChange={(event) => set('enabled', event.target.checked)}
            />
            <Select
              name={`background-${index}`}
              label="Background"
              value={section.settings?.background || 'default'}
              options={BACKGROUNDS}
              onChange={(event) => set('settings.background', event.target.value)}
            />
          </div>

          {uses('eyebrow') ? (
            <Input
              name={`eyebrow-${index}`}
              label="Eyebrow"
              placeholder="Small label above the heading"
              value={section.eyebrow || ''}
              onChange={(event) => set('eyebrow', event.target.value)}
            />
          ) : null}

          {uses('title') ? (
            <Input
              name={`title-${index}`}
              label="Heading"
              value={section.title || ''}
              onChange={(event) => set('title', event.target.value)}
            />
          ) : null}

          {uses('subtitle') ? (
            <Input
              name={`subtitle-${index}`}
              label="Sub-heading"
              value={section.subtitle || ''}
              onChange={(event) => set('subtitle', event.target.value)}
            />
          ) : null}

          {uses('body') ? (
            <RichTextEditor
              name={`body-${index}`}
              label="Body content"
              value={section.body || ''}
              onChange={(event) => set('body', event.target.value)}
            />
          ) : null}

          {uses('image') ? (
            <ImageField
              label="Image"
              folder="pages"
              value={section.image || {}}
              onChange={(value) => set('image', value)}
            />
          ) : null}

          {uses('items') ? (
            <SectionItems
              label={definition.itemsLabel || 'Items'}
              type={section.type}
              value={section.items || []}
              onChange={(value) => set('items', value)}
            />
          ) : null}

          {uses('cta') ? <CtaField value={section.cta || {}} onChange={(value) => set('cta', value)} /> : null}

          {uses('secondaryCta') ? (
            <CtaField
              label="Secondary button"
              value={section.secondaryCta || {}}
              onChange={(value) => set('secondaryCta', value)}
            />
          ) : null}

          <details>
            <summary style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              Display options
            </summary>
            <div className="form-grid form-grid--2" style={{ marginTop: 'var(--space-3)' }}>
              <Select
                name={`align-${index}`}
                label="Alignment"
                value={section.settings?.align || 'left'}
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Centred' },
                ]}
                onChange={(event) => set('settings.align', event.target.value)}
              />
              <Select
                name={`columns-${index}`}
                label="Columns"
                value={String(section.settings?.columns || 3)}
                options={['1', '2', '3', '4'].map((value) => ({ value, label: value }))}
                onChange={(event) => set('settings.columns', Number(event.target.value))}
              />
              {['services', 'vehicles', 'testimonials', 'faq', 'blogList', 'coverage'].includes(section.type) ? (
                <Input
                  name={`limit-${index}`}
                  type="number"
                  label="Maximum items"
                  value={section.settings?.limit ?? ''}
                  onChange={(event) =>
                    set('settings.limit', event.target.value === '' ? undefined : Number(event.target.value))
                  }
                />
              ) : null}
              {['faq', 'blogList'].includes(section.type) ? (
                <Input
                  name={`category-${index}`}
                  label="Filter by category"
                  placeholder="e.g. airport"
                  value={section.settings?.category || ''}
                  onChange={(event) => set('settings.category', event.target.value)}
                />
              ) : null}
              {section.type === 'contactForm' ? (
                <Select
                  name={`layout-${index}`}
                  label="Form type"
                  value={section.settings?.layout || 'contact'}
                  options={FORM_LAYOUTS}
                  onChange={(event) => set('settings.layout', event.target.value)}
                />
              ) : null}
              {section.type === 'imageText' ? (
                <Select
                  name={`imagePosition-${index}`}
                  label="Image position"
                  value={section.settings?.imagePosition || 'right'}
                  options={[
                    { value: 'left', label: 'Left' },
                    { value: 'right', label: 'Right' },
                  ]}
                  onChange={(event) => set('settings.imagePosition', event.target.value)}
                />
              ) : null}
              <Input
                name={`anchor-${index}`}
                label="Anchor ID"
                placeholder="e.g. pricing"
                hint="Lets you link to this section with #anchor."
                value={section.settings?.anchorId || ''}
                onChange={(event) => set('settings.anchorId', event.target.value)}
              />
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
};

/** Item rows inside a section, with the field set trimmed per block type. */
const SectionItems = ({ label, type, value, onChange }) => {
  const relevant = {
    features: ['icon', 'title', 'description'],
    steps: ['title', 'description', 'icon'],
    stats: ['value', 'title', 'description'],
    faq: ['title', 'body'],
    gallery: ['image', 'title'],
    logoStrip: ['image', 'title', 'link'],
    relatedLinks: ['title', 'description', 'link'],
    coverage: ['title', 'description', 'link'],
    hero: ['icon', 'title'],
    imageText: ['title', 'description', 'icon'],
  }[type] || ['title', 'description'];

  const fields = ITEM_FIELDS.filter((field) => relevant.includes(field.name)).map((field) =>
    type === 'faq' && field.name === 'title' ? { ...field, label: 'Question' } : field,
  );

  const [openIndex, setOpenIndex] = useState(null);

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="repeater">
        {value.length === 0 ? <div className="repeater__empty">No {label.toLowerCase()} yet.</div> : null}

        {value.map((item, index) => (
          <div className="repeater__item" key={item.id || index}>
            <div className="repeater__head">
              <button
                type="button"
                className="repeater__handle"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <Icon
                  name="chevronDown"
                  size={14}
                  style={{ transform: openIndex === index ? 'none' : 'rotate(-90deg)' }}
                />
                {item.title || item.value || `Item ${index + 1}`}
              </button>
              <button type="button" className="icon-btn" onClick={() => move(index, -1)} aria-label="Move up">
                <Icon name="chevronDown" size={14} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <button type="button" className="icon-btn" onClick={() => move(index, 1)} aria-label="Move down">
                <Icon name="chevronDown" size={14} />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                onClick={() => onChange(value.filter((_, position) => position !== index))}
                aria-label="Remove"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>

            {openIndex === index ? (
              <div className="repeater__body">
                {fields.map((field) => (
                  <FieldRenderer
                    key={field.name}
                    field={field}
                    value={getPath(item, field.name)}
                    values={item}
                    onChange={(next) =>
                      onChange(
                        value.map((entry, position) =>
                          position === index ? setPath(entry, field.name, next) : entry,
                        ),
                      )
                    }
                  />
                ))}
              </div>
            ) : null}
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          icon="plus"
          onClick={() => {
            onChange([...value, { id: uniqueId() }]);
            setOpenIndex(value.length);
          }}
        >
          Add {label.replace(/s$/, '').toLowerCase()}
        </Button>
      </div>
    </div>
  );
};

/**
 * Page builder. Sections are ordered, toggled and configured here, then stored
 * on the content document and rendered by `SectionRenderer` on the public site.
 */
const SectionsEditor = ({ value = [], onChange, allowed }) => {
  const [picker, setPicker] = useState(false);
  const catalogue = allowed ? SECTION_TYPES.filter((entry) => allowed.includes(entry.type)) : SECTION_TYPES;

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="stack">
      <div className="repeater">
        {value.length === 0 ? (
          <div className="repeater__empty">
            This page has no sections yet. Add your first block to start building the page.
          </div>
        ) : null}

        {value.map((section, index) => (
          <SectionCard
            key={section.id || index}
            section={section}
            index={index}
            total={value.length}
            onChange={(next) => onChange(value.map((entry, position) => (position === index ? next : entry)))}
            onMove={move}
            onDuplicate={() =>
              onChange([
                ...value.slice(0, index + 1),
                { ...section, id: uniqueId() },
                ...value.slice(index + 1),
              ])
            }
            onRemove={() => onChange(value.filter((_, position) => position !== index))}
          />
        ))}
      </div>

      <div>
        <Button variant="primary" icon="plus" onClick={() => setPicker(true)}>
          Add section
        </Button>
      </div>

      <Modal open={picker} onClose={() => setPicker(false)} title="Add a section" wide>
        <div className="section-picker">
          {catalogue.map((definition) => (
            <button
              key={definition.type}
              type="button"
              onClick={() => {
                onChange([
                  ...value,
                  { id: uniqueId(), type: definition.type, enabled: true, items: [], settings: {} },
                ]);
                setPicker(false);
              }}
            >
              <Icon name={definition.icon} size={18} />
              <span>
                {definition.label}
                <small>{definition.description}</small>
              </span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default SectionsEditor;
