from typing import Annotated

import aiocsv
import aiofiles
from fastapi import APIRouter, Query

from app.config import cfg
from app.schema import GeotagListResponse, HelloRequest, HelloResponse

router = APIRouter()


@router.get("/ping")
async def ping() -> str:
    """
    サーバーの起動状態の確認用。
    競技内容とは関係ない API なので消してOK。
    $ curl 'localhost:8000/ping'
    """
    return "pong"


@router.post("/hello")
async def hello(payload: HelloRequest) -> HelloResponse:
    r"""
    競技内容とは関係ない API なので消してOK。
    $ curl -XPOST 'localhost:8000/hello' -H 'Content-Type: application/json' -d '{"name": "Bob"}'
    """
    msg = f"Hello, {payload.name}!!"
    return HelloResponse(msg=msg * payload.repeat)


@router.post("/hello2")
async def hello2(payload: HelloRequest) -> dict:
    """HelloResponse を介さず直接 dict を返すこともできる"""
    msg = f"Hello, {payload.name}!!"
    return {"msg": msg * payload.repeat}


@router.get("/")
async def find_geotags_by_tag(
    q_tag: Annotated[str, Query(alias="tag")],
) -> GeotagListResponse:
    """
    本命の API の実装。
    現状の実装ではタイムアウトするはずですが
    データの持ち方やアルゴリズム、レスポンス処理の設定など
    改善できるところは多いにあるのでがんばりましょう💪
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
