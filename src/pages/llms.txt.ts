import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { profile, site } from '../data/profile';
import { featured } from '../data/projects';

// A curated map of this site for models and agents. Kept under 3k tokens on purpose.
// Everything here is generated from the same data the pages use.
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const out = `# ${profile.name}

> ${profile.role} based in ${profile.location}. ${profile.summary}

Currently at ${profile.company.name} (${profile.company.url}). Previously founded Webcube,
a software studio of 25 people. Won Google Code-in at 17. Computer science at Dalhousie University.

Every page on this site is also available as plain text or markdown. Add \`.md\` to any post URL,
or run \`curl ${site.url}\` for the whole profile in a terminal.

## Pages

- [Home](${site.url}): profile, timeline, selected work
- [Now](${site.url}/now): what he is working on this month
- [Writing](${site.url}/blog): all posts
- [Archive](${site.url}/archive): every project since 2017

## Writing

${posts.map((p) => `- [${p.data.title}](${site.url}/blog/${p.id}.md): ${p.data.description}`).join('\n')}

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
