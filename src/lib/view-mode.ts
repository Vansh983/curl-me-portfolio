// Defines the viewport breakpoint for the desktop journey.
export const LAPTOP_QUERY = '(min-width: 1025px)';
export const isLaptop = () => matchMedia(LAPTOP_QUERY).matches;
