import sqlite3

DATABASE_NAME = "deployx.db"


def get_db_connection():
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS deployments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_url TEXT,
        framework TEXT,
        image_name TEXT,
        image_id TEXT,
        container_id TEXT,
        port TEXT,
        url TEXT,
        status TEXT,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()