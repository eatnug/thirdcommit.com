import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import puppeteer from 'puppeteer';

const DIST_DIR = 'dist';
const BASE_URL = 'http://localhost:4173'; // Vite preview server

async function generateStaticSite() {
  // Read posts data
  const postsData = JSON.parse(readFileSync(join(DIST_DIR, 'posts.json'), 'utf-8'));

  console.log(`Starting static generation for ${postsData.length} posts...`);

  // Launch browser with CI-friendly options
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  const page = await browser.newPage();

  try {
    // Generate homepage
    console.log('Generating homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    const homeHtml = await page.content();
    writeFileSync(join(DIST_DIR, 'index.html'), homeHtml);

    // Generate each post page
    for (const post of postsData) {
      const url = `${BASE_URL}/posts/${post.slug}`;
      console.log(`Generating ${post.slug}...`);

      await page.goto(url, { waitUntil: 'networkidle0' });
      const html = await page.content();

      // Create directory structure
      const postDir = join(DIST_DIR, 'posts', post.slug);
      mkdirSync(postDir, { recursive: true });

      // Write HTML file
      writeFileSync(join(postDir, 'index.html'), html);
    }

    console.log('✓ Static HTML generation complete');
  } catch (error) {
    console.error('Error generating static HTML:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

generateStaticSite();
