// components/StoryGrid.tsx
import { FC } from "react";

interface CardProps {
  id: number;
  title: string;
  description: string;
  img: string;
  link: string;
}

interface StoryGridProps {
  cards: CardProps[];
}

const StoryGrid: FC<StoryGridProps> = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="relative h-64 radius shadow-md bg-cover bg-center my-4 overflow-hidden"
          style={{
            backgroundImage: `url(${card.img})`,
            height: "400px",
            boxShadow: "0px 4px 4px 500px rgba(0, 0, 0, 0.25) inset",
          }}
        >
          <div className="absolute inset-0  flex flex-col justify-end py-8 px-16">
            <h2 className="text-4xl font-bold text-white">{card.title}</h2>
            {/* <p className="text-white w-5/6">{card.description}</p> */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StoryGrid;
