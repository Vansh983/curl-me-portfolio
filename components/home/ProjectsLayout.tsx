import { useEffect, useRef } from "react";
import ProjectCard from "./ProjectCard";
import { projects } from "../../data/projects";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

function ProjectsLayout() {
  const ref = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (headingRef.current) {
      gsap.to(headingRef.current, {
        delay: 0.5,
        ease: "power3.out",
        marginLeft: -2000,
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "top -200%",
          scrub: true,
        },
      });
    }
    // if (ref.current) {
    //   gsap.to(ref.current, {
    //     // y: 100,
    //     ease: "power3.out",
    //     // delay: 1,
    //     skewY: -6,
    //     // stagger: {
    //     //   amount: 0.3,
    //     // },
    //     scrollTrigger: {
    //       trigger: ref.current,
    //       start: "top center",
    //       end: "bottom center",
    //       scrub: true,
    //       markers: true,
    //     },
    //   });
    // }
  }, []);
  return (
    <div
      className="flex flex-col bg-[#000000e0] relative w-full px-24 py-24"
      style={{ zIndex: 40 }}
      id="projects"
      ref={ref}
    >
      <div className="flex justify-between mb-16">
        <div className="w-3/4">
          <h1
            className={`text-7xl font-bold text-white  absolute`}
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
      <ProjectCard data={projects} />
    </div>
  );
}

export default ProjectsLayout;
