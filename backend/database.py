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

    conn.execute(
        "PRAGMA foreign_keys = ON"
    )

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

        assigned_port INTEGER,

        subdomain TEXT,
        custom_url TEXT,

        url TEXT,
        local_url TEXT,

        status TEXT,
        current_step TEXT,
        
        jenkins_queue_id INTEGER,
        jenkins_build_number INTEGER,
        jenkins_status TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    )
    """)

    # =====================================================
    # MIGRATION SUPPORT
    # =====================================================

    columns = [
        row["name"]
        for row in cursor.execute(
            "PRAGMA table_info(deployments)"
        ).fetchall()
    ]

    migrations = {
        "assigned_port": "ALTER TABLE deployments ADD COLUMN assigned_port INTEGER",
        "subdomain": "ALTER TABLE deployments ADD COLUMN subdomain TEXT",
        "custom_url": "ALTER TABLE deployments ADD COLUMN custom_url TEXT",
        "local_url": "ALTER TABLE deployments ADD COLUMN local_url TEXT",
        "current_step": "ALTER TABLE deployments ADD COLUMN current_step TEXT",
        "repo_name": "ALTER TABLE deployments ADD COLUMN repo_name TEXT",
        "framework": "ALTER TABLE deployments ADD COLUMN framework TEXT",
        "image_name": "ALTER TABLE deployments ADD COLUMN image_name TEXT",
        "image_id": "ALTER TABLE deployments ADD COLUMN image_id TEXT",
        "container_id": "ALTER TABLE deployments ADD COLUMN container_id TEXT",
        "port": "ALTER TABLE deployments ADD COLUMN port TEXT",
        "url": "ALTER TABLE deployments ADD COLUMN url TEXT",
        "status": "ALTER TABLE deployments ADD COLUMN status TEXT",
        "jenkins_queue_id": "ALTER TABLE deployments ADD COLUMN jenkins_queue_id INTEGER",
        "jenkins_build_number": "ALTER TABLE deployments ADD COLUMN jenkins_build_number INTEGER",
        "jenkins_status": "ALTER TABLE deployments ADD COLUMN jenkins_status TEXT"
    }

    for column, query in migrations.items():
        if column not in columns:
            try:
                cursor.execute(query)
                print(f"Added missing column: {column}")
            except Exception as e:
                print(f"Migration failed for {column}: {e}")

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

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_deployments_subdomain
    ON deployments(subdomain)
    """)

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_deployments_port
    ON deployments(assigned_port)
    """)

    conn.commit()
    conn.close()

    print("DeployX database initialized successfully 🚀")