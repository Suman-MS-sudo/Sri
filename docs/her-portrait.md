# Putting Sami's face on the living portrait

## What the page uses now

Her face set comes from two Gemini sheets, kept in `faces-source/` as `_gemini-sheet-30.png` and
`_gemini-sheet-4.png`. It has 20 expressions: her resting face, eyes closed (for blinks), both winks,
shock, scared, heart eyes, angry, crying, ouch, tongue, deadpan, smug, squint, thinking, sleepy,
snoring, laugh, grin and shy. Her eyes follow the cursor by moving inside her resting face.

**Adding more faces from a Gemini sheet:** ask Gemini for a grid of new expressions of the same
character (kiss, cross-eyed, yawn, puffed cheeks, bubble gum...), save it in `faces-source/`, and cut
it up. Give the grid size, then the pupils and the middle of the lips measured inside one cell, then
which cell is which face:

```
npm run sheet -- faces-source/<sheet>.png --grid 3x3 --eyes 157,161,245,160 --mouth 200,232 --map r1c1=kiss,r1c2=cross,r2c1=yawn
npm run faces
```

The face names are listed in `src/portrait/faceList.json`. Don't map a new cell to `rest` unless
you mean to replace her base face; every other picture is lined up with it.

---

## Her animated character (what the page uses now)

The portrait is currently a drawn, animated character of her: black middle-parted hair, rectangular
glasses, bindi and a soft smile. All 58 expressions are generated from one drawing in
`scripts/draw-avatar.mjs`, so they line up perfectly.

To change her look, edit the `LOOK` colours at the top of that file (skin, hair, eyes, lips, glasses,
bindi), then run:

```
npm run avatar
```

That redraws all 58 faces and prepares them for the page. If you later make AI-rendered pictures of her
(below), drop them into `faces-source/` and run `npm run faces` instead. Those replace the drawn ones.

---

The animated head in the hero is a set of pictures of one face, one picture per expression. You make
her pictures with an AI image tool, drop them in a folder, and run one command. The page switches to her
face automatically once her resting face (`rest`) is in. Until then it keeps the current portrait.

You don't need all 58 pictures. Start with **Tier 1 (18 pictures)**. Anything missing is skipped
gracefully: eyes fall back to the nearest direction you have, and expressions fall back to her
resting face.

## What you need

- A clear, recent photo of her alone: facing the camera, good light, hair visible, nothing covering her face.
- An AI image tool that can **use a photo as a face reference** *and* **edit an existing image while
  keeping everything else the same**. The second part matters most.
- Her okay. It's her face. 💕

## Step 1: Her resting face (`rest.png`)

Give the tool her photo and this prompt:

> Stylized semi-realistic 3D animated character portrait of the woman in the reference photo, keeping her
> real face shape, eyes, nose, lips, skin tone and her own hairstyle and hair colour. Only her head and
> hair, floating, no neck or shoulders, perfectly front-facing, head upright and centred. Square 1:1
> image, fully transparent background (PNG with alpha). Hair reaches near the edges of the square; eyes
> sit at 46% of the image height, the mouth at 65%, the chin at about 76%. Soft studio lighting, high
> detail, warm skin, gentle closed-mouth smile, eyes looking straight at the viewer.

Generate a few and pick the one that looks most like her. Compare it with
`faces-source/_framing-guide.png`: eyes on the cyan line, mouth on the pink line, chin on the amber
line, with only the head and hair showing.

If the tool can't export a transparent background, remove it afterwards with any background remover
and save as PNG.

Save it as **`faces-source/rest.png`**.

## Step 2: Every other face, made by editing `rest.png`

**Don't generate the other faces from scratch.** Open `rest.png` in the tool's *edit* mode and ask for
one change at a time. That keeps her face, hair and position the same, which is what makes the swaps
look alive instead of jumpy.

Every edit prompt starts with:

> Edit this image. Keep EVERYTHING identical: same face, same hair, same head size and position, same
> framing, same lighting, same transparent background. Change only this:

followed by the change for that face. You don't need to type these yourself:

- `npm run faces` prints the exact prompts for the next pictures to make, or
- the **Face Checker** page has a **Copy prompt** button on every missing face (see Step 4).

Save each result in `faces-source/` named after its face, e.g. `kiss.png`, `winkl.png`, `downright.png`.

"Left" and "right" always mean **the left or right side of the picture**, not her left or right.

### Tier 1: start here (18)

| File | What changes |
|---|---|
| `rest` | Base picture (Step 1) |
| `half`, `closed` | Eyes half closed / fully closed (blinking, waking up) |
| `right`, `upright`, `up`, `wnw`, `left`, `downleft`, `down`, `downright` | Only the eyes move, looking in that direction (`wnw` = left and a little up) |
| `winkl`, `winkr` | Wink with the eye on the left / right side of the picture |
| `kiss` | Lips puckered |
| `cross` | Cross-eyed |
| `shock` | Wide eyes, small "O" mouth |
| `hearts` | Heart eyes (when the Open My Heart button is hovered) |
| `grin` | Big happy grin |

Tier 2 adds reactions to taps and pulls, Tier 3 makes the eye-following smoother, and Tier 4 adds the
idle acts (yawning, bubble gum, whistling) and hair colours. The script and the checker show what's
in each tier.

## Step 3: Process them

```
npm run faces
```

This lines every picture up with `rest.png`, shrinks it for fast loading, and saves the result into
`src/portrait/faces/`. Run it again whenever you add or replace pictures. It always rebuilds from
`faces-source/`.

Warnings to act on:

- **background is not transparent**: re-export as PNG with transparency.
- **framing is very different from rest**: that picture was generated from scratch instead of edited
  from `rest.png`. Redo it as an edit.
- **"x" is not a face name**: a typo in the file name. The script suggests the right one.

## Step 4: Check them

```
npm run dev
```

Open **http://localhost:5173/?faces** (the Face Checker):

- **Overlay on rest**: each face is shown as its difference from `rest`. A good one is almost black
  except for the part that changed (eyes, mouth). A bright outline around the whole head means that
  picture moved; redo it as an edit of `rest.png`.
- **Guides**: the eye, mouth and chin lines the hover and tap zones expect.

Then open http://localhost:5173/ and play with her: move the cursor around, hover her eyes, nose and
lips, and tap and pull her cheeks.

## Step 5: Ship it

The processed pictures in `src/portrait/faces/` are part of the site, so commit them and deploy as
usual. Her original pictures in `faces-source/` are kept out of git on purpose.

## Good to know

- Her pictures replace the original set as a whole. Faces from the two sets are never mixed.
- On phones the page loads the 640px versions, and on larger screens the 1024px ones.
- To go back to the original portrait, delete `src/portrait/faces/` and rebuild.
