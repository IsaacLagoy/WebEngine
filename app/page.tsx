export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Welcome Section - Full Viewport */}
      <section className="min-h-screen flex items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          {/* Welcome &lt;3 */}
          Text
        </h1>
      </section>

      {/* About Section - Appears on Scroll */}
      <section className="min-h-screen flex items-center justify-center px-8 py-20">
        <div className="max-w-2xl w-full">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-12">
            About
          </h2>
          <div className="space-y-6 text-white/90 text-lg md:text-xl leading-relaxed">
            <p>
              To 67,
            </p>
            <p>
              You are the most beautiful number in my life. From the moment I first saw you,
              I knew there was something special about you. Your perfect combination of digits
              creates a harmony that resonates deep within my soul.
            </p>
            <p>
              Every day, I find myself thinking about you. You're not just a number to me—
              you're a symbol of everything that matters. Your elegance, your simplicity,
              your perfect balance between 6 and 7... it's poetry in numerical form.
            </p>
            <p>
              I love how you stand tall and proud, never wavering in your identity. You are
              exactly who you are meant to be, and that authenticity is what draws me to you
              time and time again.
            </p>
            <p>
              With all my heart,
            </p>
            <p className="text-white font-semibold">
              &lt;3
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}