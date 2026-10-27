// Original vector artwork. Architectural references are recorded in rebuild/59.
const ink = '#3a4c49';
const stroke = `stroke="${ink}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"`;
const rect = (x: number, y: number, w: number, h: number, fill: string, r = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${stroke}/>`;
const path = (d: string, fill = 'none', color = ink, width = .9) => `<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const wash = (d: string, fill: string) => path(d, fill, fill, 0);
const line = (x: number, y: number, xx: number, yy: number, color = ink, width = .7) => path(`M${x} ${y}L${xx} ${yy}`, 'none', color, width);
const circle = (x: number, y: number, r: number, fill: string) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${stroke}/>`;
const ellipse = (x: number, y: number, rx: number, ry: number, fill: string) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const label = (x: number, y: number, text: string, size = 7, color = ink, weight = 500) => `<text x="${x}" y="${y}" font-family="Inter, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${text}</text>`;
const group = (x: number, y: number, content: string, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})">${content}</g>`;
const rows = (count: number, render: (i: number) => string) => Array.from({ length: count }, (_, i) => render(i)).join('');

const code = (x: number, y: number, w: number) => rows(5, i => line(x + i % 3 * 3, y + i * 4, x + w * [.73, 1, .6, .85, .48][i], y + i * 4, ['#a4c8b2', '#d4bf88', '#9cb5cc'][i % 3], 1));
const monitor = (x: number, y: number, w: number, title: string) => group(x, y,
  path(`M${w / 2 - 3} 41v12h-10l-3 2h32l-3-2h-10V41`, '#7f8c83') + rect(0, 0, w, 44, '#364643', 2) + rect(3, 3, w - 6, 36, '#253735', 1) +
  wash(`M3 3h${w - 6}v7H3Z`, '#50615b') + [6, 10, 14].map(a => ellipse(a, 6, 1, 1, '#a4b09c')).join('') + label(6, 17, title, 5, '#e9e5cd') +
  line(8, 23, 8, 35, '#78988b') + code(13, 23, w - 24) + ellipse(w - 6, 41, .8, .8, '#bfd7aa') + line(5, 1, w - 5, 1, '#7b8b80', .6));
const keyboard = (x: number, y: number, w = 44) => group(x, y,
  path(`M3 0h${w - 6}l3 7H0Z`, '#8e9c90') + rows(3, row => rows(9, col => wash(`M${4 + col * (w - 8) / 9} ${1 + row * 1.7}h2.6v1h-2.6Z`, col === 0 && row === 0 ? '#c28c57' : '#d5dbca'))));
const mug = (x: number, y: number) => group(x, y, path('M1 1h10v10q-5 3-10 0Z', '#d8c6a0') + path('M11 3h3q3 5-3 6') + ellipse(6, 1, 5, 1.5, '#ede5cd') + ellipse(6, 1, 3.4, .8, '#766650'));
const books = (x: number, y: number) => group(x, y, rect(0, 3, 7, 22, '#a6765b') + rect(8, 0, 6, 25, '#6e9294') + rect(15, 5, 9, 20, '#c7b77e') + path('M2 7h3m5-2h2m5 5h5M2 22h3m5-1h2', 'none', '#e7d9b6', .7));
const desk = (x: number, y: number, w: number) => group(x, y,
  path(`M8 5v41h4V5m${w - 24} 0v41h4V5`, '#687569') + rect(0, 0, w, 5, '#b9966b', 1) + line(3, 1, w - 3, 1, '#e1c59a') + line(15, 4, w - 22, 4, '#947950', .5));
const officeChair = (x: number, y: number) => group(x, y,
  rect(0, 0, 27, 28, '#657c72', 5) + rect(3, 3, 21, 21, '#7f9488', 4) + path('M1 31h25q5 3 1 5H0q-4-3 1-5Z', '#5a7167') + path('M6 28v3m14-3v3m-7 5v15m0-2-15 5m15-5 15 5M-2 52v4m30-4v4', 'none', '#536357', 1.4));
const skyline = (x: number, y: number, scale = 1) => group(x, y,
  wash('M0 63V31h16V14h15v49h8V36h20V24h14v39h7V8h18v55h9V34h21v29h10V20h21v43h12V38h20v25Z', '#a7bab4') + rows(7, i => line(8 + i * 27, 45, 8 + i * 27, 54, '#dce3d3', 2)), scale);
const windowFrame = (x: number, y: number, w: number, h: number, content: string) => group(x, y,
  rect(-3, -3, w + 6, h + 6, '#d8dccb') + rect(0, 0, w, h, '#c5d8d4') + content + path(`M0 0h${w}v${h}H0Z M${w / 2} 0v${h} M0 ${h * .66}h${w}`, 'none', '#536e65', 1.6) + rect(-6, h + 2, w + 12, 4, '#b9c6b6') + line(-4, h + 3, w + 4, h + 3, '#e9e8d7'));
const plant = (x: number, y: number, scale = 1) => group(x, y,
  path('M0 0v-43m0 20-12-12m12 4 13-17', 'none', '#57735a', 1.5) + wash('M0-32q-24 1-19-15Q-3-47 0-32M0-22q24 1 20-17Q2-38 0-22M0-40q-11-21 0-26Q12-57 0-40', '#739174') + path('M-11 0h22l-3 23H-8Z', '#45594e') + line(-8, 4, 8, 4, '#7b8e75'), scale);

const bedroom = windowFrame(229, 25, 126, 110,
  circle(94, 25, 17, '#e3c586') + wash('M0 110V75h21V54h29v56h12V70h34V48h30v62Z', '#bcb397') + rows(5, i => line(10 + i * 25, 83, 10 + i * 25, 94, '#dad8be', 3)) + path('M21 0v110m23-110v110m38-110v110m23-110v110', 'none', '#8b9078', .65)) +
  rect(35, 37, 65, 78, '#c7a98d') + rect(39, 41, 57, 70, '#a86659') + group(68, 73,
    path('M-17-12q17-15 34 0l-3 25q-14 18-28 0Z', '#be7863') + path('M-13-5l10 7-3 9-8-6Z M13-5 3 2l3 9 8-6Z', '#ede3c6') + path('M0-19v43m-16-34 32 19m-32 0 32-19M-15-11q15 8 30 0m-29 14q14 9 28 0m-24 13q10 6 20 0', 'none', '#764f48', .6)) +
  desk(24, 190, 188) + monitor(39, 130, 80, 'W3Schools') + keyboard(48, 182, 46) +
  group(146, 144, path('M0 0q8 3 21 0l-3 43q-8-2-15 0Z', '#e9e8d8') + line(6, 8, 16, 8, '#6b7f6b', 1.5) + line(7, 11, 15, 11, '#9aa78e') + circle(11, 32, 3.3, '#95af71') + circle(11, 32, 1.8, '#e8ebd3') + rows(5, i => line(5, 17 + i * 2, 8, 17 + i * 2, '#aab49e', .5))) +
  group(180, 178, path('M0 0q7-6 16 0l4 10q-3 4-8-2H4q-6 6-8 2Z', '#566b5a') + path('M0 2v6m-3-3h6', 'none', '#d7dec4', 1.5) + circle(12, 3, 1, '#c1b15b') + circle(15, 6, 1, '#9aad73')) + officeChair(113, 179) +
  group(269, 180, path('M0 6h111v47H0Z', '#9d8d72') + rect(3, 5, 105, 37, '#b5c0ac', 3) + path('M3 19q29 5 46-1t59 3v21H3Z', '#a0b39c') + path('M43 20q3 12 0 22m8-22q2 12 0 22', 'none', '#d0d7bd', .7) + rect(8, 3, 28, 10, '#ece7d1', 3) + path('M11 6q9-3 21 0', 'none', '#c4cbb3', .6)) +
  circle(234, 225, 9, '#eee9d6') + path('M232 219l5 2 1 5-5 3-4-5Z M226 222l3 2m4 5-1 5m6-8 5-1', '#667866', ink, .6);

// His San Francisco photograph: the sign, bridge and planted foreground.
const google = wash('M0 148h390v85H0Z', '#c8d5bc') + wash('M0 153q39-27 87-8t111-10 104 5 88 2v29H0Z', '#a8bf9b') +
  path('M26 128V18h11v110M26 22l11 25-11 25 11 26-11 27M37 27q116 65 276 15', 'none', '#8da39d', 1.8) + line(0, 132, 390, 67, '#829a91', 4) + rows(13, i => { const x = 49 + i * 21; return line(x, 45 + Math.sin(i / 12 * Math.PI) * 28, x, 124 - (x - 49) * .16, '#a8bcb0', .8); }) +
  group(74, 93, path('M0 79V0m0 22q-19-16-29-9m29 3q20-20 36-10m-36 10q-4-29-18-35m18 35q15-30 29-31', 'none', '#688361', 3)) + rect(138, 82, 229, 112, '#eeeede') + wash('M138 176h229v18H138Z', '#42574d') +
  `<text x="154" y="132" font-family="Inter, sans-serif" font-size="43" font-weight="600" letter-spacing="-2">${[...'Google'].map((c, i) => `<tspan fill="${['#507fa1', '#b86c56', '#c2a057', '#507fa1', '#62895c', '#b86c56'][i]}">${c}</tspan>`).join('')}</text>` + label(158, 161, 'San Francisco', 13, '#42574d') +
  rect(49, 170, 58, 48, '#d3ba88', 2) + rect(53, 174, 50, 40, '#eee8d2') + label(59, 187, 'Google Code-in', 6.1) + label(59, 198, 'Drupal', 9) + label(59, 208, 'Grand prize', 5.5) +
  path('M42 233h340M131 204v29m226-29v29M62 218v15m33-15v15', 'none', '#7b8d73', 1.3) + wash('M141 216q12-20 24-7 15-25 29-7 17-16 30 0 18-21 34-3 18-23 36-6 17-18 31-3 22-14 39 9v34H141Z', '#829e73') + rows(7, i => path(`M${151 + i * 31} 223l5-10m-5 6-5-6`, 'none', '#b4c396', .7));

const webcube = windowFrame(274, 29, 88, 105, skyline(1, 49, .44)) + rect(27, 30, 166, 61, '#e6dfc9', 1) + label(38, 46, 'Covid Leads Delhi', 10) +
  ['Beds', 'Oxygen', 'Plasma'].map((title, i) => label(38 + i * 50, 59, title, 6) + rows(3, row => line(38 + i * 50, 67 + row * 6, 73 + i * 50, 67 + row * 6, '#97a38b', .8))).join('') +
  path('M31 96h159', 'none', '#a58d68', 4) + books(204, 71) + line(202, 96, 244, 96, '#9e8b68', 4) + desk(24, 191, 242) + monitor(37, 133, 80, 'Webcube') + keyboard(43, 183, 47) + mug(238, 176) +
  group(158, 154, rect(0, 0, 46, 34, '#eee7d0') + rect(14, -3, 18, 5, '#9ca88e', 1) + label(6, 11, 'Webcube', 7) + path('M6 17h33m-33 5h26m-25 7 6-4 4 2 8-5', 'none', '#839680', .8)) +
  group(216, 174, rect(0, 0, 10, 16, '#45584e', 2) + rect(2, 2, 6, 10, '#b9cfb3', 1) + circle(5, 14, .6, '#dbe0c5')) + officeChair(116, 179) + plant(332, 212, .95) + path('M74 191q-9 24 14 26t-3 15', 'none', '#7b8f79', .7);

const university = rect(27, 13, 291, 220, '#899ba2') + rows(8, col => line(28 + col * 40, 14, 28 + col * 40, 232, '#607981', .7)) + rows(6, row => line(28, 17 + row * 41, 317, 17 + row * 41, '#607981', .7)) + rect(47, 28, 251, 131, '#608d9e') +
  rows(7, col => rows(3, row => { const x = 49 + col * 35.4, y = 30 + row * 42.8; return rect(x, y, 33.1, 40.5, ['#91b2ba', '#739da9', '#a6c0c0'][(col + row) % 3]) + (row === 2 ? rows(9, k => line(x + 1, y + 4 + k * 3.8, x + 32, y + 4 + k * 3.8, '#b9cdca', .45)) : path(`M${x + 2} ${y + 6}l29 16m-29-10 17 9`, 'none', '#b8cfd0', .7)); })) +
  path('M46 27h253v133H46Z', 'none', '#3e5a62', 2) + label(44, 177, 'Goldberg Computer Science Building', 7.4, '#e9e8d8', 600) + rect(119, 190, 83, 43, '#3e5861') + rect(123, 194, 34, 39, '#9bb7bd') + rect(163, 194, 34, 39, '#9bb7bd') + path('M151 209v12m18-12v12', 'none', '#e4e6d5', 1.2) + line(116, 188, 205, 188, '#d1d7ce', 3) +
  rect(40, 194, 59, 21, '#ded8b4') + label(46, 207, 'Dalhousie', 8) + wash('M12 234q18-7 37-2h53l-6 2Z M213 234l8-3h99q9-6 21 3Z', '#edf0de') +
  group(324, 179, path('M0 37h62v5H0Zm6 5v12m49-12v12', '#a48c67')) + path('M9 233V132m0 21-9-12m9 26 12-20m-12 43-9-11', 'none', '#8a9780', 1.2);

const audience = (x: number, y: number, i: number, color = '#b46c53') => group(x, y,
  path('M5 22q-1-14 12-14t12 14l3 7H3Z', ['#758d7e', '#a6ad92', '#8a9fa5', '#b0a083'][i % 4]) + path('M7 18l-3 10m23-10 4 10', 'none', '#566c5e', 1.2) + circle(17, 5, 6, ['#bc916c', '#bd9a80', '#c8aa88'][i % 3]) +
  path(i % 2 ? 'M11 7V2q6-9 12 0v6l-3-6h-7Z' : 'M11 4V1q6-7 12 0v3l-6-3Z', '#4c5147') + path('M1 24q16-4 32 0l-2 15H3Z', color) + path('M4 39v10m26-10v10m-26-5h26', 'none', '#66756a', 1));
const lecture = rect(31, 24, 252, 111, '#eae7d5', 1) + rect(36, 29, 242, 101, '#f3efdc') + label(49, 50, 'ShiftKey Labs', 15, '#354f47', 600) + label(50, 65, 'Generative AI', 8) +
  ['Prompt', 'Model', 'Output'].map((text, i) => rect(54 + i * 75, 85, 54, 24, '#d1dcc5', 3) + label(64 + i * 75, 100, text, 7)).join('') + path('M109 97h19m-4-3 4 3-4 3m80-3h19m-4-3 4 3-4 3', 'none', '#819b87', 1) +
  path('M20 234v-29h350v29', '#a2957d') + line(21, 205, 369, 205, '#dbccb0', 2) + rect(42, 166, 47, 39, '#a88a61') + path('M39 160h52v6H39Z', '#cab18a') + path('M61 160v-17l9-5m-2-2h7', 'none', '#43574d', 1.4) +
  rows(2, row => rows(4, col => audience(156 + col * 51, 154 + row * 31, row + col))) +
  group(321, 117, path('M-10-22h20v13Q10 3 0 3T-10-9Z', '#d0b369') + path('M-10-18h-6q-1 14 10 12m16-12h6q1 14-10 12M0 3v11m-9 0H9', 'none', '#8c8054', 1.4) + rect(-13, 15, 26, 6, '#778571') + line(-6, -18, -6, -8, '#ebd395', 1.2) + rect(-22, 22, 44, 4, '#b99c73') + path('M-15 26v8l8-8m22 0v8l-8-8', 'none', '#87927b'));

const sails = path('M0 45Q13 14 35 0L45 45Q51 17 69 9L82 45Q93 26 105 22L117 45Z', '#f0eedc', '#789691') + path('M8 45 35 0m-14 45L35 0m20 45L69 9m-1 36L69 9m19 36 17-23', 'none', '#b5c4b8', .6) + path('M-3 46h123l-4 6H2Z', '#b6c4b8') + line(-8, 57, 123, 57, '#8da99f');
const beanMark = path('M0 29h29l5-14h12l-7 14h22q-1-26-29-27Q4 3 0 29Z M-2 29q0 7 7 7h24l3-7m7 0-9 27 21-27m-4 7h12q8 0 8-7M28 2v-3q-4-6 3-6t3 6v3', 'none', '#c97732', 2.5);
const bean = wash('M1 105l32-58 20 32 32-50 47 76Z', '#b6cbbb') + wash('M24 65l9-18 10 17-10-4Z M74 47l11-18 15 23-14-8Z', '#f0efdc') + skyline(1, 67, .66) + label(9, 126, 'Vancouver', 8) + group(242, 29, sails, .9) + label(280, 94, 'Sydney', 8) + path('M159 104Q185 24 255 42', 'none', '#91aa95', .8) + circle(159, 104, 2.2, '#d3bc80') + label(139, 119, 'Halifax', 7) +
  group(19, 139, rect(0, 0, 61, 94, '#d5ddca', 4) + rect(3, 3, 55, 26, '#e2e6d3', 3) + rect(3, 32, 55, 59, '#e2e6d3', 3) + path('M48 11v11m0 20v19', 'none', '#6b8574', 2) + rect(10, 41, 26, 34, '#efe8c8') + circle(23, 43, 2, '#b89160') + path('M14 51h17m-17 5h13m-13 5h16m-16 5h11', 'none', '#879d7b', .7) + path('M7 94h8m31 0h8', 'none', '#738671', 2)) +
  group(110, 134, path('M9 73 2 100m73-27 7 27M6 88h73', 'none', '#97a287', 1.3) + rect(0, 0, 84, 73, '#eee5c9', 1) + label(8, 17, '$40k', 19, ink, 600) + label(8, 30, 'funding', 9) + line(8, 37, 76, 37, '#b5b18e') + label(8, 49, 'Invest Nova Scotia', 6.8) + label(8, 59, 'Accelerate', 7.5) + label(8, 68, 'PH #4', 6)) +
  group(215, 139, rect(0, 0, 146, 94, '#d4d8bc', 2) + path('M-5 0h156v6H-5Z', '#eee9d3') + group(15, 23, beanMark, .46) + label(55, 40, 'bean', 27, '#bf7330', 500) + label(17, 58, 'Web Summit Vancouver', 7.2) + line(16, 64, 129, 64, '#b2bea1') +
    path('M16 76q9-15 20 0t20 0m-40 8h40', 'none', '#819c72', 1.5) + rect(96, 67, 32, 22, '#f0e9d2') + label(102, 75, 'MOU', 6) + path('M101 79h21m-20 7 5-4 3 2 7-5', 'none', '#839777', .6)) +
  group(250, 111, path('M0 0l7 11L14 0', 'none', '#7e9b80', 1.2) + rect(-1, 11, 17, 17, '#ede5c9', 1) + label(2, 18, 'Web', 4.8) + label(2, 24, 'Summit', 3.6)) + mug(326, 125) + group(181, 212, path('M0 0v-10h8V0') + rect(-4, 0, 17, 19, '#ad8d64', 2) + line(1, 3, 1, 16, '#d1bb91') + line(8, 3, 8, 16, '#d1bb91'));

// Volta's sloped glazing, harbour clock tower and plain projection wall.
const collect = wash('M0 192h390v42H0Z', '#c5c7b8') + path('M219 30h160v129H207Z', '#b9cecc', '#9eb3a6') + wash('M211 121h168v38H208Z', '#8fbbb9') + skyline(282, 88, .48) +
  group(229, 86, path('M0 67V29h12V11l14-31 14 31v18h12v38Z', '#bda981') + path('M12 11l14-31 14 31Z', '#73958d') + circle(26, 20, 6, '#e8dfbe') + path('M26 16v5l3 1') + path('M19 46v-9q7-8 14 0v9', '#6b8c87') + rows(3, i => rect(4 + i * 17, 52, 9, 13, '#8b9e8a'))) +
  path('M219 30 207 159m65-129-5 129m62-129 5 129m45-129v129', 'none', '#e6e8d8', 4) + rect(206, 159, 178, 13, '#d7ddcd') + rows(24, i => line(213 + i * 7, 162, 213 + i * 7, 168, '#9ea99a', .6)) +
  rect(0, 29, 205, 154, '#c8c0a9') + rect(11, 104, 25, 79, '#48534a') + rect(13, 126, 12, 16, '#d9d9c4') + label(14, 132, 'VOLTA', 2.9) + label(16, 139, '825', 4) + wash('M50 65h139v86H50Z', '#edf0dc') + label(65, 92, 'collect.', 20, '#665071', 600) + label(66, 113, 'Demo Day', 11) + path('M66 132h35m8 0h19m7 0h28', 'none', '#a2b395', 2) +
  rect(0, 10, 390, 20, '#35463e') + path('M8 15h360M36 15v15m85-15v15m119-15v15m100-15v15', 'none', '#5e6e5d', 2) +
  [82, 291].map(x => line(x - 24, 28, x - 34, 45) + line(x + 23, 28, x + 33, 45) + `<ellipse cx="${x}" cy="48" rx="47" ry="9" fill="none" stroke="#36473e" stroke-width="4"/>` + `<ellipse cx="${x}" cy="50" rx="44" ry="7" fill="none" stroke="#ead5a6" stroke-width="1.8"/>`).join('') +
  path('M66 197v35m-19 0h39', 'none', '#e7e8d7', 3) + ellipse(67, 194, 28, 4, '#eef0df') + mug(54, 181) + rows(2, row => rows(3, col => audience(183 + col * 54, 154 + row * 30, col + row, '#ba6b4e'))) + plant(365, 215.6, .8);

const graduation = rect(10, 34, 276, 190, '#d2c9af') + rect(22, 44, 252, 168, '#e9e3cd') +
  path('M10 34h31v171l-15-13-16 13Z M255 34h31v171l-16-13-15 13Z', '#536459') + rows(3, i => path(`M${16 + i * 9} 39v149m${245 - i * 18} -149v149`, 'none', '#778273', .6)) +
  label(66, 92, 'Dalhousie', 24, '#354b42', 600) + label(126, 116, '2026', 14, '#8d764c') + line(74, 128, 224, 128, '#b5a77d') + label(85, 144, 'BSc Computer Science', 9) +
  rect(8, 222, 280, 12, '#b49b73') + line(9, 223, 287, 223, '#e6d2a8', 2) +
  group(214, 166, path('M3 5h39l-3 49H6Z', '#a48b65') + rect(0, 0, 45, 5, '#d4bd92', 1) + path('M17 54h15l6 12H11Z', '#947f5f') + path('M22 0v-15l8-5m-1-1h5', 'none', '#43574d', 1.1) + rect(14, 16, 17, 22, '#ddd1aa') + label(17, 30, 'Dal', 7));

const foamMark = group(24, 31, rows(30, i => {
  const col = i % 5, row = Math.floor(i / 5);
  const orange = (row === 1 && col > 0 && col < 4) || (row === 2 && col === 1) || (row === 3 && col > 1 && col < 4) || (row === 4 && col === 1);
  return group(col * 16, row * 16, rect(0, 0, 16, 16, orange ? '#ca742d' : '#344139') + rows(9, k => {
    const x = k % 3 * 5.33, y = Math.floor(k / 3) * 5.33;
    return wash(`M${x} ${y}l5.33 0-2.66 2.66Z`, orange ? '#e69644' : '#4b574c') + wash(`M${x} ${y}l2.67 2.66-2.67 2.67Z`, orange ? '#d58132' : '#3f4b42') + wash(`M${x} ${y + 5.33}l2.67-2.67 2.66 2.67Z`, orange ? '#b86629' : '#29362f');
  }));
}));
const floqer = windowFrame(181, 20, 190, 109,
  wash('M0 77q18-39 37-21 23-42 43-11 25-34 50-9 33-27 60 18v55H0Z', '#9eb28b') + path('M48 0v109m-2-51-19-14m21-13 24-11m63-20v109m0-61-24-14m24-10 23-17', 'none', '#7e956f', 1.6) + wash('M0 85h190v24H0Z', '#b4b8a0') + rows(7, i => line(0, 87 + i * 3, 190, 87 + i * 3, '#a1ac92', .5)) +
  path('M32 0v109m32-109v109m64-109v109m32-109v109M0 29h190m-190 34h190', 'none', '#354e42', 2) + wash('M0 0h190v17H0Z', '#66766a') + rows(5, i => line(0, 3 + i * 3, 190, 3 + i * 3, '#94a38b', .55))) + foamMark +
  rect(119, 53, 50, 40, '#e4dec5', 1) + label(124, 65, 'TechCrunch', 5.5) + label(124, 76, 'Disrupt', 7) + label(124, 86, 'Top 20', 5.8) +
  path('M31 194l-5 39m12-39 7 39m-16-12h14m215-27-5 39m12-39 7 39m-16-12h14', 'none', '#d6dcc7', 3) + rect(20, 189, 272, 5, '#d4bd92', 1) + line(23, 190, 289, 190, '#efe1bb') + monitor(33, 132, 91, 'Floqer') + keyboard(43, 181, 52) +
  group(154, 167, rect(0, 0, 29, 21, '#b5c2b1', 1) + rect(2, 2, 25, 17, '#2f4540') + code(5, 5, 17) + path('M-4 21h37l3 2H-7Z', '#d6dcc8')) +
  group(244, 141, rect(0, 0, 33, 47, '#ececdd', 7) + rect(22, 4, 8, 39, '#4b6255', 4) + rows(7, i => line(5, 21 + i * 2, 18, 21 + i * 2, '#a9b5a2', .55)) + circle(26, 12, 3, '#879e83')) +
  mug(212, 174) + group(192, 174, rect(0, 0, 8, 14, '#98a7a0', 2) + line(1, 3, 7, 3, '#d7dec9') + label(1, 10, 'F', 6, '#49694e')) + path('M80 190q-9 23 26 25t-3 16m67-41q-20 23 37 23t32 17', 'none', '#7b8e76', .75) + rect(189, 228, 39, 5, '#e5e5d2', 1) + rows(5, i => path(`M${193 + i * 6} 229v2m2-2v2`, 'none', '#85947d', .5)) +
  group(303, 137, rect(0, 0, 74, 66, '#e8e8d7', 2) + rect(3, 3, 68, 57, '#eff0df') + label(7, 12, 'Vansh', 6) + ['To-do', 'Failed', 'Passed', 'Prod'].map((t, i) => label(6 + i * 17, 23, t, 3.7)).join('') + rows(16, i => rect(6 + i % 4 * 17, 27 + Math.floor(i / 4) * 8, 12, 6, ['#d4bf70', '#cf9c85', '#b2c57c', '#e0c381'][i % 4])) + path('M7 66v26m59-26v26M1 92h13m46 0h13', 'none', '#7d8d79', 1.3) + circle(3, 94, 2, '#5a6f5b') + circle(71, 94, 2, '#5a6f5b'));

export const LANDMARKS: Record<string, string> = { delhi: bedroom, google, webcube, university, shiftkey: lecture, bean, collect, graduation, floqer };

export function transitArtwork(start: number, end: number) {
  const width = end - start;
  return group(start, 0, wash(`M0 189q${width / 2}-8 ${width} 0v71H0Z`, '#b9d2cf') + line(0, 190, width, 190, '#a2bfba', .65) +
    rows(12, i => path(`M${25 + i * 61} ${207 + i % 3 * 15}q12-3 25 0t22 0`, 'none', '#d8e3d6', .8)) +
    rows(4, i => group(160 + i * 159, 80 + i % 2 * 39, wash('M-35 7q-2-9 10-11 3-20 23-16 13-7 22 8 17-1 20 12 13 0 14 8Z', '#edf0e0'))) +
    wash('M0 213h200l28 47H0Z', '#b6bca9') + wash(`M${width - 170} 220h170v40H${width - 199}Z`, '#b6bca9') +
    rows(7, i => line(7 + i * 27, 243, 22 + i * 27, 243, '#eef0dd', 2)) + rows(6, i => line(width - 160 + i * 28, 243, width - 145 + i * 28, 243, '#eef0dd', 2)) +
    group(3, 173, rect(0, 0, 63, 21, '#667d70', 2) + label(10, 14, 'DELHI', 9, '#e9e9d3') + path('M10 21v38m44-38v38', 'none', '#6e8575', 1.3)) +
    group(width - 77, 175, rect(0, 0, 71, 21, '#667d70', 2) + label(9, 14, 'HALIFAX', 9, '#e9e9d3') + path('M9 21v38m53-38v38', 'none', '#6e8575', 1.3)));
}

// Passenger aircraft side profile, with an engine and retracting landing gear.
export const AEROPLANE = path('M-14-36l-39-29h16l63 29', '#a7bcb0') + path('M-96-31l-10-45h15l31 43', '#7f9d89') + path('M-100-69h9l18 27', 'none', '#c5d1b7', 2) +
  path('M-109-31q29-8 50-8h128q20 0 30 9l24 12q8 7-7 9H-73q-19-2-36-17Z', '#f0edde') + wash('M-105-24q18 10 35 10h184l-3 5H-73q-19-2-32-15Z', '#baccc0') + line(-70, -35, 74, -35, '#fff9e5', 1.4) + path('M86-33l13 6 8 6H84Z', '#4b7278') + line(94, -30, 95, -22, '#e6ead7', .7) +
  rows(12, i => rect(-66 + i * 11.5, -30, 4.5, 7, '#89adb2', 1.8)) + rect(-82, -32, 9, 21, 'none', 3) + rect(72, -32, 9, 21, 'none', 3) + path('M-79-20h3m149 0h3', 'none', '#8ba191', .6) +
  path('M-3-25l-39 24h24l57-21', '#b4c6ba') + line(-31, -3, 26, -23, '#e0e6d1', .8) + path('M6-20v9h10v-12', '#7f9d90') + path('M-4-11q0-8 8-8h18q9 0 9 8t-9 8H4q-8 0-8-8Z', '#d7e1cc') + ellipse(24, -11, 7, 7, '#75938c') + ellipse(25, -11, 4.5, 5, '#3f635f') + ellipse(25, -11, 1.5, 2, '#a1b8aa') + path('M-103-26l-17 7h32l14-6', '#a7bdb0') +
  wash('M15-25v-3h3v3Z', '#c9996d') + wash('M15-28v-2h3v2Z', '#282a27') +
  `<g class="plane-gear">${path('M-35-10v8m3-8v8m115-9v10', 'none', '#5f786d', 1.6) + circle(-36, 0, 3, '#40564c') + circle(-30, 0, 3, '#40564c') + circle(84, 1, 2.5, '#40564c')}</g>`;
