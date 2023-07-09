// Components/ScrollAnimation.tsx

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { about } from "../../data/about";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollAnimationProps {
  children: React.ReactNode;
}

const About: React.FC<ScrollAnimationProps> = () => {
  const ref = useRef(null);

  useEffect(() => {
    gsap.to(ref.current, {
      scrollTrigger: {
        trigger: ref.current,
        start: "top center",
        end: "bottom center",
        scrub: true,
      },
      width: "100%",
      borderRadius: "0",
    });
  }, []);

  return (
    <div className="h-screen">
      <div className="flex flex-col">
        <h1 className="text-6xl font-bold text-white">{about.title}</h1>
        {about.paragraphs.map((p) => (
          <p className="text-white">{p}</p>
        ))}
      </div>
    </div>
  );
};

export default Brand;
