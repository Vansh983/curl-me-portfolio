import {
  Bebas_Neue,
  Inter,
  Montserrat,
  Playfair_Display,
} from "@next/font/google";

export const play = Playfair_Display({
  weight: ["400", "700"],
  subsets: ["latin"],
});
export const bebas = Bebas_Neue({ weight: ["400"], subsets: ["latin"] });
export const mont = Montserrat({
  weight: ["400", "700", "800"],
  subsets: ["latin"],
});

export const inter = Inter({
  weight: ["400", "700"],
  subsets: ["latin"],
});
