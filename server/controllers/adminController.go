package controllers

import (
	"net/http"
	"server/services"
	"server/utils"
)

type AdminController struct {
	as *services.AdminService
}

func NewAdminController(s *services.AdminService) *AdminController {
	return &AdminController{as: s}
}

func (c *AdminController) GetData(w http.ResponseWriter, r *http.Request) {
	data, err := c.as.GetData()
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    data,
	})
}

func (c *AdminController) DeleteSource(w http.ResponseWriter, r *http.Request) {

	source := r.URL.Query().Get("source")
	if source == "" {
		http.Error(w, "source is neeeded", http.StatusBadRequest)
		return
	}
	success, err := c.as.DeleteSource(source)
	if err != nil || !success {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"success": success,
	})
}
