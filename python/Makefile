.DEFAULT_GOAL := help

.venv:
	poetry install

# この Makefile を表示する
.PHONY:	help
help:
	@batcat Makefile || bat Makefile || cat Makefile

# 静的解析によるソースコードの欠陥検知 + 型チェック
.PHONY:	lint
lint:	.venv
	poetry run ruff app
	poetry run pyright app

# ソースコードの整形
.PHONY:	fmt
fmt:	.venv
	poetry run black app
	poetry run isort app

# 整形されているかチェック
.PHONY:	fmt-check
fmt-check:	.venv
	poetry run black --check app
	poetry run isort --check app

# サーバーの起動 (Ctrl-C で終了)
.PHONY:	run/server
run/server:	.venv
	poetry run python3 -m app.cmd.serve

.PHONY:	run/prepare
run/prepare:	.venv
	poetry run python3 ./app/cmd/prepare.py inner-join data/tag.csv data/geotag.csv -o data/merged.csv
