# Editor Implementation Plan

## 목표
로컬 개발 환경에서만 사용하는 Markdown 에디터 구현
- 로컬에서만 실행 (static export에 포함 안됨)
- 파일시스템 접근 위한 간단한 Node.js API 서버
- 기존 Next.js 에디터 기능 동일하게 구현

---

## 현재 상태

### 완료된 것
- ✅ EditorPage route 설정 (`/editor` - dev only)
- ✅ StaticPostRepository에 API 메서드 정의됨
  - `createPost()`
  - `updatePost()`
  - `deletePost()`
- ✅ Domain layer의 use cases 모두 존재
  - `savePostUseCase`
  - `publishPostUseCase`
  - `deletePostUseCase`
  - `getDraftsUseCase`
  - `loadPostAsFormUseCase`

### 미완성인 것
- ❌ Editor UI 컴포넌트
- ❌ API 서버 (`/api/posts/*` 엔드포인트)
- ❌ Markdown preview
- ❌ Draft 목록
- ❌ Auto-save
- ❌ Keyboard shortcuts

---

## 구현 계획

### Phase 1: Simple Node.js API Server

**파일**: `scripts/dev-api-server.mjs`

**기능**:
- Express로 간단한 API 서버
- Port: 4000 (Vite는 3000)
- CORS 허용 (localhost:3000)
- Endpoints:
  - `GET /api/posts` - 모든 포스트 목록 (drafts 포함)
  - `GET /api/posts/:id` - 특정 포스트 상세
  - `POST /api/posts` - 새 포스트 생성
  - `PUT /api/posts/:id` - 포스트 업데이트
  - `DELETE /api/posts/:id` - 포스트 삭제
  - `PUT /api/posts/:id/publish` - 포스트 발행

**구현**:
```javascript
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { ulid } from 'ulid';

const app = express();
app.use(cors());
app.use(express.json());

const POSTS_DIR = join(process.cwd(), 'storage/posts');

// GET /api/posts - 모든 포스트 (drafts 포함)
app.get('/api/posts', (req, res) => {
  // 구현
});

// GET /api/posts/:id
app.get('/api/posts/:id', (req, res) => {
  // 구현
});

// POST /api/posts
app.post('/api/posts', (req, res) => {
  // 구현
});

// PUT /api/posts/:id
app.put('/api/posts/:id', (req, res) => {
  // 구현
});

// DELETE /api/posts/:id
app.delete('/api/posts/:id', (req, res) => {
  // 구현
});

// PUT /api/posts/:id/publish
app.put('/api/posts/:id/publish', (req, res) => {
  // 구현
});

app.listen(4000, () => {
  console.log('🚀 API server running on http://localhost:4000');
});
```

**package.json script**:
```json
{
  "scripts": {
    "dev:api": "node scripts/dev-api-server.mjs",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:api\""
  }
}
```

**Dependencies 추가**:
```bash
npm install --save-dev concurrently
```

---

### Phase 2: Editor UI Components

**파일 구조**:
```
src/presentation/pages/editor/
├── EditorPage.tsx              # Main editor container
├── use-editor-view-model.ts    # Editor state logic
└── components/
    ├── MetadataForm.tsx        # Title, description input
    ├── MarkdownEditor.tsx      # Textarea for markdown
    ├── PreviewPanel.tsx        # Rendered HTML preview
    ├── DraftsDropdown.tsx      # Load draft list
    └── EditorActions.tsx       # Save, Publish, Delete buttons
```

**EditorPage.tsx** - 기본 레이아웃:
```tsx
import { Header } from '@/presentation/layouts/Header';
import { MetadataForm } from './components/MetadataForm';
import { MarkdownEditor } from './components/MarkdownEditor';
import { PreviewPanel } from './components/PreviewPanel';
import { DraftsDropdown } from './components/DraftsDropdown';
import { EditorActions } from './components/EditorActions';
import { useEditorViewModel } from './use-editor-view-model';

export function EditorPage() {
  const vm = useEditorViewModel();

  return (
    <div className="min-h-screen">
      <Header />
      <div className="px-4 md:px-[400px] py-[20px]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Editor</h1>
          <DraftsDropdown
            drafts={vm.drafts}
            onLoad={vm.loadDraft}
          />
        </div>

        <MetadataForm
          title={vm.title}
          description={vm.description}
          onTitleChange={vm.setTitle}
          onDescriptionChange={vm.setDescription}
        />

        <div className="grid grid-cols-2 gap-4 mt-4">
          <MarkdownEditor
            value={vm.content}
            onChange={vm.setContent}
          />
          <PreviewPanel html={vm.previewHtml} />
        </div>

        <EditorActions
          onSave={vm.save}
          onPublish={vm.publish}
          onDelete={vm.deleteDraft}
          hasUnsavedChanges={vm.hasUnsavedChanges}
          currentPostId={vm.currentPostId}
        />
      </div>
    </div>
  );
}
```

**use-editor-view-model.ts** - 상태 관리:
```tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBlogApi } from '@/domain/blog';
import { getPostRepository } from '@/adapters/repositories';
import { marked } from 'marked';
import { debounce } from '@/shared/utils/debounce';

const blogApi = createBlogApi(getPostRepository());

export function useEditorViewModel() {
  const queryClient = useQueryClient();

  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch drafts
  const { data: drafts = [] } = useQuery({
    queryKey: ['drafts'],
    queryFn: () => blogApi.getDrafts(),
  });

  // Preview markdown (debounced)
  useEffect(() => {
    const updatePreview = debounce(async () => {
      const html = await marked(content);
      setPreviewHtml(html);
    }, 300);

    updatePreview();
  }, [content]);

  // Track unsaved changes
  useEffect(() => {
    if (currentPostId || title || content) {
      setHasUnsavedChanges(true);
    }
  }, [title, description, content]);

  // Load draft
  const loadDraft = async (id: string) => {
    const formData = await blogApi.loadPostAsForm(id);
    setCurrentPostId(formData.id || null);
    setTitle(formData.title);
    setDescription(formData.description);
    setContent(formData.content);
    setHasUnsavedChanges(false);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (status: 'draft' | 'published') =>
      blogApi.savePost({ id: currentPostId, title, description, content, status }),
    onSuccess: (data) => {
      setCurrentPostId(data.id);
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries(['drafts']);
      alert('Saved!');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogApi.deletePost(id),
    onSuccess: () => {
      // Clear form
      setCurrentPostId(null);
      setTitle('');
      setDescription('');
      setContent('');
      queryClient.invalidateQueries(['drafts']);
      alert('Deleted!');
    },
  });

  const save = () => saveMutation.mutate('draft');
  const publish = () => {
    if (!currentPostId) {
      alert('Save as draft first!');
      return;
    }
    saveMutation.mutate('published');
  };
  const deleteDraft = () => {
    if (!currentPostId) return;
    if (confirm('Delete this draft?')) {
      deleteMutation.mutate(currentPostId);
    }
  };

  return {
    // State
    currentPostId,
    title,
    description,
    content,
    previewHtml,
    hasUnsavedChanges,
    drafts,

    // Actions
    setTitle,
    setDescription,
    setContent,
    loadDraft,
    save,
    publish,
    deleteDraft,
  };
}
```

---

### Phase 3: Repository Updates

**StaticPostRepository**의 API URL은 이미 `/api/posts`로 설정되어 있음.
단, API 서버가 4000 포트에서 실행되므로 URL을 수정:

```typescript
// src/adapters/repositories/post.static.repository.ts

const API_BASE = import.meta.env.DEV ? 'http://localhost:4000' : '';

async createPost(data) {
  const response = await fetch(`${API_BASE}/api/posts`, { ... });
}
```

또는 Vite dev server에 proxy 설정:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
```

---

### Phase 4: Keyboard Shortcuts & UX

**추가 기능**:
- Cmd/Ctrl+S로 저장
- Unsaved changes warning (beforeunload)
- Tab key in textarea (indent)
- Full screen toggle

**Hooks**:
- `useBeforeUnload(hasUnsavedChanges)`
- `useKeyboardShortcut('Cmd+S', handleSave)`

---

## 실행 방법

### 1. API 서버 + Vite 동시 실행
```bash
npm run dev:all
```

### 2. 브라우저에서 `/editor` 접속
```
http://localhost:3000/editor
```

### 3. 사용 흐름
1. Editor 페이지 접속
2. Draft 드롭다운에서 기존 draft 로드 OR 새로 작성
3. Title, Description, Content 입력
4. Live preview 확인
5. "Save Draft" 클릭
6. "Publish" 클릭하면 published로 변경
7. `npm run build:data` 실행하면 public JSON에 반영

---

## 테스트 계획

### Manual Testing
- [ ] 새 포스트 생성
- [ ] Draft 저장
- [ ] Draft 불러오기
- [ ] Draft 수정 후 저장
- [ ] Publish
- [ ] Delete
- [ ] Unsaved changes warning
- [ ] Cmd+S shortcut
- [ ] Preview 실시간 업데이트

---

## 파일 체크리스트

### 새로 만들 파일
- [ ] `scripts/dev-api-server.mjs`
- [ ] `src/presentation/pages/editor/EditorPage.tsx`
- [ ] `src/presentation/pages/editor/use-editor-view-model.ts`
- [ ] `src/presentation/pages/editor/components/MetadataForm.tsx`
- [ ] `src/presentation/pages/editor/components/MarkdownEditor.tsx`
- [ ] `src/presentation/pages/editor/components/PreviewPanel.tsx`
- [ ] `src/presentation/pages/editor/components/DraftsDropdown.tsx`
- [ ] `src/presentation/pages/editor/components/EditorActions.tsx`

### 수정할 파일
- [ ] `package.json` - `dev:api`, `dev:all` 스크립트 추가
- [ ] `vite.config.ts` - API proxy 설정
- [ ] `src/adapters/repositories/post.static.repository.ts` - API_BASE URL 설정

### Dependencies
```bash
npm install --save-dev concurrently
npm install --save-dev cors  # API server용
```

---

## 예상 소요 시간
- Phase 1 (API Server): 30분
- Phase 2 (Editor UI): 1-2시간
- Phase 3 (Repository): 10분
- Phase 4 (UX): 30분
- Testing: 30분

**Total**: ~3시간

---

## 참고 자료

### 기존 Next.js Editor 구현
- `app/editor/page.tsx`
- `app/editor/use-editor-view-model.ts`
- `app/editor/_components/*.tsx`

### API 참고
- `app/api/posts/route.ts`
- `app/api/posts/[id]/route.ts`
- `app/api/posts/[id]/publish/route.ts`
- `app/api/drafts/route.ts`

---

## 다음 세션 시작 방법

1. 이 문서 읽기
2. `docs/MIGRATION_COMPLETE.md` 읽기
3. Phase 1부터 순서대로 구현 시작
