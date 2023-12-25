import { useState } from "react";
import { archive } from "../../data/archive";
import { mont } from "../../utils/fonts";

export default function ArchiveCards() {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="grid grid-cols-3 gap-4">
      {archive.map((card, index) => (
        <div
          key={index}
          className={`relative h-64 rounded-md shadow-md bg-cover bg-center my-4 ${
            hoveredId === card.id ? "card-hovered" : ""
          }`}
          style={{
            backgroundImage: `url(${card.imgSrc})`,
            height: "400px",
            boxShadow: "0px 4px 4px 500px rgba(0, 0, 0, 0.35) inset",
            zIndex: 300,
          }}
          onMouseEnter={() => setHoveredId(card.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <div
            className="absolute inset-0 flex justify-end flex-col py-8 px-2 card-content"
            style={{ bottom: 0 }}
          >
            <h2 className={`${mont.className} text-2xl font-bold text-white`}>
              {card.title}
            </h2>
            <div className="flex flex-wrap">
              {card.tags.map((tag, index) => (
                <p
                  key={index}
                  className={`text-black px-3 mt-2 py-1 mr-2 tag-transition rounded-xl text-xs bg-white ${
                    mont.className
                  }  ${hoveredId === card.id ? "show-tag" : ""}`}
                >
                  {tag}
                </p>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
