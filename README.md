# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/konongxyz/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/konongxyz/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Coast Cover Studio — a GTA 6 cover-art studio game built for the make.fun bounty.

Turn any photo of yours into a multi-panel sunset-and-neon poster cover, right in the
browser. Drop in up to four photos, arrange them across poster panels, grade the whole
cover in one of five coastal colour looks, letter it with a block title and a script
subtitle, and export a share-ready PNG in the common post sizes. Everything runs
offline from the app's own files: your photos are read on your own machine and never
leave it.

## What it does

- **Six panel layouts** — Hero Split, Four Panel, Nine Panel with the title on the
  centre tile, Tilted Snapshots, Full Bleed and Strip Trio.
- **Five colour grades** — Vice Sunset, Neon Night, Palm Gold, Teal Heat and Noir Pop,
  applied to every panel so the cover reads as one poster.
- **Per-panel framing** — click a panel in the live preview, then zoom and pan the
  photo inside it; each panel can hold any of your four photo slots or a built-in
  sample scene.
- **Poster lettering and dressing** — a block title in Anton, a script subtitle in
  Pacifico (both SIL Open Font License, vendored in `app/fonts/`), a badge ribbon,
  a five-star heat meter, film grain, a vignette and a halftone title block.
- **One-click PNG export** at 1080 × 1080, 1080 × 1350 and 1920 × 1080.
- **Two built-in sample scenes** — sunset boulevard and neon alley, painted by the
  app's own code, so the studio works before you add a photo of your own.

## Run it

Serve the `app/` folder with any static file server and open `index.html` in a
desktop browser — no build step, no network needed:

```sh
node serve.ts        # then open http://localhost:8080
```

## Hand it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the
output directory and writes `dossier.json` there with `buildDossier` from
`vendor/makefun-app.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`. The lettering fonts are under the SIL Open Font License 1.1 —
see `app/fonts/OFL.txt`.

---

Built for the make.fun bounty: https://make.fun/bounty/gta6-cover-art-01 — join in
with the referral link https://make.fun/r/9m688dgh
