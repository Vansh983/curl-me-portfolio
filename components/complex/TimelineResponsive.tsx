import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { MotionPathPlugin } from "gsap/dist/MotionPathPlugin";
import styles from "../../styles/Timeline.module.css";
import { bebas, play } from "../../utils/fonts";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
gsap.defaults({ ease: "none" });

function TimelineResponsive() {
  useEffect(() => {
    const pulses = gsap
      .timeline({
        defaults: {
          duration: 0.05,
          autoAlpha: 1,
          scale: 2,
          transformOrigin: "center",
          ease: "elastic(2.5, 1)",
          visibility: "visible",
        },
      })
      .to(".ballR02, .textR01", {}, 0.1)
      .to(".ballR03, .textR02", {}, 0.28)
      .to(".ballR04, .textR03", {}, 0.45)
      .to(".ballR05, .textR04", {}, 0.64);

    const main = gsap
      .timeline({
        scrollTrigger: {
          trigger: "#svg1",
          scrub: true,
          start: "top center",
          end: "bottom center",
        },
      })
      .to(".ballR01", { duration: 0.01, autoAlpha: 1 })
      .from(".theLineR", { drawSVG: 0 }, 0)
      .add(pulses, 0);
  }, []);
  return (
    <div
      style={{ position: "relative", zIndex: 200, marginTop: -100 }}
      id="about"
    >
      <h1
        className={`${play.className} text-6xl font-bold text-white mx-4`}
        style={{ opacity: 0.7 }}
      >
        My story
      </h1>
      <svg id="svg1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1200">
        <path className="line01 line" d="M 10 200  600 200"></path>
        <path className="line02 line" d="M 10 400  600 400"></path>
        <path className="line03 line" d="M 10 600  600 600"></path>
        <path className="line04 line" d="M 10 800  600 800"></path>
        <path className="line05 line" d="M 10 1000  600 1000"></path>
        <text
          className={`textR01 ${bebas.className}`}
          style={{ fill: "#ffffff" }}
          x="30"
          y="190"
        >
          2018
        </text>

        <text
          className={`textR02 ${bebas.className}`}
          style={{ fill: "#ffffff" }}
          x="30"
          y="470"
        >
          2020
        </text>
        <text
          className={`textR03 ${bebas.className}`}
          style={{ fill: "#ffffff" }}
          x="30"
          y="720"
        >
          2022
        </text>
        <text
          className={`textR04 ${bebas.className}`}
          style={{ fill: "#ffffff" }}
          x="30"
          y="990"
        >
          2023
        </text>
        <image href="/assets/timeline/gci.png" x="330" y="120" width="250" />
        <image href="/assets/timeline/2020.png" x="330" y="480" width="250" />
        <line
          className="theLineR"
          x1="150"
          y1="120"
          x2="150"
          y2="1200"
          fill="none"
          stroke="white"
          strokeWidth="5px"
        />
        {/* <circle
          className={`${styles.ballR} ballR01`}
          r="20"
          cx="50"
          cy="100"
        ></circle> */}
        {/* <circle
          className={`${styles.ballR} ballR02`}
          r="20"
          cx="278"
          cy="201"
        ></circle> */}
        <image
          href="/assets/timeline/google.png"
          className={`${styles.ballR} ballR02`}
          x="130" // Adjust these coordinates to position the image
          y="181"
          width="40" // And these to scale the image
          height="40"
        />
        <image
          href="/assets/timeline/webcube.png"
          className={`${styles.ballR} ballR03`}
          x="130"
          y="481"
          width="40" // And these to scale the image
          height="40"
        ></image>
        <image
          href="/assets/timeline/dal.png"
          className={`${styles.ballR} ballR04`}
          x="130"
          y="721"
          width="40" // And these to scale the image
          height="40"
        ></image>
        <image
          href="/assets/timeline/rocket1.png"
          className={`${styles.ballR} ballR05`}
          x="130"
          y="971"
          width="40" // And these to scale the image
          height="40"
        ></image>
      </svg>
    </div>
  );
}

export default TimelineResponsive;
