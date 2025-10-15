import { useState } from 'react';

interface Draft {
  id: string;
  title: string;
  status: string;
}

interface DraftsDropdownProps {
  drafts: Draft[];
  onLoad: (id: string) => void;
  currentDraftId?: string;
}

export function DraftsDropdown({
  drafts,
  onLoad,
  currentDraftId,
}: DraftsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-[40px] h-[40px] flex items-center justify-center"
        title="Load Draft"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M14 2H6C4.9 2 4 2.9 4 4V16C4 17.1 4.9 18 6 18H14C15.1 18 16 17.1 16 16V4C16 2.9 15.1 2 14 2ZM12 12H8V10H12V12ZM14 8H6V6H14V8Z"
            fill="black"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-black z-10">
          <div className="max-h-96 overflow-y-auto">
            {drafts.length === 0 ? (
              <div className="px-3 py-2 text-[15px]">No drafts</div>
            ) : (
              drafts.map((draft) => (
                <button
                  key={draft.id}
                  onClick={() => {
                    onLoad(draft.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-200 ${
                    draft.id === currentDraftId ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="text-[15px] truncate">
                    {draft.title || 'Untitled'}
                  </div>
                  <div className="text-[13px] text-gray-500 mt-1">
                    {draft.status === 'published' ? 'Published' : 'Draft'}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
