import { useState, useEffect } from "react";
import Tabs from "../components/archive/Tabs";

import { bebas, mont } from "../utils/fonts";
import { Tab } from "../utils/types/tabs";
import ArchiveCards from "../components/archive/ArchiveCards";

import { archiveData } from "../data/archive";
import Dropdown from "../components/archive/Dropdown";
import { FiRefreshCcw } from "react-icons/fi";
import { navigation } from "../data/nav";
import Link from "next/link";

const years = ["2023", "2022", "2021", "2020", "2019", "2018", "2017"];

export default function Archive() {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      name: "All",
      val: "#",
      current: true,
    },
    {
      name: "Web",
      val: "#",
      current: false,
    },
    {
      name: "Mobile",
      val: "#",
      current: false,
    },
    {
      name: "Cloud",
      val: "#",
      current: false,
    },
    {
      name: "Machine Learning",
      val: "#",
      current: false,
    },
  ]);

  const [data, setData] = useState<archiveData[]>(archiveData);
  const [selectedYear, setSelectedYear] = useState<string>("");

  useEffect(() => {
    const filteredData = archiveData.filter((card) => {
      const tabCondition = tabs[0].current
        ? true
        : card.category.includes(tabs.find((tab) => tab.current)?.name ?? "");
      const yearCondition = selectedYear ? card.year === selectedYear : true;
      return tabCondition && yearCondition;
    });

    setData(filteredData);
  }, [tabs, selectedYear]);

  return (
    <div className="bg-dark min-h-screen px-4 lg:px-16 pb-24">
      <div className="flex justify-between items-center py-4">
        <h1
          className={`text-gray-200 ${bebas.className} text-5xl font-bold`}
          style={{ opacity: 0.8 }}
        >
          Vansh&apos;s Archives
        </h1>
        <div className="flex items-center">
          <Tabs tabs={tabs} setTabs={setTabs} />
          <Dropdown
            years={years}
            setSelectedYear={setSelectedYear}
            selectedYear={selectedYear}
          />
          <FiRefreshCcw
            className="text-gray-200 text-2xl ml-4 cursor-pointer hover:text-gray-400"
            onClick={() => {
              const newTabs = tabs.map((tab) => {
                if (tab.name === "All") {
                  return { ...tab, current: true };
                } else {
                  return { ...tab, current: false };
                }
              });
              setSelectedYear("");
              setTabs(newTabs);
            }}
          />
        </div>
      </div>
      <ArchiveCards archive={data} />
      <Link
        href="/"
        className={`${bebas.className} bg-white text-4xl px-4 py-2 font-bold text-sky-600 fixed rounded-md right-8 md:right-20`}
        style={{
          zIndex: 2000,
          opacity: 0.7,
          transition: "1s ease-in-out",
          bottom: 40,
        }}
        id="logo"
      >
        Back to Portfolio
      </Link>
    </div>
  );
}
