import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { BsArrowRight, BsGithub, BsTwitter, BsLinkedin, BsClock, BsCalendar } from "react-icons/bs";
import { getAllPosts, getFeaturedPosts, BlogPostMeta } from "@/lib/mdx";

interface BlogPageProps {
  featuredPosts: BlogPostMeta[];
  recentPosts: BlogPostMeta[];
}

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "tsarr.in Blog",
  description: "Tips, tutorials, and guides for creating beautiful screenshots, code images, and visual content.",
  url: "https://tsarr.in/blog",
  publisher: {
    "@type": "Organization",
    name: "tsarr.in",
    url: "https://tsarr.in"
  }
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://tsarr.in" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://tsarr.in/blog" }
  ]
};

export default function BlogPage({ featuredPosts, recentPosts }: BlogPageProps) {
  return (
    <>
      <Head>
        <title>Blog - Tips, Tutorials & Guides | tsarr.in</title>
        <meta name="title" content="Blog - Tips, Tutorials & Guides | tsarr.in" />
        <meta name="description" content="Learn how to create beautiful screenshots, code images, and visual content. Tips, tutorials, and guides for designers and developers." />
        <meta name="keywords" content="screenshot tutorial, code screenshot guide, image editing tips, design tutorials, visual content" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://tsarr.in/blog" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tsarr.in/blog" />
        <meta property="og:title" content="Blog - Tips, Tutorials & Guides | tsarr.in" />
        <meta property="og:description" content="Learn how to create beautiful screenshots and visual content." />
        <meta property="og:image" content="https://tsarr.in/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
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
              <Link href="/blog" className="px-3 py-2 text-sm text-gray-900 font-medium">
                Blog
              </Link>
              <Link href="/editor" className="ml-3 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                Open Editor
              </Link>
            </nav>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="pt-16 pb-12 px-6 border-b border-gray-100">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-4xl font-semibold text-gray-900 tracking-tight mb-4">
                Blog
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Tips, tutorials, and guides for creating beautiful screenshots, code images, 
                and visual content.
              </p>
            </div>
          </section>

          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <section className="py-12 px-6">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
                  Featured
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group block p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all bg-gray-50"
                    >
                      <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                        {post.category}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900 mt-3 mb-2 group-hover:text-gray-700 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BsCalendar className="w-3.5 h-3.5" />
                          {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <BsClock className="w-3.5 h-3.5" />
                          {post.readTime} min read
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* All Posts */}
          <section className="py-12 px-6 bg-gray-50 border-t border-gray-100">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
                All Posts
              </h2>
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group block p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {post.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-400 flex-shrink-0">
                        <BsClock className="w-3.5 h-3.5" />
                        {post.readTime} min
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 px-6 bg-gray-900 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-semibold tracking-tight mb-4">
                Ready to create something amazing?
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

export const getStaticProps: GetStaticProps = async () => {
  const allPosts = getAllPosts();
  const featuredPosts = allPosts.filter((post) => post.featured);
  const recentPosts = allPosts.filter((post) => !post.featured);

  return {
    props: {
      featuredPosts,
      recentPosts,
    },
  };
};
