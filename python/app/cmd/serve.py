import os

import click
import uvicorn
from fastapi import FastAPI

from app.config import PROJECT_ROOT_DIR, cfg
from app.routers import router

api = FastAPI()
api.include_router(router)


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
        "app.cmd.serve:api",
        port=cfg.port,
        host=cfg.host,
        workers=workers or cfg.num_workers,
        reload=reload,
        reload_dirs=[str(PROJECT_ROOT_DIR / "app")],
    )


if __name__ == "__main__":
    main()
