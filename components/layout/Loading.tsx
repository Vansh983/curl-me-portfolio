import React, { useEffect, useRef } from "react";
import styles from "./Loading.module.css";
import gsap from "gsap";

const Loading: React.FC = () => {
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.from(ref1.current, {
      y: 40,
      rotation: 0.001,
      yoyo: true,
      repeat: -1,
      delay: 0.5,
      stagger: 0.5,
      ease: Power1.easeOut,
    });

    gsap.from(".circle-shad", {
      y: -40,
      yoyo: true,
      repeat: -1,
      delay: 0.5,
      ease: Power1.easeOut,
      opacity: 0.2,
      stagger: 0.5,
    });
  }, []);

  return (
    <div className="containerLoader">
      <div className="loader">
        <div className="circle" ref={ref1}>
          <svg
            width="29px"
            height="29px"
            viewBox="0 0 29 29"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              id="Page-1"
              stroke="none"
              stroke-width="1"
              fill="none"
              fill-rule="evenodd"
            >
              <g
                id="NAme"
                transform="translate(-168.000000, -99.000000)"
                fill="#FFFFFF"
              >
                <circle id="Oval" cx="182.5" cy="113.5" r="14.5"></circle>
              </g>
            </g>
          </svg>
        </div>
        <div className="circle">
          <svg
            width="29px"
            height="29px"
            viewBox="0 0 29 29"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              id="Page-1"
              stroke="none"
              stroke-width="1"
              fill="none"
              fill-rule="evenodd"
            >
              <g
                id="NAme"
                transform="translate(-168.000000, -99.000000)"
                fill="#FFFFFF"
              >
                <circle id="Oval" cx="182.5" cy="113.5" r="14.5"></circle>
              </g>
            </g>
          </svg>
        </div>
        <div className="circle">
          <svg
            width="29px"
            height="29px"
            viewBox="0 0 29 29"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              id="Page-1"
              stroke="none"
              stroke-width="1"
              fill="none"
              fill-rule="evenodd"
            >
              <g
                id="NAme"
                transform="translate(-168.000000, -99.000000)"
                fill="#FFFFFF"
              >
                <circle id="Oval" cx="182.5" cy="113.5" r="14.5"></circle>
              </g>
            </g>
          </svg>
        </div>
      </div>
      <div className="loader-shadow">
        <div className="circle-shad">
          <svg
            width="29px"
            height="29px"
            viewBox="0 0 29 29"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              id="Page-1"
              stroke="none"
              stroke-width="1"
              fill="none"
              fill-rule="evenodd"
            >
              <g
                id="NAme"
                transform="translate(-168.000000, -99.000000)"
                fill="#FFFFFF"
              >
                <circle id="Oval" cx="182.5" cy="113.5" r="14.5"></circle>
              </g>
            </g>
          </svg>
        </div>
        <div className="circle-shad">
          <svg
            width="29px"
            height="29px"
            viewBox="0 0 29 29"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              id="Page-1"
              stroke="none"
              stroke-width="1"
              fill="none"
              fill-rule="evenodd"
            >
              <g
                id="NAme"
                transform="translate(-168.000000, -99.000000)"
                fill="#FFFFFF"
              >
                <circle id="Oval" cx="182.5" cy="113.5" r="14.5"></circle>
              </g>
            </g>
          </svg>
        </div>
        <div className="circle-shad">
          <svg
            width="29px"
            height="29px"
            viewBox="0 0 29 29"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              id="Page-1"
              stroke="none"
              stroke-width="1"
              fill="none"
              fill-rule="evenodd"
            >
              <g
                id="NAme"
                transform="translate(-168.000000, -99.000000)"
                fill="#FFFFFF"
              >
                <circle id="Oval" cx="182.5" cy="113.5" r="14.5"></circle>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Loading;
