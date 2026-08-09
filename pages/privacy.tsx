import Head from "next/head";
import Link from "next/link";
import { BsArrowLeft } from "react-icons/bs";

const LAST_UPDATED = "July 13, 2026";

const PrivacyPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy | tsarr.in</title>
        <meta
          name="description"
          content="How tsarr.in collects, uses, and protects your data across its free image and video tools."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://tsarr.in/privacy" />
      </Head>

      <div className="min-h-screen bg-white text-gray-900 antialiased">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold text-gray-900 tracking-tight">
              tsarr.in
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <BsArrowLeft className="w-4 h-4" />
              Home
            </Link>
          </div>
        </header>

        <main className="py-12 px-6">
          <div className="max-w-3xl mx-auto prose prose-gray prose-lg max-w-none">
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight mb-2">
              Privacy Policy
            </h1>
            <p className="text-gray-500 mb-10">Last updated: {LAST_UPDATED}</p>

            <p>
              tsarr.in (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) provides free browser-based image and video
              editing tools. This policy explains what data we collect, why, and how it’s
              handled. Most of our tools run entirely in your browser and never send your
              files anywhere — this policy calls out the specific cases where data does
              leave your device.
            </p>

            <h2>1. What we collect</h2>
            <h3>Account data</h3>
            <p>
              If you sign in (via Google OAuth, email/password, or a magic link), we
              store your email address, display name, and avatar URL through our
              authentication provider (Supabase). We use this to associate saved
              projects and presets with your account.
            </p>
            <h3>Projects and presets</h3>
            <p>
              If you’re signed in and choose to save a project or preset to the cloud,
              its data (including a thumbnail and the editing state) is stored in our
              database, scoped to your account. Everything you create without signing
              in stays local to your browser (IndexedDB / localStorage) and is never
              transmitted to us.
            </p>
            <h3>Images and files you upload</h3>
            <p>
              For the vast majority of tools (Screenshot Editor, Image Converter,
              Resizer, Watermark Remover, Background Remover, and others), your images
              and videos are processed entirely client-side in your browser and never
              uploaded to any server.
            </p>
            <p>
              A small number of AI-powered features send an image to a third-party
              model provider for processing:
            </p>
            <ul>
              <li>
                <strong>Image Map Pro’s AI hotspot detection</strong> sends the image
                you’re annotating to Replicate (running GPT-4o-mini and SAM3) to
                identify regions. The image is processed for that single request and
                is not stored by us afterward, subject to Replicate’s own retention
                policy.
              </li>
              <li>
                <strong>Screenshot capture</strong> (the URL-to-screenshot API) fetches
                and renders the URL you provide using a headless browser on our
                servers.
              </li>
            </ul>
            <h3>Payment information</h3>
            <p>
              If you subscribe to a paid plan, payment is handled entirely by Stripe.
              We never see or store your card details — only your email and
              subscription status are shared with us via Stripe’s webhooks.
            </p>
            <h3>Automatically collected data</h3>
            <p>
              We use Vercel Web Analytics and Vercel Speed Insights to understand
              aggregate traffic and performance (pages visited, general device/browser
              type, approximate region). This data is anonymized and not tied to your
              account or used to individually identify you.
            </p>

            <h2>2. How we use your data</h2>
            <ul>
              <li>To provide and maintain the tools and your saved projects/presets</li>
              <li>To authenticate you and secure your account</li>
              <li>To process payments and manage subscriptions</li>
              <li>To run the specific AI features you explicitly invoke</li>
              <li>To understand aggregate usage and improve performance</li>
              <li>To send push notifications you’ve opted into</li>
            </ul>
            <p>We do not sell your data, and we do not use your uploaded images to train any model.</p>

            <h2>3. Third-party services</h2>
            <p>We rely on the following processors, each governed by their own privacy policy:</p>
            <ul>
              <li><strong>Supabase</strong> — authentication and database storage</li>
              <li><strong>Firebase</strong> — push notifications</li>
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Replicate</strong> — AI model inference for specific opt-in features</li>
              <li><strong>Vercel</strong> — hosting, analytics, and performance monitoring</li>
            </ul>

            <h2>4. Cookies and local storage</h2>
            <p>
              We use essential cookies/local storage for authentication sessions and
              your preferences (like theme). IndexedDB is used to store your local
              (unsynced) projects directly in your browser. You can clear these at any
              time via your browser settings, which will sign you out and remove
              locally saved projects.
            </p>

            <h2>5. Your rights</h2>
            <p>
              You can request access to, correction of, or deletion of your account
              data at any time by contacting us. Deleting your account removes your
              stored projects and presets from our database.
            </p>

            <h2>6. Data retention</h2>
            <p>
              Account data and saved projects/presets are retained until you delete
              them or close your account. Images sent to AI processing endpoints are
              not retained by us beyond the request.
            </p>

            <h2>7. Children’s privacy</h2>
            <p>
              tsarr.in is not directed at children under 13, and we do not knowingly
              collect data from them.
            </p>

            <h2>8. Changes to this policy</h2>
            <p>
              We may update this policy occasionally. Material changes will be
              reflected by updating the &ldquo;Last updated&rdquo; date above.
            </p>

            <h2>9. Contact</h2>
            <p>
              Questions about this policy? Reach out via{" "}
              <a href="https://github.com/tansihmittal/" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>{" "}
              or{" "}
              <a href="https://tanishmittal.com/" target="_blank" rel="noopener noreferrer">
                tanishmittal.com
              </a>
              .
            </p>
          </div>
        </main>

        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-6 py-8 flex items-center justify-between">
            <p className="text-sm text-gray-500">© 2025 tsarr.in</p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/terms" className="text-gray-500 hover:text-gray-900 transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-gray-900 font-medium">
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default PrivacyPage;
