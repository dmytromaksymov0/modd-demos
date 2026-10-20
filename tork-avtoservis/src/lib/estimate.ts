// Interactive estimate in the master's chat: each line is "Робимо" or "Відкласти"; total = labour + parts of
// the lines marked "Робимо". Pure — unit-tested in phase 5.
export type Line = { id: string; labour: number; parts: number; doing: boolean; comboWith?: string; comboSaving?: number };

export function estimateTotal(lines: Line[]): { total: number; labour: number; parts: number; saving: number } {
  const doing = lines.filter((l) => l.doing);
  let labour = doing.reduce((s, l) => s + l.labour, 0);
  const parts = doing.reduce((s, l) => s + l.parts, 0);
  let saving = 0;
  for (const l of doing) if (l.comboWith && l.comboSaving && doing.some((d) => d.id === l.comboWith)) { labour -= l.comboSaving; saving += l.comboSaving; }
  return { total: labour + parts, labour, parts, saving };
}
