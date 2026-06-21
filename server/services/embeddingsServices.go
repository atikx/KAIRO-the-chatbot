package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"server/agent"
	"server/structs"
	"server/utils"
)

type EmbeddingsService struct {
	DB *sql.DB
}

func embeddingToBytes(emb []float64) ([]byte, error) {
	return json.Marshal(emb)
}

// Constructor
func NewEmbeddingsService(db *sql.DB) *EmbeddingsService {
	return &EmbeddingsService{DB: db}
}

func (s *EmbeddingsService) InsertChunksFromWebsite(webUrl string) (bool, int, error) {
	fmt.Println("Inserting chunks from website:", webUrl)
	records, err := utils.EmbedWebsite(webUrl)
	if err != nil {
		return false, 0, err
	}

	tx, err := s.DB.Begin()
	if err != nil {
		return false, 0, err
	}

	query := `
	INSERT INTO chunks (id, content, embedding, source, chunk_index)
	VALUES (?, ?, ?, ?, ?)
	ON CONFLICT(source, chunk_index) DO NOTHING;
	`

	stmt, err := tx.Prepare(query)
	if err != nil {
		tx.Rollback()
		return false, 0, err
	}
	defer stmt.Close()

	for _, r := range records {
		embBytes, err := embeddingToBytes(r.Embedding)
		if err != nil {
			tx.Rollback()
			return false, 0, err
		}

		_, err = stmt.Exec(
			r.ID,
			r.Content,
			embBytes,
			r.Source,
			r.ChunkIndex,
		)

		if err != nil {
			tx.Rollback()
			return false, 0, err
		}
	}

	err = tx.Commit()
	if err != nil {
		return false, 0, err
	}

	return true, len(records), nil
}

func (s *EmbeddingsService) ResolveQuery(q string, chatId string) (string, error) {

	// fetch all embeddings

	rows, err := s.DB.Query(`
		SELECT content, embedding, source, chunk_index 
		FROM chunks
	`)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var records []utils.ChunkRecord

	for rows.Next() {
		var content, source string
		var chunkIndex int
		var embBytes []byte

		err := rows.Scan(&content, &embBytes, &source, &chunkIndex)
		if err != nil {
			return "", err
		}

		emb, err := utils.BytesToEmbedding(embBytes)
		if err != nil {
			continue
		}

		records = append(records, utils.ChunkRecord{
			Content:    content,
			Embedding:  emb,
			Source:     source,
			ChunkIndex: chunkIndex,
		})
	}

	// match embeddings

	results, err := utils.MatchQuery(records, q, 5)
	if err != nil {
		return "", err
	}

	matchArray := []string{}

	for _, r := range results {
		matchArray = append(matchArray, r.Content)
	}

	// get the saved chats

	msgs, err := utils.GetMessages(chatId)
	if len(msgs) > 10 {
		msgs = msgs[len(msgs)-10:]
	}

	answer, err := agent.FindAnswer(q, matchArray, msgs)
	if err != nil {
		return "", err
	}

	msgs = append(msgs, structs.Message{
		Role:    "user",
		Content: q,
	}, structs.Message{
		Role:    "assistant",
		Content: answer,
	})

	utils.SaveMessages(chatId, msgs)

	return answer, nil
}

func (s *EmbeddingsService) InsertChunksFromText(text string, source string) (bool, int, error) {
	if source == "" {
		if len(text) > 20 {
			source = text[:20]
		} else {
			source = text
		}
	}

	records, err := utils.EmbedText(text, source)
	if err != nil {
		return false, 0, err
	}

	tx, err := s.DB.Begin()
	if err != nil {
		return false, 0, err
	}

	query := `
	INSERT INTO chunks (id, content, embedding, source, chunk_index)
	VALUES (?, ?, ?, ?, ?)
	ON CONFLICT(source, chunk_index) DO NOTHING;
	`

	stmt, err := tx.Prepare(query)
	if err != nil {
		tx.Rollback()
		return false, 0, err
	}
	defer stmt.Close()

	for _, r := range records {
		embBytes, err := embeddingToBytes(r.Embedding)
		if err != nil {
			tx.Rollback()
			return false, 0, err
		}

		_, err = stmt.Exec(
			r.ID,
			r.Content,
			embBytes,
			r.Source,
			r.ChunkIndex,
		)

		if err != nil {
			tx.Rollback()
			return false, 0, err
		}
	}

	err = tx.Commit()
	if err != nil {
		return false, 0, err
	}

	return true, len(records), nil
}
