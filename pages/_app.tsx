import Head from "next/head";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Script from "next/script";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div>
      <Head>
        <title>Vansh Sood - Full Stack Developer, Tech Founder</title>
        <link rel="ICON" href="/assets/icons/bouncy.gif" />
        {/* Google tag (gtag.js) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta
          name="keywords"
          content="vansh sood, vansh, web designer, tech founder, developer, entrepreneur, open-source, design, creative, dalhousie, dalhousie university, mobile app"
        />
        <meta name="theme-color" content="#13171c" />
        <meta
          name="description"
          content="Vansh Sood's personal portfolio. Explore my world of development, technology leadership, and creative projects."
        />
        <meta
          property="og:title"
          content="Vansh Sood - Full Stack Developer, Tech Founder"
        />
        <meta
          property="og:description"
          content="Vansh Sood's personal portfolio. Explore my world of development, technology leadership, and creative projects."
        />
        <meta property="og:image" content="/assets/story/vansh.JPG" />{" "}
        <meta property="og:type" content="website" />
        <meta name="author" content="Vansh Sood"></meta>
        <meta
          property="article:published_time"
          content="2023-12-12T00:00:00Z"
        />
      </Head>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-F4F6K9RZP7" />
      <Script id="google-analytics">
        {`
        window.dataLayer = window.dataLayer || [];
        function gtag() {
          dataLayer.push(arguments);
        }
        gtag("js", new Date());
        gtag("config", "G-F4F6K9RZP7");
      `}
      </Script>

      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
