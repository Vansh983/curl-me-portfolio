import { parseMermaid } from 'beautiful-mermaid';

const logos = { syncthing: 'syncthing', raspberryPi: 'raspberry-pi', claudeCode: 'claude-code', codex: 'codex' };
const outlines = {
  speaker: '<path d="M8 7h24a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H17l-9 7v-7a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3Z"/>',
  laptop: '<rect x="5" y="7" width="30" height="22" rx="2"/><path d="M5 29h30l3 4H2z"/><path class="terminal-prompt" d="m11 14 3 3-3 3m7 0h5"/>',
  tower: '<rect x="10" y="2.5" width="20" height="34" rx="3"/><path d="M14 8h12m-12 4h12m-12 4h12"/><circle class="terminal-prompt" cx="20" cy="29" r="1.8"/>',
  git: '<circle cx="12" cy="7" r="3"/><circle cx="12" cy="32" r="3"/><circle cx="29" cy="11" r="3"/><path d="M12 10v19m17-15c0 8-17 5-17 13"/>',
};

export function outlineIcon(kind, geometry = '') {
  return `<svg ${geometry} viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.8">${outlines[kind]}</svg>`;
}

function escape(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function device(graph, id) {
  const kind = graph.classAssignments.get(id);
  const [name, ...details] = graph.nodes.get(id).label.split('\n');
  const brand = { claudeCode: 'Claude Code', codex: 'Codex' }[kind] ?? '';
  const icon = Object.hasOwn(logos, kind)
    ? `<img src="/assets/blog/agent-icons/${logos[kind]}.svg" alt="${brand}" width="40" height="40">`
    : outlineIcon(kind);
  const detail = details.length ? `<span class="flow-detail">${details.map(escape).join('<br>')}</span>` : '';
  return `<div class="flow-device"><span class="flow-icon">${icon}</span><span class="flow-name">${escape(name)}</span>${detail}</div>`;
}

// A horizontal pair of feedback loops. Each rail represents one directed edge.
function renderCycle(graph, title) {
  const conversation = graph.edges.find(edge => graph.classAssignments.get(edge.source) === 'speaker' &&
    edge.hasArrowStart && edge.hasArrowEnd);
  const ids = [...graph.nodes.keys()].filter(id => id !== conversation?.source);
  const edges = graph.edges.filter(edge => edge !== conversation);
  if (ids.length !== 3 || edges.length !== 4 || graph.subgraphs.length ||
      ids.some(id => !Object.hasOwn(logos, graph.classAssignments.get(id))) ||
      edges.some(edge => !ids.includes(edge.source) || !ids.includes(edge.target) ||
        edge.source === edge.target || edge.hasArrowStart || !edge.hasArrowEnd || !edge.label)) return;

  const hub = ids.find(id => edges.filter(edge => edge.source === id).length === 2);
  if (!hub || (conversation && conversation.target !== hub)) return;
  const outward = edges.filter(edge => edge.source === hub);
  const replies = outward.map(edge => edges.find(reply => reply.source === edge.target && reply.target === hub));
  if (outward[0].target === outward[1].target || replies.some(reply => !reply)) return;

  function route(edge, side, leg) {
    const [from, to] = [edge.source, edge.target].map(id => escape(graph.nodes.get(id).label.split('\n')[0]));
    return `<div class="cycle-route cycle-${side} cycle-${leg}" role="group" aria-label="${from} to ${to}"><span class="cycle-wire" aria-hidden="true"></span><span>${escape(edge.label).replaceAll('\n', '<br>')}</span></div>`;
  }
  const stations = [outward[0].target, hub, outward[1].target].map(id => device(graph, id)).join('');
  const rails = outward.map((edge, i) => {
    const side = i === 0 ? 'left' : 'right';
    return route(edge, side, 'send') + route(replies[i], side, 'return');
  }).join('');
  let entry = '';
  if (conversation) {
    const name = escape(graph.nodes.get(conversation.source).label);
    const model = escape(graph.nodes.get(hub).label.split('\n')[0]);
    const link = `${name} ↔ ${model}${conversation.label ? ' · ' + escape(conversation.label) : ''}`;
    entry = `<span class="cycle-speaker flow-name">${outlineIcon('speaker')}${name}</span><span class="cycle-conversation-wire flow-wire" role="img" aria-label="${link}" title="${link}"></span>`;
  }
  return `<figure class="blog-icon-flow blog-agent-cycle" aria-label="${escape(title)}">${entry}${stations}${rails}</figure>`;
}

function transfer(edge, atFork) {
  const label = escape(edge.label).replaceAll('\n', '<br>');
  return `<div class="flow-transfer${atFork ? ' flow-from-fork' : ''}"><span class="flow-wire" aria-hidden="true"></span><span class="flow-protocol">${label}</span></div>`;
}

// Parallel, two-way routes from one device to a group of peers. The labels,
// direction, intermediate nodes and members all come from the Mermaid graph.
export function renderIconFlow(source, title) {
  const graph = parseMermaid(source);
  if (graph.direction === 'LR') return renderCycle(graph, title);
  const [fleet] = graph.subgraphs;
  if (!['TD', 'TB'].includes(graph.direction) ||
      graph.subgraphs.length !== 1 || fleet.children.length || !fleet.nodeIds.length) return;
  const arrivals = graph.edges.filter(e => e.target === fleet.id);
  const starts = graph.edges.filter(e => e.target !== fleet.id);
  if (!arrivals.length || starts.length !== arrivals.length ||
      graph.edges.some(e => !e.hasArrowStart || !e.hasArrowEnd || !e.label)) return;
  const origin = starts[0].source;
  const routes = starts.map(first => [first, arrivals.find(last => last.source === first.target)]);
  if (new Set(starts.map(edge => edge.target)).size !== starts.length ||
      routes.some(([first, last]) => first.source !== origin || !last)) return;
  const devices = new Set([origin, ...starts.map(e => e.target), ...fleet.nodeIds]);
  if (devices.size + 1 !== graph.nodes.size || [...devices].some(id => {
    const kind = graph.classAssignments.get(id);
    return !Object.hasOwn(logos, kind) && !Object.hasOwn(outlines, kind);
  })) return;

  const lanes = routes.map(([first, last]) => `<li>${transfer(first, true)}${device(graph, first.target)}${transfer(last, false)}</li>`).join('');
  const hosts = fleet.nodeIds.map(id => `<li>${device(graph, id)}</li>`).join('');
  return `<figure class="blog-icon-flow" aria-label="${escape(title)}">${device(graph, origin)}<span class="flow-trunk" aria-hidden="true"></span><ul class="flow-routes" role="list" aria-label="Two-way transfer routes">${lanes}</ul><div class="flow-fleet"><div class="flow-fleet-title">${escape(fleet.label)}</div><ul class="flow-hosts" role="list">${hosts}</ul></div></figure>`;
}
