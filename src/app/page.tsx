import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LandingHeader from "@/components/landing/header";
import LandingFooter from "@/components/landing/footer";
import {
  CheckCircle,
  ShoppingBag,
  Factory,
  Truck,
  BedDouble,
  Tractor,
  Dumbbell,
  Building,
  Users,
  Database,
  Cloud,
  Cpu,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const industries = [
  { icon: ShoppingBag, name: "Retail & E-commerce" },
  { icon: Factory, name: "Manufacturing" },
  { icon: Truck, name: "Logistics & Supply Chain" },
  { icon: BedDouble, name: "Hospitality" },
  { icon: Tractor, name: "Agriculture" },
  { icon: Dumbbell, name: "Fitness & Sports" },
  { icon: Building, name: "Construction" },
  { icon: Users, name: "Membership-Based Businesses" },
];

const whyCloudMorphix = [
  {
    icon: Cloud,
    title: "Complete Google Cloud Native Solution",
    description: "Built with BigQuery, Looker Studio, Firebase, and Google AI for seamless integration and performance.",
  },
  {
    icon: Zap,
    title: "Seamless IoT Data Integration",
    description: "Connect sensors, devices, and real-time operational data streams with ease.",
  },
  {
    icon: Database,
    title: "Pre-built, Industry-Specific Dashboards",
    description: "Get started instantly with ready-to-use insights tailored for your specific industry.",
  },
  {
    icon: Cpu,
    title: "AI & ML-Powered Forecasting",
    description: "Leverage Google's AI to predict trends, forecast sales, and understand customer behavior.",
  },
  {
    icon: ShieldCheck,
    title: "Scalable & Secure Architecture",
    description: "Trust in an infrastructure backed by Google’s world-class security and infinite scalability.",
  },
  {
    icon: Users,
    title: "Unified Data Management",
    description: "Eliminate the need for multiple tools and fragmented systems with a single source of truth.",
  },
];

const howItEmpowers = [
    { text: "Make faster, more confident decisions with clear, actionable insights." },
    { text: "Monitor your key operations and KPIs in real-time, from anywhere." },
    { text: "Discover hidden growth opportunities with powerful predictive analytics." },
    { text: "Streamline your data workflows with Google Cloud's unmatched speed and reliability." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden py-24 md:py-40">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="container text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline">
              One Platform.
              <br />
              <span className="text-primary">Powered by Google Cloud.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
              CloudMorphix unifies your business data, delivers real-time insights, and scales effortlessly — all on the trusted foundation of Google Cloud.
            </p>
            <div className="mt-10">
              <Button asChild size="lg" className="px-10 py-6 text-lg">
                <Link href="/register">Book a Demo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section id="industries" className="py-20 sm:py-24 bg-secondary/30">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Industries We Serve</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Providing tailored analytics solutions for a diverse range of sectors.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
              {industries.map((industry) => (
                 <Card key={industry.name} className="text-center items-center flex flex-col justify-center p-6 bg-card/50 border-border/50">
                   <industry.icon className="h-10 w-10 mb-4 text-primary" />
                   <CardTitle className="text-base font-medium">{industry.name}</CardTitle>
                 </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why CloudMorphix Section */}
        <section id="why" className="py-20 sm:py-32">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Image
                  src="https://placehold.co/600x450.png"
                  alt="Google Cloud architecture diagram"
                  width={600}
                  height={450}
                  className="rounded-xl shadow-2xl"
                  data-ai-hint="cloud architecture"
                />
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Why CloudMorphix on Google Cloud?</h2>
                <p className="text-lg text-muted-foreground">
                  Leverage the full power of Google's ecosystem in a single, unified platform.
                </p>
                <ul className="space-y-4">
                  {whyCloudMorphix.map((item) => (
                    <li key={item.title} className="flex items-start gap-4">
                      <div className="flex-shrink-0 bg-primary/10 text-primary p-2 rounded-full mt-1">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Empowers Section */}
        <section id="empower" className="py-20 sm:py-24 bg-secondary/30">
            <div className="container">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Empowering Your Business</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Turn data into your most valuable asset and drive meaningful growth.
                    </p>
                </div>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {howItEmpowers.map((item, index) => (
                         <div key={index} className="flex items-start gap-3 p-6 rounded-lg bg-card/50">
                            <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                            <p className="text-muted-foreground">{item.text}</p>
                         </div>
                    ))}
                </div>
                 <div className="mt-16 text-center">
                    <Button asChild size="lg" className="px-10 py-6 text-lg">
                        <Link href="/register">Book a Demo</Link>
                    </Button>
                </div>
            </div>
        </section>

      </main>
      <LandingFooter />
    </div>
  );
}
