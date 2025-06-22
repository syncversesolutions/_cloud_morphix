import LandingFooter from "@/components/landing/footer";
import LandingHeader from "@/components/landing/header";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <div className="container py-12 md:py-24">
          <div className="prose prose-invert mx-auto max-w-3xl">
            <Link href="/" className="text-primary hover:underline mb-8 block">&larr; Back to Home</Link>
            <h1 className="font-headline text-4xl">Terms of Service</h1>
            <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              This is a placeholder for your Terms of Service agreement. This agreement sets the rules and expectations for users of your service.
            </p>
            <h2>1. Agreement to Terms</h2>
            <p>
              By using our services, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the services.
            </p>
            <h2>2. User Accounts</h2>
            <p>
              When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
            </p>
            <h2>3. Content</h2>
            <p>
              Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
            </p>
            <h2>4. Prohibited Uses</h2>
            <p>
              You may use the Service only for lawful purposes and in accordance with the Terms. You agree not to use the Service in any way that violates any applicable national or international law or regulation.
            </p>
            <h2>5. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <h2>6. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect.
            </p>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
