import React from "react";
import Head from "next/head";
import Script from "next/script";

const CommunityForm = () => {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vansh Sood</title>
        <meta name="description" content="undefined" />
        <meta
          property="og:url"
          content="https://vanshsood.com/community-form"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Vansh Sood" />
        <meta property="og:description" content="undefined" />
        <meta
          property="og:image"
          content="https://vanshsood.com/community-form/form.png"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="vanshsood.com" />
        <meta
          property="twitter:url"
          content="https://vanshsood.com/community-form"
        />
        <meta name="twitter:title" content="Vansh Sood" />
        <meta name="twitter:description" content="undefined" />
        <meta
          name="twitter:image"
          content="https://vanshsood.com/community-form/form.png"
        />
      </Head>
      <body>
        <div data-tf-live="01H76F2932HDMZRJETQBK6P0H4"></div>
        <Script src="//embed.typeform.com/next/embed.js" />
      </body>
    </>
  );
};

export default CommunityForm;
