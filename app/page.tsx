import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass-pane">
        <h1 className="text-4xl font-bold mb-4">Home</h1>
        <Link 
          href="/about" 
          className="inline-block mt-4 px-6 py-3 border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-200"
        >
          Go to About →
        </Link>
      </div>
    </div>
  );
}
