import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Particle {
  radius: number;
  xPos: number;
  yPos: number;
  xVelocity: number;
  yVelocity: number;
  color: string;
}

class ParticleClass {
  colors: string[];
  blurry: boolean;
  border: boolean;
  minRadius: number;
  maxRadius: number;
  minOpacity: number;
  maxOpacity: number;
  minSpeed: number;
  maxSpeed: number;
  fps: number;
  numParticles: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  particle: Particle[];
  blurAmount: number;

  constructor(canvas: HTMLCanvasElement) {
    this.colors = ["225, 0, 254", "0, 124, 254", "255, 255, 255"];
    // this.colors = ["255, 255, 255", "255, 99, 71", "19, 19, 19"];
    this.blurry = true;
    this.border = false;
    this.minRadius = 10;
    this.maxRadius = 35;
    this.minOpacity = 0.005;
    this.maxOpacity = 0.3;
    this.minSpeed = 0.2;
    this.maxSpeed = 0.7;
    this.fps = 60;
    this.numParticles = 50;
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.particle = [];
    this.blurAmount = 0;
  }

  _rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  render = () => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };

  init() {
    this.render();
    this.createCircle();
    window.addEventListener("resize", this.render);
  }

  createCircle() {
    for (let i = 0; i < this.numParticles; i++) {
      const color = this.colors[Math.floor(this._rand(0, this.colors.length))];
      this.particle[i] = {
        radius: this._rand(this.minRadius, this.maxRadius),
        xPos: this._rand(0, this.canvas.width),
        yPos: this._rand(0, this.canvas.height),
        xVelocity: this._rand(this.minSpeed, this.maxSpeed),
        yVelocity: this._rand(this.minSpeed, this.maxSpeed),
        color: `rgba(${color},${this._rand(this.minOpacity, this.maxOpacity)})`,
      };
      this.draw(i);
    }
    this.animate();
  }

  draw(i: number) {
    const ctx = this.ctx;
    const particle = this.particle[i];
    if (this.blurry) {
      const grd = ctx.createRadialGradient(
        particle.xPos,
        particle.yPos,
        particle.radius,
        particle.xPos,
        particle.yPos,
        particle.radius / (1.25 - this.blurAmount)
      );
      grd.addColorStop(1.0, particle.color);
      grd.addColorStop(0.0, "rgba(34, 34, 34, 0)");
      ctx.fillStyle = grd;
    } else {
      ctx.fillStyle = particle.color;
    }
    if (this.border) {
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(
      particle.xPos,
      particle.yPos,
      particle.radius,
      0,
      2 * Math.PI,
      false
    );
    ctx.fill();
  }

  animate() {
    gsap.ticker.add(() => {
      this.clearCanvas();
      for (let i = 0; i < this.numParticles; i++) {
        this.particle[i].xPos += this.particle[i].xVelocity;
        this.particle[i].yPos -= this.particle[i].yVelocity;
        if (
          this.particle[i].xPos > this.canvas.width + this.particle[i].radius ||
          this.particle[i].yPos > this.canvas.height + this.particle[i].radius
        ) {
          this.resetParticle(i);
        } else {
          this.draw(i);
        }
      }
    });
  }

  resetParticle(i: number) {
    const random = this._rand(0, 1);
    if (random > 0.5) {
      this.particle[i].xPos = -this.particle[i].radius;
      this.particle[i].yPos = this._rand(0, this.canvas.height);
    } else {
      this.particle[i].xPos = this._rand(0, this.canvas.width);
      this.particle[i].yPos = this.canvas.height + this.particle[i].radius;
    }
    this.draw(i);
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

const Particles: React.FC = ({ setComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arr = [10, -10];

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    const particleInstance = new ParticleClass(canvas);
    particleInstance.init();
    // GSAP Animation with ScrollTrigger
    gsap.to(particleInstance.particle, {
      radius: 1000,
      //   radius: (i: number) => particleInstance.particle[i].radius * 100,
      blurAmount: 1,
      xVelocity: (i: number) =>
        particleInstance.particle[i].xVelocity /
        arr[Math.floor(Math.random() * arr.length)], // this will scatter particles in random directions
      yVelocity: (i: number) =>
        particleInstance.particle[i].yVelocity /
        arr[Math.floor(Math.random() * arr.length)],
      scrollTrigger: {
        trigger: document.body, // you can specify the trigger element here
        start: "top top",
        end: 100,
        scrub: true,
      },
      triggerActions: "play none play none",
      //@ts-ignore
      //   onComplete: () => (particleInstance.particle = []), // remove particles after the animation
    });

    // tl.to(particleInstance.particle, {
    //   radius: 10,
    //   //   radius: (i: number) => particleInstance.particle[i].radius * 100,
    //   blurAmount: 1,
    //   xVelocity: (i: number) =>
    //     particleInstance.particle[i].xVelocity /
    //     arr[Math.floor(Math.random() * arr.length)], // this will scatter particles in random directions
    //   yVelocity: (i: number) =>
    //     particleInstance.particle[i].yVelocity /
    //     arr[Math.floor(Math.random() * arr.length)],
    //   scrollTrigger: {
    //     trigger: "#footer",
    //     start: "top bottom",
    //     end: "bottom bottom",
    //     scrub: true,
    //   },
    // });
    return () => {
      window.removeEventListener("resize", particleInstance.render);
    };
  }, []);

  return <canvas id="canvas" style={{ position: "fixed" }} ref={canvasRef} />;
};

export default Particles;
