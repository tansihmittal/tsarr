import { GetServerSideProps } from 'next';
import { getAllPosts } from '@/lib/mdx';

// This component doesn't render anything - it just generates the sitemap
function Sitemap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = 'https://tsarr.in';
  
  // Static pages
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/tools', priority: '0.9', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/blog', priority: '0.8', changefreq: 'weekly', lastmod: '2025-12-30' },
  ];

  // Tool landing pages (SEO)
  const toolPages = [
    'screenshot-editor', 'code-screenshots', 'text-behind-image', 'video-captions',
    'tweet-editor', 'carousel-editor', 'aspect-ratio-converter', 'image-resizer',
    'image-converter', 'clipboard-saver', 'video-converter', 'chart-maker',
    'map-maker', '3d-globe', 'polaroid-generator', 'watermark-remover',
    'text-to-speech', 'image-text-editor', 'bubble-blaster'
  ].map(slug => ({
    url: `/tool/${slug}`,
    priority: slug === 'screenshot-editor' || slug === 'code-screenshots' ? '0.9' : '0.8',
    changefreq: 'monthly',
    lastmod: '2025-12-30'
  }));

  // Tool app pages
  const appPages = [
    { url: '/editor', priority: '0.8', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/code', priority: '0.8', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/text-behind-image', priority: '0.7', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/captions', priority: '0.7', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/tweet', priority: '0.6', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/carousel', priority: '0.6', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/aspect-ratio', priority: '0.6', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/resize', priority: '0.6', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/convert', priority: '0.6', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/clipboard', priority: '0.5', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/video-convert', priority: '0.6', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/chart', priority: '0.6', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/map', priority: '0.6', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/globe', priority: '0.6', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/polaroid', priority: '0.5', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/watermark-remover', priority: '0.6', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/tts', priority: '0.6', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/image-text-editor', priority: '0.5', changefreq: 'weekly', lastmod: '2025-12-30' },
    { url: '/bubble-blaster', priority: '0.5', changefreq: 'weekly', lastmod: '2025-12-30' },
  ];

  // Dynamic blog pages - automatically generated from MDX files
  const blogPosts = getAllPosts();
  const blogPages = blogPosts.map(post => ({
    url: `/blog/${post.slug}`,
    priority: post.featured ? '0.7' : '0.6',
    changefreq: 'monthly',
    lastmod: post.updatedAt
  }));

  // Combine all pages
  const allPages = [...staticPages, ...toolPages, ...appPages, ...blogPages];

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default Sitemap;