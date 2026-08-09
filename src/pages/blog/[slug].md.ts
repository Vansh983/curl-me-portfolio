import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// The raw markdown twin of every post. Same content, no markup, so a model,
// a terminal or a script can read it without parsing HTML.
export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export const GET: APIRoute = ({ props }) => {
  const post = props.post as Awaited<ReturnType<typeof getCollection<'blog'>>>[number];
  const fm = [
    '---',
    `title: ${post.data.title}`,
    `description: ${post.data.description}`,
    `pubDate: ${post.data.pubDate.toISOString().slice(0, 10)}`,
    post.data.tags.length ? `tags: [${post.data.tags.join(', ')}]` : null,
    `canonical: https://vanshsood.com/blog/${post.id}`,
    '---',
    '',
  ]
    .filter(Boolean)
    .join('\n');

  return new Response(fm + post.body, {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
};
