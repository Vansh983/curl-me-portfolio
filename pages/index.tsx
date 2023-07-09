import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import Navbar from "../components/layout/Navbar";
import Landing from "../components/home/Landing";
import ZoomSection from "../components/home/ZoomSection";
import ScrollAnimation from "../components/home/ScrollAnimation";
import ProjectCard from "../components/home/ProjectCard";
import { projects } from "../data/projects";
import { about } from "../data/about";

const Home: NextPage = () => {
  return (
    <div className={styles.main}>
      <Head>
        <title>Vansh Sood</title>
        <meta name="description" content="Developer" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <div className="min-h-screen">
        <ScrollAnimation>
          <div className="flex flex-col justify-center items-center py-64 text-center h-full">
            <h1 className="text-6xl font-bold text-white">
              Hi! I'm Vansh, a Creative Developer
            </h1>
            <p className="color-4 text-lg mt-4">
              Trying to bring a change by empowering international students to
              leverage Freelancing over conventional part-time
            </p>
          </div>
        </ScrollAnimation>
      </div>
      <div className="h-screen">
        <div className="flex flex-col">
          <h1 className="text-6xl font-bold text-white">{about.title}</h1>
          {about.paragraphs.map((p) => (
            <p className="text-white">{p}</p>
          ))}
        </div>
      </div>
      {/* <div className="bg-white">
        <ProjectCard data={projects} />
      </div> */}
    </div>
  );
};

export default Home;
