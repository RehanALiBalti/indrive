import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api, apiRequest } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Input, Select, Textarea } from '../../components/ui/Field.jsx';
import AdminTable, { IconButton, StatusBadge, dateTime } from '../components/AdminTable.jsx';
import { titleCase } from '../../lib/format.js';

const COLLECTIONS = {
  booking: {
    title: 'Journey enquiries',
    singular: 'enquiry',
    description: 'Airport, city-to-city and hourly enquiries submitted through the booking widget.',
    name: (row) => `${row.firstName || ''} ${row.lastName || ''}`.trim(),
    summary: (row) =>
      [row.pickup, row.destination || row.airport, row.hours ? `${row.hours} hours` : null]
        .filter(Boolean)
        .join(' → '),
  },
  contact: {
    title: 'Contact messages',
    singular: 'message',
    description: 'Messages sent from the contact page and contact sections.',
    name: (row) => `${row.firstName || ''} ${row.lastName || ''}`.trim(),
    summary: (row) => row.subject,
  },
  corporate: {
    title: 'Corporate enquiries',
    singular: 'enquiry',
    description: 'Business account requests from the corporate travel page.',
    name: (row) => row.contactName,
    summary: (row) => row.companyName,
  },
  support: {
    title: 'Support requests',
    singular: 'request',
    description: 'Help requests raised from the support page.',
    name: (row) => row.name,
    summary: (row) => row.subject,
  },
  newsletter: {
    title: 'Newsletter subscribers',
    singular: 'subscriber',
    description: 'People who opted in to marketing emails. Export the list for your email platform.',
    name: (row) => row.firstName || row.email,
    summary: (row) => row.source,
  },
};

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'archived', label: 'Archived' },
  { value: 'spam', label: 'Spam' },
];

const HIDDEN_FIELDS = new Set(['id', 'meta', 'status', 'internalNotes', 'assignedTo']);

const SubmissionDetail = ({ collection, id, onClose, onChanged }) => {
  const toast = useToast();
  const state = useApi(id ? `/admin/submissions/${collection}/${id}` : null, { auth: true });
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(null);

  const record = state.data;
  const noteValue = notes ?? record?.internalNotes ?? '';

  const patch = async (body) => {
    setSaving(true);
    try {
      await api.patch(`/admin/submissions/${collection}/${id}`, body, { auth: true });
      toast.success('Enquiry updated.');
      state.refetch();
      onChanged();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(id)}
      onClose={onClose}
      wide
      title={record ? `${record.reference || 'Submission'} · ${COLLECTIONS[collection].title}` : 'Loading…'}
      footer={
        record ? (
          <>
            <Button variant="outline" href={`mailto:${record.email}`} icon="mail">
              Reply by email
            </Button>
            <Button onClick={() => patch({ internalNotes: noteValue })} loading={saving}>
              Save notes
            </Button>
          </>
        ) : null
      }
    >
      {state.loading ? <p>Loading…</p> : null}
      {state.error ? <p role="alert">{state.error.message}</p> : null}

      {record ? (
        <div className="stack">
          <div className="field-row">
            <Select
              name="status"
              label="Status"
              value={record.status || 'new'}
              options={STATUS_OPTIONS}
              onChange={(event) => patch({ status: event.target.value })}
            />
          </div>

          <div className="detail-list">
            {Object.entries(record)
              .filter(([key, value]) => !HIDDEN_FIELDS.has(key) && value !== '' && value !== null)
              .map(([key, value]) => (
                <div className="detail-list__row" key={key}>
                  <span className="detail-list__label">{titleCase(key)}</span>
                  <span className="detail-list__value">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </span>
                </div>
              ))}
          </div>

          <Textarea
            name="internalNotes"
            label="Internal notes"
            rows={4}
            value={noteValue}
            hint="Only visible to your team."
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      ) : null}
    </Modal>
  );
};

const SubmissionsPage = () => {
  const { collection = 'booking' } = useParams();
  const config = COLLECTIONS[collection] || COLLECTIONS.booking;
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const open = searchParams.get('open');

  const state = useApi(`/admin/submissions/${collection}`, {
    auth: true,
    params: { page, limit: 20, search: search || undefined, status: status || undefined },
  });

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const exportCsv = async () => {
    setBusy(true);
    try {
      const { data } = await apiRequest(`/admin/submissions/${collection}/export/csv`, { auth: true });
      const blob = new Blob([data || ''], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collection}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/submissions/${collection}/${pendingDelete.id}`, { auth: true });
      toast.success('Deleted.');
      setPendingDelete(null);
      state.refetch();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'reference',
      label: 'Reference',
      render: (row) => (
        <button
          type="button"
          className="admin-table__primary"
          style={{ background: 'none', textDecoration: 'underline' }}
          onClick={() => setParam('open', row.id)}
        >
          {row.reference || row.id.slice(0, 8)}
        </button>
      ),
    },
    {
      key: 'name',
      label: 'From',
      render: (row) => (
        <>
          {config.name(row) || '—'}
          <span className="admin-table__sub">{row.email}</span>
        </>
      ),
    },
    { key: 'summary', label: 'Details', render: (row) => config.summary(row) || '—' },
    { key: 'createdAt', label: 'Received', render: (row) => dateTime(row.createdAt) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        {isAdmin ? (
          <div className="admin-actions">
            <Button variant="outline" icon="download" onClick={exportCsv} loading={busy}>
              Export CSV
            </Button>
          </div>
        ) : null}
      </div>

      <div className="panel">
        <div className="admin-toolbar">
          <Input
            name="search"
            label="Search"
            type="search"
            placeholder="Search by reference, name or email"
            defaultValue={search}
            onChange={(event) => setParam('search', event.target.value)}
          />
          <Select
            name="status"
            label="Status"
            value={status}
            options={[{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS]}
            onChange={(event) => setParam('status', event.target.value)}
          />
        </div>

        <AdminTable
          state={state}
          columns={columns}
          onPageChange={(next) => setParam('page', String(next))}
          emptyTitle={`No ${config.title.toLowerCase()} yet`}
          emptyText="Submissions from the website appear here automatically."
          actions={(row) => (
            <>
              <IconButton icon="eye" label="Open" onClick={() => setParam('open', row.id)} />
              {row.email ? <IconButton icon="mail" label="Reply" href={`mailto:${row.email}`} /> : null}
              {isAdmin ? (
                <IconButton icon="trash" label="Delete" danger onClick={() => setPendingDelete(row)} />
              ) : null}
            </>
          )}
        />
      </div>

      <SubmissionDetail
        collection={collection}
        id={open}
        onClose={() => setParam('open', '')}
        onChanged={state.refetch}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        pending={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        title="Delete this submission?"
        message="The record will be permanently removed from Firestore."
      />
    </>
  );
};

export default SubmissionsPage;
