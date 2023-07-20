import os
import pathlib
from typing import Annotated

import aiocsv
import aiofiles
import click
import uvicorn
from fastapi import FastAPI, Query

from app.config import Config
from app.schema import GeotagListResponse, HelloRequest, HelloResponse

PROJECT_ROOT_DIR = pathlib.Path(__file__).parent.parent

api = FastAPI()
cfg = Config(PROJECT_ROOT_DIR / ".env")


@api.get("/ping")
async def ping() -> str:
    """
    サーバーの起動状態の確認用。
    競技内容とは関係ない API なので消してOK。
    $ curl 'localhost:8000/ping'
    """
    return "pong"


@api.post("/hello")
async def hello(payload: HelloRequest) -> HelloResponse:
    r"""
    競技内容とは関係ない API なので消してOK。
    $ curl -XPOST 'localhost:8000/hello' -H 'Content-Type: application/json' -d '{"name": "Bob"}'
    """
    msg = f"Hello, {payload.name}!!"
    return HelloResponse(msg=msg * payload.repeat)


@api.post("/hello2")
async def hello2(payload: HelloRequest) -> dict:
    """HelloResponse を介さず直接 dict を返すこともできる"""
    msg = f"Hello, {payload.name}!!"
    return {"msg": msg * payload.repeat}


@api.get("/")
async def find_geotags_by_tag(
    q_tag: Annotated[str, Query(alias="tag")],
) -> GeotagListResponse:
    """
    本命の API の実装。
    データの持ち方やアルゴリズム、レスポンス処理の設定など改善できるところはたくさんあるのでがんばりましょう💪
    """
    Item = GeotagListResponse.Item
    results: list[Item] = []

    # 非同期 IO でファイルをオープン
    async with aiofiles.open(cfg.prepared_csv_path, mode="rt", encoding="utf-8") as f:
        # CSV の行を1行ずつ読み込んで tag が q_tag と一致する行だけ集める
        async for row in aiocsv.readers.AsyncReader(f):
            tag, date, lat, lon, url = row
            if tag == q_tag:
                item = Item(
                    date=date,
                    lat=float(lat),
                    lon=float(lon),
                    url=url,
                )
                results.append(item)

    # 日付の降順でソート
    results.sort(key=lambda x: x.date, reverse=True)

    # ソート結果の先頭 100 行までをレスポンス
    return GeotagListResponse(tag=q_tag, results=results[:100])


@click.command
@click.option(
    "-w",
    "--workers",
    type=int,
    required=False,
    show_default=True,
    help=".env の NUM_WORKERS をこの値で上書きする",
)
@click.option("--reload", is_flag=True, help="app/ 以下のファイルが変更されたら自動で再読み込みする")
def main(
    workers: int | None,
    reload: bool,
) -> None:
    assert os.path.exists(cfg.prepared_csv_path)

    uvicorn.run(
        "app.main:api",
        port=cfg.port,
        host=cfg.host,
        workers=workers or cfg.num_workers,
        reload=reload,
        reload_dirs=[str(PROJECT_ROOT_DIR / "app")],
    )


if __name__ == "__main__":
    main()
