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

const ScrollAnimation: React.FC<ScrollAnimationProps> = ({ children }) => {
  const ref = useRef(null);

  useEffect(() => {
    gsap.to(ref.current, {
      scrollTrigger: {
        trigger: ref.current,
        start: "top center",
        // end: "bottom center",
        scrub: true,
      },
      width: "100%",
      marginLeft: "0",
      borderRadius: "0",
      marginTop: "0",
      height: "100vh",
      // position: "relative",
    });
  }, []);

  return (
    <div ref={ref} className="fixed w-[80%] bg-[#0D0D0D] mt-36 mx-[10%] radius">
      {children}
    </div>
  );
};

export default ScrollAnimation;
