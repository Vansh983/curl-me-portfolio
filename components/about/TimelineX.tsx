import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
  const RoadmapElement = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathPoints, setPathPoints] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (RoadmapElement.current && pathRef.current) {
      const pathLength = pathRef.current.getTotalLength();
      const points = Array.from({ length: RoadmapData.length }).map((_, i) => {
        const point = pathRef.current!.getPointAtLength(
          (pathLength / (RoadmapData.length - 1)) * i
        );
        return { x: point.x, y: point.y };
      });
      setPathPoints(points);
    }
  }, []);

  useEffect(() => {
    gsap.utils.toArray(".Roadmap-text").forEach((el, i) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 1500 + i * 150,
          toggleActions: "play none none reverse",
          // scrub: true,
        },
        y: "+=20",
        opacity: 0,
        duration: 0.5,
      });
    });
  }, [pathPoints]);

  return (
    <>
      <h1 className={`text-6xl font-bold text-white`}>About Me</h1>
      <p className="color-4 text-lg mt-4">
        Trying to bring a change by empowering international students to
        leverage Freelancing over conventional part-time
      </p>
      <svg
        ref={RoadmapElement}
        viewBox="0 0 800 600"
        // className="fixed"
        style={{ zIndex: 2 }}
      >
        <path
          ref={pathRef}
          d="M10,300 H790"
          fill="transparent"
          stroke="white"
        />
        {pathPoints &&
          pathPoints.map((point, index) => (
            <g key={index} transform={`translate(${point.x}, ${point.y})`}>
              <circle cx="0" cy="0" r="5" fill="white" />
              <g className="Roadmap-text">
                <text
                  x="10"
                  y={index % 2 === 0 ? "-10" : "30"}
                  fontSize="14"
                  fill="white"
                >
                  {RoadmapData[index].year}
                </text>
                <text
                  x="10"
                  y={index % 2 === 0 ? "-5" : "45"}
                  fontSize="12"
                  fill="white"
                >
                  {RoadmapData[index].event}
                </text>
              </g>
            </g>
          ))}
      </svg>
    </>
  );
};
