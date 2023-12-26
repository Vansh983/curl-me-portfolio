import { useState, useEffect } from "react";
import Tabs from "../components/archive/Tabs";

import { mont } from "../utils/fonts";
import { Tab } from "../utils/types/tabs";
import ArchiveCards from "../components/archive/ArchiveCards";

import { archiveData } from "../data/archive";
import Dropdown from "../components/archive/Dropdown";

export default function archive() {
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
      name: "UI/UX",
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
    const newData = archiveData.filter((card) => {
      if (tabs[0].current) {
        return true;
      } else {
        return card.category.includes(
          tabs.find((tab) => tab.current)?.name ?? ""
        );
      }
    });
    setData(newData);
  }, [tabs]);

  useEffect(() => {
    const newData = archiveData.filter((card) => {
      return selectedYear ? card.year === selectedYear : true;
    });
    setData(newData);
  }, [selectedYear]);

  return (
    <div className="bg-dark min-h-screen px-16">
      <div className="flex justify-between items-center py-4">
        <h1 className={`text-gray-200 ${mont.className} text-5xl font-bold`}>
          Archive
        </h1>
        <div className="flex">
          <Tabs tabs={tabs} setTabs={setTabs} />
          <Dropdown
            setSelectedYear={setSelectedYear}
            selectedYear={selectedYear}
          />
        </div>
      </div>
      <ArchiveCards archive={data} />
    </div>
  );
}
