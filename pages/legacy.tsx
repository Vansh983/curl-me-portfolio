import Link from "next/link";
import Facts from "../components/home/Facts";
import Footer from "../components/home/Footer";
import ProjectCard from "../components/home/ProjectCard";
import ProjectsLayout from "../components/home/ProjectsLayout";
import StoryGrid from "../components/home/StoryGrid";
import { story } from "../data/about";
import { projects } from "../data/projects";
import { inter, mont, play } from "../utils/fonts";
import LegacyCards from "../components/legacy/LegacyCards";

export default function legacy() {
  return (
    <div className="bg-dark min-h-screen px-4 md:px-16">
      <div className="relative px-24" style={{ zIndex: 1 }}>
        <div className="flex flex-col">
          <h1 className="text-6xl font-bold text-white">About Me</h1>
          <p className="text-2xl text-gray-400 mt-4">
            I'm a 2nd year Computer Science student at the University of
            Waterloo. I'm passionate about building products that make a
            difference in people's lives. I'm also a huge fan of{" "}
            <span className="text-sky-600">open-source</span> and{" "}
            <span className="text-sky-600">design</span>.
          </p>
        </div>
        <LegacyCards />
        <div className="my-8">
          <div className="flex flex-row justify-between align-center items-center">
            <h1 className={`text-6xl font-bold text-white ${play.className}`}>
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
            I'm a 2nd year Computer Science student at the University of
            Waterloo. I'm passionate about building products that make a
            difference in people's lives. I'm also a huge fan of{" "}
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
