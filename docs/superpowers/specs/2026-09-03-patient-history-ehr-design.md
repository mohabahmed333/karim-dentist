# Patient history EHR — domain & API

Date: 2026-09-03

## Goal

Drive the admin patient-history dashboard from a single clinical projection: 32-tooth chart, condition graph, timeline slice, and bento widgets. UI is a view. Computed rules live in `src/services/dental_chart/`.

Patient identity stays `patient_key` (phone, else name) so this layer fits reservations and tooth notes. Universal numbers (#1–#32) are the dashboard coordinate system; FDI is stored alongside for the odontogram.

## Corrections to the brief

- `ABSCEE` → `PERIAPICAL_ABSCESS`.
- `ENDODONTIC_INFECTION` and `PERIAPICAL_ABSCESS` always coerce to `CRITICAL` while `ACTIVE`. Any tooth with an active critical condition glows (mockup: #14).
- Stream also includes `TOOTH_FRACTURE` and `IMPLANT_DEGRADATION` (dashboard list). They are not auto-critical.
- `activeAlertCount` = count of `status === ACTIVE` on that tooth (not related encounters).
- Timeline years render 2022→2014 (recent left). Range state always uses `startYear <= endYear`.

## Persistence

v1 is a **computed chart**: seed clinical overlay + live reservations as encounters + tooth notes as endodontic notes. POST `/encounters` inserts a `reservations` row. Dedicated condition/lab/rx tables are the next migration; the Zod models are the contract those tables must match.

## State machine

| Field | Values |
| --- | --- |
| `activeTab` | `overview` `notes` `perio` `labs` `imaging` |
| `selectedToothId` | Universal 1–32 or `null` (all teeth) |
| `selectedConditionId` | Stream node id or `null` |
| `timelineRange` | `{ startYear, endYear }` default `{ 2015, 2016 }` |
| `zoomLevel` | 1 cluster by year, 2 by month, 3 discrete days |

Events: `onSelectTooth` filters the stream and highlights the arch; `onSelectConditionNode` rebuilds the Bezier graph; `onScrubTimeline` refilters medications, visits, and labs.

## APIs (admin cookie)

- `GET /api/v1/patients/{id}/dental-chart`
- `GET /api/v1/patients/{id}/conditions/{conditionId}/node-graph`
- `GET /api/v1/patients/{id}/timeline?start=&end=`
- `POST /api/v1/patients/{id}/encounters`

401 if unauthenticated. 404 if `patient_key` is unknown.

## Clinical validation

- Tooth number 1–32 or FDI 11–48 (convertible).
- Encounter must cite ≥1 tooth.
- Lab `progressPercent` is derived from `status` (webhook may set status; percent is not client-trusted).
- Prescription `EXPIRED` when `endDate < today`.
- Vitality index required for `ENDODONTIC_INFECTION` (0–180).

## Tests

`src/services/dental_chart/*.test.ts` — numbering, alerts, graph links, timeline filter/cluster, lab progress.
