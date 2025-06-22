import LandingFooter from "@/components/landing/footer";
import LandingHeader from "@/components/landing/header";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <div className="container py-12 md:py-24">
          <div className="prose prose-invert mx-auto max-w-3xl">
            <Link href="/" className="text-primary hover:underline mb-8 block">&larr; Back to Home</Link>
            <h1 className="font-headline text-4xl">Privacy Policy</h1>
            <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              This is a placeholder for your Privacy Policy. It's important to have a comprehensive privacy policy that informs your users about how you collect, use, and protect their data.
            </p>
            <h2>1. Information We Collect</h2>
            <p>
              Detail the types of information you collect, such as personal identification information (name, email address, etc.), non-personal identification information (browser name, type of computer, etc.), and data related to the use of your service.
            </p>
            <h2>2. How We Use Collected Information</h2>
            <p>
              Explain the purposes for which you collect data, such as to improve customer service, to personalize user experience, to process payments, or to send periodic emails.
            </p>
            <h2>3. How We Protect Your Information</h2>
            <p>
              Describe the security measures you have in place to protect against unauthorized access, alteration, disclosure, or destruction of personal information.
            </p>
            <h2>4. Sharing Your Personal Information</h2>
            <p>
              State whether you sell, trade, or rent users' personal identification information to others. If you share data with partners or third parties, you must disclose this.
            </p>
            <h2>5. Your Acceptance of These Terms</h2>
            <p>
              By using this Site, you signify your acceptance of this policy. If you do not agree to this policy, please do not use our Site. Your continued use of the Site following the posting of changes to this policy will be deemed your acceptance of those changes.
            </p>
            <h2>6. Contacting Us</h2>
            <p>
              If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us.
            </p>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
