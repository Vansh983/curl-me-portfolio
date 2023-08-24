import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { MotionPathPlugin } from "gsap/dist/MotionPathPlugin";
import styles from "../../styles/Timeline.module.css";
import { bebas, mont, play } from "../../utils/fonts";
import Image from "next/image";
import { about } from "../../data/about";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
gsap.defaults({ ease: "none" });

function TimelineResponsive() {
  return (
    <div
      className="flex flex-wrap"
      style={{ position: "relative", zIndex: 200, marginTop: -100 }}
      id="about"
    >
      {/* <h1
        className={`${play.className} text-6xl font-bold text-white mx-4 w-full`}
        style={{ opacity: 0.7 }}
      >
        My story
      </h1> */}

      <div className="content mx-4 mt-8">
        {about.map((a) => (
          <div key={a.year} className="flex flex-col my-4">
            <div className="flex items-end">
              <Image src={a.img} alt="Timeline" width={70} height={70} />
              <p className={`${bebas.className} text-5xl ml-4 text-white`}>
                {a.year}
              </p>
            </div>
            <p className={`${mont.className} text-white text-md w-full my-4`}>
              {a.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TimelineResponsive;
