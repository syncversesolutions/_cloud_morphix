import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/landing/feature-card";
import PricingCard from "@/components/landing/pricing-card";
import LandingHeader from "@/components/landing/header";
import LandingFooter from "@/components/landing/footer";
import {
  LayoutDashboard,
  Target,
  Settings,
  Users,
  Bot,
  BadgeDollarSign,
  Check,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Unified Reporting Platform",
    description: "Integrate all your data sources into a single, intuitive dashboard for a complete view of your business.",
  },
  {
    icon: Target,
    title: "Enterprise-Grade KPIs",
    description: "Track and visualize key performance indicators that matter most to your business growth and success.",
  },
  {
    icon: Settings,
    title: "Report Customization",
    description: "Tailor reports and dashboards to meet the specific needs of different teams and stakeholders.",
  },
  {
    icon: Users,
    title: "User Management",
    description: "Control access and permissions with robust role-based user management for secure data handling.",
  },
  {
    icon: Bot,
    title: "AI-Driven Accelerators",
    description: "Leverage artificial intelligence to uncover hidden insights, predict trends, and accelerate decision-making.",
  },
  {
    icon: BadgeDollarSign,
    title: "Subscription-Based Pricing",
    description: "Flexible and scalable pricing plans that grow with your business, ensuring you only pay for what you need.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <section id="hero" className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute top-0 left-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="container text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline">
              All-in-One Business Intelligence Platform
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Transform your raw data into actionable insights with our unified reporting, enterprise-grade KPIs, and AI-driven business accelerators.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="#demo">Request a Demo</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#pricing">See Pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 sm:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Powerful Features to Drive Your Business</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to make data-driven decisions, all in one place.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section id="use-cases" className="py-20 sm:py-32 bg-secondary/30">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">For Every Industry</div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Built for Your Business Needs</h2>
                <p className="text-lg text-muted-foreground">
                  Whether you're in e-commerce, finance, or marketing, Cloud Morphix provides the tools to understand your customers, optimize operations, and drive revenue.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> <span>E-commerce & Retail Analytics</span></li>
                  <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> <span>Financial Performance Tracking</span></li>
                  <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> <span>Marketing Campaign ROI</span></li>
                </ul>
              </div>
              <div>
                <Image
                  src="https://placehold.co/600x450.png"
                  alt="Dashboard screenshot showing charts and graphs"
                  width={600}
                  height={450}
                  className="rounded-xl shadow-2xl"
                  data-ai-hint="dashboard chart"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 sm:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Choose Your Plan</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Simple, transparent pricing that scales with you.
              </p>
            </div>
            <div className="mt-16 grid max-w-md grid-cols-1 gap-8 md:max-w-none md:grid-cols-3">
              <PricingCard
                tier="Basic"
                price="49"
                period="month"
                description="For small teams and startups getting started with data."
                features={["5 Dashboards", "10 Data Sources", "Basic Support", "Daily Data Refresh"]}
              />
              <PricingCard
                tier="Pro"
                price="99"
                period="month"
                description="For growing businesses that need more power and insights."
                features={["Unlimited Dashboards", "50 Data Sources", "Priority Support", "Hourly Data Refresh", "AI Accelerators"]}
                isFeatured
              />
              <PricingCard
                tier="Enterprise"
                price="Custom"
                period=""
                description="For large organizations with custom needs and requirements."
                features={["Everything in Pro", "Dedicated Account Manager", "Custom Integrations", "On-premise option"]}
              />
            </div>
          </div>
        </section>

        <section id="demo" className="py-20 sm:py-32 text-center">
          <div className="container">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Ready to See It in Action?</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Schedule a personalized demo with one of our experts to see how Cloud Morphix can transform your business.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="#">Request a Demo</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
