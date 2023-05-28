// ref: https://docs.rs/sqlx/latest/sqlx/trait.FromRow.html

use sqlx::{query_as, types::chrono::NaiveDateTime, MySqlPool};

#[derive(Debug, Clone, sqlx::FromRow)]
// NOT NULL 制約を設けていないので optional となっています
// とはいえ NULL の column はないはずなので基本的に unwrap しています
pub struct GeoTag {
    pub tag: Option<String>,
    pub id: u64,
    pub time: Option<NaiveDateTime>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub url: Option<String>,
}

pub async fn get_geotags_by_tag(pool: &MySqlPool, name: &str) -> Result<Vec<GeoTag>, sqlx::Error> {
    // HINT: tag のあるカラムに対して index を貼ってないとかなり遅いです
    let tags = query_as!(
        GeoTag,
        r#"
SELECT t.tag, g.id, g.time, g.latitude, g.longitude, g.url FROM tag AS t
    INNER JOIN geotag AS g ON t.id = g.id
    WHERE t.tag = ?
    ORDER BY g.time DESC
    LIMIT 100
    "#,
        name
    )
    .fetch_all(pool)
    .await?;
    Ok(tags)
}
