// Mapping for correct species names display
const SPECIES_DISPLAY_NAMES: Record<string, string> = {
  "Lori": "Loris",
  "Amazona": "Amazonas",
};

export function getSpeciesDisplayName(species: string): string {
  return SPECIES_DISPLAY_NAMES[species] || species;
}
