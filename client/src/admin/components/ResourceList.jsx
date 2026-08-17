import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import AdminTable, { IconButton } from './AdminTable.jsx';
import { getResource } from '../config/resources.jsx';

/**
 * Generic CRUD list for any CMS collection.
 *
 * The columns, filters and API path all come from the resource definition, so
 * adding a new content type never means writing another list screen.
 */
const ResourceList = ({ resourceKey, extraActions = null }) => {
  const params = useParams();
  const resource = getResource(resourceKey || params.resource);
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const type = searchParams.get('type') || '';

  const state = useApi(resource.api, {
    auth: true,
    params: { page, limit: 20, search: search || undefined, status: status || undefined, type: type || undefined },
  });

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const duplicate = async (row) => {
    setBusy(true);
    try {
      const copy = await api.post(`${resource.api}/${row.id}/duplicate`, {}, { auth: true });
      toast.success('Copy created as a draft.');
      navigate(`/admin/${resource.key}/${copy.id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`${resource.api}/${pendingDelete.id}`, { auth: true });
      toast.success(`${resource.singular} deleted.`);
      setPendingDelete(null);
      state.refetch();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>{resource.title}</h1>
          <p>{resource.description}</p>
        </div>
        <div className="admin-actions">
          {extraActions}
          <Button icon="plus" to={`/admin/${resource.key}/new`}>
            New {resource.singular.toLowerCase()}
          </Button>
        </div>
      </div>

      <div className="panel">
        <div className="admin-toolbar">
          <Input
            name="search"
            label="Search"
            type="search"
            placeholder={`Search ${resource.title.toLowerCase()}`}
            defaultValue={search}
            onChange={(event) => setParam('search', event.target.value)}
          />
          {(resource.filters || []).map((filter) => (
            <Select
              key={filter.name}
              name={filter.name}
              label={filter.label}
              value={searchParams.get(filter.name) || ''}
              options={filter.options}
              onChange={(event) => setParam(filter.name, event.target.value)}
            />
          ))}
        </div>

        <AdminTable
          state={state}
          columns={resource.columns}
          onPageChange={(next) => setParam('page', String(next))}
          emptyTitle={search || status || type ? 'No matches' : `No ${resource.title.toLowerCase()} yet`}
          emptyText={
            search || status || type
              ? 'Try a different search or clear the filters.'
              : `Create your first ${resource.singular.toLowerCase()} to see it here.`
          }
          emptyAction={{ label: `New ${resource.singular.toLowerCase()}`, to: `/admin/${resource.key}/new` }}
          actions={(row) => (
            <>
              {resource.viewPath ? (
                <IconButton icon="eye" label="View on the website" href={resource.viewPath(row)} />
              ) : null}
              <IconButton icon="edit" label="Edit" to={`/admin/${resource.key}/${row.id}`} />
              {resource.supportsDuplicate ? (
                <IconButton icon="copy" label="Duplicate" onClick={() => duplicate(row)} disabled={busy} />
              ) : null}
              <IconButton icon="trash" label="Delete" danger onClick={() => setPendingDelete(row)} />
            </>
          )}
        />
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        pending={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        title={`Delete this ${resource.singular.toLowerCase()}?`}
        message={
          pendingDelete
            ? `"${pendingDelete[resource.titleField] || 'This record'}" will be permanently removed. Any links pointing to it will start returning a 404 page unless you add a redirect.`
            : ''
        }
      />
    </>
  );
};

export const ResourceListRoute = () => {
  const { resource } = useParams();
  const definition = getResource(resource);
  if (!definition) {
    return (
      <div className="admin-page-head">
        <div>
          <h1>Unknown section</h1>
          <p>
            That content type does not exist. <Link to="/admin">Return to the dashboard</Link>.
          </p>
        </div>
      </div>
    );
  }
  return <ResourceList resourceKey={resource} />;
};

export default ResourceList;
