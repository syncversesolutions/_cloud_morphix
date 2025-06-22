import { Cloud } from "lucide-react";
import Link from "next/link";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="absolute top-0 left-0 w-full p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Cloud className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-primary font-headline">Cloud Morphix</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
