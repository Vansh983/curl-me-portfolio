import Link from "next/link";
import Facts from "../components/home/Facts";
import Footer from "../components/home/Footer";
import ProjectCard from "../components/home/ProjectCard";
import ProjectsLayout from "../components/home/ProjectsLayout";
import StoryGrid from "../components/home/StoryGrid";
import { story } from "../data/about";
import { projects } from "../data/projects";
import { bebas, mont, play } from "../utils/fonts";
import TimelineResponsive from "../components/complex/TimelineResponsive";
import Navbar from "../components/layout/Navbar";
import Image from "next/image";

export default function legacy() {
  return (
    <div className="bg-dark min-h-screen px-4 pt-16 md:px-8">
      <Navbar />
      <h1
        className={`${bebas.className} text-4xl font-bold text-white fixed`}
        style={{
          zIndex: 20,
          opacity: 0.7,
          transition: "1s ease-in-out",
          top: "1rem",
        }}
        id="logo"
      >
        Vansh Sood
      </h1>
      <div className="relative px-24 pt-24" style={{ zIndex: 1 }}>
        {/* <div className="flex"> */}
        <h1
          className={`${bebas.className} max-w-6xl text-9xl text-white`}
          style={{
            zIndex: 20,
            opacity: 0.7,
            transition: "0.5s ease-in-out",
          }}
          id="logo"
        >
          I&apos;m a creative developer and tech founder.
        </h1>
        {/* <div className="w-1/2">
            <Image src="/assets/story/vansh.png" width={500} height={500} />
          </div> */}
        {/* </div> */}
        <div className="flex flex-col">
          <p className="text-2xl text-gray-400 mt-4">
            I&apos;m a 2nd year Computer Science student at the University of
            Waterloo. I&apos;m passionate about building products that make a
            difference in people&apos;s lives. I&apos;m also a huge fan of{" "}
            <span className="text-sky-600">open-source</span> and{" "}
            <span className="text-sky-600">design</span>.
          </p>
          <p className="text-2xl text-gray-400 mt-4">
            I&apos;m a 2nd year Computer Science student at the University of
            Waterloo. I&apos;m passionate about building products that make a
            difference in people&apos;s lives. I&apos;m also a huge fan of{" "}
            <span className="text-sky-600">open-source</span> and{" "}
            <span className="text-sky-600">design</span>. I&apos;m a 2nd year
            Computer Science student at the University of Waterloo. I&apos;m
            passionate about building products that make a difference in
            people&apos;s lives. I&apos;m also a huge fan of{" "}
            <span className="text-sky-600">open-source</span> and{" "}
            <span className="text-sky-600">design</span>.
          </p>
        </div>
        <TimelineResponsive />
        <div className="mt-24 mb-8">
          <div className="flex flex-row justify-between align-center items-center">
            <h1 className={`text-6xl font-bold text-white ${bebas.className}`}>
              Overview of my Work
            </h1>
            <Link href="/archive">
              <p
                className={`text-lg text-white font-bold ${mont.className} border-2 border-white px-4 h-auto ml-4 py-2 rounded-md align-center`}
              >
                View Archive
              </p>
            </Link>
          </div>
          <p className={`${mont.className} text-2xl text-gray-400 mt-4`}>
            I&apos;m a 2nd year Computer Science student at the University of
            Waterloo. I&apos;m passionate about building products that make a
            difference in people&apos;s lives. I&apos;m also a huge fan of{" "}
            <span className="text-sky-600">open-source</span> and{" "}
            <span className="text-sky-600">design</span>.
          </p>
        </div>
        <ProjectCard data={projects} />
        <div className="flex md:hidden flex-col relative py-24">
          <h1
            className={`${play.className} text-5xl md:text-6xl font-bold text-white`}
          >
            Some things i like to flaunt
          </h1>
          <div className="py-4">
            <StoryGrid cards={story} />
          </div>
        </div>

        <Footer />
        <div className="hidden md:block" id="story">
          <Facts />
        </div>
      </div>
    </div>
  );
}
