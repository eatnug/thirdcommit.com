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

// Write individual post files with markdown
publishedPosts.forEach(post => {
  const fullPost = posts.find(p => p.id === post.id);

  writeFileSync(
    join(PUBLIC_DIR, `post-${post.slug}.json`),
    JSON.stringify({ ...post, content: fullPost.content }, null, 2)
  );
});

// Write projects data
const projects = [
  {
    title: "What should I build next?",
    description: "Send me an idea.",
    externalLink: "mailto:jake@thirdcommit.com",
  },
  {
    title: "My Feed (WIP)",
    description:
      "Fully customizable feed: add any source you follow (YouTube channels, Instagram accounts, blogs) and read everything without distractions.",
  },
  {
    title: "The Terminal X",
    description:
      "AI research agent for finance professionals. Retrieves news, analyzes market signals, and answers questions",
    externalLink: "https://theterminalx.com/",
  },
  {
    title: "DoctorNow",
    description:
      "South Korea's leading telemedicine app, enabling 24/7 remote doctor consultations and prescription services.",
    externalLink: "https://www.doctornow.co.kr/",
  },
];

writeFileSync(
  join(PUBLIC_DIR, 'projects.json'),
  JSON.stringify(projects, null, 2)
);

console.log(`✓ Generated ${publishedPosts.length} posts and ${projects.length} projects`);
