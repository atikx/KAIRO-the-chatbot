package db

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB() {
	var err error
	

	DB, err = sql.Open("sqlite3", "./db/database.db")
	if err != nil {
		log.Fatal(err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatal(err)
	}

	createTable()
}

func createTable() {

	query := `
	CREATE TABLE IF NOT EXISTS chunks (
		id TEXT PRIMARY KEY,
		content TEXT NOT NULL,
		embedding BLOB NOT NULL,
		source TEXT,
		chunk_index INTEGER,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(source, chunk_index)
	);

	CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source);
	CREATE INDEX IF NOT EXISTS idx_chunks_source_index ON chunks(source, chunk_index);
`


	_, err := DB.Exec(query)
	if err != nil {
		panic(err)
	}
}
