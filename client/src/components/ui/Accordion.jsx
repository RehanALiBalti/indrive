import { useId, useState } from 'react';
import Icon from './Icon.jsx';

/**
 * FAQ accordion. Uses real buttons with aria-expanded/aria-controls so it is
 * keyboard and screen-reader accessible, and renders CMS answers as HTML.
 */
const Accordion = ({ items = [], allowMultiple = false, defaultOpen = [] }) => {
  const baseId = useId();
  const [open, setOpen] = useState(() => new Set(defaultOpen));

  const toggle = (index) => {
    setOpen((current) => {
      const next = new Set(allowMultiple ? current : []);
      if (current.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (!items.length) return null;

  return (
    <div className="accordion">
      {items.map((item, index) => {
        const expanded = open.has(index);
        const triggerId = `${baseId}-trigger-${index}`;
        const panelId = `${baseId}-panel-${index}`;
        return (
          <div className="accordion__item" key={item.id || item.question || index}>
            <h3 style={{ margin: 0, font: 'inherit' }}>
              <button
                type="button"
                id={triggerId}
                className="accordion__trigger"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(index)}
              >
                <span>{item.question}</span>
                <span className="accordion__icon" aria-hidden="true">
                  <Icon name={expanded ? 'plus' : 'plus'} size={14} />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className="accordion__panel prose prose--full"
              hidden={!expanded}
              // Answers are authored in the CMS and sanitised server-side.
              dangerouslySetInnerHTML={{ __html: item.answer || '' }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
