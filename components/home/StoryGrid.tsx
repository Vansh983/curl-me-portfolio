import { FC, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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

const StoryGrid: FC<StoryGridProps> = ({ cards }) => {
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
          // markers: true,
        },
      });
    }
  }, []);

  return (
    <div className="flex" style={{ width: 50000 }}>
      {cards.map((card, index) => (
        <div
          key={index}
          className="relative h-64 radius shadow-md bg-cover bg-center my-4"
          style={{
            backgroundImage: `url(${card.img})`,
            height: "400px",
            boxShadow: "0px 4px 4px 500px rgba(0, 0, 0, 0.25) inset",
            zIndex: 300,
            width: 400,
          }}
        >
          <div className=" inset-0  flex flex-col justify-end py-8 px-16">
            <h2 className="text-4xl font-bold text-white">{card.title}</h2>
            {/* <p className="text-white w-5/6">{card.description}</p> */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StoryGrid;
