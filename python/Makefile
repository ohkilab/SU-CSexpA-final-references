.DEFAULT_GOAL := help

# この Makefile を表示する
.PHONY:	help
help:
	@batcat Makefile || bat Makefile || cat Makefile

# 静的解析によるソースコードの欠陥検知 + 型チェック
.PHONY:	lint
lint:
	ruff app
	pyright app

# ソースコードの整形
.PHONY:	fmt
fmt:
	black app
	isort app

# 整形されているかチェック
.PHONY:	fmt-check
fmt-check:
	black --check app
	isort --check app

# サーバーの起動 (Ctrl-C で終了)
.PHONY:	run/server
run/server:
	poetry run python3 -m app.cmd.serve
