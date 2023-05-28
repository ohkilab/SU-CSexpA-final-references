CREATE DATABASE CSexp1DB;

USE CSexp1DB;

CREATE TABLE
    geotag (
        id BIGINT UNSIGNED PRIMARY KEY,
        time DATETIME,
        latitude DOUBLE,
        longitude DOUBLE,
        url VARCHAR(100)
    );

CREATE TABLE
    tag (id BIGINT UNSIGNED, tag VARCHAR(300));

LOAD DATA LOCAL INFILE "/tmp/csv/geotag.csv" INTO TABLE geotag FIELDS TERMINATED BY ',' ENCLOSED BY '"';

LOAD DATA LOCAL INFILE "/tmp/csv/tag.csv" INTO TABLE tag FIELDS TERMINATED BY ',' ENCLOSED BY '"';