import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { MotionPathPlugin } from "gsap/dist/MotionPathPlugin";
import styles from "../../styles/Timeline.module.css";
import { bebas, mont } from "../../utils/fonts";
import { about } from "../../data/about";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
gsap.defaults({ ease: "none" });

function Timeline() {
  useEffect(() => {
    const pulses = gsap
      .timeline({
        defaults: {
          duration: 0.05,
          autoAlpha: 1,
          scale: 2,
          transformOrigin: "center",
          ease: "power3.out",
          visibility: "visible",
        },
      })
      .to(".ball02, .text01", {}, 0.2)
      .to(".ball03, .text02", {}, 0.38)
      .to(".ball04, .text03", {}, 0.55)
      .to(".ball05, .text04", {}, 0.74);

    const main = gsap
      .timeline({
        defaults: { duration: 1 },
        scrollTrigger: {
          trigger: "#svg",
          scrub: true,
          start: "top center",
          end: "bottom center",
        },
      })
      .to(".ball01", { duration: 0.01, autoAlpha: 1 })
      .from(".theLine", { drawSVG: 0 }, 0)
      .to(
        ".ball01",
        {
          motionPath: {
            path: ".theLine",
            align: ".theLine",
            alignOrigin: [0.5, 0.5],
          },
        },
        0
      )
      .add(pulses, 0);
  }, []);

  return (
    <div style={{ position: "relative", zIndex: 200 }} id="about">
      <div className="paras">
        {about.map((ab, index) => (
          <p
            style={{
              color: "#fff",
              width: ab.width ? ab.width : "550px",
              fontSize: "1.5rem",
              position: "absolute",
              right: ab.left,
              top: ab.top,
            }}
            className={mont.className}
            key={index}
          >
            {ab.content}
          </p>
        ))}
      </div>
      <svg id="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1200">
        <path className="line01 line" d="M 10 200  600 200"></path>
        <path className="line02 line" d="M 10 400  600 400"></path>
        <path className="line03 line" d="M 10 600  600 600"></path>
        <path className="line04 line" d="M 10 800  600 800"></path>
        <path className="line05 line" d="M 10 1000  600 1000"></path>
        <text
          className={`text01 ${bebas.className}`}
          style={{ fill: "#ffffff" }}
          x="30"
          y="190"
        >
          2018
        </text>

        <text
          className={`text02 ${bebas.className}`}
          style={{ fill: "#ffffff" }}
          x="30"
          y="470"
        >
          2020
        </text>
        <text
          className={`text03 ${bebas.className}`}
          style={{ fill: "#ffffff" }}
          x="30"
          y="720"
        >
          2022
        </text>
        <text
          className={`text04 ${bebas.className}`}
          style={{ fill: "#ffffff" }}
          x="30"
          y="990"
        >
          2023
        </text>
        {/* <image href="/assets/timeline/2018.png" x="330" y="120" width="250" />
        <image href="/assets/timeline/2020.png" x="330" y="470" width="250" />
        <image href="/assets/timeline/2022.png" x="230" y="680" width="300" />
        <image href="/assets/timeline/2023.png" x="330" y="900" width="250" /> */}
        <path
          className="theLine"
          d="M -5,0
               Q 450 230 300 450 
               T 130 750
               Q 100 850 300 1000
               T 150 1200"
          fill="none"
          stroke="white"
          strokeWidth="7px"
        />

        <circle
          className={`${styles.ball} ball01`}
          r="20"
          cx="50"
          cy="100"
        ></circle>
        {/* <circle
          className={`${styles.ball} ball02`}
          r="20"
          cx="278"
          cy="201"
        ></circle> */}
        <image
          href="/assets/timeline/google.png"
          className={`${styles.ball} ball02`}
          x="258" // Adjust these coordinates to position the image
          y="181"
          width="40" // And these to scale the image
          height="40"
        />
        <image
          href="/assets/timeline/webcube.png"
          className={`${styles.ball} ball03`}
          x="247"
          y="481"
          width="40" // And these to scale the image
          height="40"
        ></image>
        <image
          href="/assets/timeline/dal.png"
          className={`${styles.ball} ball04`}
          x="120"
          y="721"
          width="40" // And these to scale the image
          height="40"
        ></image>
        <image
          href="/assets/timeline/rocket1.png"
          className={`${styles.ball} ball05`}
          x="260"
          y="971"
          width="40" // And these to scale the image
          height="40"
        ></image>
      </svg>
    </div>
  );
}

export default Timeline;
