export type Placement = { row: number; column: number; rowSpan: number; columnSpan: number };

/** Newest first. Reading minutes set preferred widths; every row is filled. */
export function tile(minutes: readonly number[], columns: 1 | 2 | 4 = 4) {
  const panes: Placement[] = new Array(minutes.length);
  const pending = minutes.map((_, index) => index);
  let row = 1;
  const put = (index: number, r: number, column: number, rowSpan: number, columnSpan: number) => {
    panes[index] = { row: r, column, rowSpan, columnSpan };
  };
  const width = (index: number) => Math.min(columns, index === 0 || minutes[index] >= 3 ? 2 : 1);

  if (columns === 4 && minutes.length === 2) {
    put(0, 1, 1, 1, 3);
    put(1, 1, 4, 1, 1);
    return { panes, rows: 1 };
  }

  while (pending.length) {
    const group = pending.slice(0, 4);
    const feature = group.includes(0) ? 0 : group.reduce((a, b) => minutes[b] > minutes[a] ? b : a);
    if (columns === 4 && group.length >= 3 && (feature === 0 || minutes[feature] >= 5)) {
      // A two-row band: one square and two or three panes filling the other half.
      pending.splice(0, group.length);
      const featureColumn = group.indexOf(feature) < 2 ? 1 : 3;
      const otherColumn = featureColumn === 1 ? 3 : 1;
      put(feature, row, featureColumn, 2, 2);
      const others = group.filter(index => index !== feature);
      const widest = others.reduce((a, b) => minutes[b] > minutes[a] ? b : a);
      others.splice(others.indexOf(widest), 1);
      put(widest, row, otherColumn, 1, 2);
      others.forEach((index, offset) => put(index, row + 1, otherColumn + offset, 1, 2 / others.length));
      row += 2;
      continue;
    }

    let column = 1;
    let last = -1;
    while (pending.length && column <= columns) {
      const next = pending.findIndex(index => width(index) <= columns - column + 1);
      if (next < 0) break;
      const [index] = pending.splice(next, 1);
      put(index, row, column, 1, width(index));
      column += width(index);
      last = index;
    }
    // Stretch the last pane into any remainder, including the final partial row.
    if (column <= columns) panes[last].columnSpan += columns - column + 1;
    row++;
  }
  return { panes, rows: row - 1 };
}
