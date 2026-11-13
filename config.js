// Settings you can change without touching the app code.
window.HEIGHT_CONFIG = {
  owner: "Teun",
  ownerX: "Teunemansvb",     // X handle for removal requests (without @)

  // Names containing one of these words are left out of the chart (case/accents/punctuation ignored).
  blockedNames: [],

  // Result codes to hide from the chart (paste the whole code from the sheet).
  hiddenCodes: [],

  // Published CSV of the "public" tab of the response sheet (codes only, see README.md).
  // Leave empty to use only results.js.
  liveCsv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQxT6l_pmJPE95DMH4T-euGN7TORAtKPiv-G7gWRJREcj4-Marc18u0HRPhJLr5ZIB4IxH_qGjtUVit/pub?gid=1456769463&single=true&output=csv",

  // Google Form that receives results. Leave `action` empty to switch sending off;
  // the page then only shows a "copy my code" route. See README.md for how to fill this in.
  form: {
    action:  "https://docs.google.com/forms/d/e/1FAIpQLSffBiX7V1baZhrN6-8fiuNZApHemi2Bto_dCUpGUPxFsjNyug/formResponse",             // https://docs.google.com/forms/d/e/LONG_ID/formResponse
    code:    "entry.137170306",             // entry.xxxxxxxxx  (question "code")
    kind:    "entry.22107598",             // entry.xxxxxxxxx  (question "kind": add or remove)
    key:     "entry.1503553182",             // entry.xxxxxxxxx  (question "key": random removal key)
    consent: "entry.1010811237"              // entry.xxxxxxxxx  (question "consent")
  }
};
