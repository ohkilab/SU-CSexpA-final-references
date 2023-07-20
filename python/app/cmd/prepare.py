import csv
import logging
from collections import defaultdict

import click

TagID = int
TagName = str

# (TagID -> (TagNameの集合)) を表す辞書型 (写像)
TagNamessDict = defaultdict[TagID, set[TagName]]

# ログ出力の設定
log = logging.getLogger(__name__)
logging.basicConfig(
    format="[%(asctime)s %(levelname)s] Line%(lineno)03d: %(funcName)s(): %(message)s",
    datefmt="%H:%M:%S",
)
log.setLevel(logging.DEBUG)


@click.group
def cli():
    pass


def load_tag_csv(csv_path: str) -> TagNamessDict:
    log.info(f"Start loading {csv_path}")

    dic: TagNamessDict = defaultdict(set)
    with open(csv_path) as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader, start=1):
            assert len(row) == 2
            tag_id, name = row
            dic[int(tag_id)].add(name)

            if i % 2_000_000 == 0:
                log.info(f"Processed {i} lines.")

    return dic


@cli.command
@click.argument("tag_csv", type=click.Path(exists=True))
@click.argument("geotag_csv", type=click.Path(exists=True))
@click.option("-o", "--out-csv", type=click.Path(), required=True)
def inner_join(
    tag_csv: str,
    geotag_csv: str,
    out_csv: str,
) -> None:
    # コマンドライン引数のチェック
    assert tag_csv.endswith(".csv")
    assert geotag_csv.endswith(".csv") and geotag_csv != tag_csv
    assert out_csv.endswith(".csv") and out_csv != tag_csv and out_csv != geotag_csv

    tag_names = load_tag_csv(tag_csv)

    # geotag.csv を1行ずつ読み込む
    log.info(f"Start loading {geotag_csv}")
    with open(geotag_csv) as f_geotag, open(out_csv, mode="w") as f_out:
        reader = csv.reader(f_geotag)
        writer = csv.writer(f_out)

        for i, row in enumerate(reader, start=1):
            tid, date, lat, lon, url = row
            tid = int(tid)

            if tid not in tag_names:
                continue

            for name in tag_names[tid]:
                writer.writerow((name, date, lat, lon, url))

            if i % 1_000_000 == 0:
                log.info(f"Processed {i} lines.")

    log.info(f"Successfully generated to {out_csv}")


if __name__ == "__main__":
    cli()
