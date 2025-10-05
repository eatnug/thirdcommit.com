import { useState, useEffect, useCallback } from "react";
import { getDraftsUseCase } from "@/features/blog/core/use-cases/get-drafts.use-case";
import { loadPostAsFormUseCase } from "@/features/blog/core/use-cases/load-post-as-form.use-case";
import { deletePostUseCase } from "@/features/blog/core/use-cases/delete-post.use-case";
import { savePostUseCase } from "@/features/blog/core/use-cases/save-post.use-case";
import { useMutationWrapper } from "@/shared/hooks";
import { useBeforeUnload } from "@/app/_hooks";
import type { Post } from "@/features/blog/core/entities/post.entity";

import { markdownService } from "@/shared/services/markdown.service";

export async function renderMarkdown(content: string): Promise<string> {
  return markdownService.toHtml(content);
}

const AUTOSAVE_KEY = "editor-autosave";
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

export interface EditorFormData {
  title: string;
  description: string;
  tags: string;
  content: string;
  draft: boolean;
}

export interface AutosaveDraft extends EditorFormData {
  timestamp: number;
}

export function useEditorViewModel() {
  // Form state
  const [formData, setFormData] = useState<EditorFormData>({
    title: "",
    description: "",
    tags: "",
    content: "",
    draft: true,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutosave, setLastAutosave] = useState<number | null>(null);

  // Drafts state
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [currentDraftSlug, setCurrentDraftSlug] = useState<string | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // UI state
  const [message, setMessage] = useState("");

  // Restore autosave on mount
  useEffect(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        const autosave: AutosaveDraft = JSON.parse(saved);
        setFormData({
          title: autosave.title,
          description: autosave.description,
          tags: autosave.tags,
          content: autosave.content,
          draft: autosave.draft,
        });
        setLastAutosave(autosave.timestamp);
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error("Failed to restore autosave:", error);
      }
    }
  }, []);

  // Autosave effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (formData.title || formData.content) {
        const autosave: AutosaveDraft = {
          ...formData,
          timestamp: Date.now(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosave));
        setLastAutosave(autosave.timestamp);
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(timer);
  }, [formData]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData]);

  // Warn before leaving
  useBeforeUnload(hasUnsavedChanges);

  // Load drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      setLoadingDrafts(true);
      try {
        const fetchedDrafts = await getDraftsUseCase();
        setDrafts(fetchedDrafts);
      } catch (error) {
        console.error("Failed to fetch drafts:", error);
      } finally {
        setLoadingDrafts(false);
      }
    };
    loadDrafts();
  }, []);

  // Update preview when content changes (debounced)
  useEffect(() => {
    if (!showPreview) return;

    const updatePreview = async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const html = await renderMarkdown(formData.content);
        setPreviewHtml(html);
      } catch (error) {
        setPreviewError(
          error instanceof Error ? error.message : "Failed to render"
        );
      } finally {
        setPreviewLoading(false);
      }
    };

    const timer = setTimeout(updatePreview, 300);
    return () => clearTimeout(timer);
  }, [formData.content, showPreview]);

  // Save post mutation
  const savePostMutation = useMutationWrapper(savePostUseCase, {
    onSuccess: async (result) => {
      setMessage(`✅ Saved: ${result.filename}`);
      setHasUnsavedChanges(false);
      localStorage.removeItem(AUTOSAVE_KEY);
      setLastAutosave(null);
      // Refresh drafts
      const fetchedDrafts = await getDraftsUseCase();
      setDrafts(fetchedDrafts);
    },
    onError: (error) => {
      setMessage(`❌ Failed to save: ${error}`);
    },
  });

  // Handlers
  const handleSave = useCallback(
    (asDraft: boolean = false) => {
      setMessage("");
      const dataToSave = { ...formData, draft: asDraft };
      savePostMutation.mutate(dataToSave);
    },
    [formData, savePostMutation]
  );

  // Keyboard shortcut for save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!savePostMutation.isPending && formData.title.trim()) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [savePostMutation.isPending, formData.title, handleSave]);

  const handleLoadDraft = async (slug: string) => {
    try {
      const draftData = await loadPostAsFormUseCase(slug);
      if (draftData) {
        setFormData(draftData);
        setCurrentDraftSlug(slug);
        setHasUnsavedChanges(false);
        setMessage(`✅ Loaded draft: ${draftData.title}`);
      }
      setShowDrafts(false);
    } catch (error) {
      setMessage(`❌ Failed to load draft: ${error}`);
    }
  };

  const handleDeleteDraft = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete "${slug}"?`)) {
      return;
    }

    try {
      await deletePostUseCase(slug);
      setMessage(`✅ Deleted draft: ${slug}`);

      // Refresh drafts
      const fetchedDrafts = await getDraftsUseCase();
      setDrafts(fetchedDrafts);

      if (currentDraftSlug === slug) {
        handleNewDraft();
      }
    } catch (error) {
      setMessage(`❌ Failed to delete draft: ${error}`);
    }
  };

  const handleNewDraft = () => {
    setFormData({
      title: "",
      description: "",
      tags: "",
      content: "",
      draft: true,
    });
    setCurrentDraftSlug(null);
    setHasUnsavedChanges(false);
    setMessage("");
  };

  const updateField = useCallback(
    <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const toggleDrafts = () => setShowDrafts(!showDrafts);
  const closeDrafts = () => setShowDrafts(false);

  // Computed values
  const descriptionCharCount = {
    current: formData.description.length,
    max: 160,
  };
  const contentLineCount = formData.content.split("\n").length;
  const canSave = formData.title.trim() !== "";

  return {
    // Form state
    formData,
    hasUnsavedChanges,
    lastAutosave,

    // Drafts state
    drafts,
    loadingDrafts,
    currentDraftSlug,
    showDrafts,

    // Preview state
    showPreview,
    previewHtml,
    previewLoading,
    previewError,

    // UI state
    message,

    // Handlers
    handleSave,
    handleLoadDraft,
    handleDeleteDraft,
    handleNewDraft,
    updateField,
    toggleDrafts,
    closeDrafts,
    setShowPreview,

    // Computed values
    descriptionCharCount,
    contentLineCount,
    canSave,
    isSaving: savePostMutation.isPending,
  };
}
