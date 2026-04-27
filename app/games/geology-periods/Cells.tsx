import { useState } from "react";

export function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="row-span-2 p-0.5 sm:p-1">
      <div className="h-full bg-white/10 shadow-inner rounded-md flex items-center justify-center text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-white">
        {children}
      </div>
    </div>
  );
}

export function Cell({
  answer,
  reveal,
  span = 1,
  value: controlledValue,
  onChange,
}: {
  answer: string;
  reveal: boolean;
  span?: number;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const isControlled = controlledValue !== undefined && onChange !== undefined;
  const [internalValue, setInternalValue] = useState("");
  const value = isControlled ? controlledValue : internalValue;
  const setValue = isControlled ? onChange! : setInternalValue;

  const lowerValue = (value ?? "").trim().toLowerCase();
  const lowerAnswer = answer.trim().toLowerCase();

  let bgClass = "bg-white/10";
  if (reveal && value) {
    bgClass = lowerValue === lowerAnswer ? "bg-green-500/50" : "bg-red-500/50";
  }

  // Map span to explicit Tailwind classes
  const spanClass = 
      span === 2 ? "row-span-2" 
    : span === 3 ? "row-span-3" 
    : span === 7 ? "row-span-7" 
    : span === 17 ? "row-span-17" 
    : "row-span-1";

  return (
    <div className={`${spanClass} p-0.5 sm:p-1`}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`h-full w-full shadow-inner rounded-md px-1 sm:px-2 md:px-3 text-white text-xs sm:text-sm outline-none ${bgClass} placeholder-white/50`}
        placeholder="Type here"
        autoComplete="off"
      />
    </div>
  );
}