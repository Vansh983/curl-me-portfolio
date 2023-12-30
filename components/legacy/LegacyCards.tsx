import React from "react";
import { about } from "../../data/about";

export default function LegacyCards() {
  return (
    <div className="flex">
      {about.map((card, index) => (
        <div key={index} className="relative w-full md:w-[48%] my-4">
          <img src={card.img} alt={card.year} className="w-full rounded" />
          <div className="flex justify-between mt-2 flex-wrap">
            <h2
              className={`font-bold text-4xl md:text-5xl my-8 w-full md:w-3/4 ${card.font}`}
              style={{
                background: `-webkit-linear-gradient(${card.grad})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <span>{card.year}</span>
            </h2>
          </div>
        </div>
      ))}
    </div>
  );
}
