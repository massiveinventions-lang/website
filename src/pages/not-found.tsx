import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-black text-[var(--foreground)] mb-4">404</h1>
        <p className="text-xl text-[var(--foreground)]/60 mb-8">This page doesn't exist.</p>
        <Link href="/">
          <button className="bg-[var(--foreground)] text-[var(--background)] px-8 py-3 rounded-full font-semibold hover:opacity-80 transition-opacity">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
