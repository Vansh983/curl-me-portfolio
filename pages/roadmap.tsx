import type { NextPage } from "next";
import { useState } from "react";
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

const Home: NextPage = () => {
  const [counter, setCounter] = useState(0);
  return (
    <div className={styles.main}>
      <Head>
        <title>Vansh Sood</title>
        <meta name="description" content="Developer" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <Roadmap />
    </div>
  );
};

export default Home;
