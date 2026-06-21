package utils

import (
	"math"
	"sort"
	"server/agent"
)

type SearchResult struct {
	Content    string
	Source     string
	ChunkIndex int
	Score      float64
}

// ---------- Cosine Similarity ----------
func cosineSimilarity(a, b []float64) float64 {
	var dot, normA, normB float64

	for i := range a {
		dot += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}

	return dot / (math.Sqrt(normA) * math.Sqrt(normB))
}

// ---------- MAIN SEARCH ----------
func MatchQuery(records []ChunkRecord, query string, topK int) ([]SearchResult, error) {

	// Generate embedding
	queryEmb, err := agent.GenerateEmbedding(query)
	if err != nil {
		return nil, err
	}


	results := make([]SearchResult, 0, len(records))

	// Compute similarity
	for _, r := range records {
		score := cosineSimilarity(queryEmb, r.Embedding)

		results = append(results, SearchResult{
			Content:    r.Content,
			Source:     r.Source,
			ChunkIndex: r.ChunkIndex,
			Score:      score,
		})
	}

	//  Sort DESC
	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	// Top K
	if len(results) > topK {
		results = results[:topK]
	}

	return results, nil
}
