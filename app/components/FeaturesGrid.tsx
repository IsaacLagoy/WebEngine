"use client";

import Glass from "./Glass";

interface Feature {
  title: string;
  description: string;
}

interface FeaturesGridProps {
  title: string;
  features: Feature[];
}

export default function FeaturesGrid({ title, features }: FeaturesGridProps) {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <Glass key={index} className="p-4 md:p-5 h-full">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-white/80 text-sm md:text-base leading-relaxed">
              {feature.description}
            </p>
          </Glass>
        ))}
      </div>
    </div>
  );
}

