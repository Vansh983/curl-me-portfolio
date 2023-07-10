import type { NextPage } from "next";
import { useState, useEffect, useRef } from "react";
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
import { Roadmap } from "../components/about/Roadmap";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const Home: NextPage = () => {
  const [counter, setCounter] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      gsap.from(ref.current.children, {
        duration: 0.5,
        y: 100,
        stagger: 0.2,
        opacity: 0,
        delay: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: 550,
          // end: "bottom center",
          scrub: true,
        },
        zIndex: 2,
        x: 0,
      });
    }
    // if (ref2.current) {
    //   gsap.from(ref2.current, {
    //     duration: 0.5,
    //     stagger: 0.2,
    //     y: 100,
    //     delay: 0.5,
    //     ease: "power3.out",
    //     scrollTrigger: {
    //       trigger: ref2.current,
    //       start: 850,
    //       // end: "bottom center",
    //       scrub: true,
    //     },
    //   });
    // }
  }, []);

  return (
    <div className={styles.main}>
      <Head>
        <title>Vansh Sood</title>
        <meta name="description" content="Developer" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <ScrollAnimation setCounter={setCounter} />
      <div className="min-h-screen px-24">
        <div
          className={`flex flex-col relative justify-center py-64 h-full ${
            counter < 1 ? "fixed" : "relative"
          }`}
          style={{ zIndex: 1 }}
        >
          <h1 className={`text-6xl font-bold text-white `}>
            Hi! I'm Vansh, a Creative Developer
          </h1>
          <p className="color-4 text-lg mt-4">
            Trying to bring a change by empowering international students to
            leverage Freelancing over conventional part-time
          </p>
        </div>
      </div>
      {/* <div className="h-screen relative px-24" style={{ zIndex: 1 }}>
        <div className="flex flex-col">
          <h1 className="text-6xl font-bold text-white">{about.title}</h1>
         
        </div>
      </div> */}
      <div className="flex h-screen relative" style={{ zIndex: 2 }}>
        <div className="t-0 l-0 px-24 fixed" ref={ref2} style={{ zIndex: 3 }}>
          {/* <h1 className={`text-6xl font-bold text-white`}>About Me</h1> */}
          <div className="flex flex-col w-1/2" ref={ref}>
            {about.paragraphs.map((p) => (
              <p className="text-white">{p}</p>
            ))}
          </div>
        </div>
        <div className={`fixed t-0`} style={{ right: 100 }}>
          <Roadmap />
        </div>
      </div>
      {/* <div className="h-[1000px]"></div> */}
      <div
        className="flex flex-col bg-gray-100 w-full radius relative p-24"
        style={{ zIndex: 3 }}
      >
        <h1 className={`text-6xl font-bold text-black `}>Recent Work</h1>
        <p className="color-3 text-lg mt-4">
          Trying to bring a change by empowering international students to
          leverage Freelancing over conventional part-time
        </p>
        <ProjectCard data={projects} />
      </div>
    </div>
  );
};

export default Home;
