import type { NextPage } from "next";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import Navbar from "../components/layout/Navbar";
import ScrollAnimation from "../components/home/ScrollAnimation";
import { about, story } from "../data/about";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { BsMouse } from "react-icons/bs";
// import Particles from "../components/complex/Particles";

import dynamic from "next/dynamic";
import ProjectsLayout from "../components/home/ProjectsLayout";
import { mont, play, bebas } from "../utils/fonts";
import Link from "next/link";
import Timeline from "../components/complex/Timeline";
import Facts from "../components/home/Facts";
import Footer from "../components/home/Footer";
import StoryGrid from "../components/home/StoryGrid";
import TimelineResponsive from "../components/complex/TimelineResponsive";
import Script from "next/script";
import Loading from "../components/layout/Loading";

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
  const titleResRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [complete, setComplete] = useState(false);
  const [vanish, setVanish] = useState(false);
  const tl = useRef();
  useEffect(() => {
    setTimeout(() => {
      setVanish(true);
    }, 5000);
    setTimeout(() => {
      setComplete(true);
    }, 6000);
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
        gsap.to(titleResRef.current, {
          ease: "power1.out",
          scrollTrigger: {
            trigger: titleResRef.current,
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
      <Navbar />
      <Particles />
      {/* <CustomCursor /> */}
      <ScrollAnimation setCounter={setCounter} />
      <div className="min-h-screen px-4 md:px-24">
        <div
          className={`flex flex-col relative py-36 h-full ${
            counter < 1 ? "fixed" : "relative"
          }`}
          style={{ zIndex: 1 }}
        >
          <h1
            className={`${play.className} text-4xl font-bold text-white fixed`}
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
            className={`${bebas.className} max-w-6xl text-6xl md:block hidden md:text-9xl mt-16 text-white fixed`}
            style={{
              zIndex: 20,
              opacity: 0.7,
              transition: "0.5s ease-in-out",
            }}
            id="logo"
            ref={titleRef}
          >
            Hi! I&apos;m Vansh,
            <br />a tech founder and creative developer.
          </h1>
          {/* <p
            className={`${mont.className} md:block hidden fixed color-4 text-lg mt-40 md:mt-48 w-[92vw] md:pl-2 md:w-1/2 text-justify`}
            style={{
              fontSize: 20,
              opacity: 0.7,
              transition: "0.8s",
              zIndex: 3,
            }}
            ref={landingParaRef}
          >
            My endeavors go beyond conventional paths, as I continue to explore
            new avenues that bridge creativity, technology, and business.
          </p> */}
          <h1
            className={`${play.className} text-6xl md:text-8xl font-bold  text-white block md:hidden lg:hidden `}
            style={{
              zIndex: 20,
              opacity: 1,
              transition: "0.5s ease-in-out",
            }}
            id="logo"
            ref={titleResRef}
          >
            Vansh Sood
          </h1>
          <p
            className={`${mont.className} md:hidden block  color-4 text-lg mt-12 w-[92vw] md:pl-2 md:w-1/2`}
            style={{
              fontSize: 20,
              opacity: 0.8,
              transition: "0.8s",
              zIndex: 3,
            }}
          >
            I&apos;m a creative developer on a mission to ignite change and
            innovation. I assist startups by building their software as a
            founding engineer, applying my skills to uplift local businesses and
            helping them resolve their tech issues. I am a problem-solver at
            heart, with a passion for reading, music, and active engagement in
            discussions surrounding tech and entrepreneurship. My endeavors go
            beyond conventional paths, as I continue to explore new avenues that
            bridge creativity, technology, and business.
          </p>
        </div>
        <div
          className="scroll-to-see relative md:fixed flex"
          style={{
            bottom: 50,
            zIndex: 40,
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
      <div className="hidden md:block">
        <Timeline />
      </div>
      <div className="block mt-16 md:hidden">
        <TimelineResponsive />
      </div>

      {/* <div className="h-[1000px]></div> */}
      <ProjectsLayout />
      {/* <Facts /> */}
      <div className="flex md:hidden flex-col relative px-2 py-24">
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
      {!complete && (
        <div
          style={{
            transition: "1s",
            opacity: vanish ? 0 : 1,
          }}
        >
          <Loading />
        </div>
      )}
    </div>
  );
};

export default Home;
