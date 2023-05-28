use actix_web::{
    get,
    middleware::Logger,
    web::{Data, Query},
    App, HttpResponse, HttpServer,
};
use dotenv::dotenv;
use env_logger::Env;
use log::{error, info};
use serde::{Deserialize, Serialize};
use sqlx::mysql::MySqlPool;
use std::{env, sync::Arc};

use crate::repository::get_geotags_by_tag;

mod repository;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    //env_logger::init_from_env(Env::default().default_filter_or("debug"));

    let pool = Arc::new(MySqlPool::connect(&env::var("DATABASE_URL")?).await?);

    HttpServer::new(move || {
        App::new()
            .app_data(Data::new(pool.clone()))
            .wrap(Logger::default())
            .service(handle)
    })
    .bind(("0.0.0.0", env::var("PORT").unwrap().parse()?))?
    .run()
    .await?;

    Ok(())
}

#[derive(Debug, Clone, Serialize)]
struct Response {
    tag: String,
    results: Vec<TagResult>,
}

#[derive(Debug, Clone, Serialize)]
struct TagResult {
    lat: f64,
    lon: f64,
    date: String,
    url: String,
}

#[derive(Deserialize)]
struct HandleQuery {
    tag: String,
}

#[get("/")]
async fn handle(pool: Data<Arc<MySqlPool>>, query: Query<HandleQuery>) -> HttpResponse {
    info!("tag = {}", &query.tag);

    let geotags = match get_geotags_by_tag(&pool, &query.tag).await {
        Ok(geotag) => geotag,
        Err(e) => {
            error!("{}", &e);
            return HttpResponse::InternalServerError()
                .reason("failed to get geotag from DB")
                .finish();
        }
    };

    HttpResponse::Ok().json(Response {
        tag: query.tag.clone(),
        results: geotags
            .iter()
            .map(|geotag| TagResult {
                lat: geotag.latitude.unwrap(),
                lon: geotag.longitude.unwrap(),
                date: geotag.time.unwrap().format("%F %T").to_string(),
                url: geotag.url.as_ref().unwrap().clone(),
            })
            .collect::<Vec<_>>(),
    })
}
