import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";
import { story } from "../../data/about";
import { mont, play } from "../../utils/fonts";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function Scene() {
  const componentRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const pixelsPause = 300;
      let panels = gsap.utils.toArray(sliderRef.current.children);
      gsap.to(panels, {
        xPercent: -100 * (panels.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: sliderRef.current,
          scrub: 1,
          snap: 1 / (panels.length - 1),
          start: `top+=${pixelsPause} top`,
          end: () => "+=" + window.innerWidth * panels.length,
        },
      });
      ScrollTrigger.create({
        trigger: sliderRef.current,
        end: () => "+=" + (window.innerWidth * panels.length + pixelsPause),
        pin: true,
      });
    }, componentRef);
    return () => ctx.revert();
  });

  return (
    <div ref={componentRef} id="exp">
      <div ref={sliderRef} className="containerRR">
        <h1
          className="text-7xl text-white ml-16 font-bold"
          style={{ width: "500px" }}
        >
          Some things I like to flaunt
        </h1>
        {story.map((card, index) => (
          <div
            key={index}
            className="relative rounded-md shadow-md bg-cover bg-center my-4 panelR mx-8"
            style={{
              backgroundImage: `url(${card.img})`,
              boxShadow: "0px 4px 4px 500px rgba(0, 0, 0, 0.25) inset",
              zIndex: 300,
            }}
          >
            <div className="absolute inset-0 flex flex-col justify-end py-8 px-16 ">
              <h2 className={`text-5xl font-bold text-white ${mont.className}`}>
                {card.title}
              </h2>
              {/* <p className={`text-white w-5/6 ${mont.className}`}>
                {card.description}
              </p> */}
            </div>
          </div>
        ))}
        <div
          className="relative ml-4 panelR flex flex-col justify-center"
          style={{ zIndex: 30 }}
        >
          <h1 className="text-7xl text-white ml-6 font-bold">
            Enjoyed my work?
          </h1>
          <p className={`text-3xl my-8 text-white ml-6 ${mont.className}`}>
            Lets work together! Drop a{" "}
            <Link href="https://www.linkedin.com/in/vanshsood/">
              <span style={{ cursor: "pointer", textDecoration: "underline" }}>
                text
              </span>
            </Link>
            , schedule a quick{" "}
            <Link href="topmate.io/vansh_sood">
              <span style={{ cursor: "pointer", textDecoration: "underline" }}>
                call
              </span>
            </Link>{" "}
            or send an{" "}
            <Link href="mailto:vanshsood@dal.ca">
              <span style={{ cursor: "pointer", textDecoration: "underline" }}>
                email
              </span>
            </Link>{" "}
            - whatever works best!
          </p>
        </div>
      </div>
    </div>
  );
}
