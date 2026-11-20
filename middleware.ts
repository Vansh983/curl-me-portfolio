import { next, rewrite } from '@vercel/functions';

// Vercel Routing Middleware. Runs before the cache, on every matched request.
// Browsers fall straight through to the static HTML; terminals get plain text.
// The URL never changes, so `curl vanshsood.com` is the whole trick.
export const config = {
  matcher: ['/', '/blog/:slug'],
};

const TERMINAL = /^(curl|wget|httpie|libcurl|lwp-request|python-requests)/i;

export default function middleware(request: Request): Response {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/blog/') && url.pathname.endsWith('.md')) {
    return next({
      headers: { Link: `<https://vanshsood.com${url.pathname.slice(0, -3)}>; rel="canonical"` },
    });
  }

  const ua = request.headers.get('user-agent') ?? '';
  if (!TERMINAL.test(ua)) return next();

  if (url.pathname === '/') return rewrite(new URL('/index.txt', url));
  return rewrite(new URL(`${url.pathname}.md`, url));
}
