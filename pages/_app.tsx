import Head from "next/head";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Script from "next/script";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div>
      <Head>
        <title>Vansh Sood</title>
        <link rel="ICON" href="/assets/icons/bouncy.gif" />

        {/* Google tag (gtag.js) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta
          name="keywords"
          content="vansh sood, vansh, web designer, converge clan, web designer at converge clan"
        />
        <meta name="theme-color" content="#13171c" />
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
