// components/StoryGrid.tsx
import { FC, useLayoutEffect, useRef, useState } from "react";
import Bridge from "../../data/savages/bridge/bridge";
import Sun from "../../data/savages/bridge/sun";
import Baadal from "../../data/savages/bridge/baadal";
import BoatRight from "../../data/savages/bridge/boat-right";
import BoatLeft from "../../data/savages/bridge/boat-left";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

interface CardProps {
  id: number;
  title: string;
  description: string;
  img: string;
  link: string;
}

interface StoryGridProps {
  cards: CardProps[];
}
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SanFran: FC<StoryGridProps> = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [vanish, setVanish] = useState(false);
  const tl = useRef();

  useLayoutEffect(() => {
    const ctx = gsap.context((self) => {
      const boxes = self.selector(".svg");
      tl.current = gsap.timeline();
      boxes.forEach((box) => {
        tl.current
          // .from(box, { y: 150, opacity: 0 })
          .to(box, {
            y: 0,
            opacity: 1,
            scrollTrigger: {
              trigger: boxes,
              start: "bottom bottom",
              end: "+=500",
              scrub: true,
              // markers: true,
              // pin: true,
            },
          })
          .to(box, {
            x: 200,
            opacity: 0,
            scrollTrigger: {
              trigger: boxes,
              start: "bottom top",
              end: "bottom +=150",
              scrub: true,
              // markers: true,
            },
          });
      });
    }, ref); // <- Scope!
    return () => ctx.revert(); // <- Cleanup!
  }, []);

  return (
    <div ref={ref} style={{ height: "100vh", marginTop: "50vh" }}>
      <Bridge />
      <Sun />
      <Baadal />
      <BoatRight />
      <BoatLeft />
    </div>
  );
};

export default SanFran;
