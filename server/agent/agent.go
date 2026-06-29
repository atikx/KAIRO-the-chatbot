package agent

import (
	"context"
	"fmt"
	"log"
	"os"
	"server/structs"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/packages/param"
	"github.com/openai/openai-go/v3/responses"
)

var client openai.Client

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system env")
	}

	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		log.Fatal("API_KEY is required")
	}

	client = openai.NewClient(
		option.WithAPIKey(apiKey),
		option.WithBaseURL("https://openrouter.ai/api/v1"),
	)
}

func GenerateEmbedding(text string) ([]float64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	resp, err := client.Embeddings.New(
		ctx,
		openai.EmbeddingNewParams{
			Model: openai.EmbeddingModelTextEmbedding3Large,
			Input: openai.EmbeddingNewParamsInputUnion{
				OfString: param.NewOpt(text),
			},
		},
	)

	if err != nil {
		fmt.Println("Error generating embedding:", err)
		return nil, err
	}

	if len(resp.Data) == 0 {
		return nil, fmt.Errorf("no embeddings returned")
	}

	return resp.Data[0].Embedding, nil
}

func FindAnswer(query string, contexts []string, oldMsgs []structs.Message) (string, error) {

	var sb strings.Builder

	// ---------- SYSTEM INSTRUCTION ----------
	sb.WriteString("You are a helpful assistant.\n")
	sb.WriteString("Answer ONLY from the provided context.\n")
	sb.WriteString("Keep the answer short and precise.\n")
	sb.WriteString("Do not use newlines, tabs, or special formatting.\n\n")

	// embeddings
	sb.WriteString("Context:\n")
	for _, c := range contexts {
		sb.WriteString(c)
		sb.WriteString("\n---\n")
	}

	// prev chats
	if len(oldMsgs) > 0 {
		sb.WriteString("\nConversation:\n")
		for _, m := range oldMsgs {
			sb.WriteString(m.Role)
			sb.WriteString(": ")
			sb.WriteString(m.Content)
			sb.WriteString("\n")
		}
	}

	// queryu
	sb.WriteString("\nUser: ")
	sb.WriteString(query)
	sb.WriteString("\nAssistant:")

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	resp, err := client.Responses.New(ctx, responses.ResponseNewParams{
		Model: "openai/gpt-4o-nano",
		Input: responses.ResponseNewParamsInputUnion{
			OfString: param.NewOpt(sb.String()),
		},
	})

	if err != nil {
		return "", err
	}

	answer := strings.TrimSpace(resp.OutputText())

	// remove useless things
	answer = strings.ReplaceAll(answer, "\n", " ")
	answer = strings.ReplaceAll(answer, "\t", " ")

	return answer, nil
}
