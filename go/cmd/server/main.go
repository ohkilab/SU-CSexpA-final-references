package main

import (
	"database/sql"
	"encoding/json"
	"go/repository"
	"log"
	"net/http"
	"os"

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

		name := r.URL.Query().Get("tag")
		geotags, err := repository.GetGeotagsByTag(r.Context(), db, name)
		if err != nil {
			log.Println(err)
			http.Error(w, "failed to get geotags", http.StatusInternalServerError)
			return
		}

		if err := json.NewEncoder(w).Encode(&Response{
			Tag: name,
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
