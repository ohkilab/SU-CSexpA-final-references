# Rust

## Technologies

- [actix_web](https://actix.rs/) ... web framework
- [sqlx](https://github.com/launchbadge/sqlx) ... sql

## Setup

- .env

1. `.env.sample` をコピーして `.env` を作成
2. username と password を変える

以下は username が `root`, password が `root` の例です。各自設定したものを入力してください。

```shell
DATABASE_URL="mysql://root:root@localhost:3306/CSexp1DB"
PORT=8080  # 適宜変更して下さい
```

## Run

※ コンパイルにだいぶ時間がかかる可能性があります。プログレスみたいなものが表示されていたら正常なので、30分ぐらい待ってみてください。

```rs
$ make run
```
