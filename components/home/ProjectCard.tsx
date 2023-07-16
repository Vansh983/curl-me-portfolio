import { FC, useRef, useEffect } from "react";
import "tailwindcss/tailwind.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

interface CardProps {
  data: {
    imgSrc: string;
    title: string;
    tags: string[];
    grad: string[];
    url: string;
    year: string;
  }[];
}

const ProjectCard: FC<CardProps> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.from(ref.current.children, {
        duration: 0.5,
        y: 100,
        stagger: 0.2,
        opacity: 0,
        delay: 0.9,
        ease: "power1.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 90%",
          // start: 550,
          end: "bottom center",
          // markers: true,
          scrub: true,
        },
        zIndex: 2,
        x: 0,
      });
    }
    // }
  }, []);
  return (
    <div className="flex flex-wrap mt-8 justify-between" ref={ref}>
      {data.map((card, index) => (
        <div
          key={index}
          className="relative group card w-[48%] my-4"
          style={{ opacity: 1 }}
        >
          <a href={card.url} target="_blank" rel="noopener noreferrer">
            <div className="">
              <img
                src={card.imgSrc}
                alt={card.title}
                className="w-full rounded"
              />
              {/* <div className="absolute bottom-0 flex justify-between left-0 w-full bg-black bg-opacity-40 text-white text-center py-2 transition-opacity opacity-0 group-hover:opacity-100 px-4">
                <div className="flex justify-start">
                  {card.pills.map((pill, pillIndex) => (
                    <span
                      key={pillIndex}
                      className={`inline-block px-3 py-1 text-sm font-semibold mr-2 cursor-pointer bg-blue-500`}
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div> */}
            </div>
            <div className="flex justify-between mt-2">
              <h2
                className="font-bold text-4xl my-8 w-3/4"
                style={{
                  background: `-webkit-linear-gradient(${card.grad})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {card.title}
              </h2>
              <div className="flex items-center">
                <button
                  type="button"
                  className={`text-white font-bold py-2 px-4 rounded`}
                  style={{
                    background: `-webkit-linear-gradient(${card.grad})`,
                  }}
                >
                  View
                </button>
              </div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
};

export default ProjectCard;
