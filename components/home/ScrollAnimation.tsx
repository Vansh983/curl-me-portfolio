// Components/ScrollAnimation.tsx

import React, { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollAnimationProps {
  setCounter: Dispatch<SetStateAction<number>>;
}

const ScrollAnimation: React.FC<ScrollAnimationProps> = ({ setCounter }) => {
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
      onComplete: () => setCounter(1),
    });
  }, []);

  return (
    <div
      ref={ref}
      className="fixed w-[90%] mt-32 mx-[5%] radius h-[80vh]"
      style={{ zIndex: 0 }}
    />
  );
};

export default ScrollAnimation;
