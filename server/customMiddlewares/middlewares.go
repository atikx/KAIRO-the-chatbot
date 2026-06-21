package custommiddlewares

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"
)

func AdminAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		key := r.Header.Get("x-admin-key")
		validKey := os.Getenv("ADMIN_KEY")

		fmt.Printf("Received key: %s, Valid key: %s\n", key, validKey)

		if validKey == "" || key != validKey {
			http.Error(w, "unauthorized", 401)
			return
		}

		next.ServeHTTP(w, r)
	})
}
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		start := time.Now()

		next.ServeHTTP(w, r)

		slog.Info(r.URL.Path,
			"method", r.Method,
			"duration", time.Since(start),
		)
	})
}

func EnableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-admin-key")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
