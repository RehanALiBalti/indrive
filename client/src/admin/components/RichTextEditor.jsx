import { useRef, useState } from 'react';
import Button from '../../components/ui/Button.jsx';

const SNIPPETS = [
  { label: 'H2', wrap: ['<h2>', '</h2>'] },
  { label: 'H3', wrap: ['<h3>', '</h3>'] },
  { label: 'Paragraph', wrap: ['<p>', '</p>'] },
  { label: 'Bold', wrap: ['<strong>', '</strong>'] },
  { label: 'Italic', wrap: ['<em>', '</em>'] },
  { label: 'Link', wrap: ['<a href="/">', '</a>'] },
  { label: 'Bullet list', insert: '<ul>\n  <li>First point</li>\n  <li>Second point</li>\n</ul>' },
  { label: 'Numbered list', insert: '<ol>\n  <li>First step</li>\n  <li>Second step</li>\n</ol>' },
  {
    label: 'Table',
    insert:
      '<table>\n  <thead>\n    <tr><th>Column</th><th>Column</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Value</td><td>Value</td></tr>\n  </tbody>\n</table>',
  },
  { label: 'Quote', wrap: ['<blockquote>', '</blockquote>'] },
];

/**
 * HTML editor for CMS rich text.
 *
 * Deliberately a structured HTML field with formatting helpers and a live
 * preview rather than a WYSIWYG: editors control the exact heading levels the
 * SEO team depends on, and the markup is sanitised again server-side before it
 * is stored.
 */
const RichTextEditor = ({ label, value = '', onChange, name, hint, rows = 14, error }) => {
  const areaRef = useRef(null);
  const [preview, setPreview] = useState(false);

  const apply = (snippet) => {
    const area = areaRef.current;
    if (!area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = value.slice(start, end);

    const addition = snippet.insert
      ? `${value.slice(start, end) ? '\n' : ''}${snippet.insert}`
      : `${snippet.wrap[0]}${selected || 'Text'}${snippet.wrap[1]}`;

    const next = value.slice(0, start) + addition + value.slice(end);
    onChange({ target: { name, value: next } });

    requestAnimationFrame(() => {
      area.focus();
      const caret = start + addition.length;
      area.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className={`field ${error ? 'field--invalid' : ''}`.trim()}>
      {label ? (
        <label className="field__label" htmlFor={`rte-${name}`}>
          {label}
        </label>
      ) : null}

      <div className="rte">
        <div className="rte__toolbar">
          {SNIPPETS.map((snippet) => (
            <button key={snippet.label} type="button" className="rte__btn" onClick={() => apply(snippet)}>
              {snippet.label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto' }}>
            <Button variant="ghost" size="sm" onClick={() => setPreview((current) => !current)}>
              {preview ? 'Hide preview' : 'Preview'}
            </Button>
          </span>
        </div>

        <textarea
          id={`rte-${name}`}
          ref={areaRef}
          className="rte__area"
          name={name}
          rows={rows}
          value={value}
          onChange={onChange}
          spellCheck
        />

        {preview ? (
          <div className="rte__preview">
            <div className="prose prose--full" dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        ) : null}
      </div>

      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : null}
      {hint && !error ? <span className="field__hint">{hint}</span> : null}
    </div>
  );
};

export default RichTextEditor;
