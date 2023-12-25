import { useState, useEffect } from "react";
import Tabs from "../components/archive/Tabs";

import { mont } from "../utils/fonts";
import { Tab } from "../utils/types/tabs";
import ArchiveCards from "../components/archive/ArchiveCards";

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
      name: "Design",
      val: "#",
      current: false,
    },
    {
      name: "Photography",
      val: "#",
      current: false,
    },
  ]);
  return (
    <div className="bg-dark min-h-screen px-16">
      <div className="flex justify-between items-center">
        <h1 className={`text-gray-200 ${mont.className} text-5xl font-bold`}>
          Archive
        </h1>
        <Tabs tabs={tabs} />
      </div>
      <ArchiveCards />
    </div>
  );
}
