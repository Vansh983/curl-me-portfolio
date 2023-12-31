import { useState } from "react";
import { mont } from "../../utils/fonts";
import Link from "next/link";

interface ArchiveCardProps {
  archive: archiveData[];
}

interface LinkWrapperProps {
  href: string;
  children: React.ReactNode;
}

const LinkWrapper = ({ href, children }: LinkWrapperProps) => {
  if (href == "#") {
    return <div style={{ cursor: "not-allowed" }}>{children}</div>;
  }
  return (
    <Link href={href} target="_blank">
      {children}
    </Link>
  );
};

export default function ArchiveCards({ archive }: ArchiveCardProps) {
  const [hoveredId, setHoveredId] = useState<Number>(-1);

  return (
    <div className="grid grid-col-1 md:grid-cols-3 gap-4">
      {archive.map((card, index) => (
        <LinkWrapper
          href={card.url}
          key={index}
          // className={card.url === "#" ? "pointer-events-hover" : ""}
        >
          <div
            key={index}
            className={`relative h-64 rounded-md shadow-md bg-cover bg-center my-4 ${
              hoveredId === card.id ? "card-hovered" : ""
            }`}
            style={{
              backgroundImage: `url(${card.imgSrc})`,
              height: "400px",
              boxShadow: "0px 4px 4px 500px rgba(0, 0, 0, 0.35) inset",
              zIndex: 300,
              overflow: "hidden",
            }}
            onMouseEnter={() => setHoveredId(card.id)}
            onMouseLeave={() => setHoveredId(-1)}
          >
            <div
              className="absolute inset-0 py-8 px-2 card-content"
              style={{ bottom: 0, top: 0, left: "100%" }}
            >
              <h3 className={`${mont.className} text-2xl font-bold text-white`}>
                {card.year}
              </h3>
            </div>

            <div
              className="absolute inset-0 flex justify-end flex-col py-8 px-2 card-content"
              style={{ bottom: 0 }}
            >
              <h2 className={`${mont.className} text-2xl font-bold text-white`}>
                {card.title}
              </h2>
              <div className=" flex flex-wrap" style={{ bottom: 0 }}>
                {card.tags.map((tag, index) => (
                  <p
                    key={index}
                    style={{
                      border: "1px solid white",
                      width: "fit-content",
                    }}
                    className={`text-white border-white px-3 mt-2 py-1 mr-2 font-bold tag-transition rounded-xl text-xs bg-[#ffffff36] ${
                      mont.className
                    }  ${hoveredId === card.id ? "show-tag" : ""}`}
                  >
                    {tag}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </LinkWrapper>
      ))}
    </div>
  );
}
