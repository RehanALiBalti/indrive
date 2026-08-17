import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import Icon, { iconNames } from '../../components/ui/Icon.jsx';
import {
  Input,
  Textarea,
  Select,
  Checkbox,
  NumberInput,
} from '../../components/ui/Field.jsx';
import RichTextEditor from './RichTextEditor.jsx';
import { ImageField, ImageListField } from './MediaPicker.jsx';
import { getPath, setPath } from '../utils/objectPath.js';
import { slugify } from '../../lib/format.js';

/** Tag-style editor for arrays of short strings (features, keywords, tags). */
export const StringListField = ({ label, value = [], onChange, hint, placeholder = 'Add an item', max = 30 }) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const entry = draft.trim();
    if (!entry || value.length >= max) return;
    onChange([...value, entry]);
    setDraft('');
  };

  return (
    <div className="field">
      {label ? <span className="field__label">{label}</span> : null}

      {value.length ? (
        <div className="chip-row" style={{ marginBottom: 'var(--space-2)' }}>
          {value.map((entry, index) => (
            <span className="chip" key={`${entry}-${index}`}>
              {entry}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, position) => position !== index))}
                aria-label={`Remove ${entry}`}
                style={{ marginLeft: 6, display: 'inline-flex' }}
              >
                <Icon name="close" size={13} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 auto' }}>
          <Input
            name={`list-${label}`}
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add();
              }
            }}
          />
        </div>
        <Button variant="outline" onClick={add} disabled={!draft.trim() || value.length >= max}>
          Add
        </Button>
      </div>

      {hint ? <span className="field__hint">{hint}</span> : null}
    </div>
  );
};

/** Repeating group of sub-fields (benefits, FAQs, related links…). */
export const RepeaterField = ({
  label,
  value = [],
  onChange,
  fields,
  hint,
  addLabel = 'Add item',
  titleKey = 'title',
  max = 30,
  blank = {},
}) => {
  const [openIndex, setOpenIndex] = useState(null);

  const update = (index, patch) =>
    onChange(value.map((item, position) => (position === index ? { ...item, ...patch } : item)));

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="field">
      {label ? <span className="field__label">{label}</span> : null}

      <div className="repeater">
        {value.length === 0 ? <div className="repeater__empty">No entries yet.</div> : null}

        {value.map((item, index) => {
          const open = openIndex === index;
          return (
            <div className="repeater__item" key={index}>
              <div className="repeater__head">
                <button
                  type="button"
                  className="repeater__handle"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                >
                  <Icon name="chevronDown" size={15} style={{ transform: open ? 'none' : 'rotate(-90deg)' }} />
                  {item[titleKey] || `Item ${index + 1}`}
                </button>
                <button type="button" className="icon-btn" onClick={() => move(index, -1)} aria-label="Move up">
                  <Icon name="chevronDown" size={15} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button type="button" className="icon-btn" onClick={() => move(index, 1)} aria-label="Move down">
                  <Icon name="chevronDown" size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  onClick={() => onChange(value.filter((_, position) => position !== index))}
                  aria-label="Remove entry"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>

              {open ? (
                <div className="repeater__body">
                  {fields.map((field) => (
                    <FieldRenderer
                      key={field.name}
                      field={field}
                      value={getPath(item, field.name)}
                      values={item}
                      onChange={(next) => update(index, setPath(item, field.name, next))}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}

        {value.length < max ? (
          <Button
            variant="outline"
            size="sm"
            icon="plus"
            onClick={() => {
              onChange([...value, { ...blank }]);
              setOpenIndex(value.length);
            }}
          >
            {addLabel}
          </Button>
        ) : null}
      </div>

      {hint ? <span className="field__hint">{hint}</span> : null}
    </div>
  );
};

/** Call-to-action editor (label, destination, style, on/off). */
export const CtaField = ({ label = 'Call to action', value = {}, onChange, hint }) => (
  <div className="field">
    <span className="field__label">{label}</span>
    <div className="repeater__item">
      <div className="repeater__body">
        <div className="form-grid form-grid--2">
          <Input
            name="cta-label"
            label="Button label"
            value={value.label || ''}
            placeholder="Get a quote"
            onChange={(event) => onChange({ ...value, label: event.target.value })}
          />
          <Input
            name="cta-href"
            label="Destination"
            value={value.href || ''}
            placeholder="/contact"
            onChange={(event) => onChange({ ...value, href: event.target.value })}
          />
          <Select
            name="cta-variant"
            label="Style"
            value={value.variant || 'primary'}
            onChange={(event) => onChange({ ...value, variant: event.target.value })}
            options={[
              { value: 'primary', label: 'Primary' },
              { value: 'secondary', label: 'Secondary' },
              { value: 'outline', label: 'Outline' },
              { value: 'ghost', label: 'Ghost' },
            ]}
          />
          <Checkbox
            name="cta-enabled"
            label="Show this button"
            checked={value.enabled !== false}
            onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
          />
        </div>
      </div>
    </div>
    {hint ? <span className="field__hint">{hint}</span> : null}
  </div>
);

const ICON_OPTIONS = [{ value: '', label: 'No icon' }, ...iconNames.map((name) => ({ value: name, label: name }))];

/**
 * Renders one field from a resource definition. Keeping every input behind a
 * single renderer means all CMS screens share the same behaviour, spacing and
 * validation display.
 */
export const FieldRenderer = ({ field, value, values, onChange, error, onSlugSource }) => {
  if (field.condition && !field.condition(values)) return null;

  const common = {
    name: field.name,
    label: field.label,
    hint: field.hint,
    error,
    required: field.required,
    placeholder: field.placeholder,
  };

  switch (field.type) {
    case 'textarea':
      return (
        <Textarea {...common} rows={field.rows || 4} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      );

    case 'richtext':
      return (
        <RichTextEditor
          name={field.name}
          label={field.label}
          hint={field.hint}
          error={error}
          rows={field.rows || 14}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'number':
      return (
        <NumberInput
          {...common}
          min={field.min ?? 0}
          max={field.max ?? 9999}
          step={field.step}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      );

    case 'select':
      return (
        <Select
          {...common}
          value={value ?? ''}
          options={field.options}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'icon':
      return (
        <Select {...common} value={value || ''} options={ICON_OPTIONS} onChange={(e) => onChange(e.target.value)} />
      );

    case 'boolean':
      return (
        <Checkbox
          name={field.name}
          label={field.label}
          error={error}
          checked={value !== false && Boolean(value ?? field.defaultChecked)}
          onChange={(e) => onChange(e.target.checked)}
        />
      );

    case 'slug':
      return (
        <div className="field-inline">
          <Input
            {...common}
            value={value || ''}
            onChange={(e) => onChange(slugify(e.target.value))}
            hint={field.hint || 'Used in the page URL. Letters, numbers and hyphens only.'}
          />
          {onSlugSource ? (
            <Button variant="ghost" size="sm" icon="refresh" onClick={onSlugSource}>
              Generate from title
            </Button>
          ) : null}
        </div>
      );

    case 'image':
      return (
        <ImageField
          label={field.label}
          hint={field.hint}
          folder={field.folder}
          value={value || { url: '', alt: '' }}
          onChange={onChange}
        />
      );

    case 'imageList':
      return (
        <ImageListField
          label={field.label}
          hint={field.hint}
          folder={field.folder}
          max={field.max || 12}
          value={value || []}
          onChange={onChange}
        />
      );

    case 'stringList':
      return (
        <StringListField
          label={field.label}
          hint={field.hint}
          placeholder={field.placeholder}
          max={field.max || 30}
          value={value || []}
          onChange={onChange}
        />
      );

    case 'repeater':
      return (
        <RepeaterField
          label={field.label}
          hint={field.hint}
          fields={field.fields}
          addLabel={field.addLabel}
          titleKey={field.titleKey}
          max={field.max}
          blank={field.blank}
          value={value || []}
          onChange={onChange}
        />
      );

    case 'cta':
      return <CtaField label={field.label} hint={field.hint} value={value || {}} onChange={onChange} />;

    case 'date':
      return (
        <Input
          {...common}
          type="date"
          value={(value || '').slice(0, 10)}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        />
      );

    default:
      return <Input {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
};

/** Shared SEO metadata panel used by every routable content type. */
export const SEO_FIELDS = [
  {
    name: 'seo.title',
    label: 'SEO title',
    hint: 'Aim for 50–60 characters. Leave empty to use the page title.',
    maxLength: 120,
  },
  {
    name: 'seo.description',
    label: 'Meta description',
    type: 'textarea',
    rows: 3,
    hint: 'Aim for 140–160 characters.',
  },
  {
    name: 'seo.canonical',
    label: 'Canonical URL',
    hint: 'Only set this when the page duplicates another URL.',
  },
  { name: 'seo.keywords', label: 'Keywords', type: 'stringList', placeholder: 'Add a keyword' },
  { name: 'seo.ogTitle', label: 'Social title', hint: 'Falls back to the SEO title.' },
  { name: 'seo.ogDescription', label: 'Social description', type: 'textarea', rows: 2 },
  { name: 'seo.ogImage', label: 'Social share image', type: 'image', folder: 'seo' },
  {
    name: 'seo.schemaType',
    label: 'Schema type',
    type: 'select',
    options: [
      { value: 'WebPage', label: 'WebPage' },
      { value: 'Service', label: 'Service' },
      { value: 'Article', label: 'Article' },
      { value: 'FAQPage', label: 'FAQ page' },
      { value: 'LocalBusiness', label: 'Local business' },
      { value: 'Product', label: 'Product' },
      { value: 'None', label: 'No schema' },
    ],
  },
  { name: 'seo.breadcrumbLabel', label: 'Breadcrumb label', hint: 'Shown in the breadcrumb trail.' },
  { name: 'seo.noindex', label: 'Hide from search engines (noindex)', type: 'boolean' },
  { name: 'seo.nofollow', label: 'Do not follow links on this page (nofollow)', type: 'boolean' },
];

export const CHARACTER_COUNTS = {
  'seo.title': 60,
  'seo.description': 160,
};

export default FieldRenderer;
