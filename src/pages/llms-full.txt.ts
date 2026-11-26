// Serves the full profile, timeline and project text for agents.
import type { APIRoute } from 'astro';
import { profile, site } from '../data/profile';
import { timeline } from '../data/timeline';
import { projects } from '../data/projects';

// Everything, in one fetch. For agents that would rather read one file than crawl.
export const GET: APIRoute = () => {
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

## Contact

${profile.links.map((l) => `- ${l.label}: ${l.href}`).join('\n')}
`;

  return new Response(out, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
