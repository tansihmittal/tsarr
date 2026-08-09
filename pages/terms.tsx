import Head from "next/head";
import Link from "next/link";
import { BsArrowLeft } from "react-icons/bs";

const LAST_UPDATED = "July 13, 2026";

const TermsPage = () => {
  return (
    <>
      <Head>
        <title>Terms of Service | tsarr.in</title>
        <meta
          name="description"
          content="The terms governing your use of tsarr.in’s free image and video tools."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://tsarr.in/terms" />
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
              Terms of Service
            </h1>
            <p className="text-gray-500 mb-10">Last updated: {LAST_UPDATED}</p>

            <p>
              These terms govern your use of tsarr.in and its tools (the &ldquo;Service&rdquo;).
              By using the Service, you agree to these terms. If you don’t agree,
              please don’t use the Service.
            </p>

            <h2>1. The Service</h2>
            <p>
              tsarr.in provides free, browser-based image and video editing tools
              (screenshot editing, format conversion, background removal, QR code
              generation, and others), plus optional paid features and account-based
              cloud storage for projects and presets.
            </p>

            <h2>2. Accounts</h2>
            <p>
              Most tools work without an account. Creating an account (via Google,
              email/password, or magic link) lets you save projects and presets to the
              cloud. You’re responsible for keeping your account credentials secure and
              for all activity under your account.
            </p>

            <h2>3. Acceptable use</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Upload or process content you don’t have the right to use</li>
              <li>Generate or distribute illegal, abusive, or infringing content</li>
              <li>Attempt to disrupt, overload, or gain unauthorized access to the Service</li>
              <li>Use the AI-detection or screenshot-capture endpoints to scrape, abuse, or exceed reasonable usage</li>
              <li>Resell or redistribute the Service as your own product</li>
            </ul>
            <p>We reserve the right to suspend accounts that violate these terms.</p>

            <h2>4. Your content</h2>
            <p>
              You retain all rights to the images, videos, and other content you
              process through the Service. We don’t claim ownership over your content,
              and — outside the specific AI features you explicitly invoke — we don’t
              access it, since most processing happens locally in your browser.
            </p>
            <p>
              For projects/presets you choose to save to the cloud, you grant us a
              limited license to store and display that content back to you, solely
              for the purpose of providing the Service.
            </p>

            <h2>5. AI features</h2>
            <p>
              Some tools (e.g. Image Map Pro’s AI hotspot detection) use third-party AI
              models. Outputs from these models are provided &ldquo;as-is&rdquo; — they may be
              inaccurate, incomplete, or require manual correction. You’re responsible
              for reviewing AI-generated results before relying on them.
            </p>

            <h2>6. Paid plans and billing</h2>
            <p>
              Paid subscriptions are billed and processed through Stripe. By
              subscribing, you authorize recurring charges until you cancel.
              Subscriptions can be canceled at any time; access continues through the
              end of the current billing period. Fees are non-refundable except where
              required by law.
            </p>

            <h2>7. Service availability</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties
              of any kind. We don’t guarantee uninterrupted availability and may
              modify, suspend, or discontinue any part of the Service at any time.
            </p>

            <h2>8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, tsarr.in and its operator won’t
              be liable for any indirect, incidental, or consequential damages arising
              from your use of the Service, including loss of data, images, or saved
              projects. Keep local backups of anything important.
            </p>

            <h2>9. Termination</h2>
            <p>
              You may stop using the Service or delete your account at any time. We
              may suspend or terminate access for violations of these terms.
            </p>

            <h2>10. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the
              Service after changes take effect constitutes acceptance of the updated
              terms.
            </p>

            <h2>11. Contact</h2>
            <p>
              Questions about these terms? Reach out via{" "}
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
              <Link href="/terms" className="text-gray-900 font-medium">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default TermsPage;
