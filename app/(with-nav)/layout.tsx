import Link from "next/link";

export default function WithNavLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Jake Park
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="/blog" className="hover:underline">
              Blog
            </Link>
            <Link href="/tags" className="hover:underline">
              Tags
            </Link>
            {isDevelopment && (
              <Link href="/editor" className="hover:underline text-blue-600">
                Editor
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 Jake Park. Built with Next.js.
        </div>
      </footer>
    </div>
  );
}