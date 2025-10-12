import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { ulid } from 'ulid';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const POSTS_DIR = join(__dirname, '../storage/posts');

// Helper: Read all post files
function readAllPosts() {
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  return files.map(filename => {
    const filepath = join(POSTS_DIR, filename);
    const fileContent = readFileSync(filepath, 'utf-8');
    const { data, content } = matter(fileContent);
    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      description: data.description || '',
      status: data.status || 'draft',
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
      content,
    };
  });
}

// Helper: Read single post
function readPost(id) {
  const posts = readAllPosts();
  return posts.find(p => p.id === id);
}

// Helper: Write post to file
function writePost(postData) {
  const { id, slug, title, description, status, createdAt, updatedAt, content } = postData;
  const filename = `${slug || id}.md`;
  const filepath = join(POSTS_DIR, filename);

  const frontmatter = {
    id,
    slug,
    title,
    description: description || '',
    status,
    created_at: createdAt,
    updated_at: updatedAt,
    published_at: status === 'published' ? updatedAt : null,
  };

  // Remove undefined/null values
  Object.keys(frontmatter).forEach(key => {
    if (frontmatter[key] === undefined || frontmatter[key] === null) {
      delete frontmatter[key];
    }
  });

  const fileContent = matter.stringify(content || '', frontmatter);
  writeFileSync(filepath, fileContent, 'utf-8');

  return postData;
}

// Helper: Delete post file
function deletePostFile(id) {
  const posts = readAllPosts();
  const post = posts.find(p => p.id === id);
  if (!post) return false;

  const filename = `${post.slug || post.id}.md`;
  const filepath = join(POSTS_DIR, filename);

  if (existsSync(filepath)) {
    unlinkSync(filepath);
    return true;
  }
  return false;
}

// GET /api/posts - 모든 포스트 (drafts 포함)
app.get('/api/posts', (req, res) => {
  try {
    const posts = readAllPosts().map(post => ({
      ...post,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    }));
    res.json(posts);
  } catch (error) {
    console.error('Error reading posts:', error);
    res.status(500).json({ error: 'Failed to read posts' });
  }
});

// GET /api/posts/:idOrSlug - 특정 포스트 상세 (id 또는 slug로 조회)
app.get('/api/posts/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const posts = readAllPosts();

    // id 또는 slug로 찾기
    const post = posts.find(p => p.id === idOrSlug || p.slug === idOrSlug);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      ...post,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    });
  } catch (error) {
    console.error('Error reading post:', error);
    res.status(500).json({ error: 'Failed to read post' });
  }
});

// POST /api/posts - 새 포스트 생성
app.post('/api/posts', (req, res) => {
  try {
    const { title, description, content, status = 'draft' } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const now = new Date().toISOString();
    const id = ulid();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const postData = {
      id,
      slug,
      title,
      description: description || '',
      status,
      createdAt: now,
      updatedAt: now,
      content,
    };

    const saved = writePost(postData);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /api/posts/:id - 포스트 업데이트
app.put('/api/posts/:id', (req, res) => {
  try {
    const existingPost = readPost(req.params.id);
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const { title, description, content, status } = req.body;

    const updatedPost = {
      ...existingPost,
      title: title || existingPost.title,
      description: description !== undefined ? description : existingPost.description,
      content: content !== undefined ? content : existingPost.content,
      status: status || existingPost.status,
      updatedAt: new Date().toISOString(),
    };

    // Update slug if title changed
    if (title && title !== existingPost.title) {
      updatedPost.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const saved = writePost(updatedPost);
    res.json(saved);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE /api/posts/:id - 포스트 삭제
app.delete('/api/posts/:id', (req, res) => {
  try {
    const deleted = deletePostFile(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// PUT /api/posts/:id/publish - 포스트 발행
app.put('/api/posts/:id/publish', (req, res) => {
  try {
    const existingPost = readPost(req.params.id);
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const publishedPost = {
      ...existingPost,
      status: 'published',
      updatedAt: new Date().toISOString(),
    };

    const saved = writePost(publishedPost);
    res.json(saved);
  } catch (error) {
    console.error('Error publishing post:', error);
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
