/** Read-only projections of the WorldState for the UI: only what the crew knows. */
import type { Disposition, ShipId, WorldState } from '../engine/types';
import type { ScenarioModule } from '../engine/scenario';
import { bearingFrom, range } from '../engine/rules';

export interface ContactView {
  id: ShipId;
  name: string;
  classification: string;
  faction: string;
  range: number;
  bearing: number;
  disposition: Disposition;
  scanned: boolean;
  destroyed: boolean;
  details: string[];
}

const FACTION_LABEL: Record<string, string> = { concord: 'Concord', directorate: 'Tessarine Directorate', independent: 'Independent' };

export function contactsView(s: WorldState, scenario: ScenarioModule): ContactView[] {
  const h = s.ships.halcyon;
  return (['kestrel', 'cruiser'] as const)
    .filter((id) => s.ships[id].detected)
    .map((id) => {
      const sh = s.ships[id];
      const known = sh.scanLevel > 0;
      return {
        id,
        name: known ? sh.name : `Unidentified ${id === 'cruiser' ? 'warship' : 'vessel'}`,
        classification: known ? sh.classification : 'Unknown configuration',
        faction: known ? (FACTION_LABEL[sh.faction] ?? sh.faction) : 'Unknown',
        range: range(s, 'halcyon', id),
        bearing: Math.round(bearingFrom(h.position, sh.position)),
        disposition: sh.disposition,
        scanned: sh.scanLevel >= 2,
        destroyed: sh.destroyed,
        details: scenario.contactDetails(s, id),
      };
    });
}
