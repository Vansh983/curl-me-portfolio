import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import styles from "../../styles/Projects.module.css";
import { story } from "../../data/about";

gsap.registerPlugin(ScrollTrigger);

const Facts: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;

      gsap.to(container, {
        x: -(container.scrollWidth - window.innerWidth),
        scrollTrigger: {
          trigger: container,
          pin: true,
          scrub: 1,
          start: "top top",
          end: `+=500`,
          markers: true,
        },
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="h-screen" style={{ display: "flex" }}>
      {story.map((image, index) => (
        <img
          key={index}
          src={image.img}
          alt={`image-${index}`}
          style={{ height: "400px", margin: "10px" }}
        />
      ))}
    </div>
  );
};

export default Facts;
