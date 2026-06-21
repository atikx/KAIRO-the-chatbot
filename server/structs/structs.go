package structs

type ChunkRecord struct {
	ID         string
	Content    string
	Embedding  []float64
	Source     string
	ChunkIndex int
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type AdminData struct {
	Source       string `json:"source"`
	Chunks_count int    `json:"chunks_count"`
}
