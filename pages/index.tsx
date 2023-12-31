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
import dynamic from "next/dynamic";
import ProjectsLayout from "../components/home/ProjectsLayout";
import { mont, play, bebas } from "../utils/fonts";
import Link from "next/link";
import Timeline from "../components/complex/Timeline";
import Facts from "../components/home/Facts";
import Footer from "../components/home/Footer";
import StoryGrid from "../components/home/StoryGrid";
import TimelineResponsive from "../components/complex/TimelineResponsive";
import Loading from "../components/layout/Loading";
import { navigation } from "../data/nav";
import { TypeAnimation } from "react-type-animation";

const Particles = dynamic(() => import("../components/complex/Particles"), {
  ssr: false,
});

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
        });
      }
    }, ref); // <- Scope!
    return () => ctx.revert(); // <- Cleanup!
  }, []);

  return (
    <div className={styles.main}>
      <Navbar />
      <Particles />
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
          <div
            className={`${bebas.className} max-w-6xl md:block hidden text-white mt-16 fixed`}
            style={{
              zIndex: 20,
              opacity: 0.7,
              transition: "0.5s ease-in-out",
            }}
            id="logo"
            ref={titleRef}
          >
            <h1 className="text-white text-5xl md:text-9xl">
              Hi I&apos;m Vansh,
            </h1>
            <TypeAnimation
              sequence={[
                "A Creative Developer",
                7000,
                "A Full Stack Developer",
                4000,
                "A Software Developer",
                3000,
                "A Software Architect",
                4000,
                "A Cloud Architect",
                3000,
                "A Cloud Practitioner",
                3000,
                "A Tech Entrepreneur",
                3000,
                "A Tech Founder",
                3000,
                "An Open Source Enthusiast",
                3000,
                "An Open Source Developer",
                4000,
                "A LinkedIn Top Voice",
                3000,
                "A Mobile Developer",
                4000,
                "A Web Developer",
                3000,
                "A Web Designer",
                3000,
                "A Creative Designer",
                () => {
                  console.log("Sequence completed");
                },
              ]}
              wrapper="span"
              cursor={true}
              repeat={Infinity}
              style={{ color: "#ffffff", fontSize: 120, lineHeight: "110px" }}
            />
            {/* <h1 className="text-white text-5xl md:text-8xl">
              Hi I&apos;m Vansh, <br /> a creative{" "}
              <span className="bg-gray-300 rounded-xl px-4 text-sky-600">
                developer
              </span>{" "}
            </h1> */}
            <p className="text-3xl text-gray-400 mt-4">
              I&apos;m a 2nd year Computer Science student at Dalhousie
              University. I barely manage to attend classes and try to promote
              freelancing/ solopreneurship among students. I also run a{" "}
              <span className="text-sky-600">software company</span>, build{" "}
              <span className="text-sky-600">open-source</span> programs under
              Shiftkey Labs and design{" "}
              <span className="text-sky-600">system architectures</span> for
              startups.
            </p>
          </div>

          <h1
            className={`${bebas.className} text-5xl md:text-8xl font-bold  text-white block md:hidden lg:hidden `}
            style={{
              zIndex: 20,
              opacity: 0.8,
              transition: "0.5s ease-in-out",
            }}
            id="logo"
            ref={titleResRef}
          >
            Hi! I&apos;m Vansh Sood, a creative developer and Tech Founder.
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
            I&apos;m a 2nd year Computer Science student at Dalhousie
            University. I barely manage to attend classes and try to promote
            freelancing/ solopreneurship among students. I also run a{" "}
            <span className="text-sky-400">software company</span>, build{" "}
            <span className="text-sky-400">open-source</span> programs under
            Shiftkey Labs and design{" "}
            <span className="text-sky-400">system architectures</span> for
            startups.
          </p>
        </div>
        <div
          className="scroll-to-see relative md:fixed flex"
          style={{
            bottom: 50,
            zIndex: 40,
            color: "#ffffff",
            opacity: 0.9,
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

      <div className="hidden md:block">
        <Timeline />
      </div>
      <div className="block mt-16 md:hidden">
        <TimelineResponsive />
      </div>
      <ProjectsLayout />
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
