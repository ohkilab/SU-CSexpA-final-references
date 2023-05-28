package repository

import (
	"context"
	"database/sql"
	"time"
)

type GeoTag struct {
	Tag       string
	ID        uint64
	Time      time.Time
	Latitude  float64
	Longitude float64
	URL       string
}

func GetGeotagsByTag(ctx context.Context, conn *sql.DB, name string) ([]*GeoTag, error) {
	rows, err := conn.QueryContext(ctx,
		`SELECT t.tag, g.id, g.time, g.latitude, g.longitude, g.url FROM tag AS t
	INNER JOIN geotag AS g ON t.id = g.id
	WHERE t.tag = ?
	ORDER BY g.time DESC
	LIMIT 100`,
		name)
	if err != nil {
		return nil, err
	}
	geotags := make([]*GeoTag, 0)
	for rows.Next() {
		var err error
		geotag := &GeoTag{}
		var rawTime string
		if err := rows.Scan(&geotag.Tag, &geotag.ID, &rawTime, &geotag.Latitude, &geotag.Longitude, &geotag.URL); err != nil {
			return nil, err
		}

		geotag.Time, err = time.Parse("2006-01-02 15:04:05", rawTime)
		if err != nil {
			return nil, err
		}
		geotags = append(geotags, geotag)
	}
	return geotags, nil
}
