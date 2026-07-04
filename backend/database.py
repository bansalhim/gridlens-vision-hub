import sqlite3
from typing import List, Dict

DB_NAME = "gridlens.db"


def get_connection():
    return sqlite3.connect(DB_NAME)


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS violations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            violation_type TEXT,
            confidence REAL,
            vehicle_id TEXT,
            number_plate TEXT,
            evidence TEXT,
            status TEXT
        )
        """
    )

    conn.commit()
    conn.close()


def save_violation(violation: Dict):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO violations (
            timestamp,
            violation_type,
            confidence,
            vehicle_id,
            number_plate,
            evidence,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            violation.get("timestamp"),
            violation.get("violation_type"),
            violation.get("confidence"),
            violation.get("vehicle_id"),
            violation.get("number_plate"),
            violation.get("evidence"),
            violation.get("status"),
        ),
    )

    conn.commit()
    conn.close()


def get_all_violations() -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            id,
            timestamp,
            violation_type,
            confidence,
            vehicle_id,
            number_plate,
            evidence,
            status
        FROM violations
        ORDER BY id DESC
        """
    )

    rows = cursor.fetchall()
    conn.close()

    records = []

    for row in rows:
        records.append(
            {
                "id": row[0],
                "timestamp": row[1],
                "violation_type": row[2],
                "confidence": row[3],
                "vehicle_id": row[4],
                "number_plate": row[5],
                "evidence": row[6],
                "status": row[7],
            }
        )

    return records