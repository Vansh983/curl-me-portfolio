// Components/ScrollAnimation.tsx

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollAnimationProps {
  children: React.ReactNode;
}

const Brand: React.FC<ScrollAnimationProps> = () => {
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
    <div ref={ref} className="h-screen w-3/4 bg-[#0D0D0D] mx-auto radius"></div>
  );
};

export default Brand;
