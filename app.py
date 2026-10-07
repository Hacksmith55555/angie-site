import base64
import os
import sqlite3
import uuid
from datetime import datetime
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, render_template, request, session, send_from_directory


BASE = Path(__file__).resolve().parent

# Uses ./data by default.
# When you later add a Render persistent disk, set:
# DATA_DIR=/var/data
DATA_DIR = Path(os.environ.get("DATA_DIR", str(BASE / "data"))).resolve()

DB_PATH = DATA_DIR / "memories.db"
UPLOAD_DIR = DATA_DIR / "uploads"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


app = Flask(__name__)

app.secret_key = os.environ.get(
    "FLASK_SECRET_KEY",
    "change-this-secret-key"
)

app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

SITE_PASSWORD = os.environ.get(
    "SITE_PASSWORD",
    "OctoberAfterDark"
)


def db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db_conn() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                extra INTEGER NOT NULL DEFAULT 0,
                date TEXT NOT NULL,
                photo TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        db.commit()


def login_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if not session.get("unlocked"):
            return jsonify({
                "ok": False,
                "error": "unauthorized"
            }), 401

        return fn(*args, **kwargs)

    return wrapped


def clean_date(value):
    if not value:
        return datetime.now().strftime("%Y-%m-%d")

    try:
        datetime.strptime(value, "%Y-%m-%d")
        return value
    except ValueError:
        return datetime.now().strftime("%Y-%m-%d")


def save_photo(data_url):
    if not data_url:
        return ""

    if not data_url.startswith("data:image/"):
        raise ValueError("invalid image")

    try:
        header, encoded = data_url.split(",", 1)
        raw = base64.b64decode(encoded, validate=True)
    except Exception as exc:
        raise ValueError("invalid image") from exc

    if len(raw) > 2 * 1024 * 1024:
        raise ValueError("image too large")

    extension = ".jpg"

    if "image/png" in header:
        extension = ".png"
    elif "image/webp" in header:
        extension = ".webp"
    elif "image/jpeg" in header:
        extension = ".jpg"

    filename = f"{uuid.uuid4().hex}{extension}"

    (UPLOAD_DIR / filename).write_bytes(raw)

    return filename


def delete_photo(filename):
    if not filename:
        return

    path = UPLOAD_DIR / Path(filename).name

    if path.exists():
        path.unlink()


def memory_json(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "extra": bool(row["extra"]),
        "date": row["date"],
        "photo": f"/uploads/{row['photo']}" if row["photo"] else "",
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/status")
def status():
    return jsonify({
        "unlocked": bool(session.get("unlocked"))
    })


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}

    if data.get("password") != SITE_PASSWORD:
        session.clear()

        return jsonify({
            "ok": False,
            "error": "wrong_password"
        }), 401

    session["unlocked"] = True

    return jsonify({
        "ok": True
    })


@app.post("/api/logout")
def logout():
    session.clear()

    return jsonify({
        "ok": True
    })


@app.get("/api/memories")
def memories():
    with db_conn() as db:
        rows = db.execute(
            "SELECT * FROM memories ORDER BY date, created_at"
        ).fetchall()

    return jsonify({
        row["id"]: memory_json(row)
        for row in rows
    })


@app.post("/api/memories")
@login_required
def create_memory():
    return upsert_memory(None)


@app.put("/api/memories/<memory_id>")
@login_required
def update_memory(memory_id):
    return upsert_memory(memory_id)


def upsert_memory(memory_id):
    data = request.get_json(silent=True) or {}

    title = str(data.get("title", "")).strip()
    extra = bool(data.get("extra"))
    date = clean_date(data.get("date"))

    if not title:
        return jsonify({
            "ok": False,
            "error": "title_required"
        }), 400

    now = datetime.utcnow().isoformat(timespec="seconds")

    photo = ""
    old_photo = ""

    with db_conn() as db:

        existing = False

        if memory_id:
            old = db.execute(
                "SELECT * FROM memories WHERE id = ?",
                (memory_id,)
            ).fetchone()

            if not old:
                return jsonify({
                    "ok": False,
                    "error": "not_found"
                }), 404

            existing = True
            old_photo = old["photo"] or ""

        else:
            memory_id = "x" + uuid.uuid4().hex

        incoming_photo = data.get("photo") or ""

        if incoming_photo.startswith("data:image/"):
            try:
                photo = save_photo(incoming_photo)
            except ValueError as exc:
                return jsonify({
                    "ok": False,
                    "error": str(exc)
                }), 400

        elif incoming_photo.startswith("/uploads/"):
            photo = Path(incoming_photo).name

        else:
            photo = old_photo

        if memory_id and old_photo and photo != old_photo:
            delete_photo(old_photo)

        if existing:
            db.execute("""
                UPDATE memories
                SET title=?,
                    extra=?,
                    date=?,
                    photo=?,
                    updated_at=?
                WHERE id=?
            """, (
                title,
                int(extra),
                date,
                photo,
                now,
                memory_id
            ))

        else:
            db.execute("""
                INSERT INTO memories(
                    id,
                    title,
                    extra,
                    date,
                    photo,
                    created_at,
                    updated_at
                )
                VALUES(?,?,?,?,?,?,?)
            """, (
                memory_id,
                title,
                int(extra),
                date,
                photo,
                now,
                now
            ))

        db.commit()

        row = db.execute(
            "SELECT * FROM memories WHERE id=?",
            (memory_id,)
        ).fetchone()

    return jsonify({
        "ok": True,
        "memory": memory_json(row)
    })


@app.delete("/api/memories/<memory_id>")
@login_required
def remove_memory(memory_id):
    with db_conn() as db:

        row = db.execute(
            "SELECT photo FROM memories WHERE id=?",
            (memory_id,)
        ).fetchone()

        if not row:
            return jsonify({
                "ok": False,
                "error": "not_found"
            }), 404

        db.execute(
            "DELETE FROM memories WHERE id=?",
            (memory_id,)
        )

        db.commit()

    delete_photo(row["photo"])

    return jsonify({
        "ok": True
    })


@app.route("/uploads/<path:filename>")
@login_required
def uploads(filename):
    # Photos are private to logged-in sessions.
    return send_from_directory(
        UPLOAD_DIR,
        Path(filename).name
    )


@app.errorhandler(413)
def too_large(_):
    return jsonify({
        "ok": False,
        "error": "upload_too_large"
    }), 413


init_db()


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=int(os.environ.get("PORT", 5000)),
        debug=True
    )