import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass-pane">
        <h1 className="text-4xl font-bold mb-4">About</h1>
        <p className="text-lg leading-relaxed mb-4">
          This is the about page. The sharp pane of glass effect provides a modern glassmorphism aesthetic.
        </p>
        <Link 
          href="/" 
          className="inline-block mt-4 px-6 py-3 border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-200"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

