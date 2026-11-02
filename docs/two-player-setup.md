# Playing the 2-player games from two phones

The games (Love Pong, Heart Catch, Tug of Love) connect your two phones through **Supabase Realtime**,
a free service. Nothing is stored: moves are just passed between the phones. Until it's set up,
the games run in **test mode**, which only works between two tabs of the same browser.

## One-time setup (about 5 minutes)

1. Put the project on GitHub and import it into **Vercel** (vercel.com → Add New → Project).
2. In your Vercel project, open **Storage** → **Connect store / Marketplace** → **Supabase** → create a
   free project. Vercel adds the keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) to
   your project automatically. The app already reads those names.
3. **Redeploy** (Deployments → ⋯ → Redeploy), so the new keys are built in.

The Games tab now shows **"Live: play from anywhere"** instead of "Test mode".

Not using Vercel's integration? Create a project at supabase.com, then set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` (Project Settings → API) in Vercel's environment variables, or in a `.env`
file for local testing (see `.env.example`).

## Playing

1. Open the site, go to **Games**, enter your name, and tap **Create a room**.
2. Tap **Share invite** and send her the link (WhatsApp, anything). She opens it, enters her name,
   and she's in. You'll both see each other's green online dot.
3. Either of you picks a game. It starts on both phones with a 3-2-1 countdown.

Keep the app open in front while playing: if the phone of the person who created the room goes to
the background, the game pauses for both of you.
