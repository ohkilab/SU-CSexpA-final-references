package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
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
	return GetGeotags(ctx, conn, []string{name}, "or", "DESC")
}

func GetGeotags(ctx context.Context, conn *sql.DB, tags []string, tagOperator, sortOrder string) ([]*GeoTag, error) {
	if len(tags) == 0 {
		return nil, errors.New("tags must not be empty")
	}
	switch tagOperator {
	case "and", "or":
	default:
		return nil, errors.New("tagOperator must be 'and' or 'or'")
	}
	switch sortOrder {
	case "ASC", "DESC":
	default:
		return nil, errors.New("sortOrder must be 'ASC' or 'DESC'")
	}

	args := make([]any, 0, len(tags)+1)
	placeholders := make([]string, 0, len(tags))
	for _, tag := range tags {
		args = append(args, tag)
		placeholders = append(placeholders, "?")
	}

	having := ""
	if tagOperator == "and" {
		having = "HAVING COUNT(DISTINCT t.tag) = ?"
		args = append(args, len(tags))
	}

	rows, err := conn.QueryContext(ctx,
		fmt.Sprintf(`SELECT g.id, g.time, g.latitude, g.longitude, g.url FROM tag AS t
	INNER JOIN geotag AS g ON t.id = g.id
	WHERE t.tag IN (%s)
	GROUP BY g.id, g.time, g.latitude, g.longitude, g.url
	%s
	ORDER BY g.time %s, g.url ASC
	LIMIT 100`,
			strings.Join(placeholders, ","),
			having,
			sortOrder,
		),
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	geotags := make([]*GeoTag, 0)
	for rows.Next() {
		var err error
		geotag := &GeoTag{}
		var rawTime string
		if err := rows.Scan(&geotag.ID, &rawTime, &geotag.Latitude, &geotag.Longitude, &geotag.URL); err != nil {
			return nil, err
		}

		geotag.Time, err = time.Parse("2006-01-02 15:04:05", rawTime)
		if err != nil {
			return nil, err
		}
		geotags = append(geotags, geotag)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return geotags, nil
}
