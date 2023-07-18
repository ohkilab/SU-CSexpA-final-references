CARGO := $(shell command -v cargo 2> /dev/null)

.PHONY: install
install:
ifndef CARGO
	@curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
	@source ~/.cargo/env
endif

tag.json: install
	@cargo run --release --bin prepare

run:
	@cargo run --release --bin server
