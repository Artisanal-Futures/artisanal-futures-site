"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { DisplaySector } from "~/lib/constants/shop-sectors";
import { OTHER_SECTOR } from "~/lib/constants/shop-sectors";

const MapSectorsContext = createContext<readonly DisplaySector[]>([
  OTHER_SECTOR,
]);

/** Supplies the sectors the page fetched to the map, chips, cards and export. */
export function MapSectorsProvider({
  sectors,
  children,
}: {
  sectors: readonly DisplaySector[];
  children: ReactNode;
}) {
  return (
    <MapSectorsContext.Provider value={sectors}>
      {children}
    </MapSectorsContext.Provider>
  );
}

/** Every sector, in display order, ending with "Other". */
export const useMapSectors = () => useContext(MapSectorsContext);
