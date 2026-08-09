import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { profile } from '../data/profile';
import { timeline } from '../data/timeline';
import { featured } from '../data/projects';

// What `curl vanshsood.com` returns. Vercel Routing Middleware rewrites terminal
// clients here, so the URL never changes and the site stays fully static.
const E = '\u001b[';
const b = (s: string) => `${E}1m${s}${E}0m`;
const dim = (s: string) => `${E}2m${s}${E}0m`;
const acc = (s: string) => `${E}38;5;154m${s}${E}0m`;
const pad = (s: string, n = 9) => s.padEnd(n);

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b2) => b2.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, 3);

  const out = [
    '',
    `  ${acc(b(profile.name.toUpperCase()))}  ${dim(profile.role.toLowerCase())}`,
    `  ${dim('-'.repeat(58))}`,
    '',
    ...wrap(profile.summary, 58).map((l) => `  ${l}`),
    '',
    `  ${b('TIMELINE')}`,
    ...timeline.map((m) => `  ${acc(pad(m.year, 7))}${m.title}\n${dim(indent(wrap(m.body, 48), 14))}`),
    '',
    `  ${b('SELECTED WORK')}`,
    ...featured
      .slice(0, 6)
      .map((p) => `  ${dim(pad(p.year, 7))}${p.title}${p.url ? `\n         ${dim(p.url)}` : ''}`),
    '',
    `  ${b('WRITING')}`,
    ...posts.map(
      (p) =>
        `  ${dim(pad(p.data.pubDate.toISOString().slice(0, 7), 9))}${p.data.title}\n           ${dim(
          `curl vanshsood.com/blog/${p.id}`
        )}`
    ),
    '',
    `  ${b('ELSEWHERE')}`,
    ...profile.links.map((l) => `  ${dim(pad(l.label.toLowerCase(), 9))}${l.href.replace(/^https?:\/\//, '')}`),
    `  ${dim(pad('email', 9))}${profile.email}`,
    '',
    `  ${dim('there is a browser version of this page at https://vanshsood.com')}`,
    `  ${dim('and a version for models at https://vanshsood.com/llms.txt')}`,
    '',
  ].join('\n');

  return new Response(out, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
};

function wrap(s: string, n: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > n) {
      lines.push(line.trim());
      line = w;
    } else line += ' ' + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}
function indent(lines: string[], n: number) {
  return lines.map((l) => ' '.repeat(n) + l).join('\n');
}
