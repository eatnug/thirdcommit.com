import { useState, useEffect, useCallback } from "react";
import { createBlogApi, getClientPostRepository, type Post } from "@/domain/blog";
import { useMutationWrapper, useBeforeUnload } from "@/app/_adapters/_hooks";
import { markdownService } from "@/domain/blog/services/markdown.service";

// Create blog API instance for client-side use
let blogApiInstance: ReturnType<typeof createBlogApi> | null = null;

async function getBlogApi() {
  if (!blogApiInstance) {
    const repository = await getClientPostRepository();
    blogApiInstance = createBlogApi(repository);
  }
  return blogApiInstance;
}

export async function renderMarkdown(content: string): Promise<string> {
  return markdownService.toHtml(content);
}

export interface EditorFormData {
  id?: string;
  title: string;
  description: string;
  content: string;
  status: 'draft' | 'published';
}

export function useEditorViewModel(initialId?: string) {
  // Form state
  const [formData, setFormData] = useState<EditorFormData>({
    id: initialId,
    title: "",
    description: "",
    content: "",
    status: 'draft',
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(initialId || null);

  // Drafts state
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // UI state
  const [message, setMessage] = useState("");

  // Load post if ID is provided
  useEffect(() => {
    if (initialId) {
      const loadPost = async () => {
        try {
          // Use API to fetch post
          const response = await fetch(`/api/posts/${initialId}`);
          if (!response.ok) {
            throw new Error('Failed to load post');
          }
          const post = await response.json();
          const postData = {
            id: post.id,
            title: post.title,
            description: post.description || '',
            content: post.content,
            status: post.status,
          };
          setFormData(postData);
          setCurrentPostId(initialId);
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error("Failed to load post:", error);
          setMessage(`❌ Failed to load post: ${error}`);
        }
      };
      loadPost();
    }
  }, [initialId]);

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
        // Use API on client side
        const response = await fetch('/api/drafts');
        if (!response.ok) {
          throw new Error('Failed to fetch drafts');
        }
        const data = await response.json();
        setDrafts(data.drafts || []);
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
  const savePostMutation = useMutationWrapper(async (input: Parameters<Awaited<ReturnType<typeof getBlogApi>>['savePost']>[0]) => {
    const blog = await getBlogApi();
    return blog.savePost(input);
  }, {
    onSuccess: async (result) => {
      const isCreate = !currentPostId;
      if (isCreate && 'id' in result) {
        // New post created - set the ID
        setCurrentPostId(result.id);
        setFormData(prev => ({ ...prev, id: result.id }));
      }
      setMessage(`✅ Saved: ${result.title || formData.title}`);
      setHasUnsavedChanges(false);
      // Refresh drafts via API
      const response = await fetch('/api/drafts');
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.drafts || []);
      }
    },
    onError: (error) => {
      setMessage(`❌ Failed to save: ${error}`);
    },
  });

  // Publish post mutation
  const publishPostMutation = useMutationWrapper(
    async (id: string) => {
      const response = await fetch(`/api/posts/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish post');
      }
      return await response.json();
    },
    {
      onSuccess: async (result) => {
        setFormData(prev => ({ ...prev, status: 'published' }));
        setMessage(`✅ Published: ${result.title}`);
        // Refresh drafts via API (will remove from list)
        const response = await fetch('/api/drafts');
        if (response.ok) {
          const data = await response.json();
          setDrafts(data.drafts || []);
        }
      },
      onError: (error) => {
        setMessage(`❌ Failed to publish: ${error}`);
      },
    }
  );

  // Handlers
  const handleSave = useCallback(() => {
    setMessage("");
    savePostMutation.mutate(formData);
  }, [formData, savePostMutation]);

  const handlePublish = useCallback(() => {
    if (!currentPostId) {
      setMessage("❌ Please save the post first before publishing");
      return;
    }
    if (formData.status === 'published') {
      setMessage("❌ Post is already published");
      return;
    }
    setMessage("");
    publishPostMutation.mutate(currentPostId);
  }, [currentPostId, formData.status, publishPostMutation]);

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

  const handleLoadDraft = async (id: string) => {
    try {
      // Use API to fetch post
      const response = await fetch(`/api/posts/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load draft');
      }
      const post = await response.json();
      const draftData = {
        id: post.id,
        title: post.title,
        description: post.description || '',
        content: post.content,
        status: post.status,
      };
      setFormData(draftData);
      setCurrentPostId(id);
      setHasUnsavedChanges(false);
      setMessage(`✅ Loaded draft: ${draftData.title}`);
      setShowDrafts(false);
    } catch (error) {
      setMessage(`❌ Failed to load draft: ${error}`);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    // Find the draft to get its title for the confirmation message
    const draft = drafts.find(d => d.id === id);
    const title = draft?.title || 'this post';

    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete post');
      }

      setMessage(`✅ Deleted draft: ${title}`);

      // Refresh drafts via API
      const draftsResponse = await fetch('/api/drafts');
      if (draftsResponse.ok) {
        const data = await draftsResponse.json();
        setDrafts(data.drafts || []);
      }

      if (formData.id === id) {
        handleNewDraft();
      }
    } catch (error) {
      setMessage(`❌ Failed to delete draft: ${error}`);
    }
  };

  const handleNewDraft = () => {
    setFormData({
      id: undefined,
      title: "",
      description: "",
      content: "",
      status: 'draft',
    });
    setCurrentPostId(null);
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
    currentPostId,

    // Drafts state
    drafts,
    loadingDrafts,
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
    handlePublish,
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
    isPublishing: publishPostMutation.isPending,
  };
}
