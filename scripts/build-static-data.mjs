import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const POSTS_DIR = 'storage/posts';
const PUBLIC_DIR = 'public';

// Read all posts
const files = readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));

const posts = files.map(file => {
  const filepath = join(POSTS_DIR, file);
  const fileContent = readFileSync(filepath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
    published_at: data.published_at,
    content,
  };
});

// Filter published posts
const publishedPosts = posts
  .filter(post => post.status === 'published')
  .map(({ content, ...post }) => post);

// Write posts list
writeFileSync(
  join(PUBLIC_DIR, 'posts.json'),
  JSON.stringify(publishedPosts, null, 2)
);

// Write individual post files with HTML
await Promise.all(
  publishedPosts.map(async post => {
    const { marked } = await import('marked');
    const html = await marked(posts.find(p => p.id === post.id).content || '');

    writeFileSync(
      join(PUBLIC_DIR, `post-${post.slug}.json`),
      JSON.stringify({ ...post, html }, null, 2)
    );
  })
);

// Empty projects for now
writeFileSync(
  join(PUBLIC_DIR, 'projects.json'),
  JSON.stringify([], null, 2)
);

console.log(`✓ Generated ${publishedPosts.length} posts`);
