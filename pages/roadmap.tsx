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
import { projects, code_proj } from "../data/projects";
import { about, story } from "../data/about";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
// import Particles from "../components/complex/Particles";

import dynamic from "next/dynamic";
import SideProj from "../components/home/SideProj";
import StoryGrid from "../components/home/StoryGrid";
import CustomCursor from "../components/layout/CustomCursor";
import Storyline from "../components/home/Storyline";

const Particles = dynamic(() => import("../components/complex/Particles"), {
  ssr: false,
});

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const Home: NextPage = () => {
  const [counter, setCounter] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [vanish, setVanish] = useState(false);
  useEffect(() => {
    if (ref.current) {
      gsap.from(ref.current.children, {
        duration: 0.5,
        y: 50,
        stagger: 0.2,
        opacity: 0,
        delay: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: 550,
          end: "bottom bottom",
          scrub: true,
        },
        zIndex: 2,
        x: 0,
        onComplete: () => setVanish(true),
      });
    }
    if (logoRef.current) {
      gsap.to(logoRef.current, {
        duration: 0.5,
        stagger: 0.2,
        delay: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: 0,
          // end: "bottom center",
          scrub: true,
        },
        top: 15,
        // left: 10,
        fontSize: 40,
        // background: "#eee",
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
        <meta name="description" content="developer" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <Particles />
      {/* <CustomCursor /> */}
      <ScrollAnimation setCounter={setCounter} />
      <div className="min-h-screen px-24">
        <div
          className={`flex flex-col relative py-24 h-full ${
            counter < 1 ? "fixed" : "relative"
          }`}
          style={{ zIndex: 1 }}
        >
          <h1
            className={`text-6xl font-bold text-white fixed`}
            style={{ zIndex: 20 }}
            ref={logoRef}
          >
            Hi! I'm Vansh
          </h1>
          <p className="color-4 text-lg mt-24">
            Trying to bring a change by empowering international students to
            leverage Freelancing over conventional part-time <br />
            Driven by a passion for technology and entrepreneurship, I am a
            problem-solver at heart. Leveraging my technical skills, I strive to
            conceptualize solutions that can make a tangible difference. I'm an
            avid reader, a music enthusiast, and an active participant in
            discussions around tech and entrepreneurship.
          </p>
        </div>
      </div>
      {/* <div className="h-screen relative px-24" style={{ zIndex: 1 }}>
        <div className="flex flex-col">
          <h1 className="text-6xl font-bold text-white">{about.title}</h1>
         
        </div>
      </div> */}
      <div className={`flex`} style={{ zIndex: 2 }}>
        <Storyline />
      </div>
      <div className="h-[10000px]"></div>
    </div>
  );
};

export default Home;
