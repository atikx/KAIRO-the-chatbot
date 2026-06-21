package main

import (
	"log/slog"
	"net/http"
	"os"
	"server/controllers"
	custommiddlewares "server/customMiddlewares"
	"server/db"
	"server/services"
	"server/utils"
	"strings"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/gorilla/mux"
)

func init() {
	os.MkdirAll("db", os.ModePerm)
	db.InitDB()
}

func main() {

	router := mux.NewRouter()

	// Services & Controllers
	embeddingsService := services.NewEmbeddingsService(db.DB)
	embeddingsController := controllers.NewEmbeddingsController((*services.EmbeddingsService)(embeddingsService))

	adminService := services.NewAdminService(db.DB)
	adminController := controllers.NewAdminController(adminService)

	// Middlewares
	router.Use(custommiddlewares.EnableCORS)
	router.Use(middleware.Logger)

	slog.Info("server started on port 4242")

	// Health check
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		utils.WriteJSON(w, http.StatusOK, map[string]any{
			"status": "healthy",
		})
	})

	// -----------------------
	// Public APIs
	// -----------------------
	router.HandleFunc("/resolveQuery", embeddingsController.ResolveQuery).Methods("POST", "OPTIONS")

	// -----------------------
	// Protected APIs
	// -----------------------
	protected := router.PathPrefix("/").Subrouter()
	protected.Use(custommiddlewares.AdminAuth)

	protected.HandleFunc("/admin/embeddings/url", embeddingsController.AddEmbeddingsFromWeb).Methods("POST", "OPTIONS")
	protected.HandleFunc("/admin/embeddings/text", embeddingsController.AddEmbeddingsFromText).Methods("POST", "OPTIONS")
	protected.HandleFunc("/admin/data", adminController.GetData).Methods("GET", "OPTIONS")
	protected.HandleFunc("/admin/source", adminController.DeleteSource).Methods("DELETE", "OPTIONS")

	// -----------------------
	// Static Frontend Serving (Next.js export, trailingSlash: true)
	// -----------------------
	//
	// Build output structure (out/):
	//   out/index.html
	//   out/admin/index.html
	//   out/admin/dashboard/index.html
	//   out/admin/sources/index.html   ← each route is a folder with index.html
	//   out/_next/...                  ← JS/CSS assets
	//
	// Resolution order for a request to e.g. /admin/sources/:
	//  1. out/admin/sources           → exact file? serve it (e.g. assets)
	//  2. out/admin/sources/index.html → folder index? serve it
	//  3. out/index.html              → SPA fallback (404 page, etc.)

	outDir := "./out"

	router.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		urlPath := r.URL.Path
		exact := outDir + urlPath

		// 1. Exact file (JS/CSS/images, _next/* assets, pdf.worker.min.mjs, etc.)
		if info, err := os.Stat(exact); err == nil && !info.IsDir() {
			http.ServeFile(w, r, exact)
			return
		}

		// 2. Folder index — trailingSlash:true creates path/index.html for every route
		//    Works for both /admin/sources and /admin/sources/
		folderIndex := outDir + "/" + strings.TrimRight(urlPath, "/") + "/index.html"
		if _, err := os.Stat(folderIndex); err == nil {
			http.ServeFile(w, r, folderIndex)
			return
		}

		// 3. Fallback to root index.html
		http.ServeFile(w, r, outDir+"/index.html")
	})

	// -----------------------

	err := http.ListenAndServe(":4242", router)
	if err != nil {
		panic(err)
	}
}
