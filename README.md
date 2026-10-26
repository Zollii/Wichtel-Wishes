# Zollhaus Wichtel

Family wishlists ("Wunschlisten") for birthdays, Christmas and other occasions. Everyone picks
their profile, manages their own wishlists and sees the wishlists of the person they drew.

Version 3 is a rewrite of `wichtel_app_v2` with a new design and current dependencies. The data
model is unchanged, so a v2 database can be reused (see below).

## Features

- **Your profile, protected by a PIN.** Whoever picks a profile first chooses its 4-digit PIN.
  With it you sign in on as many devices as you like; "PIN ändern" and "Abmelden" are in the
  menu under your name at the top right.
- **Secret Santa ("Wichteln").** After drawing names on paper, everybody enters whom they drew.
  Only they can see it (hidden behind an "Aufdecken" button on their page; "Wunschliste
  ansehen" next to it opens the drawn person's lists), they can't pick themselves, nobody can
  be drawn twice, and the choice is final.
- **Admin area** (`/admin`, password protected): add, rename and delete family members, answer
  "PIN vergessen?" requests, sign somebody out on all devices, reset a single draw, start a new
  round and set each list's visibility. The admin takes part in the draw too, so the admin page
  only shows *how many* people have entered their draw – not who, and never whom they drew.
- **Wishlist visibility.** Each list is either **"Nur mein Wichtel"** (default) – visible only to
  its owner and to whoever drew the owner – or **"Ganze Familie"**. The owner chooses in the list
  dialog; the admin can switch it per list. Hidden lists answer with 404, also by direct URL.
- Create, rename and delete your wishlists; add, edit and delete wishes with optional details
  and a product link
- Light and dark mode, responsive down to small phones

### Signing in with a PIN

- The PIN is shown in four digit boxes. Signing in goes off by itself with the last digit on the
  first try; after a wrong PIN, the button confirms.
- The PIN is stored as a salted scrypt hash. Every 5th wrong try locks the profile – for 15
  minutes, then twice as long each further round (at most a day); only the right PIN resets the
  count. Obvious PINs like `1234` or `0000` are refused.
- Signing in stores a random secret in an `httpOnly` cookie on that device; the database only
  keeps its SHA-256 hash (one row per device in `Session`). The cookie is renewed on every visit
  (`proxy.ts`), so it does not expire while the app is in use.
- Changing the PIN signs you out on your other devices.
- **PIN vergessen?** The request shows up at the top of the admin page. The admin hands out a
  temporary PIN (a random one is suggested), which signs the person out everywhere. Right after
  signing in with it, the person has to choose their own PIN before seeing anything – so the
  admin can't quietly use it to look up somebody's draw, and the admin can only assign a PIN
  when somebody asked for one.
- Profiles picked before PINs existed stay signed in on their device and are asked for a PIN on
  the next visit.

## Admin area

Set `ADMIN_PASSWORD` in `.env` (see `.env.example`) and open `/admin` (also linked in the footer).
Without a password the admin area stays locked. Admin sessions last 12 hours; changing the
password logs out all admins.

New family members are added here – the start page only lets people pick existing profiles.
Open "PIN vergessen?" requests appear at the top of the admin page.

## Tech stack

| Area      | Technology                                                    |
| --------- | ------------------------------------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack, Server Actions), React 19  |
| Database  | SQLite via Prisma 7 + `@prisma/adapter-better-sqlite3`        |
| Styling   | Tailwind CSS 4, Fraunces + Geist fonts, Heroicons             |
| Tooling   | TypeScript 6, ESLint 9 (`eslint-config-next`)                 |
| Runtime   | Node.js ≥ 22.12 (Docker image uses Node 24)                   |

## Getting started

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # then set ADMIN_PASSWORD
npm run db:deploy           # create the SQLite database
npm run db:seed             # optional: sample family
npm run dev
```

Open <http://localhost:3000>.

## Scripts

| Script               | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Development server                              |
| `npm run build`      | Generate Prisma client and build for production |
| `npm start`          | Run the production build                        |
| `npm run lint`       | ESLint                                          |
| `npm run typecheck`  | TypeScript check                                |
| `npm run db:migrate` | Create a new migration after schema changes (then restart `npm run dev`) |
| `npm run db:deploy`  | Apply pending migrations                        |
| `npm run db:seed`    | Insert sample data (only into an empty DB)      |
| `npm run db:studio`  | Browse the database in Prisma Studio            |

## Docker

```bash
ADMIN_PASSWORD='something-long' docker compose up -d --build
```

`ADMIN_PASSWORD` is required (it can also live in a `.env` file next to `docker-compose.yml`).
The app is reachable on port 3002 (`http://<server>:3002`); change the left side of `ports` in
`docker-compose.yml` to use another one.

> **Docker inside WSL:** WSL shuts the Linux distro down shortly after the last WSL session
> ends, which also stops Docker and this container (it starts again with the next `wsl` call,
> thanks to `restart: unless-stopped`). To keep the app reachable, keep a WSL session open or
> run Docker somewhere that stays on.

The SQLite database is stored in the `wichtel_data` volume at `/app/data/wichtel.db`. On every
start the container runs `prisma migrate deploy`, which creates the database if it is missing
and applies new migrations. `/api/health` checks that the database is reachable and is used as
the container health check.

## Home server

The server needs Git and Docker with Compose v2.

**First time:**

```bash
git clone github-wichtel:Zollii/Wichtel-Wishes.git wichtel   # see "Repository access" below
cd wichtel
echo "ADMIN_PASSWORD='something-long'" > .env
./update.sh
```

**Updating:** run `./update.sh` in that folder. It pulls the latest code (`git pull --ff-only`),
rebuilds the image, restarts the container and waits until the health check passes. The
database volume is kept; new migrations are applied on start. Run it as a user in the `docker`
group – with `sudo`, Git would look for the repository key in root's home instead.

**Repository access:** while the repository is private, the server reads it with a deploy key –
read-only, limited to this repository and without expiry:

```bash
ssh-keygen -t ed25519 -N "" -C "wichtel server" -f ~/.ssh/wichtel_deploy
cat ~/.ssh/wichtel_deploy.pub
# GitHub: repository → Settings → Deploy keys → Add deploy key, paste the line,
# leave "Allow write access" unchecked.
cat >> ~/.ssh/config <<'EOF'
Host github-wichtel
  HostName github.com
  User git
  IdentityFile ~/.ssh/wichtel_deploy
  IdentitiesOnly yes
EOF
```

If the repository is public, clone `https://github.com/Zollii/Wichtel-Wishes.git` instead and
skip the key.

## Taking over data from v2

v3 starts from the same initial migration as v2 and adds the sign-in, PIN, draw and visibility
columns in later migrations, so an existing database is upgraded automatically
(`npm run db:deploy`, or on container start). Existing lists become "Nur mein Wichtel".
Everybody then picks their profile once more and sets a PIN:

- **Local:** copy `wichtel_app_v2/dev.db` to `data/wichtel.db`.
- **Docker:** copy `/app/data/dev.db` from the old container's volume into the new
  `wichtel_data` volume as `wichtel.db` — or set `DATABASE_URL=file:/app/data/dev.db` and mount
  the old volume.

## Project structure

```
app/                  routes: / (sign-in), /user/[id], /wishlist/[id], /admin, /api/health
components/           UI components; dialogs are client components using native <dialog>
lib/actions.ts        server actions for family members (sign-in, PIN, draw, wishlists, wishes)
lib/admin-actions.ts  server actions for the admin area (each one checks the admin session)
lib/admin.ts          admin password check and signed admin cookie
lib/session.ts        signed-in devices (sessions)
lib/pin.ts            PIN hashing and the lock after wrong tries
lib/data.ts           read queries (server-only)
lib/validation.ts     form input parsing
proxy.ts              renews the sign-in cookie on every visit
prisma/               schema, migrations and seed script
update.sh             pulls the latest code and rebuilds the container on the server
```
