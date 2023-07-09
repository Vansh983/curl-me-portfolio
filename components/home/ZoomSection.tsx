// components/ZoomSection.tsx
import React, { ReactNode, useState, useEffect } from "react";

interface ZoomSectionProps {
  children: ReactNode;
}

const ZoomSection = ({ children }: ZoomSectionProps) => {
  const [scale, setScale] = useState(1);
  const scrollThreshold = 1000; // Change to the point you want the maximum scale

  const checkScale = () => {
    const scrollPosition = window.scrollY;
    // Compute the scale based on scroll position
    let newScale = 1 + (scrollPosition / scrollThreshold) * 0.5; // Change 0.05 to the max scale change you want

    // Restrict the scale within 1 to 1.05
    newScale = Math.max(1, newScale);
    newScale = Math.min(1.25, newScale);

    setScale(newScale);
  };

  useEffect(() => {
    window.addEventListener("scroll", checkScale);

    return () => {
      window.removeEventListener("scroll", checkScale);
    };
  }, []);

  return (
    <div
      className={`transition-transform duration-200 ease-in-out transform w-4/5 mx-auto rounded-xl bg-white dark:bg-black`}
      style={{ transform: `scale(${scale})` }}
    >
      {children}
    </div>
  );
};

export default ZoomSection;
