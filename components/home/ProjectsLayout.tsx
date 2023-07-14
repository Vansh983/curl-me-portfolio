import { useEffect, useRef } from "react";
import ProjectCard from "./ProjectCard";
import { projects } from "../../data/projects";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

function ProjectsLayout() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      gsap.from(ref.current.children, {
        duration: 0.5,
        stagger: 0.2,
        delay: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 40%",
          end: "bottom bottom",
          scrub: true,
        },
        position: "fixed",
      });
    }
  }, []);
  return (
    <div
      className="flex flex-col bg-[#000000e0] relative w-full px-24 radius py-24 mt-64"
      style={{ zIndex: 4 }}
    >
      <div className="flex justify-between">
        <div className="w-3/4">
          <h1 className={`text-7xl font-bold text-white `}>Recent Work</h1>
          <p className="color-3 text-lg mt-4">
            Trying to bring a change by empowering international students to
            leverage Freelancing over conventional part-time
          </p>
        </div>
        <div className="button">See all projects</div>
      </div>
      <ProjectCard data={projects} />
    </div>
  );
}

export default ProjectsLayout;
