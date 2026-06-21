package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"server/agent"
	"strings"
	"sync"

	"github.com/PuerkitoBio/goquery"
	"github.com/google/uuid"
)

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

type ChunkRecord struct {
	ID         string
	Content    string
	Embedding  []float64
	Source     string
	ChunkIndex int
}

func BytesToEmbedding(b []byte) ([]float64, error) {
	var emb []float64
	err := json.Unmarshal(b, &emb)
	if err != nil {
		return nil, err
	}
	return emb, nil
}

// EmbedWebsite uses agent.GenerateEmbedding internally
func EmbedWebsite(url string) ([]ChunkRecord, error) {

	// ---------- Fetch HTML ----------
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// ---------- Extract Text ----------
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(body)))
	if err != nil {
		return nil, err
	}

	doc.Find("script, style, noscript").Remove()

	text := doc.Find("main").Text()
	if strings.TrimSpace(text) == "" {
		text = doc.Find("body").Text()
	}

	// ---------- Clean ----------
	text = strings.ReplaceAll(text, "\n", " ")
	text = strings.ReplaceAll(text, "\t", " ")
	text = strings.TrimSpace(text)


	if len(text) == 0 {
		return nil, fmt.Errorf("no usable text found")
	}

	// ---------- Chunk ----------
	chunkSize := 800
	overlap := 200

	var chunks []string
	runes := []rune(text)

	for i := 0; i < len(runes); i += (chunkSize - overlap) {
		end := i + chunkSize
		if end > len(runes) {
			end = len(runes)
		}

		chunks = append(chunks, string(runes[i:end]))

		if end == len(runes) {
			break
		}
	}

	// ---------- Parallel Embedding ----------
	records := make([]ChunkRecord, len(chunks))
	errChan := make(chan error, len(chunks))
	var wg sync.WaitGroup

	for i, chunk := range chunks {
		wg.Add(1)

		go func(i int, chunk string) {
			defer wg.Done()

			emb, err := agent.GenerateEmbedding(chunk)
			if err != nil {
				errChan <- err
				return
			}

			records[i] = ChunkRecord{
				ID:         uuid.New().String(),
				Content:    chunk,
				Embedding:  emb,
				Source:     url,
				ChunkIndex: i,
			}
		}(i, chunk)
	}

	wg.Wait()
	close(errChan)

	if len(errChan) > 0 {
		return nil, <-errChan
	}

	return records, nil
}

func EmbedText(text string, source string) ([]ChunkRecord, error) {

	// ---------- Chunk ----------
	chunkSize := 800
	overlap := 200

	var chunks []string
	runes := []rune(text)

	for i := 0; i < len(runes); i += (chunkSize - overlap) {
		end := i + chunkSize
		if end > len(runes) {
			end = len(runes)
		}

		chunks = append(chunks, string(runes[i:end]))

		if end == len(runes) {
			break
		}
	}

	// ---------- Parallel Embedding ----------
	records := make([]ChunkRecord, len(chunks))
	errChan := make(chan error, len(chunks))
	var wg sync.WaitGroup

	for i, chunk := range chunks {
		wg.Add(1)

		go func(i int, chunk string) {
			defer wg.Done()

			emb, err := agent.GenerateEmbedding(chunk)
			if err != nil {
				errChan <- err
				return
			}

			records[i] = ChunkRecord{
				ID:         uuid.New().String(),
				Content:    chunk,
				Embedding:  emb,
				Source:     source,
				ChunkIndex: i,
			}
		}(i, chunk)
	}

	wg.Wait()
	close(errChan)

	if len(errChan) > 0 {
		return nil, <-errChan
	}

	return records, nil
}
