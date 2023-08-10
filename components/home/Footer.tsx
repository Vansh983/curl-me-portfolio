import React from "react";
import { mont, play } from "../../utils/fonts";

const Footer = () => {
  return (
    <div className="relative w-3/4 m-auto" id="footer" style={{ zIndex: 10 }}>
      <h1 className={`text-5xl font-bold text-white ${mont.className}`}>
        Enjoying my work? Let's work together
      </h1>
      <p className={`text-xl my-8 text-white w-3/4 ${mont.className}`}>
        Happy to create one of your own! Drop a text, schedule a quick call or
        send an email - whatever works best!
      </p>
    </div>
  );
};

export default Footer;
