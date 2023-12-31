import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { GrClose } from "react-icons/gr";
import { HiMiniBars3BottomRight } from "react-icons/hi2";
import Link from "next/link";
import { bebas, mont } from "../../utils/fonts";

const navigation = [
  { name: "About", href: "#about" },
  { name: "Projects", href: "#projects" },
  { name: "Milestones", href: "#story" },
  { name: "Archives", href: "/archive" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div>
      <header className="fixed inset-x-0 top-0 z-50">
        <nav
          className="flex items-center justify-between p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex lg:flex-1"></div>
          {/* <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-200"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <HiMiniBars3BottomRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </div> */}
          <div className="hidden lg:flex lg:gap-x-12 ">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <span
                  className={`text-sm font-semibold leading-6 text-gray-300 uppercase rounded-full px-4 py-2 bg-[rgba(255,255,255,0.1)] ${mont.className}`}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Mobile */}
        {/* <Dialog
          as="div"
          className="lg:hidden"
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
        >
          <div className="fixed inset-0 z-5000" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-black px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <h1
                className={`text-4xl font-bold text-white fixed`}
                style={{
                  zIndex: 20,
                  opacity: 0.8,
                  transition: "1s ease-in-out",
                  top: 15,
                }}
                id="logo"
              >
                Vansh Sood
              </h1>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <GrClose className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <span className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-100 hover:bg-gray-50">
                        {item.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog> */}
      </header>
    </div>
  );
}
