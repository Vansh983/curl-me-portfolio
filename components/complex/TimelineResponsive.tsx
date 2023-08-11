import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { MotionPathPlugin } from "gsap/dist/MotionPathPlugin";
import styles from "../../styles/Timeline.module.css";
import { bebas, mont, play } from "../../utils/fonts";

const about = [
  {
    year: "2018",
    img: "/assets/timeline/google.png",
    content:
      "The journey began when I became the Winner of Google Code In at the age of 17. This achievement, recognized by a fully sponsored trip to San Francisco by Google, ignited my passion for coding and catalyzed my decision to move to Canada for studying Computer Science.",
  },
  {
    year: "2020",
    img: "/assets/timeline/webcube.png",
    content:
      "My entrepreneurial endeavors started with Webcube, transforming startups' ideas into business solutions via software, managing a team of 25+ developers and six production-level projects. I've assisted over 20 startups, aiding in securing $100,000+ in funding through MVP development.",
  },
  {
    year: "2022",
    img: "/assets/timeline/dal.png",
    content:
      "I moved to Canada to study Computer Science at Dalhousie University. I soon became the Student Ambassador for Shiftkey Labs, where I began hosting enriching workshops for fellow university students. The year culminated in me joining the Emerging Wireless Technologies Lab at Dalhousie University under the esteemed guidance of Dr. Srinivas Sampalli.",
  },
  {
    year: "2023",
    img: "/assets/timeline/rocket1.png",
    content:
      "As an intern and Software Developer at Dalhousie University, I'm contributing to various research projects and building a community to help students worldwide leverage freelancing for financial independence. My goal is to spread awareness and provide the tools for students to get into freelancing, empowering them to achieve financial independence.",
  },
];

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
              <img src={a.img} width={70} />
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
