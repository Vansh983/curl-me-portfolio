import { mont } from "../../utils/fonts";
import { Tab } from "../../utils/types/tabs";

type TabsProps = {
  tabs: Tab[];
};

export default function Tabs({ tabs }: TabsProps) {
  return (
    <div className="flex">
      {tabs.map(({ name, val, current }) => (
        <div
          className={`w-1/2 text-gray-500 hover:text-gray-400 px-4 py-2  ${
            current ? "border-b-2 border-sky-600 text-sky-600" : ""
          }`}
          style={{ cursor: "pointer" }}
        >
          <h1 className={`${mont.className}`}>{name}</h1>
        </div>
      ))}
    </div>
  );
}
