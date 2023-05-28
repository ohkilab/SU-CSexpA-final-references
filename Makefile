.PHONY: db/start
db/start:
	@docker build \
		-t su-csexpa-db:2023 \
		-f ./db/Dockerfile \
		.
	@docker run -d \
		--name su-csexpa-db \
		-e MARIADB_ROOT_PASSWORD=root \
		-p "3306:3306" \
		su-csexpa-db:2023

.PHONY: db/stop
db/stop:
	@docker stop su-csexpa-db
