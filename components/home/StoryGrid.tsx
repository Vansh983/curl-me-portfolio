import { FC, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import { mont } from "../../utils/fonts";

gsap.registerPlugin(ScrollTrigger);

interface CardProps {
  id: number;
  title: string;
  description: string[];
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
    // <div className="flex flex-col">
    <Carousel
      showArrows={false}
      showThumbs={false}
      showStatus={false}
      autoPlay={true}
      infiniteLoop={true}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          className="relative h-64 rounded-md shadow-md bg-cover bg-center my-4"
          style={{
            backgroundImage: `url(${card.img})`,
            height: "400px",
            boxShadow: "0px 4px 4px 500px rgba(0, 0, 0, 0.25) inset",
            zIndex: 300,
          }}
        >
          <div
            className="absolute inset-0 flex justify-end flex-col py-8 px-2"
            style={{ bottom: 0 }}
          >
            <h2 className={`${mont.className} text-4xl font-bold text-white`}>
              {card.title}
            </h2>
            {/* <p className="text-white w-5/6">{card.description}</p> */}
          </div>
        </div>
      ))}
    </Carousel>
    // </div>
  );
};

export default StoryGrid;
