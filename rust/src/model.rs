// rustのプログラムはオンメモリで動作しますが、csvファイルをそのまま流し込むだけでは2GBに収まらないためうまく前処理を行う必要があります
use serde::{Deserialize, Serialize};
use std::{error::Error, fs::File, io::BufReader, path::Path};

#[derive(Serialize, Deserialize)]
pub struct TagJSON {
    pub list: Vec<TagGeotag>,
}

impl TagJSON {
    // json を読み込んで TagJSON に unmarshal して返す
    pub fn from_path<P: AsRef<Path>>(p: P) -> Result<Self, Box<dyn Error>> {
        let f = File::open(p)?;
        let r = BufReader::new(f);
        let tag_json = serde_json::from_reader(r)?;
        Ok(tag_json)
    }
}

#[derive(Serialize, Deserialize)]
pub struct TagGeotag {
    pub tag_name: String,
    pub geotags: Vec<Geotag>,
}

// サーバー内で使い回すため Clone を追加
// 画像の出力形式に合わせてキー名を lat, lon に変更
#[derive(Serialize, Deserialize, Clone)]
pub struct Geotag {
    #[serde(rename = "lat")]
    pub latitude: f64,
    #[serde(rename = "lon")]
    pub longitude: f64,
    pub date: String,
    pub url: String,
}

// 新規追加: 指定された出力形式のJSONラッパー
#[derive(Serialize, Deserialize)]
pub struct SearchResponse {
    pub tag: String,
    pub results: Vec<Geotag>,
}
