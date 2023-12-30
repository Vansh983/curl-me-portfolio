import { useEffect, useLayoutEffect, useRef } from "react";
import ProjectCard from "./ProjectCard";
import { projects } from "../../data/projects";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { play } from "../../utils/fonts";
gsap.registerPlugin(ScrollTrigger);

function ProjectsLayout() {
  const ref = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      if (headingRef.current) {
        gsap.to(headingRef.current, {
          delay: 0.5,
          ease: "power3.out",
          marginLeft: -2000,
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    }, ref);
    return () => ctx.revert();
  });

  return (
    <div
      className="flex flex-col bg-[#000000e0] relative w-full px-2 md:px-24 py-12 md:py-24"
      style={{ zIndex: 40 }}
      id="projects"
      ref={ref}
    >
      <div className="flex justify-between mb-16">
        <div className="w-3/4">
          <h1
            className={`${play.className} text-5xl md:text-7xl font-bold text-white  absolute`}
            style={{ zIndex: 100, whiteSpace: "nowrap" }}
            ref={headingRef}
          >
            Recent Work · Recent Work · Recent Work · Recent Work · Recent Work
            · Recent Work · Recent Work · Recent Work · Recent Work · Recent
            Work · Recent Work · Recent Work · Recent Work · Recent Work ·
            Recent Work · Recent Work · Recent Work
          </h1>
          {/* <p className="color-3 text-lg mt-4">
            Trying to bring a change by empowering international students to
            leverage Freelancing over conventional part-time
          </p> */}
        </div>
        {/* <div className="button">See all projects</div> */}
      </div>
      <div className="mt-8 md:mt-24">
        <ProjectCard data={projects} />
      </div>
    </div>
  );
}

export default ProjectsLayout;
