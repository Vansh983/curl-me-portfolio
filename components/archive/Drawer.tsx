import React, { useState } from "react";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";

interface DrawerProps {
  setSelectedYear: (year: string) => void;
  selectedYear: string;
}

const Drawer: React.FC<DrawerProps> = ({ setSelectedYear, selectedYear }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Button to toggle drawer */}
      <button
        className="px-4 py-2 text-white bg-blue-500 rounded-md focus:outline-none focus:ring"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "Close Drawer" : "Select Year"}
        {isOpen ? <BsChevronUp /> : <BsChevronDown />}
      </button>

      {/* Drawer content */}
      {isOpen && (
        <div className="absolute z-10 w-full max-w-xs p-4 mt-2 origin-top bg-white rounded-md shadow-lg">
          {/* List years or other content */}
          {["2023", "2022", "2021", "2020", "2019", "2018", "2017"].map(
            (year) => (
              <div
                key={year}
                className="py-2 hover:bg-gray-100"
                onClick={() => {
                  setSelectedYear(year);
                  setIsOpen(false); // Close the drawer after selection
                }}
              >
                {year}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Drawer;
