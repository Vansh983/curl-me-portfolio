// Serves a short site map and profile for agents.
import type { APIRoute } from 'astro';
import { profile, site } from '../data/profile';
import { featured } from '../data/projects';
import { ABOUT_INTRO_PARAGRAPHS, ABOUT_PARAGRAPHS, ABOUT_LINKS, ABOUT_ROWS, type AboutPart } from '../data/about';

const plainText = (parts: readonly AboutPart[]) => parts.map(part =>
  part.tag ? ABOUT_ROWS[part.tag].label :
  part.link ? ABOUT_LINKS[part.link].label :
  part.rotating ? part.rotating[0] : part.text
).join('');

// A curated map of this site for models and agents. Kept under 3k tokens on purpose.
// Everything here is generated from the same data the pages use.
export const GET: APIRoute = () => {
  const out = `# ${profile.name}

${ABOUT_INTRO_PARAGRAPHS.map(parts => `> ${plainText(parts)}`).join('\n>\n')}

${ABOUT_PARAGRAPHS
  .filter(paragraph => ['first-code', 'webcube', 'dalhousie'].includes(paragraph.id))
  .map(paragraph => plainText(paragraph.parts))
  .join('\n\n')}

Run \`curl ${site.url}\` for the whole profile in a terminal.

## Pages

- [Home](${site.url}): profile, timeline, selected work
- [Now](${site.url}/now): what he is working on this month
- [Archive](${site.url}/archive): every project since 2017

## Selected work

${featured
  .slice(0, 8)
  .map((p) => `- ${p.title} (${p.year})${p.url ? ` ${p.url}` : ''}: ${p.description ?? ''}`)
  .join('\n')}

## Elsewhere

${profile.links.map((l) => `- ${l.label}: ${l.href}`).join('\n')}
- Full text of everything: ${site.url}/llms-full.txt
`;

  return new Response(out, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
