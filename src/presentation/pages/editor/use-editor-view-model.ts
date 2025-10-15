import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface PostFormData {
  title: string;
  description: string;
  content: string;
  status: string;
}

const API_BASE = '/api';

// API functions
async function fetchPosts(): Promise<Post[]> {
  const res = await fetch(`${API_BASE}/posts`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

async function fetchPost(id: string): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${id}`);
  if (!res.ok) throw new Error('Failed to fetch post');
  return res.json();
}

async function createPost(data: Partial<PostFormData>): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create post');
  return res.json();
}

async function updatePost(
  id: string,
  data: Partial<PostFormData>
): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update post');
  return res.json();
}

async function deletePost(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete post');
}

async function publishPost(id: string): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${id}/publish`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error('Failed to publish post');
  return res.json();
}

export function useEditorViewModel() {
  const queryClient = useQueryClient();

  // Local state
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [hasChanges, setHasChanges] = useState(false);

  // Queries
  const { data: drafts = [] } = useQuery({
    queryKey: ['editor-posts'],
    queryFn: fetchPosts,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: currentPost } = useQuery({
    queryKey: ['post', currentPostId],
    queryFn: () => fetchPost(currentPostId!),
    enabled: !!currentPostId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['editor-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setCurrentPostId(data.id);
      setHasChanges(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PostFormData> }) =>
      updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', currentPostId] });
      setHasChanges(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      handleNew();
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', currentPostId] });
      setStatus('published');
    },
  });

  // Effects
  useEffect(() => {
    if (currentPost) {
      setTitle(currentPost.title);
      setDescription(currentPost.description);
      setContent(currentPost.content);
      setStatus(currentPost.status);
      setHasChanges(false);
    }
  }, [currentPost]);

  // Track changes
  useEffect(() => {
    if (!currentPost) {
      setHasChanges(title !== '' || description !== '' || content !== '');
    } else {
      setHasChanges(
        title !== currentPost.title ||
          description !== currentPost.description ||
          content !== currentPost.content
      );
    }
  }, [title, description, content, currentPost]);

  // Handlers
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    const data = {
      title,
      description,
      content,
      status,
    };

    if (currentPostId) {
      await updateMutation.mutateAsync({ id: currentPostId, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handlePublish = async () => {
    if (!currentPostId) {
      alert('Please save the post first');
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert('Title and content are required for publishing');
      return;
    }

    // Save first if there are changes
    if (hasChanges) {
      await handleSave();
    }

    await publishMutation.mutateAsync(currentPostId);
  };

  const handleDelete = async () => {
    if (!currentPostId) return;

    if (confirm('Are you sure you want to delete this post?')) {
      await deleteMutation.mutateAsync(currentPostId);
    }
  };

  const handleNew = () => {
    setCurrentPostId(null);
    setTitle('');
    setDescription('');
    setContent('');
    setStatus('draft');
    setHasChanges(false);
  };

  const handleLoadDraft = (id: string) => {
    setCurrentPostId(id);
  };

  return {
    // State
    title,
    description,
    content,
    status,
    hasChanges,
    drafts,
    currentPostId,

    // Handlers
    setTitle,
    setDescription,
    setContent,
    handleSave,
    handlePublish,
    handleDelete,
    handleNew,
    loadDraft: handleLoadDraft,

    // Loading states
    isSaving: createMutation.isPending || updateMutation.isPending,
    isPublishing: publishMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
