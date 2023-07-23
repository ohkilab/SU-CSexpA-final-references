from pydantic import BaseModel
from pydantic.fields import Field


class HelloRequest(BaseModel):
    name: str = Field(min_length=1, max_length=10)
    repeat: int = Field(default=1, le=5)


class HelloResponse(BaseModel):
    msg: str


class GeotagListResponse(BaseModel):
    class Item(BaseModel):
        lat: float
        lon: float
        date: str
        url: str

    tag: str
    results: list[Item]
