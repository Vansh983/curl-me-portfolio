import type { NextPage } from "next";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
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
import { BsMouse } from "react-icons/bs";
// import Particles from "../components/complex/Particles";

import dynamic from "next/dynamic";
import ProjectsLayout from "../components/home/ProjectsLayout";
import { mont } from "../utils/fonts";
import Link from "next/link";
import FuckBall from "../components/complex/FuckBall";
import Timeline from "../components/complex/Timeline";
import Facts from "../components/home/Facts";
import Footer from "../components/home/Footer";

const Particles = dynamic(() => import("../components/complex/Particles"), {
  ssr: false,
});

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const navigation = [
  { name: "Linkedin", href: "https://www.linkedin.com/in/vanshsood/" },
  { name: "Github", href: "https://github.com/Vansh983" },
  { name: "Mail", href: "mailto:vanshsood@dal.ca" },
  { name: "Blog", href: "https://blog.vanshsood.com/" },
  {
    name: "Resume",
    href: "https://vanshsood.com/assets/Resume_Vansh_Sood.pdf",
  },
];

const Home: NextPage = () => {
  const [counter, setCounter] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const landingParaRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [vanish, setVanish] = useState(false);
  const tl = useRef();
  useLayoutEffect(() => {
    const ctx = gsap.context((self) => {
      // .from(box, { y: 150, opacity: 0 })

      if (logoRef.current) {
        gsap.to(logoRef.current, {
          ease: "power3.out",
          scrollTrigger: {
            trigger: logoRef.current,
            start: 10,
            end: 10,
            scrub: true,
          },
          // left: 10,
          opacity: 0.7,
          // background: "#eee",
        });
        gsap.to(landingParaRef.current, {
          ease: "power3.out",
          scrollTrigger: {
            trigger: landingParaRef.current,
            start: 50,
            end: 50,
            scrub: true,
          },
          top: 150,
          // left: 10,
          opacity: 0,
          visibility: "hidden",
          // background: "#eee",
        });
        gsap.to(titleRef.current, {
          ease: "power1.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: 10,
            end: 10,
            scrub: true,
          },
          top: 100,
          // left: 10,
          opacity: 0,
          visibility: "hidden",
          // background: "#eee",
        });
        gsap.to(ref.current, {
          duration: 0.5,
          ease: "power3.out",
          top: 0,
          opacity: 1,
          scrollTrigger: {
            trigger: ref.current,
            start: 100,
            end: 200,
            scrub: true,
            toggleActions: "play none none reverse",
          },
          // left: 10,
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
    }, ref); // <- Scope!
    return () => ctx.revert(); // <- Cleanup!
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
          className={`flex flex-col relative py-36 h-full ${
            counter < 1 ? "fixed" : "relative"
          }`}
          style={{ zIndex: 1 }}
        >
          <h1
            className={`text-4xl font-bold text-white fixed`}
            style={{
              zIndex: 20,
              opacity: 0,
              transition: "1s ease-in-out",
              top: 15,
            }}
            id="logo"
            ref={logoRef}
          >
            Vansh Sood
          </h1>
          <h1
            className={`text-8xl font-bold mt-16 text-white fixed`}
            style={{
              zIndex: 20,
              opacity: 0.7,
              transition: "0.5s ease-in-out",
            }}
            id="logo"
            ref={titleRef}
          >
            Vansh Sood
          </h1>
          <p
            className={`${mont.className} fixed color-4 text-lg mt-48 pl-2 w-1/2 text-justify`}
            style={{
              fontSize: 20,
              opacity: 0.7,
              transition: "0.8s",
              zIndex: 3,
            }}
            ref={landingParaRef}
          >
            Trying to bring a change by empowering international students to
            leverage Freelancing over conventional part-time Driven by a passion
            for technology and entrepreneurship, I am a problem-solver at heart.
            I'm an avid reader, a music enthusiast, and an active participant in
            discussions around tech and entrepreneurship.
          </p>
        </div>
        <div
          className="scroll-to-see fixed flex"
          style={{
            bottom: 50,
            left: 100,
            zIndex: 4000,
            color: "#ffffff",
            opacity: 0.7,
            alignItems: "center",
          }}
        >
          <BsMouse style={{ fontSize: 40 }} />
          <span
            className={`text-sm font-semibold leading-6 text-gray-300 uppercase ml-6 ${mont.className}`}
          >
            Scroll to know about me
          </span>
        </div>
        <div
          className="socio-links fixed"
          style={{ bottom: 50, right: 50, zIndex: 4000 }}
        >
          <div className="hidden lg:flex lg:gap-x-12 justify-end">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} target="_blank">
                <span
                  className={`text-sm font-semibold leading-6 text-gray-300 uppercase ${mont.className}`}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      {/* <div className="h-screen relative px-24" style={{ zIndex: 1 }}>
        <div className="flex flex-col">
          <h1 className="text-6xl font-bold text-white">{about.title}</h1>
         
        </div>
      </div> */}
      <Timeline />

      {/* <div className="h-[1000px]></div> */}
      <ProjectsLayout />
      {/* <Facts /> */}
      {/* <div className="flex flex-col relative px-48 py-24">
        <h1 className="text-7xl text-white">Empower</h1>
        <div className="py-4">
          <div
            className="relative h-64 radius shadow-md bg-cover bg-center my-4 overflow-hidden"
            style={{
              backgroundImage: `url(${story[0].img})`,
              height: "400px",
              boxShadow: "0px 4px 4px 500px rgba(0, 0, 0, 0.25) inset",
            }}
          >
            <div className="absolute inset-0  flex flex-col justify-end py-8 px-16">
              <h2 className="text-4xl font-bold text-white">
                {story[0].title}
              </h2>
              <p className="text-white w-5/6">{story[0].description}</p>
            </div>
          </div>
          <StoryGrid cards={story.slice(1)} />
        </div>
      </div> */}
      <Facts />
      {/* <Footer /> */}
    </div>
  );
};

export default Home;
