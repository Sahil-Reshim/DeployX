# =========================================================
# DATABASE LAYER
# ---------------------------------------------------------
# SQLite database initialisation and connection helpers.
#
# Tables:
#   deployments        — core deployment records
#   build_logs         — Docker build output per deployment
#   container_logs     — container stdout/stderr per deployment
#   deployment_metrics — CPU / RAM / network samples
#
# The init_db() function also runs "migrations" — it checks
# which columns already exist and adds any that are missing.
# This lets us evolve the schema without manual ALTER TABLE.
# =========================================================

import sqlite3

DATABASE_NAME = "deployx.db"


# =========================================================
# CONNECTION
# =========================================================

def get_db_connection():
    """
    Open a connection to the SQLite database.
    Row factory is set to sqlite3.Row so we can access
    columns by name (e.g. row["status"]).
    """

    # timeout: wait up to 30s for a lock instead of failing instantly
    # (monitoring threads + Flask workers write concurrently).
    conn = sqlite3.connect(
        DATABASE_NAME,
        check_same_thread=False,
        timeout=30,
    )
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    # WAL allows concurrent readers during a write — prevents
    # "database is locked" errors from the monitor thread.
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 30000")
    return conn


# =========================================================
# INITIALISATION & MIGRATIONS
# =========================================================

def init_db():
    """
    Create all required tables (if they don't exist) and
    add any missing columns via ALTER TABLE.
    Safe to call on every server start.
    """

    conn = get_db_connection()
    cursor = conn.cursor()

    # =====================================================
    # DEPLOYMENTS — main table
    # =====================================================

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS deployments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_url TEXT,
        repo_name TEXT,
        framework TEXT,
        image_name TEXT,
        image_id TEXT,
        container_id TEXT,
        port TEXT,
        assigned_port INTEGER,
        subdomain TEXT,
        custom_url TEXT,
        url TEXT,
        local_url TEXT,
        status TEXT,
        current_step TEXT,
        state_key TEXT,
        state_label TEXT,
        progress INTEGER DEFAULT 0,
        jenkins_queue_id INTEGER,
        jenkins_build_number INTEGER,
        jenkins_status TEXT,
        jenkins_stages TEXT,
        test_count INTEGER DEFAULT 0,
        passed_tests INTEGER DEFAULT 0,
        failed_tests INTEGER DEFAULT 0,
        test_coverage REAL DEFAULT 0,
        jenkins_console_log TEXT,
        pipeline_started_at TIMESTAMP,
        pipeline_finished_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # =====================================================
    # MIGRATIONS — add columns that may be missing
    # =====================================================

    columns = [
        row["name"]
        for row in cursor.execute("PRAGMA table_info(deployments)").fetchall()
    ]

    migrations = {
        "assigned_port":         "ALTER TABLE deployments ADD COLUMN assigned_port INTEGER",
        "subdomain":             "ALTER TABLE deployments ADD COLUMN subdomain TEXT",
        "custom_url":            "ALTER TABLE deployments ADD COLUMN custom_url TEXT",
        "local_url":             "ALTER TABLE deployments ADD COLUMN local_url TEXT",
        "current_step":          "ALTER TABLE deployments ADD COLUMN current_step TEXT",
        "repo_name":             "ALTER TABLE deployments ADD COLUMN repo_name TEXT",
        "framework":             "ALTER TABLE deployments ADD COLUMN framework TEXT",
        "image_name":            "ALTER TABLE deployments ADD COLUMN image_name TEXT",
        "image_id":              "ALTER TABLE deployments ADD COLUMN image_id TEXT",
        "container_id":          "ALTER TABLE deployments ADD COLUMN container_id TEXT",
        "port":                  "ALTER TABLE deployments ADD COLUMN port TEXT",
        "url":                   "ALTER TABLE deployments ADD COLUMN url TEXT",
        "status":                "ALTER TABLE deployments ADD COLUMN status TEXT",
        "jenkins_queue_id":      "ALTER TABLE deployments ADD COLUMN jenkins_queue_id INTEGER",
        "jenkins_build_number":  "ALTER TABLE deployments ADD COLUMN jenkins_build_number INTEGER",
        "jenkins_status":        "ALTER TABLE deployments ADD COLUMN jenkins_status TEXT",
        "jenkins_stages":        "ALTER TABLE deployments ADD COLUMN jenkins_stages TEXT",
        "test_count":            "ALTER TABLE deployments ADD COLUMN test_count INTEGER DEFAULT 0",
        "passed_tests":          "ALTER TABLE deployments ADD COLUMN passed_tests INTEGER DEFAULT 0",
        "failed_tests":          "ALTER TABLE deployments ADD COLUMN failed_tests INTEGER DEFAULT 0",
        "test_coverage":         "ALTER TABLE deployments ADD COLUMN test_coverage REAL DEFAULT 0",
        "jenkins_console_log":   "ALTER TABLE deployments ADD COLUMN jenkins_console_log TEXT",
        "pipeline_started_at":   "ALTER TABLE deployments ADD COLUMN pipeline_started_at TIMESTAMP",
        "pipeline_finished_at":  "ALTER TABLE deployments ADD COLUMN pipeline_finished_at TIMESTAMP",
        "state_key":             "ALTER TABLE deployments ADD COLUMN state_key TEXT",
        "state_label":           "ALTER TABLE deployments ADD COLUMN state_label TEXT",
        "current_stage":         "ALTER TABLE deployments ADD COLUMN current_stage TEXT DEFAULT 'Queue'",
        "progress":              "ALTER TABLE deployments ADD COLUMN progress INTEGER DEFAULT 0",
    }

    for column, query in migrations.items():
        if column not in columns:
            try:
                cursor.execute(query)
                print(f"Added missing column: {column}")
            except Exception as e:
                print(f"Migration failed for {column}: {e}")

    # =====================================================
    # BUILD LOGS
    # =====================================================

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS build_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deployment_id INTEGER,
        log TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE CASCADE
    )
    """)

    # =====================================================
    # CONTAINER LOGS
    # =====================================================

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS container_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deployment_id INTEGER,
        log TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE CASCADE
    )
    """)

    # =====================================================
    # DEPLOYMENT METRICS (monitoring samples)
    # =====================================================

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS deployment_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deployment_id INTEGER,
        cpu REAL,
        ram REAL,
        network_rx REAL,
        network_tx REAL,
        health TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE CASCADE
    )
    """)

    # =====================================================
    # INDEXES — speed up common queries
    # =====================================================

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_deployments_created ON deployments(created_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_build_logs_deployment ON build_logs(deployment_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_container_logs_deployment ON container_logs(deployment_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_deployments_subdomain ON deployments(subdomain)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_deployments_port ON deployments(assigned_port)")

    conn.commit()
    conn.close()

    print("DeployX database initialized successfully 🚀")