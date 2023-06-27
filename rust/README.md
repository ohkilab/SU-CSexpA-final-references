# Rust

## Technologies

- [actix_web](https://actix.rs/) ... web framework

## 手法

- `tag.csv` と `geotag.csv` を merge して `tag.json` を生成する

`tag.json` の形式は以下の通りです。

```json
{
    "list": [
        {
            "tag_name": "fuji",
            "geotags": [
                {
                    "date": "2012-07-14 00:02:21",
                    "latitude": 33.4,
                    "longitude": 377.6,
                    "url": "http://farm9.static.flickr.com/8144/7590065912_257e58ba4b.jpg"
                }
            ]
        }
    ]
}
```

## Setup

Rust 実装は `tag.csv` と `geotag.csv` を merge したデータである `tag.json` を利用して高速化を実現しています。`tag.json` の生成には非常に多くのメモリを必要とするため、`tag.json` の生成はご自身の PC で行うことを強くお勧めします。

```shell
$ make tag.json
loading ../csv/tag.csv ...
../csv/tag.csv has been loaded
loading ../csv/geotag.csv ...
../csv/geotag.csv has been loaded
generating ./tag.json ...
./tag.json has been generated

$ ls -l tag.json 
-rw-r--r--@ 1 earlgray  staff  1522750848 Jun 27 15:13 tag.json
```

## Run

```shell
$ make run
```
