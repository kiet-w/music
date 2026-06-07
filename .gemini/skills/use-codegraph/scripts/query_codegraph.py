import sqlite3
import sys
import os

def query_db(db_path, query):
    if not os.path.exists(db_path):
        return f"Error: Database not found at {db_path}"
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        colnames = [description[0] for description in cursor.description]
        conn.close()
        return colnames, rows
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python query_codegraph.py <db_path> <query>")
        sys.exit(1)
    
    db_path = sys.argv[1]
    query = sys.argv[2]
    result = query_db(db_path, query)
    
    if isinstance(result, str):
        print(result)
    else:
        colnames, rows = result
        print(" | ".join(colnames))
        print("-" * 20)
        for row in rows:
            print(" | ".join(map(str, row)))
