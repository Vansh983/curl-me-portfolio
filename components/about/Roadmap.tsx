import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type RoadmapPoint = {
  year: string;
  event: string;
};

const RoadmapData: RoadmapPoint[] = [
  { year: "2018", event: "Google Code In Grand Prize Winner" },
  {
    year: "2019-2020",
    event: "Finished High school and worked as a freelancer for 10+ startups",
  },
  {
    year: "2020 - 2021",
    event: "Founded a Web and mobile app development agency: Webcube Infotech",
  },
  {
    year: "2022",
    event:
      "Started Bachelors of Computer Science at Dalhousie University Canada",
  },
  {
    year: "2022 - 2023",
    event:
      "Software Developer for Dalhousie University, Freelance for 35+ companies and built multiple tech for startups as a Tech Founder and Entrepreneur (self-made)",
  },
];

export const Roadmap: React.FC = () => {
  const RoadmapElement = useRef<HTMLDivElement>(null);
  const ref = useRef(null);

  useEffect(() => {
    if (RoadmapElement.current) {
      gsap.from(RoadmapElement.current.children, {
        // duration: 1,
        y: 100,
        stagger: 0.2,
        opacity: 0,
        delay: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: RoadmapElement.current,
          start: () => 550,
          // end: "bottom center",
          scrub: true,
        },
        zIndex: 2,
        x: 0,
      });
    }
  }, []);

  return (
    <div
      ref={RoadmapElement}
      className="flex flex-col space-y-4"
      style={{ zIndex: 2 }}
    >
      <svg className="absolute z-10" width="2" height="100%">
        <line x1="1" y1="0" x2="1" y2="100%" stroke="#fff" />
      </svg>
      {[...RoadmapData].map((point, index) => (
        <div
          key={index}
          className="relative w-full max-w-md p-5 bg-gray-100 rounded shadow-md"
        >
          <svg className="absolute left-0 ml-[-12px] z-20" width="8" height="8">
            <circle cx="4" cy="4" r="4" fill="#fff" />
          </svg>
          <h2 className="text-2xl font-bold">{point.year}</h2>
          <p>{point.event}</p>
        </div>
      ))}
    </div>
  );
};
