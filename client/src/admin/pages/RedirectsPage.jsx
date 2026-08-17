import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Input, Select, Checkbox } from '../../components/ui/Field.jsx';
import { Alert, Badge } from '../../components/ui/Misc.jsx';
import AdminTable, { IconButton, dateTime } from '../components/AdminTable.jsx';

const STATUS_CODES = [
  { value: '301', label: '301 — permanent' },
  { value: '302', label: '302 — temporary' },
  { value: '307', label: '307 — temporary (keeps method)' },
  { value: '308', label: '308 — permanent (keeps method)' },
];

const blank = { from: '', to: '', statusCode: 301, note: '', isActive: true };

const RedirectDialog = ({ open, redirect, onClose, onSaved }) => {
  const toast = useToast();
  const [values, setValues] = useState(redirect || blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const save = async () => {
    const found = {};
    if (!values.from.trim()) found.from = 'Enter the old path.';
    else if (!values.from.startsWith('/')) found.from = 'The old path must start with /.';
    if (!values.to.trim()) found.to = 'Enter the destination.';
    else if (!values.to.startsWith('/') && !/^https?:\/\//i.test(values.to)) {
      found.to = 'The destination must start with / or https://.';
    }
    if (values.from.trim() === values.to.trim()) found.to = 'A redirect cannot point at itself.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const payload = { ...values, statusCode: Number(values.statusCode) };
      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.createdBy;
      delete payload.updatedBy;

      if (redirect?.id) await api.put(`/admin/redirects/${redirect.id}`, payload, { auth: true });
      else await api.post('/admin/redirects', payload, { auth: true });

      toast.success('Redirect saved.');
      onSaved();
      onClose();
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
      title={redirect?.id ? 'Edit redirect' : 'New redirect'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save redirect
          </Button>
        </>
      }
    >
      <div className="stack">
        <Input
          name="from"
          label="Old path"
          required
          placeholder="/old-page"
          hint="The path visitors and search engines still request."
          value={values.from}
          error={errors.from}
          onChange={(event) => set('from', event.target.value)}
        />
        <Input
          name="to"
          label="Redirect to"
          required
          placeholder="/airport-transfers/heathrow-airport"
          value={values.to}
          error={errors.to}
          onChange={(event) => set('to', event.target.value)}
        />
        <Select
          name="statusCode"
          label="Type"
          value={String(values.statusCode || 301)}
          options={STATUS_CODES}
          hint="Use 301 when the move is permanent — it passes ranking signals to the new URL."
          onChange={(event) => set('statusCode', Number(event.target.value))}
        />
        <Input
          name="note"
          label="Note"
          placeholder="Why this redirect exists"
          value={values.note || ''}
          onChange={(event) => set('note', event.target.value)}
        />
        <Checkbox
          name="isActive"
          label="Active"
          checked={values.isActive !== false}
          onChange={(event) => set('isActive', event.target.checked)}
        />
      </div>
    </Modal>
  );
};

const RedirectsPage = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';

  const state = useApi('/admin/redirects', {
    auth: true,
    params: { page, limit: 25, search: search || undefined },
  });

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/redirects/${pendingDelete.id}`, { auth: true });
      toast.success('Redirect removed.');
      setPendingDelete(null);
      state.refetch();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'from', label: 'From', render: (row) => <code>{row.from}</code> },
    { key: 'to', label: 'To', render: (row) => <code>{row.to}</code> },
    { key: 'statusCode', label: 'Type', render: (row) => <Badge>{row.statusCode || 301}</Badge> },
    { key: 'note', label: 'Note', render: (row) => row.note || '—' },
    {
      key: 'isActive',
      label: 'Active',
      render: (row) => (row.isActive === false ? 'No' : 'Yes'),
    },
    { key: 'updatedAt', label: 'Updated', render: (row) => dateTime(row.updatedAt) },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Redirects</h1>
          <p>Keep rankings when a URL changes. Redirects are applied by the API before the page is served.</p>
        </div>
        <div className="admin-actions">
          <Button icon="plus" onClick={() => setEditing(blank)}>
            New redirect
          </Button>
        </div>
      </div>

      <Alert variant="info">
        Add a 301 whenever you change a slug or delete a page that search engines already know about.
      </Alert>

      <div className="panel">
        <div className="admin-toolbar">
          <Input
            name="search"
            label="Search"
            type="search"
            placeholder="Search paths or notes"
            defaultValue={search}
            onChange={(event) => setParam('search', event.target.value)}
          />
        </div>

        <AdminTable
          state={state}
          columns={columns}
          onPageChange={(next) => setParam('page', String(next))}
          emptyTitle="No redirects yet"
          emptyText="When you rename or remove a page, add a redirect here so old links keep working."
          actions={(row) => (
            <>
              <IconButton icon="edit" label="Edit" onClick={() => setEditing(row)} />
              <IconButton icon="trash" label="Delete" danger onClick={() => setPendingDelete(row)} />
            </>
          )}
        />
      </div>

      {editing ? (
        <RedirectDialog
          open
          redirect={editing}
          onClose={() => setEditing(null)}
          onSaved={state.refetch}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        pending={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        title="Delete this redirect?"
        message={pendingDelete ? `Visitors to ${pendingDelete.from} will see a 404 page instead.` : ''}
      />
    </>
  );
};

export default RedirectsPage;
