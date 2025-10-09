import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/presentation/pages/home/HomePage';
import { PostDetailPage } from '@/presentation/pages/post-detail/PostDetailPage';
import { EditorPage } from '@/presentation/pages/editor/EditorPage';
import { usePageTracking } from '@/hooks/usePageTracking';

export function App() {
  usePageTracking();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/posts/:slug" element={<PostDetailPage />} />
      {import.meta.env.DEV && <Route path="/editor" element={<EditorPage />} />}
    </Routes>
  );
}
