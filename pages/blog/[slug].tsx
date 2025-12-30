import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { BsArrowRight, BsGithub, BsTwitter, BsLinkedin, BsClock, BsCalendar, BsArrowLeft, BsTag } from "react-icons/bs";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { getPostBySlug, getPostSlugs, getRelatedPosts, BlogPostMeta } from "@/lib/mdx";

interface BlogPostPageProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    author: string;
    publishedAt: string;
    updatedAt: string;
    category: string;
    tags: string[];
    readTime: number;
    metaDescription?: string;
    keywords?: string[];
  };
  mdxSource: MDXRemoteSerializeResult;
  relatedPosts: BlogPostMeta[];
}

// Custom components for MDX
const components = {
  h2: (props: any) => <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4" {...props} />,
  h3: (props: any) => <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3" {...props} />,
  p: (props: any) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside space-y-1 mb-4 text-gray-700" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-700" {...props} />,
  li: (props: any) => <li className="ml-2" {...props} />,
  strong: (props: any) => <strong className="font-semibold text-gray-900" {...props} />,
  a: (props: any) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4" {...props} />
  ),
  code: (props: any) => (
    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800" {...props} />
  ),
  pre: (props: any) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm" {...props} />
  ),
  table: (props: any) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-gray-200 rounded-lg" {...props} />
    </div>
  ),
  th: (props: any) => <th className="bg-gray-100 px-4 py-2 text-left font-semibold border-b" {...props} />,
  td: (props: any) => <td className="px-4 py-2 border-b border-gray-100" {...props} />,
};

export default function BlogPostPage({ post, mdxSource, relatedPosts }: BlogPostPageProps) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: {
      "@type": "Person",
      name: post.author,
      url: "https://tanishmittal.com"
    },
    publisher: {
      "@type": "Organization",
      name: "tsarr.in",
      url: "https://tsarr.in",
      logo: { "@type": "ImageObject", url: "https://tsarr.in/favicon.ico" }
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: `https://tsarr.in/blog/${post.slug}`,
    keywords: post.tags.join(", ")
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://tsarr.in" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://tsarr.in/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://tsarr.in/blog/${post.slug}` }
    ]
  };

  return (
    <>
      <Head>
        <title>{post.title} | tsarr.in Blog</title>
        <meta name="title" content={`${post.title} | tsarr.in Blog`} />
        <meta name="description" content={post.metaDescription || post.excerpt} />
        <meta name="keywords" content={post.keywords?.join(", ") || post.tags.join(", ")} />
        <meta name="author" content={post.author} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://tsarr.in/blog/${post.slug}`} />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://tsarr.in/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content="https://tsarr.in/images/og-image.png" />
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="article:modified_time" content={post.updatedAt} />
        <meta property="article:author" content={post.author} />
        <meta property="article:tag" content={post.tags.join(", ")} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="min-h-screen bg-white text-gray-900 antialiased">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold text-gray-900 tracking-tight">
              tsarr.in
            </Link>
            <nav className="flex items-center gap-1">
              <Link href="/tools" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Tools
              </Link>
              <Link href="/blog" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Blog
              </Link>
              <Link href="/editor" className="ml-3 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                Open Editor
              </Link>
            </nav>
          </div>
        </header>

        <main>
          {/* Article */}
          <article className="py-12 px-6">
            <div className="max-w-3xl mx-auto">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-gray-700">Home</Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-gray-700">Blog</Link>
                <span>/</span>
                <span className="text-gray-900 truncate">{post.title}</span>
              </div>

              {/* Header */}
              <header className="mb-8">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded mb-4 inline-block">
                  {post.category}
                </span>
                <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight mb-4 leading-tight">
                  {post.title}
                </h1>
                <p className="text-xl text-gray-600 mb-6">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b border-gray-200">
                  <span>By {post.author}</span>
                  <span className="flex items-center gap-1">
                    <BsCalendar className="w-3.5 h-3.5" />
                    {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <BsClock className="w-3.5 h-3.5" />
                    {post.readTime} min read
                  </span>
                </div>
              </header>

              {/* MDX Content */}
              <div className="prose prose-gray prose-lg max-w-none">
                <MDXRemote {...mdxSource} components={components} />
              </div>

              {/* Tags */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <BsTag className="w-4 h-4 text-gray-400" />
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Back to Blog */}
              <div className="mt-8">
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  <BsArrowLeft className="w-4 h-4" />
                  Back to Blog
                </Link>
              </div>
            </div>
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="py-12 px-6 bg-gray-50 border-t border-gray-100">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Related Posts</h2>
                <div className="space-y-4">
                  {relatedPosts.map((relPost) => (
                    <Link
                      key={relPost.slug}
                      href={`/blog/${relPost.slug}`}
                      className="group block p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <h3 className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                        {relPost.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{relPost.readTime} min read</p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="py-16 px-6 bg-gray-900 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-semibold tracking-tight mb-4">
                Ready to try it yourself?
              </h2>
              <p className="text-gray-400 mb-6">
                Put these tips into practice with our free tools.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/editor" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors">
                  Open Screenshot Editor
                  <BsArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/tools" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-gray-200 text-sm font-medium rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors">
                  Browse All Tools
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                © 2025 tsarr.in. Created by{" "}
                <a href="https://tanishmittal.com/" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900">
                  Tanish Mittal
                </a>
              </p>
              <div className="flex items-center gap-4">
                <a href="https://github.com/tansihmittal/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                  <BsGithub className="w-5 h-5" />
                </a>
                <a href="https://x.com/mittaltani36318" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                  <BsTwitter className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com/in/tanishmittal02" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                  <BsLinkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getPostSlugs();
  const paths = slugs.map((slug) => ({
    params: { slug: slug.replace(/\.mdx$/, '') },
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const post = getPostBySlug(slug);

  if (!post) {
    return { notFound: true };
  }

  const mdxSource = await serialize(post.content);
  const relatedPosts = getRelatedPosts(slug, 3);

  const { content, ...postMeta } = post;

  return {
    props: {
      post: postMeta,
      mdxSource,
      relatedPosts,
    },
  };
};
