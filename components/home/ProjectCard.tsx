// Components/GridCard.tsx

import { FC } from "react";
import "tailwindcss/tailwind.css";

interface CardProps {
  data: {
    imgSrc: string;
    title: string;
    pills: string[];
    url: string;
    year: string;
  }[];
}

const ProjectCard: FC<CardProps> = ({ data }) => {
  return (
    <div className="flex flex-wrap -mx-2 overflow-hidden px-32">
      {data.map((card, index) => (
        <div key={index} className="p-4 rounded-md relative group ">
          <a href={card.url} target="_blank" rel="noopener noreferrer">
            <div className="">
              <img
                src={card.imgSrc}
                alt={card.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute bottom-0 flex justify-between left-0 w-full bg-black bg-opacity-40 text-white text-center py-2 transition-opacity opacity-0 group-hover:opacity-100 px-4">
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
              </div>
              <div className="flex justify-between items-baseline mt-2">
                <h2 className="font-bold text-xl">{card.title}</h2>
                <div className="flex items-center">
                  <p className="text-lg mr-4">{card.year}</p>
                </div>
              </div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
};

export default ProjectCard;
