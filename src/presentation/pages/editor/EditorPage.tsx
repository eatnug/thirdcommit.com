import { useState } from 'react';
import { Header } from '@/presentation/layouts/Header';
import { useEditorViewModel } from './use-editor-view-model';
import { useKeyboardShortcut } from './hooks/use-keyboard-shortcut';
import { useBeforeUnload } from './hooks/use-before-unload';
import { DraftsDropdown } from './components/DraftsDropdown';
import { MarkdownEditor } from './components/MarkdownEditor';
import { PreviewPanel } from './components/PreviewPanel';

export function EditorPage() {
  const vm = useEditorViewModel();
  const [showPreview, setShowPreview] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcut('s', vm.handleSave, { metaKey: true });

  // Unsaved changes warning
  useBeforeUnload(vm.hasChanges);

  return (
    <div className="px-4 md:px-[400px] py-[20px] flex flex-col gap-[20px]">
      <Header />

      <div className="flex flex-col gap-[20px]">
        {/* Title Row with Preview/Draft buttons */}
        <div className="flex gap-[20px] items-center">
          <input
            type="text"
            value={vm.title}
            onChange={(e) => vm.setTitle(e.target.value)}
            placeholder="Title Input Placeholder"
            className="flex-1 bg-[#d9d9d9] px-[18px] py-[12px] h-[49px] text-[20px] font-['Apple_SD_Gothic_Neo'] focus:outline-none"
          />
          <div className="flex gap-[7px]">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-[40px] h-[40px] flex items-center justify-center"
              title="Toggle Preview"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4C5 4 1.73 7.11 1 10c.73 2.89 4 6 9 6s8.27-3.11 9-6c-.73-2.89-4-6-9-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z" fill="black"/>
              </svg>
            </button>
            <DraftsDropdown
              drafts={vm.drafts}
              onLoad={vm.loadDraft}
              currentDraftId={vm.currentPostId || undefined}
            />
          </div>
        </div>

        {/* Body Input */}
        {showPreview ? (
          <PreviewPanel content={vm.content} title={vm.title} />
        ) : (
          <MarkdownEditor content={vm.content} onChange={vm.setContent} />
        )}

        {/* Footer with Description and Buttons */}
        <div className="flex gap-[20px] items-center">
          <input
            type="text"
            value={vm.description}
            onChange={(e) => vm.setDescription(e.target.value)}
            placeholder="SEO Summary Placeholder"
            className="flex-1 bg-[#d9d9d9] px-[41px] py-[2px] h-[49px] text-[20px] font-['Apple_SD_Gothic_Neo'] focus:outline-none"
          />
          <div className="flex gap-[10px]">
            <button
              onClick={vm.handleSave}
              disabled={vm.isSaving || !vm.hasChanges}
              className="bg-[#d9d9d9] px-[37px] py-px h-[49px] rounded-[10px] text-[20px] font-['Apple_SD_Gothic_Neo'] disabled:opacity-50"
            >
              {vm.isSaving ? 'Saving...' : 'Save'}
            </button>
            {!vm.currentPostId || vm.status !== 'published' ? (
              <button
                onClick={vm.handlePublish}
                disabled={vm.isPublishing}
                className="bg-[#d9d9d9] px-[26px] py-[6px] h-[49px] rounded-[10px] text-[20px] font-['Apple_SD_Gothic_Neo'] disabled:opacity-50"
              >
                {vm.isPublishing ? 'Publishing...' : 'Publish'}
              </button>
            ) : (
              <div className="px-[26px] py-[6px] h-[49px] flex items-center text-[20px] font-['Apple_SD_Gothic_Neo']">
                Published
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
