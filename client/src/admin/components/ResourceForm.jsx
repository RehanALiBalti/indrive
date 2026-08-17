import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBeforeUnload, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Alert, Tabs } from '../../components/ui/Misc.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Loading, ErrorState } from '../../components/ui/States.jsx';
import { FieldRenderer, SEO_FIELDS } from './FormFields.jsx';
import SectionsEditor from './SectionsEditor.jsx';
import { getResource } from '../config/resources.jsx';
import { getPath, setPath, pruneUndefined } from '../utils/objectPath.js';
import { slugify } from '../../lib/format.js';

const SEO_LIMITS = { 'seo.title': 60, 'seo.description': 160 };

const counterHint = (field, value) => {
  const limit = SEO_LIMITS[field.name];
  if (!limit) return field.hint;
  const length = String(value || '').length;
  const suffix = `${length}/${limit} characters`;
  return field.hint ? `${field.hint} · ${suffix}` : suffix;
};

/**
 * One editor for every CMS collection.
 *
 * Field layout comes from the resource definition; sections and SEO panels are
 * opt-in. Server-side validation errors are mapped back onto their fields so
 * editors see exactly what needs fixing.
 */
const ResourceForm = ({ resourceKey }) => {
  const params = useParams();
  const resource = getResource(resourceKey || params.resource);
  const { id } = params;
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();

  const [values, setValues] = useState(() => ({ ...(resource.defaults || {}) }));
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(resource.tabs[0].id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const state = useApi(isNew ? null : `${resource.api}/${id}`, { auth: true });

  useEffect(() => {
    if (state.data) {
      setValues({ ...(resource.defaults || {}), ...state.data });
      setDirty(false);
    }
  }, [state.data, resource.defaults]);

  useBeforeUnload(
    useCallback((event) => {
      if (dirty) event.preventDefault();
    }, [dirty]),
  );

  const set = useCallback((path, value) => {
    setValues((current) => setPath(current, path, value));
    setDirty(true);
    setErrors((current) => {
      if (!current[path]) return current;
      const next = { ...current };
      delete next[path];
      return next;
    });
  }, []);

  const sectionsPath = resource.sectionsPath || 'sections';

  const tabs = useMemo(() => {
    const list = resource.tabs.map((entry) => ({ value: entry.id, label: entry.label, icon: entry.icon }));
    if (resource.supportsSections) list.push({ value: '__sections', label: 'Sections', icon: 'dashboard' });
    if (resource.supportsSeo) list.push({ value: '__seo', label: 'SEO', icon: 'search' });
    return list;
  }, [resource]);

  const validate = () => {
    const found = {};
    for (const entry of resource.tabs) {
      for (const field of entry.fields) {
        if (!field.required) continue;
        if (field.condition && !field.condition(values)) continue;
        const value = getPath(values, field.name);
        if (value === undefined || value === null || String(value).trim() === '') {
          found[field.name] = `${field.label} is required.`;
        }
      }
    }
    setErrors(found);
    if (Object.keys(found).length) {
      const firstTab = resource.tabs.find((entry) =>
        entry.fields.some((field) => found[field.name]),
      );
      if (firstTab) setTab(firstTab.id);
    }
    return Object.keys(found).length === 0;
  };

  const save = async ({ publish } = {}) => {
    const payload = pruneUndefined({ ...values });
    if (publish) {
      if (resource.statusField === 'status') payload.status = 'published';
      else payload.isActive = true;
    }
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.createdBy;
    delete payload.updatedBy;

    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const saved = isNew
        ? await api.post(resource.api, payload, { auth: true })
        : await api.put(`${resource.api}/${id}`, payload, { auth: true });

      setValues({ ...(resource.defaults || {}), ...saved });
      setDirty(false);
      toast.success(`${resource.singular} saved.`);
      if (isNew) navigate(`/admin/${resource.key}/${saved.id}`, { replace: true });
    } catch (error) {
      setSaveError(error);
      const fieldErrors = error.fieldErrors || {};
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
        const firstTab = resource.tabs.find((entry) =>
          entry.fields.some((field) => fieldErrors[field.name]),
        );
        if (firstTab) setTab(firstTab.id);
      }
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await api.delete(`${resource.api}/${id}`, { auth: true });
      toast.success(`${resource.singular} deleted.`);
      navigate(`/admin/${resource.key}`);
    } catch (error) {
      toast.error(error.message);
      setSaving(false);
    }
  };

  if (!isNew && state.loading) return <Loading label={`Loading ${resource.singular.toLowerCase()}…`} />;
  if (!isNew && state.error) return <ErrorState error={state.error} onRetry={state.refetch} />;

  const activeTab = resource.tabs.find((entry) => entry.id === tab);
  const title = values[resource.titleField] || `New ${resource.singular.toLowerCase()}`;
  const isPublished =
    resource.statusField === 'status' ? values.status === 'published' : values.isActive !== false;
  const livePath = resource.viewPath && values.slug ? resource.viewPath(values) : null;

  const renderField = (field) => (
    <FieldRenderer
      key={field.name}
      field={{ ...field, hint: counterHint(field, getPath(values, field.name)) }}
      value={getPath(values, field.name)}
      values={values}
      error={errors[field.name]}
      onChange={(next) => set(field.name, next)}
      onSlugSource={
        field.type === 'slug'
          ? () => set(field.name, slugify(values[resource.titleField] || ''))
          : undefined
      }
    />
  );

  return (
    <>
      <div className="admin-page-head">
        <div>
          <Button variant="ghost" size="sm" icon="arrowLeft" to={`/admin/${resource.key}`}>
            Back to {resource.title.toLowerCase()}
          </Button>
          <h1 style={{ marginTop: 'var(--space-2)' }}>{title}</h1>
          {livePath ? (
            <p>
              <Icon name="external" size={14} /> <code>{livePath}</code>
            </p>
          ) : null}
        </div>
        <div className="admin-actions">
          {livePath && !isNew ? (
            <Button variant="outline" icon="eye" href={livePath}>
              View
            </Button>
          ) : null}
          {!isNew ? (
            <Button variant="ghost" icon="trash" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      {saveError && !Object.keys(saveError.fieldErrors || {}).length ? (
        <Alert variant="error" title="We could not save your changes">
          {saveError.message}
        </Alert>
      ) : null}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="admin-form">
        <div>
          <div className="panel">
            <div className="panel__body">
              {tab === '__sections' ? (
                <SectionsEditor
                  value={getPath(values, sectionsPath) || []}
                  onChange={(next) => set(sectionsPath, next)}
                />
              ) : null}

              {tab === '__seo' ? (
                <div className="stack">
                  <Alert variant="info">
                    Leave a field empty to fall back to the page content. Titles and descriptions are used for
                    Google results, social previews and the sitemap.
                  </Alert>
                  {SEO_FIELDS.map(renderField)}
                </div>
              ) : null}

              {activeTab ? <div className="stack">{activeTab.fields.map(renderField)}</div> : null}
            </div>
          </div>
        </div>

        <aside className="admin-form__aside">
          <div className="panel">
            <div className="panel__head">
              <span className="panel__title">Publishing</span>
            </div>
            <div className="panel__body stack">
              {(resource.sidebar || []).map(renderField)}
              {!isNew ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--slate-500)' }}>
                  Last updated {values.updatedAt ? new Date(values.updatedAt).toLocaleString('en-GB') : 'never'}
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      <div className="form-sticky-bar">
        <span className="form-sticky-bar__status">
          {dirty ? 'You have unsaved changes' : isNew ? 'Not saved yet' : 'All changes saved'}
        </span>
        <Button variant="outline" onClick={() => save()} loading={saving}>
          Save
        </Button>
        {!isPublished ? (
          <Button onClick={() => save({ publish: true })} loading={saving} icon="check">
            Save &amp; publish
          </Button>
        ) : (
          <Button onClick={() => save()} loading={saving} icon="check">
            Save changes
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        pending={saving}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title={`Delete this ${resource.singular.toLowerCase()}?`}
        message="This cannot be undone. Add a redirect afterwards if the URL is already indexed."
      />
    </>
  );
};

export const ResourceFormRoute = () => {
  const { resource } = useParams();
  return <ResourceForm resourceKey={resource} />;
};

export default ResourceForm;
