import { useState } from "react";
import { projects } from "../../data/projects";
import Image from "next/image";

interface Project {
  imgSrc: string;
  title: string;
  tags: string[];
  grad: string[];
  url: string;
  year: string;
}

export default function ProjectSlide() {
  const project = projects[0];
  return (
    <div
      className="fixed t-0 l-0 w-full h-full"
      style={{
        zIndex: 2000,
        background: `-webkit-linear-gradient(${project.grad})`,
      }}
    >
      <div
        className="relative group card w-[48%] my-4"
        style={{ opacity: 1, transition: "0.3s all ease-in-out" }}
      >
        {/* <a href={project.url} target="_blank" rel="noopener noreferrer"> */}
        <div className="">
          <Image
            src={project.imgSrc}
            alt={project.title}
            className="w-full rounded"
          />
          {/* <div className="absolute bottom-0 flex justify-between left-0 w-full bg-black bg-opacity-40 text-white text-center py-2 transition-opacity opacity-0 group-hover:opacity-100 px-4">
                <div className="flex justify-start">
                  {project.pills.map((pill, pillIndex) => (
                    <span
                      key={pillIndex}
                      className={`inline-block px-3 py-1 text-sm font-semibold mr-2 cursor-pointer bg-blue-500`}
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div> */}
        </div>
        <div className="flex justify-between mt-2">
          <h2
            className="font-bold text-4xl my-8 w-3/4"
            style={{
              background: `-webkit-linear-gradient(${project.grad})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {project.title}
          </h2>
          <div className="flex items-center">
            <button
              type="button"
              className={`text-white font-bold py-2 px-4 rounded`}
              style={{
                background: `-webkit-linear-gradient(${project.grad})`,
              }}
            >
              View
            </button>
          </div>
        </div>
        {/* </a> */}
      </div>
    </div>
  );
}
