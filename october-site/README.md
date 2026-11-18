# October, After Dark — Flask + Render persistent storage

This version keeps the existing October, After Dark frontend and replaces the old Claude/shared-storage code with a Flask backend.

## What is stored where

- GitHub: source code only.
- Render Web Service: runs Flask.
- Render Persistent Disk (`/var/data`): stores `memories.db` and uploaded photos.
- Browser localStorage: device-only checklists, games, and other existing frontend state.

The uploaded photos are **not** committed to GitHub and are not stored in Render's temporary application filesystem.

## Local development

```bash
pip install -r requirements.txt
python app.py
```

Local data defaults to `./data/`. Set `DATA_DIR` if you want another location.

## Render deployment

Use a **paid Render Web Service** because persistent disks are not available on Render Free Web Services.

Recommended smallest setup:

- Web Service: Starter / smallest paid instance
- Persistent disk: 1 GB to start
- Mount path: `/var/data`

Environment variables:

```text
DATA_DIR=/var/data
FLASK_SECRET_KEY=<long-random-secret>
SITE_PASSWORD=<your-private-password>
```

Build command:

```text
pip install -r requirements.txt
```

Start command:

```text
gunicorn app:app
```

## Memory/photo access

The public site can load memory metadata, and uploaded photos are public to anyone with the link. `SITE_PASSWORD` is required for adding, editing, and removing memories.

Photos are stored outside `static/` on the persistent disk, so they are not committed to GitHub.

## Important

Only files written under the persistent disk mount path survive Render deploys/restarts. Keep `DATA_DIR=/var/data` when the disk is mounted there.

The persistent disk is storage, not a backup system. For important photos, keep a separate backup as well.

## Adding or unlocking a season

Everything lives in `static/js/seasons.js`. Copy the "winter" block to add a coming-soon season. When a season arrives, change `clues:[...]` to `stops:[...]` and add a `greeting`. The newest season shows at the top of Our Journey, with coming-soon seasons above it and older ones below. Existing databases are upgraded automatically (old memories become October).
