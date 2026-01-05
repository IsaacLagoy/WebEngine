"use client";

import Glass from "./Glass";

interface Concept {
  title: string;
  description: string;
}

interface ConceptCardsProps {
  concepts: Concept[];
}

export default function ConceptCards({ concepts }: ConceptCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {concepts.map((concept, index) => (
        <Glass key={index} className="p-4 md:p-5">
          <h3 className="text-lg md:text-xl font-bold text-white mb-3">
            {concept.title}
          </h3>
          <p className="text-white/90 text-sm md:text-base leading-relaxed">
            {concept.description}
          </p>
        </Glass>
      ))}
    </div>
  );
}

