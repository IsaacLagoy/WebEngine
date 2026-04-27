"use client";

import Glass from "../../components/Glass";
import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import ContentSection from "../../components/ContentSection";

export default function Y86Page() {
  const instructions = [
    {
      title: "halt",
      description: "Ends the program.",
    },
    {
      title: "nop",
      description: "Bubbles for a single cycle.",
    },
    {
      title: "irmovq",
      description: "Moves a constant to a register.",
    },
    {
      title: "rrmovq",
      description: "Moves the values of one register to another.",
    },
    {
      title: "rmmovq",
      description: "Moves a value from memory to a register.",
    },
    {
      title: "mrmovq",
      description: "Moves a value from a register to memory.",
    },
    {
      title: "pushq",
      description: "Push a register to the stack.",
    },
    {
      title: "popq",
      description: "Pop the top of the stack to a register.",
    },
    {
      title: "OPq",
      description: "Perform an operation between two registers.",
    },
    {
      title: "jXX",
      description: "Jump with or without a condition.",
    },
  ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="x86-Like CPU"
        image="/images/projects/logisim.png"
        imageAlt="x86-Like CPU"
        description="The final project for my computer organization class was to create a y86 CPU, which is a reduced version of x86."
      />

      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
          Instruction Set
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instructions.map((instruction, index) => (
            <Glass key={index} className="p-4 md:p-5 h-full">
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 font-mono">
                {instruction.title}
              </h3>
              <p className="text-white/80 text-sm md:text-base leading-relaxed">
                {instruction.description}
              </p>
            </Glass>
          ))}
        </div>
      </div>

      <ContentSection title="About">
        <p>
          This project was the final assignment for a computer organization class, requiring the implementation of a y86 CPU. The y86 instruction set architecture is a simplified version of x86, designed for educational purposes.
        </p>
        <p>
          The CPU implementation includes all the core components: instruction fetch, decode, execute, memory access, and writeback stages. The instruction set supports basic arithmetic operations, memory access, stack operations, and control flow.
        </p>
        <p>
          This project provided hands-on experience with CPU architecture, instruction pipelining, and the low-level operations that make modern computing possible.
        </p>
      </ContentSection>
    </ProjectPageLayout>
  );
}

