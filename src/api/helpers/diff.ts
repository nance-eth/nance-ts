import * as Diff from 'diff';

export function diffBody(b1: string, b2: string) {
  const diff = Diff.createPatch('', b1, b2, '', '');
  const cleaned = diff.split('\n').slice(4).join('\n');
  return cleaned;
}
