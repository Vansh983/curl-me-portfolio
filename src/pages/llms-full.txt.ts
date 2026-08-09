import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { profile, site } from '../data/profile';
import { timeline } from '../data/timeline';
import { projects } from '../data/projects';

// Everything, in one fetch. For agents that would rather read one file than crawl.
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const out = `# ${profile.name}

${profile.role}. ${profile.summary}
Location: ${profile.location}. Currently at ${profile.company.name} (${profile.company.url}).
Site: ${site.url}

## Timeline

${timeline.map((m) => `### ${m.year} ${m.title}\n${m.body}`).join('\n\n')}

## Projects (${projects.length})

${projects
  .map(
    (p) =>
      `### ${p.title} (${p.year})\n${p.description ?? ''}\nStack: ${p.tags.join(', ')}${
        p.url ? `\nLink: ${p.url}` : ''
      }`
  )
  .join('\n\n')}

## Writing

${posts
  .map(
    (p) =>
      `### ${p.data.title}\nPublished: ${p.data.pubDate.toISOString().slice(0, 10)}\nURL: ${site.url}/blog/${
        p.id
      }\n\n${p.body}`
  )
  .join('\n\n---\n\n')}

## Contact

${profile.links.map((l) => `- ${l.label}: ${l.href}`).join('\n')}
- Email: ${profile.email}
`;

  return new Response(out, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
