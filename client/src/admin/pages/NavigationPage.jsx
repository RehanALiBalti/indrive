import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Input, Checkbox } from '../../components/ui/Field.jsx';
import { Alert, Tabs } from '../../components/ui/Misc.jsx';
import { AsyncContent, SkeletonRows } from '../../components/ui/States.jsx';

const MENUS = [
  { value: 'header', label: 'Main header' },
  { value: 'mobile', label: 'Mobile menu' },
  { value: 'footer-services', label: 'Footer — services' },
  { value: 'footer-company', label: 'Footer — company' },
  { value: 'footer-legal', label: 'Footer — legal' },
];

const blankItem = () => ({ label: '', href: '/', children: [] });

const ChildRows = ({ items = [], onChange }) => (
  <div className="repeater" style={{ marginTop: 'var(--space-3)' }}>
    {items.map((child, index) => (
      <div className="repeater__item" key={index}>
        <div className="repeater__body">
          <div className="form-grid form-grid--2">
            <Input
              name={`child-label-${index}`}
              label="Label"
              value={child.label || ''}
              onChange={(event) =>
                onChange(items.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)))
              }
            />
            <Input
              name={`child-href-${index}`}
              label="Link"
              value={child.href || ''}
              onChange={(event) =>
                onChange(items.map((item, i) => (i === index ? { ...item, href: event.target.value } : item)))
              }
            />
            <Input
              name={`child-description-${index}`}
              label="Description"
              className="form-full"
              hint="Shown under the label in the dropdown."
              value={child.description || ''}
              onChange={(event) =>
                onChange(
                  items.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)),
                )
              }
            />
          </div>
          <div style={{ marginTop: 'var(--space-2)' }}>
            <Button
              variant="ghost"
              size="sm"
              icon="trash"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remove sub-item
            </Button>
          </div>
        </div>
      </div>
    ))}
    <Button variant="outline" size="sm" icon="plus" onClick={() => onChange([...items, { label: '', href: '/' }])}>
      Add sub-item
    </Button>
  </div>
);

const MenuEditor = ({ menuKey }) => {
  const toast = useToast();
  const state = useApi(`/admin/navigation/${menuKey}`, { auth: true });
  const [items, setItems] = useState([]);
  const [label, setLabel] = useState('');
  const [openIndex, setOpenIndex] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (state.data) {
      setItems(state.data.items || []);
      setLabel(state.data.label || '');
      setDirty(false);
    }
  }, [state.data]);

  const update = (index, patch) => {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    setDirty(true);
  };

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/navigation/${menuKey}`, { label, items }, { auth: true });
      toast.success('Menu saved.');
      setDirty(false);
      state.refetch();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AsyncContent state={state} allowEmpty skeleton={<SkeletonRows rows={4} />}>
      <div className="panel">
        <div className="panel__body stack">
          <Input
            name="menu-label"
            label="Menu heading"
            hint="Used as the column heading in the footer."
            value={label}
            onChange={(event) => {
              setLabel(event.target.value);
              setDirty(true);
            }}
          />

          <div className="repeater">
            {items.length === 0 ? <div className="repeater__empty">This menu is empty.</div> : null}

            {items.map((item, index) => (
              <div className="repeater__item" key={index}>
                <div className="repeater__head">
                  <button
                    type="button"
                    className="repeater__handle"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <Icon
                      name="chevronDown"
                      size={15}
                      style={{ transform: openIndex === index ? 'none' : 'rotate(-90deg)' }}
                    />
                    {item.label || 'Untitled link'}
                    <span style={{ color: 'var(--slate-500)', fontWeight: 400 }}>{item.href}</span>
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
                    onClick={() => {
                      setItems(items.filter((_, i) => i !== index));
                      setDirty(true);
                    }}
                    aria-label="Remove link"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>

                {openIndex === index ? (
                  <div className="repeater__body">
                    <div className="form-grid form-grid--2">
                      <Input
                        name={`label-${index}`}
                        label="Label"
                        value={item.label || ''}
                        onChange={(event) => update(index, { label: event.target.value })}
                      />
                      <Input
                        name={`href-${index}`}
                        label="Link"
                        placeholder="/airport-transfers"
                        value={item.href || ''}
                        onChange={(event) => update(index, { href: event.target.value })}
                      />
                      <Input
                        name={`description-${index}`}
                        label="Description"
                        className="form-full"
                        value={item.description || ''}
                        onChange={(event) => update(index, { description: event.target.value })}
                      />
                      <Checkbox
                        name={`external-${index}`}
                        label="Opens in a new tab"
                        checked={Boolean(item.external)}
                        onChange={(event) => update(index, { external: event.target.checked })}
                      />
                      <Checkbox
                        name={`highlight-${index}`}
                        label="Highlight this link"
                        checked={Boolean(item.highlight)}
                        onChange={(event) => update(index, { highlight: event.target.checked })}
                      />
                    </div>

                    <div>
                      <span className="field__label">Dropdown items</span>
                      <ChildRows
                        items={item.children || []}
                        onChange={(children) => update(index, { children })}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              icon="plus"
              onClick={() => {
                setItems([...items, blankItem()]);
                setOpenIndex(items.length);
                setDirty(true);
              }}
            >
              Add link
            </Button>
          </div>
        </div>

        <div className="panel__foot">
          <span style={{ marginRight: 'auto', fontSize: 'var(--text-sm)', color: 'var(--slate-500)' }}>
            {dirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
          <Button onClick={save} loading={saving} icon="check">
            Save menu
          </Button>
        </div>
      </div>
    </AsyncContent>
  );
};

const NavigationPage = () => {
  const [menu, setMenu] = useState('header');

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Navigation</h1>
          <p>Control the header, mobile drawer and footer menus. Links can point at any page on the site.</p>
        </div>
      </div>

      <Alert variant="info">
        Use paths that start with <code>/</code> for internal pages so navigation stays instant, and full URLs only
        for external destinations.
      </Alert>

      <Tabs tabs={MENUS} active={menu} onChange={setMenu} label="Menus" />

      <MenuEditor key={menu} menuKey={menu} />
    </>
  );
};

export default NavigationPage;
