// rustのプログラムはオンメモリで動作しますが、csvファイルをそのまま流し込むだけでは2GBに収まらないためうまく前処理を行う必要があります
use actix_web::{
    get, http::StatusCode, web, App, HttpResponse, HttpServer,
};
use rust::model::TagJSON;
use serde::Serialize;
use std::error::Error;
use std::collections::{HashMap, HashSet};

const PORT: u16 = 3000;

#[actix_web::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("Listening on http://localhost:{}...", PORT);
    
    // [hint] の通り、サーバー起動時に tag.json を一度だけ読み込んで再利用する
    // 元の型（TagJSON）のまま web::Data に格納して共有します
    let tag_json = TagJSON::from_path("tag.json").expect("Failed to load tag.json");
    let app_data = web::Data::new(tag_json);

    HttpServer::new(move || {
        App::new()
            .app_data(app_data.clone())
            .service(handle)
    })
    .bind(("0.0.0.0", PORT))?
    .run()
    .await?;

    Ok(())
}

// 出力形式の要件（"tag" と "results" のキーを持つJSON）に合わせたレスポンス用構造体
#[derive(Serialize)]
struct SearchResponse {
    tag: String,
    results: Vec<rust::model::Geotag>,
}

// GET http://localhost:8080/?tag=cat&tag=dog&tagOperator=and&sortOrder=asc で動作
// ※ 同一名のキーが複数渡るクエリに対応するため、paramsの型を変更しています
#[get("/")]
async fn handle(
    query: web::Query<Vec<(String, String)>>,
    tag_json: web::Data<TagJSON>, // 起動時に読み込んだデータを参照
) -> Result<HttpResponse, actix_web::Error> {
    
    let mut tags = Vec::new();
    let mut tag_operator = "or".to_string();
    let mut sort_order = "desc".to_string();

    // クエリパラメータのパース
    for (key, value) in query.into_inner() {
        match key.as_str() {
            "tag" => tags.push(value),
            "tagOperator" => tag_operator = value,
            "sortOrder" => sort_order = value,
            _ => {}
        }
    }

    // タグが一つも指定されていない場合は、空の結果を返す
    if tags.is_empty() {
        return Ok(HttpResponse::build(StatusCode::OK)
            .content_type("application/json")
            .json(SearchResponse {
                tag: "".to_string(),
                results: vec![],
            }));
    }

    // AND検索の正確な判定のために重複を排除したターゲットタグを用意
    let mut target_tags = HashSet::new();
    for tag in &tags {
        target_tags.insert(tag);
    }

    // 各URLの出現回数とデータを記録する一時マップ
    let mut url_counts = HashMap::new();
    let mut url_to_geotag = HashMap::new();

    // 元のプログラムの「tag_json.list からループで一致するタグを探索する」基本処理を踏襲
    for t in &tag_json.list {
        if target_tags.contains(&t.tag_name) {
            // 同一タグ内での写真（URL）の重複カウントを防止
            let mut seen_in_tag = HashSet::new();
            for g in &t.geotags {
                if seen_in_tag.insert(&g.url) {
                    *url_counts.entry(g.url.clone()).or_insert(0) += 1;
                    url_to_geotag.entry(g.url.clone()).or_insert_with(|| g.clone());
                }
            }
        }
    }

    // tagOperator (and / or) に応じたフィルタリング処理
    let mut final_geotags = Vec::new();
    for (url, count) in url_counts {
        let is_match = if tag_operator == "and" {
            count == target_tags.len() // 指定されたすべてのタグに含まれているか
        } else {
            count >= 1 // いずれかのタグに含まれているか
        };

        if is_match {
            if let Some(g) = url_to_geotag.remove(&url) {
                final_geotags.push(g);
            }
        }
    }

    // 元の並び替え処理（sort_unstable_by）の記述を踏襲しつつ、要件に合わせて拡張
    // （dateの昇順/降順、同一dateの場合はurlの文字列昇順）
    final_geotags.sort_unstable_by(|l, r| {
        let date_cmp = if sort_order == "asc" {
            l.date.cmp(&r.date)
        } else {
            r.date.cmp(&l.date)
        };

        if date_cmp == std::cmp::Ordering::Equal {
            l.url.cmp(&r.url) // タイブレーク：URLの辞書順
        } else {
            date_cmp
        }
    });

    // 出力形式の仕様に従い、上位100件のみに制限
    final_geotags.truncate(100);

    // 出力データ構造の作成
    let response_data = SearchResponse {
        tag: tags.join(","), // 複数タグはコンマ区切り
        results: final_geotags,
    };

    // 元の HttpResponse ビルド処理を踏襲して送信
    Ok(HttpResponse::build(StatusCode::OK)
        .content_type("application/json")
        .json(response_data))
}
