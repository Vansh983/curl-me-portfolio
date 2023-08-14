import { FC, useRef } from "react";
import "tailwindcss/tailwind.css";
import { bebas, mont } from "../../utils/fonts";
import Link from "next/link";
import Image from "next/image";

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

  return (
    <div className="flex flex-wrap mt-8 md:mt-24 justify-between" ref={ref}>
      {data.map((card, index) => (
        <div
          key={index}
          className="relative group card w-full md:w-[48%] my-4"
          style={{ opacity: 1 }}
        >
          <Link href={card.url} target="_blank">
            <div className="">
              <Image
                src={card.imgSrc}
                alt={card.title}
                width={500}
                height={500}
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
            <div className="flex justify-between mt-2 flex-wrap">
              <h2
                className={`font-bold text-4xl md:text-5xl my-8 w-full md:w-3/4 ${bebas.className}`}
                style={{
                  background: `-webkit-linear-gradient(${card.grad})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                <span>{card.title}</span>
              </h2>
              <div className="md:flex items-center hidden">
                <button
                  type="button"
                  className={`text-white font-bold py-2 px-4 rounded ${mont.className}`}
                  style={{
                    background: `-webkit-linear-gradient(${card.grad})`,
                  }}
                >
                  View
                </button>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default ProjectCard;
