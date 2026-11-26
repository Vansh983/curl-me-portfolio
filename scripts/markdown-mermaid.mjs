import { createHash } from 'node:crypto';
import { renderMermaidSVG } from 'beautiful-mermaid';
import { outlineIcon, renderIconFlow } from './markdown-icon-flow.mjs';

const actorLogos = new Map([
  ['ClaudeCode', ['Claude Code', 'claude-code.svg']],
  ['ClaudeApp', ['Claude app', 'claude.svg']],
  ['Codex', ['Codex', 'codex.svg']],
]);

// Keep Mermaid's lifelines, arrows and label coordinates. Only decorate the header.
function addActorLogos(svg) {
  return svg.replace(/<g class="actor" data-id="([^"]+)"[^>]*>[\s\S]*?<\/g>/g, (actor, id) => {
    const kind = id.split('_')[0];
    const logo = actorLogos.get(kind);
    if (!logo && kind !== 'Laptop') return actor;
    return actor.replace(/<text x="([\d.]+)" y="([\d.]+)"/, (label, x, y) => {
      const geometry = `x="${Number(x) - 17}" y="${Number(y) - 48}" width="34" height="34"`;
      const icon = logo
        ? `<image href="/assets/blog/agent-icons/${logo[1]}" ${geometry}><title>${logo[0]}</title></image>`
        : outlineIcon('laptop', geometry);
      return icon + label;
    });
  });
}

function escapeText(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
}

/** @type {import('satteri').MdastPluginDefinition} */
export default {
  name: 'render-mermaid',
  code(node, ctx) {
    if (node.lang !== 'mermaid') return;

    const meta = node.meta || 'Mermaid diagram';
    const caption = meta.replace(/^icons\s+/, '');
    const sequence = /^\s*sequenceDiagram\b/.test(node.value);
    if (caption !== meta && !sequence) {
      const flow = renderIconFlow(node.value, caption);
      if (flow) {
        ctx.replaceNode(node, { type: 'html', value: flow });
        return;
      }
    }

    const svg = renderMermaidSVG(node.value, {
      bg: 'var(--diagram-paper)', fg: 'var(--tx)', accent: 'var(--hi)',
      muted: 'var(--mut)', surface: 'var(--raise)', border: 'var(--rule)',
      font: 'Inter', transparent: true, padding: 10, nodeSpacing: 24, layerSpacing: 32,
    });
    const drawing = sequence && caption !== meta
      ? addActorLogos(svg).replace(/(<g class="block" data-type="par"[^>]*>[\s\S]*?<text\b[^>]*>)par \[([^<>]+)\](<\/text>)/g, '$1$2$3')
      : svg;
    const description = node.value.match(/^\s*accDescr:\s*(.+)$/m)?.[1];
    const accessibleName = `<title>${escapeText(caption)}</title>${description ? `<desc>${escapeText(description)}</desc>` : ''}`;
    const id = createHash('sha256').update(node.value + node.position?.start.offset).digest('hex').slice(0, 10);
    // Inline diagrams share the document's ID namespace and already have the site's fonts.
    const inline = drawing
      .replace(/(\sid="|url\(#|\shref="#)([\w.-]+)/g, `$1m-${id}-$2`)
      .replace(/<style>([\s\S]*?)<\/style>/, (_, css) =>
        `<style>@scope (.blog-mermaid) {${css.replace(/^\s*@import[^\n]*\n/gm, '')}}</style>`)
      .replace(/<svg([^>]*)>/, (_, attrs) => `<svg${attrs} role="img">${accessibleName}`);
    ctx.replaceNode(node, { type: 'html', value: `<figure class="blog-mermaid">${inline}</figure>` });
  },
};
