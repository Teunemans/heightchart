# Height chart

Same mechanism as Compass: a static site (HTML, CSS, JS) → Google Form → Google Sheet → published CSV tab → the site reads it and draws everyone as silhouettes on a deliberately truncated axis.

Try locally: `python3 -m http.server 8000` in this folder, open http://localhost:8000.
Deploy: push to GitHub, Settings → Pages → branch `main`, folder `/ (root)`.

## Google Form
1. Form with four **Short answer** questions, in this order, **all optional** (switch "Verplicht/Required" off): `code`, `kind`, `key`, `consent`.
2. Settings → Responses: no email collection, no "Limit to 1 response".
3. Responses → Link to Sheets (new spreadsheet).
4. ⋮ → Get pre-filled link, type `x` in all four fields, copy the link.
5. In `config.js`: `action` = that link up to `/formResponse`; fill the four `entry.` numbers (code, kind, key, consent).

## Sheet: public tab
Add a tab (here `Blad1`) and put this in A1 (Dutch Sheets: use `;` instead of `,`):

    =IFERROR(FILTER(INDIRECT("'Formulierreacties 1'!B2:B"); INDIRECT("'Formulierreacties 1'!C2:C")="add"; COUNTIFS(INDIRECT("'Formulierreacties 1'!D2:D"); INDIRECT("'Formulierreacties 1'!D2:D"); INDIRECT("'Formulierreacties 1'!C2:C"); "remove")=0); "")

Use `INDIRECT`: Google Forms inserts each new response as a new row, which silently shifts plain references like `B2:B` to `B3:B` and hides the first response.
Replace the tab name with yours. File -> Share -> Publish to web -> this tab only -> CSV -> copy the link into `liveCsv` in `config.js`. Never publish the responses tab: it contains the removal keys.

**Also publish the form itself** (the "Publish" button in Google Forms), otherwise it answers 401 and nothing arrives. The page can't see that failure (no-cors), so it says "Sent" anyway.

## Result code
`H1.<height in mm/10>.<country>.<name>`, e.g. `H1.1838.Netherlands.Sanne` (183.8 cm). Always stored in cm, whatever unit was typed.
# heightchart
