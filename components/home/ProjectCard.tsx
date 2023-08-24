import { FC, useRef } from "react";
import "tailwindcss/tailwind.css";
import { bebas, mont } from "../../utils/fonts";
import Link from "next/link";

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
  return (
    <div className="flex flex-wrap mt-8 md:mt-24 justify-between">
      {data.map((card, index) => (
        <div key={index} className="relative w-full md:w-[48%] my-4">
          <Link href={card.url} target="_blank">
            <img
              src={card.imgSrc}
              alt={card.title}
              className="w-full rounded"
            />
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
