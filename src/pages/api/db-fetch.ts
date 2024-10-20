/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";
import * as Papa from "papaparse";

import { supabase } from "~/server/supabase/client";

const dbFetchHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    try {
      const { dataType } = req.query;

      if (dataType && dataType === "customers") {
        const { data: specificData, error: specificError } =
          await supabase.storage.from("routes").download(`daz_deliveries.csv`);

        if (specificError)
          return res.status(500).json({ error: specificError });
        const text = await specificData.text();

        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (result) => {
            // const parsedData = result.data.map(
            //   (row: unknown) => parseStop(row as any) as any
            // );

            res.status(200).json(result);
          },
        });
      }

      if (dataType && dataType === "drivers") {
        const { data: specificData, error: specificError } =
          await supabase.storage.from("routes").download(`daz_drivers.csv`);

        if (specificError)
          return res.status(500).json({ error: specificError });
        const text = await specificData.text();

        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (result) => {
            // const parsedData = result.data.map(
            //   (row: unknown) => parseDriver(row as any) as any
            // );

            res.status(200).json(result);
          },
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: "Error getting routes" });
    }
  }

  return res.status(405).end(); // Method Not Allowed if not GET
};

export default dbFetchHandler;
