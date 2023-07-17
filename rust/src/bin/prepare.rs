use std::{collections::HashMap, error::Error, fs::File, io::BufWriter};

use csv::Reader as CSVReader;
use rust::model::{Geotag, TagGeotag, TagJSON};

fn main() -> Result<(), Box<dyn Error>> {
    eprintln!("loading ../csv/tag.csv ...");
    let mut tag_name_by_id = HashMap::new();
    {
        let mut tag_csv = CSVReader::from_path("../csv/tag.csv")?;
        for record in tag_csv.records() {
            let record = record?;
            tag_name_by_id.insert(
                record.get(0).unwrap().to_string(),
                record.get(1).unwrap().to_string(),
            );
        }
    }
    eprintln!("../csv/tag.csv has been loaded");

    eprintln!("loading ../csv/geotag.csv ...");
    let mut geotags_by_tag_name = HashMap::new();
    {
        let mut geotag_csv = CSVReader::from_path("../csv/geotag.csv")?;
        for record in geotag_csv.records() {
            let record = record?;
            let tag_name = match tag_name_by_id.get(record.get(0).unwrap()) {
                Some(x) => x,
                None => continue,
            };

            let entry = geotags_by_tag_name.entry(tag_name).or_insert(Vec::new());
            entry.push(Geotag {
                date: record.get(1).unwrap().trim_matches('"').to_string(),
                latitude: record.get(2).unwrap().parse().unwrap(),
                longitude: record.get(3).unwrap().parse().unwrap(),
                url: record.get(4).unwrap().to_string(),
            });
        }
    }
    eprintln!("../csv/geotag.csv has been loaded");

    eprintln!("generating ./tag.json ...");
    let mut tag_json = TagJSON { list: Vec::new() };
    for (tag_name, geotags) in geotags_by_tag_name {
        tag_json.list.push(TagGeotag {
            tag_name: tag_name.clone(),
            geotags,
        });
    }
    let f = File::create("tag.json")?;
    let w = BufWriter::new(f);
    serde_json::to_writer(w, &tag_json)?;
    eprintln!("./tag.json has been generated");

    Ok(())
}
