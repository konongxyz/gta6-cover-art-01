# Neon Coast Cover Studio

An offline web app that turns your photos and a caption into multi-panel
sunset/neon poster cover art, exported as a PNG to share.

- 6 panel layouts: Hero Split, Four Panel, Nine Panel, Tilted Snapshots,
  Full Bleed, Strip Trio
- 5 sunset/neon grades: Vice Sunset, Neon Night, Palm Gold, Teal Heat, Noir Pop
- Block title lettering (Anton) + script subtitle (Pacifico), both under the
  SIL Open Font License — vendored in `app/fonts/` with their OFL text
- Badge ribbon, 5-star heat meter, grain, vignette, halftone title block,
  poster frame
- Crop and position every panel (zoom + pan, click a panel in the preview),
  4 photo slots + 2 built-in samples
- One-click PNG export in 1080 x 1080, 1080 x 1350 and 1920 x 1080

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Everything runs offline in the browser: photos are read on your own machine
and never uploaded. No network request is made at runtime.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Referral: [![Neon Coast Cover Studio](https://make.fun/badge/9m688dgh)](https://make.fun/c/gta6-cover-art-01)

## License

MIT — see LICENSE. Fonts: Anton and Pacifico, SIL Open Font License 1.1
(see `app/fonts/OFL.txt`).
