package utils

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"server/structs"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	ctx = context.Background()
	rdb *redis.Client
)

// ---------- INIT ----------
func init() {
	redisURL := os.Getenv("REDIS_URL")

	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatal("Invalid Redis URL:", err)
	}

	rdb = redis.NewClient(opt)

	_, err = rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatal("Redis connection failed:", err)
	}

	log.Println("Connected to Redis")
}

// ---------- GET MESSAGES ----------
func GetMessages(chatID string) ([]structs.Message, error) {

	key := "chat:" + chatID

	val, err := rdb.Get(ctx, key).Result()

	// If key does not exist → create empty entry
	if err == redis.Nil {
		empty := []structs.Message{}

		data, _ := json.Marshal(empty)

		err := rdb.Set(ctx, key, data, time.Minute*10).Err() // refresh after 10 min
		if err != nil {
			return nil, err
		}

		return empty, nil
	}

	if err != nil {
		return nil, err
	}

	var msgs []structs.Message
	err = json.Unmarshal([]byte(val), &msgs)
	if err != nil {
		return nil, err
	}

	return msgs, nil
}

// ---------- SAVE MESSAGES ----------
func SaveMessages(chatID string, msgs []structs.Message) error {

	key := "chat:" + chatID

	data, err := json.Marshal(msgs)
	if err != nil {
		return err
	}

	return rdb.Set(ctx, key, data, time.Minute*10).Err() // refresh after 10 min
}
