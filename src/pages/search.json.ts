// Builds the command menu index from pages, projects and profile links.
import type { APIRoute } from 'astro';
import { projects } from '../data/projects';
import { profile } from '../data/profile';

interface SearchItem {
  title: string;
  href: string;
  kind: string;
}

// Index for the command menu. Built from the same data as the pages, fetched
// once on first open. A few KB, no search server, no dependency.
export const GET: APIRoute = () => {
  const items: SearchItem[] = [
    { title: 'Home', href: '/', kind: 'page' },
    { title: 'Archive', href: '/archive', kind: 'page' },
    { title: 'Now', href: '/now', kind: 'page' },
    { title: 'Resume', href: '/resume.pdf', kind: 'file' },
    { title: 'llms.txt', href: '/llms.txt', kind: 'file' },
    ...projects
      .filter((p) => p.url)
      .map((p) => ({ title: p.title, href: p.url as string, kind: p.year })),
    ...profile.links.map((l) => ({ title: l.label, href: l.href, kind: 'link' })),
  ];

  return new Response(JSON.stringify(items), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
