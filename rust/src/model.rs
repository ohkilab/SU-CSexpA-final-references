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

// tag.json の struct
/*
[hint] 現状は愚直に各フィールドを読み込んでいるので RAM が 1GB だと多分メモリに乗せるのは無理です
乗せる方法としては以下の方法が挙げられます。
1. url の表現方法を変えてみる
    URL の形式は http://farm9.static.flickr.com/8050/8376611070_aeb13ec0fe.jp
    http://farm と .static.flickr.com/ と .jp は共通部分だから取り除くことができそう
    8050 は文字列だと 4byte だが整数にすれば 2byte(16bit) で表現できそう
    こんな感じのことをうまい具合にやると 60byte から 10byte ぐらいまで節約できると思います
2. date の表現方法を変えてみる
    ある時間を基準とした経過時間として表現すれば 32bit まで削減できそう
3. など
*/
#[derive(Serialize, Deserialize)]
pub struct TagGeotag {
    pub tag_name: String,
    pub geotags: Vec<Geotag>,
}

#[derive(Serialize, Deserialize)]
pub struct Geotag {
    pub date: String,
    pub latitude: f64,
    pub longitude: f64,
    pub url: String,
}
