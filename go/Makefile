GO := $(shell command -v go 2> /dev/null)

.PHONY: install
install:
ifndef GO
	TEMP_DIR := $(shell mktemp -d)
	@wget -o $(TEMP_DIR) https://go.dev/dl/go1.20.4.linux-armv6l.tar.gz
	@sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf $(TEMP_DIR)/go1.20.4.linux-armv6l.tar.gz
	@echo export PATH='$$'PATH:/usr/local/go/bin >> ~/.bashrc
	@source ~/.bashrc
endif

.PHONY: run
run: install
	@go run ./cmd/server
