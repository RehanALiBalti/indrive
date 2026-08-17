import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Input, Select, PasswordInput } from '../../components/ui/Field.jsx';
import { Alert, Badge } from '../../components/ui/Misc.jsx';
import AdminTable, { IconButton, StatusBadge, dateTime } from '../components/AdminTable.jsx';
import useForm, { validators } from '../../hooks/useForm.js';

const ROLE_OPTIONS = [
  { value: 'user', label: 'Customer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Administrator' },
];

const ROLE_VARIANT = { admin: 'accent', editor: 'info', user: 'default' };

const InviteDialog = ({ open, onClose, onCreated }) => {
  const toast = useToast();
  const form = useForm({
    initialValues: { email: '', displayName: '', role: 'editor', password: '' },
    rules: {
      email: [validators.required('An email address is required.'), validators.email()],
      displayName: [
        validators.required('A name is required.'),
        validators.minLength(2, 'Enter the person’s full name.'),
      ],
      password: [
        validators.required('A temporary password is required.'),
        validators.strongPassword(),
      ],
    },
    onSubmit: async ({ email, displayName, role, password }) => {
      await api.post('/admin/users', { email, displayName, role, password }, { auth: true });
      toast.success('Account created. Share the password securely and ask them to change it.');
      onCreated();
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a team account"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit} loading={form.submitting}>
            Create account
          </Button>
        </>
      }
    >
      <form onSubmit={form.handleSubmit} className="stack" noValidate>
        {form.submitError ? <Alert variant="error">{form.submitError}</Alert> : null}
        <Input
          name="displayName"
          label="Full name"
          required
          value={form.values.displayName}
          error={form.errors.displayName}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
        />
        <Input
          name="email"
          label="Email address"
          type="email"
          required
          value={form.values.email}
          error={form.errors.email}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
        />
        <Select
          name="role"
          label="Role"
          value={form.values.role}
          options={ROLE_OPTIONS}
          onChange={form.handleChange}
        />
        <PasswordInput
          name="password"
          label="Temporary password"
          required
          hint="At least 8 characters. The user can change it from their account page."
          value={form.values.password}
          error={form.errors.password}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
        />
      </form>
    </Modal>
  );
};

const UsersPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invite, setInvite] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';

  const state = useApi('/admin/users', {
    auth: true,
    params: { page, limit: 20, search: search || undefined, type: type || undefined },
  });

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const changeRole = async (row, role) => {
    try {
      await api.patch(`/admin/users/${row.id}/role`, { role }, { auth: true });
      toast.success(`${row.displayName || row.email} is now ${role === 'user' ? 'a customer' : `an ${role}`}.`);
      state.refetch();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleStatus = async (row) => {
    const status = row.status === 'disabled' ? 'active' : 'disabled';
    try {
      await api.patch(`/admin/users/${row.id}/status`, { status }, { auth: true });
      toast.success(status === 'disabled' ? 'Account disabled.' : 'Account re-enabled.');
      state.refetch();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/users/${pendingDelete.id}`, { auth: true });
      toast.success('Account deleted.');
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
      key: 'displayName',
      label: 'User',
      render: (row) => (
        <>
          <span className="admin-table__primary">{row.displayName || '—'}</span>
          <span className="admin-table__sub">{row.email}</span>
        </>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) =>
        row.id === user?.uid ? (
          <Badge variant={ROLE_VARIANT[row.role]}>{row.role} (you)</Badge>
        ) : (
          <Select
            name={`role-${row.id}`}
            value={row.role || 'user'}
            options={ROLE_OPTIONS}
            onChange={(event) => changeRole(row, event.target.value)}
          />
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status === 'disabled' ? 'disabled' : 'active'} />,
    },
    {
      key: 'emailVerified',
      label: 'Email',
      render: (row) => (row.emailVerified ? 'Verified' : 'Unverified'),
    },
    { key: 'createdAt', label: 'Joined', render: (row) => dateTime(row.createdAt) },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Users &amp; roles</h1>
          <p>
            Roles are stored as Firebase custom claims and verified on every API request — they can never be set from
            the browser.
          </p>
        </div>
        <div className="admin-actions">
          <Button icon="plus" onClick={() => setInvite(true)}>
            Create account
          </Button>
        </div>
      </div>

      <Alert variant="info" title="What each role can do">
        Customers can only manage their own account. Editors can manage all content, media and enquiries.
        Administrators additionally manage users, redirects, site settings and deletions.
      </Alert>

      <div className="panel">
        <div className="admin-toolbar">
          <Input
            name="search"
            label="Search"
            type="search"
            placeholder="Search by name, email or phone"
            defaultValue={search}
            onChange={(event) => setParam('search', event.target.value)}
          />
          <Select
            name="type"
            label="Role"
            value={type}
            options={[{ value: '', label: 'All roles' }, ...ROLE_OPTIONS]}
            onChange={(event) => setParam('type', event.target.value)}
          />
        </div>

        <AdminTable
          state={state}
          columns={columns}
          onPageChange={(next) => setParam('page', String(next))}
          emptyTitle="No accounts found"
          emptyText="Accounts appear here as soon as someone registers on the website."
          actions={(row) =>
            row.id === user?.uid ? null : (
              <>
                <IconButton
                  icon={row.status === 'disabled' ? 'check' : 'lock'}
                  label={row.status === 'disabled' ? 'Re-enable account' : 'Disable account'}
                  onClick={() => toggleStatus(row)}
                />
                <IconButton icon="trash" label="Delete account" danger onClick={() => setPendingDelete(row)} />
              </>
            )
          }
        />
      </div>

      <InviteDialog open={invite} onClose={() => setInvite(false)} onCreated={state.refetch} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        pending={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        title="Delete this account?"
        message={
          pendingDelete
            ? `${pendingDelete.email} will be removed from Firebase Authentication and the users collection. Their submitted enquiries are kept.`
            : ''
        }
      />
    </>
  );
};

export default UsersPage;
