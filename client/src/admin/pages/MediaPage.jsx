import { MediaLibrary } from '../components/MediaPicker.jsx';

const MediaPage = () => (
  <>
    <div className="admin-page-head">
      <div>
        <h1>Media library</h1>
        <p>
          Every image used on the website. Files are stored in Firebase Storage and served over HTTPS with long-lived
          cache headers.
        </p>
      </div>
    </div>

    <div className="panel">
      <div className="panel__body">
        <MediaLibrary selectable={false} />
      </div>
    </div>
  </>
);

export default MediaPage;
