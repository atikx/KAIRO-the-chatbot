package services

import (
	"database/sql"
	"server/structs"
)

type AdminService struct {
	DB *sql.DB
}

func NewAdminService(db *sql.DB) *AdminService {
	return &AdminService{DB: db}
}

func (s *AdminService) GetData() ([]structs.AdminData, error) {

	query := `
		SELECT source, COUNT(*) as chunk_count
		FROM chunks
		GROUP BY source;
	`

	rows, err := s.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []structs.AdminData

	for rows.Next() {
		var row structs.AdminData

		err := rows.Scan(&row.Source, &row.Chunks_count)
		if err != nil {
			return nil, err
		}

		data = append(data, row)
	}

	// check iteration error
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return data, nil
}

func (s *AdminService) DeleteSource(source string) (bool, error) {
	query := `
		DELETE FROM chunks where source = ?
	`
	_, err := s.DB.Exec(query, source)
	if err != nil {
		return false, err
	}
	return true, nil
}
