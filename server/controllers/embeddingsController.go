package controllers

import (
	"net/http"
	"server/services"
	"server/utils"
	"strconv"
)

type EmbeddingsController struct {
	es *services.EmbeddingsService
}

type embeddingsRequestForUrl struct {
	URL string `json:"url"`
}

type embeddingsRequestForText struct {
	Text   string `json:"text"`
	Source string `json:"source"`
}

type ResolveQueryRequest struct {
	QUE string `json:"que"`
}

func NewEmbeddingsController(service *services.EmbeddingsService) *EmbeddingsController {
	return &EmbeddingsController{es: service}
}

func (c *EmbeddingsController) AddEmbeddingsFromWeb(w http.ResponseWriter, r *http.Request) {

	var reqData embeddingsRequestForUrl

	err := utils.BindJSON(r, &reqData)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if reqData.URL == "" {
		http.Error(w, "url is required", http.StatusBadRequest)
		return
	}

	ok, eadded, err := c.es.InsertChunksFromWebsite(reqData.URL)
	if err != nil || ok != true {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": strconv.Itoa(eadded) + " embeddings added successfully",
	})
}

func (c *EmbeddingsController) ResolveQuery(w http.ResponseWriter, r *http.Request) {

	chatID := r.URL.Query().Get("chat_id")

	if chatID == "" {
		http.Error(w, "chat_id required", 400)
		return
	}

	var reqData ResolveQueryRequest

	err := utils.BindJSON(r, &reqData)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if reqData.QUE == "" {
		http.Error(w, "question is required", http.StatusBadRequest)
		return
	}

	ans, err := c.es.ResolveQuery(reqData.QUE, chatID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)

	}
	if ans == "" {
		ans = "empty response"
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"answer":  ans,
	})
}

func (c *EmbeddingsController) AddEmbeddingsFromText(w http.ResponseWriter, r *http.Request) {
	var reqData embeddingsRequestForText

	err := utils.BindJSON(r, &reqData)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if reqData.Text == "" {
		http.Error(w, "text is required", http.StatusBadRequest)
		return
	}

	ok, eadded, err := c.es.InsertChunksFromText(reqData.Text, reqData.Source)
	if err != nil || ok != true {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": strconv.Itoa(eadded) + " embeddings added successfully",
	})
}
