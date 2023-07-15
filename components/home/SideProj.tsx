// Components/GridCard.tsx

import { FC } from "react";
import "tailwindcss/tailwind.css";

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

const SideProj: FC<CardProps> = ({ data }) => {
  return (
    <div className="flex flex-wrap mt-8 justify-between">
      {data.map((card, index) => (
        <div key={index} className="relative group w-[23%] my-4">
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
            <div className="flex flex-col mt-2">
              <h2
                className="font-bold text-xl my-8 w-full"
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
                  style={
                    card.grad[1] === "#ffffff"
                      ? {
                          color: "#000",
                          background: `-webkit-linear-gradient(${card.grad})`,
                        }
                      : {
                          background: `-webkit-linear-gradient(${card.grad})`,
                        }
                  }
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

export default SideProj;
