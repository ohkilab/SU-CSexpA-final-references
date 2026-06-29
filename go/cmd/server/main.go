package main

import (
	"database/sql"
	"encoding/json"
	"go/repository"
	"log"
	"net/http"
	"os"
	"strings"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	"github.com/samber/lo"
)

func init() {
	if err := godotenv.Load(".env"); err != nil {
		log.Fatal(err)
	}
}

type Response struct {
	Tag     string       `json:"tag"`
	Results []*TagResult `json:"results"`
}

type TagResult struct {
	Lat  float64 `json:"lat"`
	Lon  float64 `json:"lon"`
	Date string  `json:"date"`
	URL  string  `json:"url"`
}

func main() {
	db, err := sql.Open("mysql", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal("failed to connect db:", err)
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		query := r.URL.Query()
		tags := make([]string, 0, len(query["tag"]))
		for _, tag := range query["tag"] {
			if tag != "" {
				tags = append(tags, tag)
			}
		}
		if len(tags) == 0 {
			http.Error(w, "tag is required", http.StatusBadRequest)
			return
		}

		tagOperator := query.Get("tagOperator")
		switch tagOperator {
		case "":
			if len(tags) > 1 {
				http.Error(w, "tagOperator is required for multiple tags", http.StatusBadRequest)
				return
			}
			tagOperator = "or"
		case "and", "or":
		default:
			http.Error(w, "tagOperator must be 'and' or 'or'", http.StatusBadRequest)
			return
		}

		sortOrder := query.Get("sortOrder")
		switch sortOrder {
		case "":
			sortOrder = "desc"
		case "asc", "desc":
		default:
			http.Error(w, "sortOrder must be asc or desc", http.StatusBadRequest)
			return
		}

		geotags, err := repository.GetGeotags(r.Context(), db, tags, tagOperator, strings.ToUpper(sortOrder))
		if err != nil {
			log.Println(err)
			http.Error(w, "failed to get geotags", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(&Response{
			Tag: strings.Join(tags, ","),
			Results: lo.Map(geotags, func(geotag *repository.GeoTag, _ int) *TagResult {
				return &TagResult{
					Lat:  geotag.Latitude,
					Lon:  geotag.Longitude,
					Date: geotag.Time.Format("2006-01-02 15:04:05"),
					URL:  geotag.URL,
				}
			}),
		}); err != nil {
			log.Println(err)
			http.Error(w, "failed to encode to json", http.StatusInternalServerError)
		}
	})

	log.Printf("Server listening on http://localhost:%s\n", os.Getenv("PORT"))
	if err := http.ListenAndServe(":"+os.Getenv("PORT"), nil); err != nil {
		log.Println(err)
	}
}
