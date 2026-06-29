from typing import Annotated, Literal

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


PhotoKey = tuple[str, float, float, str]


@router.get("/")
async def find_geotags_by_tag(
    q_tag: Annotated[list[str], Query(alias="tag")],
    q_tag_operator: Annotated[Literal["and", "or"], Query(alias="tagOperator")] = "or",
    q_sort_order: Annotated[Literal["asc", "desc"], Query(alias="sortOrder")] = "desc",
) -> GeotagListResponse:
    """
    本命の API の実装。
    現状の実装ではタイムアウトするはずですが
    データの持ち方やアルゴリズム、レスポンス処理の設定など
    改善できるところは多いにあるのでがんばりましょう💪
    """
    Item = GeotagListResponse.Item
    query_tags = list(dict.fromkeys(q_tag))
    query_tag_set = set(query_tags)
    candidates: dict[PhotoKey, tuple[Item, set[str]]] = {}

    # 非同期 IO でファイルをオープン
    async with aiofiles.open(cfg.prepared_csv_path, mode="rt", encoding="utf-8") as f:
        # CSV の行を1行ずつ読み込んで、検索対象タグに一致する写真だけ集める
        async for row in aiocsv.readers.AsyncReader(f):
            tag, date, lat, lon, url = row
            if tag not in query_tag_set:
                continue

            lat_float = float(lat)
            lon_float = float(lon)
            photo_key = (date, lat_float, lon_float, url)

            if photo_key not in candidates:
                item = Item(
                    date=date,
                    lat=lat_float,
                    lon=lon_float,
                    url=url,
                )
                candidates[photo_key] = (item, set())

            candidates[photo_key][1].add(tag)

    if q_tag_operator == "and":
        results = [item for item, tags in candidates.values() if query_tag_set <= tags]
    else:
        results = [item for item, _ in candidates.values()]

    # date が同一の場合は sortOrder に関係なく URL の昇順で返す
    results.sort(key=lambda x: x.url)
    results.sort(key=lambda x: x.date, reverse=q_sort_order == "desc")

    # ソート結果の先頭 100 行までをレスポンス
    return GeotagListResponse(tag=",".join(query_tags), results=results[:100])
