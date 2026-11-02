# Artisan Map boundary overlays

Static GeoJSON files for the Artisan Map's **Layers** menu (`?layer=`). Each file is
fetched only when someone switches its layer on. Layer config lives in
`src/app/(site)/tools/artisan-map/_lib/boundaries.ts`.

If a file is missing or broken, the map keeps working. The Layers menu shows a short
"aren't available" notice for that layer.

## Expected files

| Layer (`?layer=`) | File                                   | Suggested source                                                                   |
| ----------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| `council`         | `detroit-council-districts.v1.geojson` | data.detroitmi.gov: "City Council Districts"                                       |
| `neighborhoods`   | `detroit-neighborhoods.v1.geojson`     | data.detroitmi.gov: "Current City of Detroit Neighborhoods"                        |
| `zip`             | `detroit-zip-codes.v1.geojson`         | U.S. Census Bureau TIGER/Line ZCTA (ZIP Code Tabulation Areas), clipped to Detroit |

To publish a new cut, bump the version (`.v2.geojson`) and update the `url` in
`boundaries.ts`, so browsers don't keep a cached copy.

## Format

- One `FeatureCollection` in WGS84 (lng/lat), coordinates rounded to about 5 decimals.
- **Polygon / MultiPolygon features** carry a single property, `label`
  (e.g. `"District 5"`, `"Corktown"`, `"48226"`). Drop every other property.
- **Point features**, one per area, carry the same `label` and sit _inside_ their
  polygon. They're where the text label is drawn. Without them the map falls back to
  placing labels itself, which is less tidy for odd shapes.
- Keep each file under **150 KB**: simplify until it looks right at zoom 10–14.

## Example (mapshaper)

Check the source's field names first with `mapshaper raw/council.geojson -info`, then
swap them into the `-each` expression:

```sh
mapshaper raw/council.geojson \
  -proj wgs84 \
  -simplify 10% keep-shapes \
  -each 'label = "District " + district_number' \
  -filter-fields label \
  -points inner + name=labels \
  -o target=* combine-layers format=geojson precision=0.00001 \
     detroit-council-districts.v1.geojson
```

For ZIP codes, start from the national ZCTA shapefile and keep only Detroit's, e.g.
`-clip bbox=-83.2877,42.2551,-82.9105,42.4502` (or `-filter` on a list of Detroit
ZIPs), then `-each 'label = ZCTA5CE20'` and the same steps as above.

## Licences

Check each dataset's terms on its source page and update `license` in
`boundaries.ts` if needed. TIGER/Line files are U.S. Government works (public
domain). The source is credited in the map's attribution while a layer is on.
