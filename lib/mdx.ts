import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const POSTS_PATH = path.join(process.cwd(), 'content/blog');

export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  readTime: number;
  featured: boolean;
  metaDescription?: string;
  keywords?: string[];
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

// Get all post slugs
export function getPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_PATH)) {
    return [];
  }
  return fs.readdirSync(POSTS_PATH).filter((file) => file.endsWith('.mdx'));
}

// Get a single post by slug
export function getPostBySlug(slug: string): BlogPost | null {
  const realSlug = slug.replace(/\.mdx$/, '');
  const filePath = path.join(POSTS_PATH, `${realSlug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const stats = readingTime(content);

  return {
    slug: realSlug,
    title: data.title || '',
    excerpt: data.excerpt || '',
    author: data.author || 'Tanish Mittal',
    publishedAt: data.publishedAt || new Date().toISOString().split('T')[0],
    updatedAt: data.updatedAt || data.publishedAt || new Date().toISOString().split('T')[0],
    category: data.category || 'General',
    tags: data.tags || [],
    readTime: Math.ceil(stats.minutes),
    featured: data.featured || false,
    metaDescription: data.metaDescription,
    keywords: data.keywords,
    content,
  };
}

// Get all posts with metadata
export function getAllPosts(): BlogPostMeta[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug.replace(/\.mdx$/, '')))
    .filter((post): post is BlogPost => post !== null)
    .map(({ content, ...meta }) => meta) // Remove content for list view
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return posts;
}

// Get featured posts
export function getFeaturedPosts(): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.featured);
}

// Get posts by category
export function getPostsByCategory(category: string): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.category === category);
}

// Get related posts (same category, excluding current)
export function getRelatedPosts(slug: string, limit = 3): BlogPostMeta[] {
  const currentPost = getPostBySlug(slug);
  if (!currentPost) return [];

  return getAllPosts()
    .filter((post) => post.category === currentPost.category && post.slug !== slug)
    .slice(0, limit);
}

// Get all categories
export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categories = new Set(posts.map((post) => post.category));
  return ['All', ...Array.from(categories)];
}
