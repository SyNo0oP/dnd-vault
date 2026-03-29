// Bonus raciaux D&D 5e SRD — clés françaises (identiques à characters/create)
export const raceData: Record<string, { stats: Record<string, number>; speed: number; languages: string[] }> = {
  Humain: { stats: { force: 1, dexterite: 1, constitution: 1, intelligence: 1, sagesse: 1, charisme: 1 }, speed: 9, languages: ["Commun", "Une langue au choix"] },
  Elfe: { stats: { dexterite: 2 }, speed: 9, languages: ["Commun", "Elfique"] },
  Nain: { stats: { constitution: 2 }, speed: 7.5, languages: ["Commun", "Nain"] },
  Halfelin: { stats: { dexterite: 2 }, speed: 7.5, languages: ["Commun", "Halfelin"] },
  "Demi-Orc": { stats: { force: 2, constitution: 1 }, speed: 9, languages: ["Commun", "Orc"] },
  Drakéide: { stats: { force: 2, charisme: 1 }, speed: 9, languages: ["Commun", "Draconique"] },
  Gnome: { stats: { intelligence: 2 }, speed: 7.5, languages: ["Commun", "Gnome"] },
  Tieffelin: { stats: { intelligence: 1, charisme: 2 }, speed: 9, languages: ["Commun", "Infernal"] },
};

export function getRaceBonus(race: string): Record<string, number> {
  return raceData[race]?.stats ?? {};
}
