// components/StoryGrid.tsx
import { FC, useEffect, useRef } from "react";
import Bridge from "../../data/savages/bridge/bridge";
import Sun from "../../data/savages/bridge/sun";
import Baadal from "../../data/savages/bridge/baadal";
import BoatRight from "../../data/savages/bridge/boat-right";
import BoatLeft from "../../data/savages/bridge/boat-left";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Curtain from "../../data/savages/podium/curtain";
import SanFran from "../about/SanFran";

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

const Storyline: FC<StoryGridProps> = () => {
  return <SanFran />;
};

export default Storyline;
