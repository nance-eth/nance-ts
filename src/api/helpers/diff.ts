import { diffLines } from 'diff';

export type DiffLines = { added: number; removed: number };

export function diffLineCounts(b1: string, b2: string): DiffLines {
  const diff = diffLines(b1, b2);
  let added = 0;
  let removed = 0;
  diff.forEach((d) => {
    if (d.added) added += 1;
    else if (d.removed) removed += 1;
  });
  return { added, removed };
}
