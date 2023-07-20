import os
import pathlib

from dotenv import dotenv_values


class Config:
    prepared_csv_path: str
    port: int
    host: str
    num_workers: int

    def __init__(self, dotenv_path: str | os.PathLike) -> None:
        env_dict = dotenv_values(dotenv_path)
        assert env_dict is not None, f"Please create a file `{dotenv_path}` ."

        def get_or_die(key: str) -> str:
            value = env_dict.get(key)
            if value is None:
                raise ValueError(f"No such environment variable `{key}`. Check your `.env` file.")
            return value

        self.prepared_csv_path = get_or_die("PREPARED_CSV_PATH")
        self.port = int(env_dict.get("PORT") or "8080")
        self.host = env_dict.get("HOST") or "0.0.0.0"
        self.num_workers = int(env_dict.get("NUM_WORKERS") or "1")


PROJECT_ROOT_DIR = pathlib.Path(__file__).parent.parent

cfg = Config(PROJECT_ROOT_DIR / ".env")
