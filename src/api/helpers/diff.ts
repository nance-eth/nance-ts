import * as Diff from 'diff';

export function diffBody(b1: string, b2: string) {
  const diff = Diff.createPatch('', b1, b2, '', '');
  // let res = '';
  // diff.forEach((part) => {
  //   if (part.added) {
  //     res += `+ ${part.value}`;
  //   } else if (part.removed) {
  //     res += `- ${part.value}`;
  //   }
  // });
  // return res;
  const cleaned = diff.split('\n').slice(4).join('\n');
  return cleaned;
}
