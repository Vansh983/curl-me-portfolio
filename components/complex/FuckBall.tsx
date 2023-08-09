import { useLayoutEffect, useRef } from "react";
import styles from "../../styles/FuckBall.module.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

function FuckBall() {
  const ref = useRef<HTMLDivElement>();
  useLayoutEffect(() => {
    const ctx = gsap.context((self) => {
      // .from(box, { y: 150, opacity: 0 })
      const tl = gsap.timeline();
      tl.to(ref.current, {
        duration: 3,
        ease: "power3.out",
        animation: "none",
        top: 100,
        scrollTrigger: {
          trigger: ref.current,
          start: 100,
          end: "-200% center",
          scrub: true,
          toggleActions: "play none none reverse",
        },
        // left: 10,
        // background: "#eee",
      });
      tl.to(ref.current, {
        duration: 3,
        ease: "power3.out",
        top: 50,
        height: 300,
        width: 300,
        left: -120,
        scrollTrigger: {
          trigger: ref.current,
          start: 200,
          end: "-200% center",
          scrub: true,
          toggleActions: "play none none reverse",
        },
        // left: 10,
        // background: "#eee",
      });
      tl.to(ref.current, {
        duration: 3,
        ease: "power4.out",
        top: 50,
        height: 300,
        width: 300,
        scrollTrigger: {
          trigger: ref.current,
          start: 200,
          end: "-200% center",
          scrub: true,
          toggleActions: "play none none reverse",
        },
        // left: 10,
        // background: "#eee",
      });
      tl.to(ref.current, {
        duration: 3,
        ease: "power3.out",
        top: 450,
        borderRadius: 0,
        height: 3,
        width: 300,
        scrollTrigger: {
          trigger: ref.current,
          start: 250,
          end: "-200% center",
          scrub: true,
          toggleActions: "play none none reverse",
        },
        // left: 10,
        // background: "#eee",
      });
      tl.to(ref.current, {
        duration: 3,
        ease: "power3.out",
        left: -920,
        borderRadius: 100,
        scrollTrigger: {
          trigger: ref.current,
          start: 350,
          end: "-200% center",
          scrub: true,
          toggleActions: "play none none reverse",
        },
        // left: 10,
        // background: "#eee",
      });
      tl.to(ref.current, {
        duration: 3,
        ease: "power3.out",
        top: 50,
        height: 300,
        width: 300,
        scrollTrigger: {
          trigger: ref.current,
          start: 400,
          end: "-200% center",
          scrub: true,
          toggleActions: "play none none reverse",
        },
        // left: 10,
        // background: "#eee",
      });
      tl.to(ref.current, {
        duration: 3,
        ease: "power3.out",
        top: 400,
        height: 3,
        width: 3500,
        left: -1500,
        scrollTrigger: {
          trigger: ref.current,
          start: 500,
          end: "-200% center",
          scrub: true,
          toggleActions: "play none none reverse",
        },
        // left: 10,
        // background: "#eee",
      });
      tl.to(ref.current, {
        duration: 3,
        ease: "power3.out",
        top: 400,
        height: 3,
        width: 3500,
        left: -1500,
        scrollTrigger: {
          trigger: ref.current,
          start: 500,
          end: "-200% center",
          scrub: true,
          toggleActions: "play none none reverse",
        },
        // left: 10,
        // background: "#eee",
      });
    }, ref); // <- Scope!
    return () => ctx.revert(); // <- Cleanup!
  }, []);

  return (
    <div className={styles.ballBouncing}>
      <div className={styles.ball} ref={ref}></div>
    </div>
  );
}

export default FuckBall;
