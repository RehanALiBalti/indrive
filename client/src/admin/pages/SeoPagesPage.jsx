import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Misc.jsx';
import ResourceList from '../components/ResourceList.jsx';
import { SEO_PAGE_PREFIX } from '../config/resources.jsx';
import { slugify } from '../../lib/format.js';

/** Token inputs shown per template type. */
const TOKENS = {
  airport: [
    { name: 'airportName', label: 'Airport name', placeholder: 'Heathrow Airport', required: true },
    { name: 'airportCode', label: 'IATA code', placeholder: 'LHR' },
    { name: 'cityName', label: 'Nearest city', placeholder: 'London' },
  ],
  city: [
    { name: 'cityName', label: 'City name', placeholder: 'Manchester', required: true },
    { name: 'region', label: 'Region', placeholder: 'Greater Manchester' },
  ],
  'city-to-city': [
    { name: 'originCity', label: 'From city', placeholder: 'London', required: true },
    { name: 'destinationCity', label: 'To city', placeholder: 'Manchester', required: true },
    { name: 'distance', label: 'Distance', placeholder: '200 miles' },
    { name: 'duration', label: 'Typical duration', placeholder: '3 hours 45 minutes' },
  ],
};

const GenerateDialog = ({ open, onClose }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const templates = useApi(open ? '/admin/seo-templates' : null, { auth: true, params: { limit: 100 } });
  const [templateId, setTemplateId] = useState('');
  const [tokens, setTokens] = useState({});
  const [slug, setSlug] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const template = (templates.data || []).find((entry) => entry.id === templateId);
  const fields = template ? TOKENS[template.type] || [] : [];

  const derivedSlug =
    slug ||
    slugify(
      template?.type === 'city-to-city'
        ? [tokens.originCity, 'to', tokens.destinationCity].filter(Boolean).join(' ')
        : tokens.airportName || tokens.cityName || '',
    );

  const generate = async () => {
    const found = {};
    if (!templateId) found.templateId = 'Choose a template.';
    fields.filter((field) => field.required).forEach((field) => {
      if (!tokens[field.name]?.trim()) found[field.name] = `${field.label} is required.`;
    });
    if (templateId && !derivedSlug) found.slug = 'Enter a slug for the new page.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const created = await api.post(
        '/admin/seo-pages/generate',
        { templateId, tokens, slug: derivedSlug, status: 'draft' },
        { auth: true },
      );
      toast.success('Landing page created as a draft. Review the content, then publish.');
      navigate(`/admin/seo-pages/${created.id}`);
    } catch (error) {
      setErrors(error.fieldErrors || {});
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a landing page from a template"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={generate} loading={saving} disabled={!templates.data?.length}>
            Create draft page
          </Button>
        </>
      }
    >
      <div className="stack">
        <Alert variant="info">
          Templates fill in the title, H1, intro, benefits, FAQs and sections for you. Everything stays editable
          afterwards.
        </Alert>

        {templates.loading ? <p>Loading templates…</p> : null}

        {templates.data && !templates.data.length ? (
          <Alert variant="warning" title="No templates yet">
            Create an SEO template first — then any new airport, city or route page takes seconds.
          </Alert>
        ) : null}

        <Select
          name="templateId"
          label="Template"
          required
          placeholder="Choose a template"
          value={templateId}
          error={errors.templateId}
          options={(templates.data || []).map((entry) => ({
            value: entry.id,
            label: `${entry.name} (${entry.type})`,
          }))}
          onChange={(event) => {
            setTemplateId(event.target.value);
            setTokens({});
            setSlug('');
          }}
        />

        {fields.map((field) => (
          <Input
            key={field.name}
            name={field.name}
            label={field.label}
            placeholder={field.placeholder}
            required={field.required}
            value={tokens[field.name] || ''}
            error={errors[field.name]}
            onChange={(event) => setTokens((current) => ({ ...current, [field.name]: event.target.value }))}
          />
        ))}

        {template ? (
          <Input
            name="slug"
            label="URL"
            value={derivedSlug}
            error={errors.slug}
            hint={`The page will live at ${SEO_PAGE_PREFIX[template.type]}/${derivedSlug || '…'}`}
            onChange={(event) => setSlug(slugify(event.target.value))}
          />
        ) : null}
      </div>
    </Modal>
  );
};

const SeoPagesPage = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ResourceList
        resourceKey="seo-pages"
        extraActions={
          <Button variant="outline" icon="sparkle" onClick={() => setOpen(true)}>
            Create from template
          </Button>
        }
      />
      <GenerateDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default SeoPagesPage;
