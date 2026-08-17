import { useCallback, useRef, useState } from 'react';
import { api, apiRequest } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { AsyncContent, Loading } from '../../components/ui/States.jsx';
import { Alert } from '../../components/ui/Misc.jsx';

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml,application/pdf';

/** Mirrors ALLOWED_FOLDERS in the API's storage service. */
const FOLDERS = ['general', 'vehicles', 'blog', 'pages', 'seo', 'services', 'testimonials'];

const humanSize = (bytes) => {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

/**
 * Media library browser and uploader.
 *
 * Files never touch Firebase Storage directly from the browser: they are posted
 * to the API, which validates the type, size and file signature before the
 * Admin SDK writes them and records the metadata in Firestore.
 */
export const MediaLibrary = ({ onSelect, selectable = true, folder: initialFolder = '' }) => {
  const toast = useToast();
  const inputRef = useRef(null);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState(initialFolder);
  const [uploadFolder, setUploadFolder] = useState(initialFolder || 'general');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const state = useApi('/admin/media', {
    auth: true,
    params: { limit: 60, search: search || undefined, category: folder || undefined },
  });

  const upload = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;

      const tooBig = files.find((file) => file.size > MAX_BYTES);
      if (tooBig) {
        setUploadError(`"${tooBig.name}" is ${humanSize(tooBig.size)}. The maximum file size is 8 MB.`);
        return;
      }

      setUploadError(null);
      setUploading(true);
      try {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        formData.append('folder', uploadFolder);
        const created = await api.upload('/admin/media', formData);
        toast.success(`${created.length} file${created.length === 1 ? '' : 's'} uploaded.`);
        state.refetch();
        if (created[0] && onSelect) onSelect(created[0]);
      } catch (error) {
        setUploadError(error.message);
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [onSelect, state, toast, uploadFolder],
  );

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.originalName}"? Pages using this file will show a placeholder.`)) {
      return;
    }
    try {
      await apiRequest(`/admin/media/${item.id}`, { method: 'DELETE', auth: true });
      toast.success('File deleted.');
      state.refetch();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="stack">
      <div className="field-row">
        <Input
          name="media-search"
          label="Search media"
          placeholder="Search by file name or alt text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          name="media-folder"
          label="Folder"
          value={folder}
          onChange={(event) => setFolder(event.target.value)}
          options={[{ value: '', label: 'All folders' }, ...FOLDERS.map((item) => ({ value: item, label: item }))]}
        />
        <Select
          name="upload-folder"
          label="Upload into"
          value={uploadFolder}
          onChange={(event) => setUploadFolder(event.target.value)}
          options={FOLDERS.map((item) => ({ value: item, label: item }))}
        />
      </div>

      <div
        className={`dropzone ${dragging ? 'is-active' : ''}`.trim()}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          upload(event.dataTransfer.files);
        }}
      >
        {uploading ? (
          <Loading label="Uploading…" compact />
        ) : (
          <>
            <Icon name="upload" size={24} />
            <p style={{ marginTop: 'var(--space-2)' }}>
              Drop files here or click to browse. JPG, PNG, WebP, AVIF, SVG or PDF, up to 8 MB each.
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(event) => upload(event.target.files)}
        />
      </div>

      {uploadError ? <Alert variant="error">{uploadError}</Alert> : null}

      <AsyncContent
        state={state}
        emptyTitle="No media yet"
        emptyText="Upload your first image and it will appear here, ready to use across the site."
      >
        {(items) => (
          <div className="media-grid">
            {items.map((item) => (
              <div className={`media-item ${selectable ? '' : 'is-static'}`.trim()} key={item.id}>
                <button
                  type="button"
                  onClick={() => (selectable ? onSelect?.(item) : window.open(item.url, '_blank'))}
                  style={{ padding: 0, background: 'none', display: 'block', width: '100%' }}
                  title={selectable ? 'Use this file' : 'Open file'}
                >
                  {item.contentType?.startsWith('image/') ? (
                    <img src={item.url} alt={item.alt || item.originalName} loading="lazy" />
                  ) : (
                    <span
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        aspectRatio: '4 / 3',
                        background: 'var(--slate-100)',
                      }}
                    >
                      <Icon name="file" size={28} />
                    </span>
                  )}
                </button>
                <div className="media-item__meta" title={item.originalName}>
                  {item.originalName}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px 8px' }}>
                  <small style={{ color: 'var(--slate-500)' }}>{humanSize(item.size)}</small>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => remove(item)}
                    aria-label={`Delete ${item.originalName}`}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AsyncContent>
    </div>
  );
};

/**
 * Single-image form field: preview, alt text and a library picker.
 * Alt text is required for accessibility and image SEO.
 */
export const ImageField = ({ label, value = {}, onChange, hint, folder = 'general' }) => {
  const [open, setOpen] = useState(false);

  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="field">
      {label ? <span className="field__label">{label}</span> : null}

      <div className="image-field">
        {value?.url ? (
          <img className="image-field__preview" src={value.url} alt={value.alt || ''} />
        ) : (
          <span className="image-field__preview" style={{ display: 'grid', placeItems: 'center' }}>
            <Icon name="image" size={22} />
          </span>
        )}

        <div className="image-field__body">
          <Input
            name={`${label || 'image'}-alt`}
            label="Alt text"
            placeholder="Describe the image for screen readers and search engines"
            value={value?.alt || ''}
            onChange={(event) => set({ alt: event.target.value })}
          />
          <div className="image-field__actions">
            <Button variant="outline" size="sm" icon="image" onClick={() => setOpen(true)}>
              {value?.url ? 'Replace image' : 'Choose image'}
            </Button>
            {value?.url ? (
              <Button
                variant="ghost"
                size="sm"
                icon="trash"
                onClick={() => onChange({ url: '', alt: '', path: '' })}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {hint ? <span className="field__hint">{hint}</span> : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Media library" wide>
        <MediaLibrary
          folder={folder}
          onSelect={(item) => {
            set({ url: item.url, path: item.path, alt: value?.alt || item.alt || '' });
            setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
};

/** Ordered gallery field used by the fleet and page galleries. */
export const ImageListField = ({ label, value = [], onChange, hint, folder = 'general', max = 12 }) => {
  const [open, setOpen] = useState(false);

  const update = (index, patch) =>
    onChange(value.map((item, position) => (position === index ? { ...item, ...patch } : item)));

  const move = (index, delta) => {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="field">
      {label ? <span className="field__label">{label}</span> : null}

      <div className="repeater">
        {value.map((image, index) => (
          <div className="repeater__item" key={`${image.url}-${index}`}>
            <div className="repeater__head">
              <span className="repeater__handle">
                <Icon name="image" size={15} />
                {index === 0 ? 'Main image' : `Image ${index + 1}`}
              </span>
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
                aria-label="Remove image"
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
            <div className="repeater__body">
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                <img className="image-field__preview" src={image.url} alt={image.alt || ''} />
                <Input
                  name={`gallery-alt-${index}`}
                  label="Alt text"
                  value={image.alt || ''}
                  onChange={(event) => update(index, { alt: event.target.value })}
                />
              </div>
            </div>
          </div>
        ))}

        {value.length < max ? (
          <Button variant="outline" size="sm" icon="plus" onClick={() => setOpen(true)}>
            Add image
          </Button>
        ) : null}
      </div>

      {hint ? <span className="field__hint">{hint}</span> : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Add images" wide>
        <MediaLibrary
          folder={folder}
          onSelect={(item) => {
            onChange([...value, { url: item.url, path: item.path, alt: item.alt || '' }]);
            setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default MediaLibrary;
