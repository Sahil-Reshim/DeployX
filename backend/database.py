import sqlite3

DATABASE_NAME = "deployx.db"


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_db_connection():

    conn = sqlite3.connect(
        DATABASE_NAME,
        check_same_thread=False
    )

    conn.row_factory = sqlite3.Row

    return conn


# =========================================================
# INITIALIZE DATABASE
# =========================================================

def init_db():

    conn = get_db_connection()

    cursor = conn.cursor()

    # =====================================================
    # DEPLOYMENTS TABLE
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

        url TEXT,
        local_url TEXT,

        status TEXT,
        current_step TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    )
    """)

    # =====================================================
    # BUILD LOGS TABLE
    # =====================================================

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS build_logs (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        deployment_id INTEGER,

        log TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (deployment_id)
        REFERENCES deployments(id)
        ON DELETE CASCADE

    )
    """)

    # =====================================================
    # CONTAINER LOGS TABLE
    # =====================================================

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS container_logs (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        deployment_id INTEGER,

        log TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (deployment_id)
        REFERENCES deployments(id)
        ON DELETE CASCADE

    )
    """)

    # =====================================================
    # DEPLOYMENT METRICS TABLE
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

        FOREIGN KEY (deployment_id)
        REFERENCES deployments(id)
        ON DELETE CASCADE

    )
    """)

    # =====================================================
    # INDEXES
    # =====================================================

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_deployments_created
    ON deployments(created_at)
    """)

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_build_logs_deployment
    ON build_logs(deployment_id)
    """)

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_container_logs_deployment
    ON container_logs(deployment_id)
    """)

    # =====================================================
    # SAVE CHANGES
    # =====================================================

    conn.commit()

    conn.close()

    print("DeployX database initialized successfully 🚀")