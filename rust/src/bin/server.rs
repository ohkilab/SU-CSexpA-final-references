use actix_web::{
    error::ErrorInternalServerError, get, http::StatusCode, web::Query, App, HttpResponse,
    HttpServer,
};
use rust::model::TagJSON;
use serde::Deserialize;
use std::error::Error;

const PORT: u16 = 8080;

#[actix_web::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("Listening on http://localhost:{}...", PORT);
    HttpServer::new(move || App::new().service(handle))
        .bind(("0.0.0.0", PORT))?
        .run()
        .await?;

    Ok(())
}

#[derive(Deserialize)]
struct GetParameter {
    tag: String,
}

// GET http://localhost:8080/?tag=hoge で動く
#[get("/")]
async fn handle(
    params: Query<GetParameter>, // http://example.com?tag=hoge の hoge が入ってる
) -> Result<HttpResponse, actix_web::Error> {
    dbg!(&params.tag);

    // 前処理データである tag.json を読み込む
    // [hint] サーバー起動時に読み込んでそれを再利用すれば良さそう
    // actix_web だと web::Data<T> を使ってデータを保持することができる
    // それをしないと多分 tag.json の load だけでタイムアウトします
    // ref: https://actix.rs/docs/application/#state
    let tag_json = TagJSON::from_path("tag.json").map_err(ErrorInternalServerError)?;

    // tag 名が一致する tag を探索する
    // [hint] これ O(1) でできそう
    let mut tag = None;
    for t in tag_json.list {
        if t.tag_name == params.tag {
            tag = Some(t);
            break;
        }
    }

    // 非常に良くないけど存在するタグしか飛んでこないので unwrap する
    let mut tag = tag.unwrap();

    // 日付昇順で並び替え
    // [hint] これ前処理できそう
    tag.geotags.sort_unstable_by(|l, r| l.date.cmp(&r.date));

    // response
    Ok(HttpResponse::build(StatusCode::OK)
        .content_type("application/json")
        .json(tag.geotags))
}
