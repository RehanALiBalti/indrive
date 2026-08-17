/**
 * Renders CMS rich text.
 *
 * The HTML is sanitised on the server (`sanitizeRichText`) before it is ever
 * stored in Firestore, so the client renders exactly what an editor approved.
 */
const RichText = ({ html, className = '', as: Tag = 'div' }) => {
  if (!html) return null;
  return (
    <Tag className={`prose ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />
  );
};

export default RichText;
