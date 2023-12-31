import { bebas, mont, play } from "../../utils/fonts";
import Image from "next/image";
import { about } from "../../data/about";

const colors = [
  "#F9D423], #FF4E50",
  "#F9D423, #FF4E50",
  "#F9D423, #FF4E50",
  "#F9D423, #FF4E50",
  "#F9D423, #FF4E50",
];

export default function TimelineResponsive() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-4 gap-2 my-8"
      style={{ position: "relative", zIndex: 200 }}
      id="about"
    >
      {/* <h1
        className={`${play.className} text-6xl font-bold text-white mx-4 w-full`}
        style={{ opacity: 0.7 }}
      >
        My story
      </h1> */}

      {about.map((a) => (
        <div
          key={a.year}
          className="px-2 py-4 rounded-md shadow-md"
          // style={{
          //   backgroundColor: "#FF4E50",
          // }}
        >
          <div className="flex items-end">
            <Image src={a.img} alt="Timeline" width={60} height={60} />
            <p className={`${bebas.className} text-5xl ml-4 text-white`}>
              {a.year}
            </p>
          </div>
          <p className={`${mont.className} text-white text-md w-full my-4`}>
            {a.content}
          </p>
        </div>
      ))}
    </div>
  );
}
