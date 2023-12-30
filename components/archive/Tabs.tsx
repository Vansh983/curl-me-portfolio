import { mont } from "../../utils/fonts";
import { Tab } from "../../utils/types/tabs";

type TabsProps = {
  tabs: Tab[];
  setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
};

export default function Tabs({ tabs, setTabs }: TabsProps) {
  return (
    <div className="hidden md:flex">
      {tabs.map(({ name, val, current }) => (
        <div
          className={`text-gray-500 hover:text-gray-400 px-4 py-2  ${
            current ? "border-b-2 border-sky-600 text-sky-600" : ""
          }`}
          style={{ cursor: "pointer" }}
          key={name}
          onClick={() => {
            const newTabs = tabs.map((tab) => {
              if (tab.name === name) {
                return { ...tab, current: true };
              } else {
                return { ...tab, current: false };
              }
            });
            setTabs(newTabs);
          }}
        >
          <h1 className={`${mont.className}`}>{name}</h1>
        </div>
      ))}
    </div>
  );
}
