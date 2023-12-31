import React from "react";
import { mont, play } from "../../utils/fonts";
import Link from "next/link";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import { FiMail } from "react-icons/fi";
import { PiFileDocDuotone } from "react-icons/pi";
import Image from "next/image";

const links = [
  {
    img: "/assets/icons/linkedin.png",
    icon: FaLinkedin,
    href: "https://www.linkedin.com/in/vanshsood/",
  },
  {
    img: "/assets/icons/github.png",
    icon: FaGithub,
    href: "https://github.com/Vansh983",
  },
  {
    img: "/assets/icons/mail.png",
    icon: FiMail,
    href: "mailto:vanshsood@dal.ca",
  },
  {
    img: "/assets/icons/doc.png",
    icon: PiFileDocDuotone,
    href: "https://vanshsood.com/resume.pdf",
  },
];

const Footer = () => (
  <div
    className="bg-[#000000e0] pt-16 pb-12 relative flex flex-col px-4 md:hidden m-auto"
    id="footer"
    style={{ zIndex: 10 }}
  >
    <h1
      className={`${play.className} text-5xl md:text-6xl text-white font-bold`}
    >
      Enjoyed my work?
    </h1>
    <p
      className={`text-2xl my-8 text-white  ${mont.className}`}
      style={{ opacity: 0.8 }}
    >
      Lets work together! Drop a{" "}
      <Link href="https://www.linkedin.com/in/vanshsood/">
        <span style={{ cursor: "pointer", textDecoration: "underline" }}>
          text
        </span>
      </Link>
      , schedule a quick{" "}
      <Link href="https://topmate.io/vansh_sood">
        <span style={{ cursor: "pointer", textDecoration: "underline" }}>
          call
        </span>
      </Link>{" "}
      or send an{" "}
      <Link href="mailto:vanshsood@dal.ca">
        <span style={{ cursor: "pointer", textDecoration: "underline" }}>
          email
        </span>
      </Link>{" "}
      - whatever works best!
    </p>
    <div className="flex flex-wrap items-center justify-between mt-8">
      {links.map((link, index) => (
        <Link href={link.href} key={index} target="_blank">
          <link.icon color="white" className="text-6xl" />
        </Link>
      ))}
    </div>
  </div>
);

export default Footer;
