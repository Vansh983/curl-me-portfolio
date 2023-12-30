import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { BsChevronDown } from "react-icons/bs";
import { mont } from "../../utils/fonts";

interface DropdownProps {
  setSelectedYear: (year: string) => void;
  selectedYear: string;
  years: string[];
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Dropdown({
  setSelectedYear,
  selectedYear,
  years,
}: DropdownProps) {
  return (
    <Menu
      as="div"
      className="relative inline-block text-left ml-4"
      style={{ zIndex: 1000 }}
    >
      <div>
        <Menu.Button
          className={`inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${mont.className}`}
        >
          {selectedYear ? selectedYear : "Select Year"}
          <BsChevronDown className="text-xl" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {years.map((year) => (
              <Menu.Item key={year}>
                {({ active }) => (
                  <p
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      `block px-4 py-2 text-sm w-full text-left ${mont.className}`
                    )}
                    onClick={() => {
                      setSelectedYear(year);
                    }}
                  >
                    {year}
                  </p>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
