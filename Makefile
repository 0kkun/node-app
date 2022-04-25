.PHONY: init
init:
	@make build
	@make install
	cp .env.example .env

.PHONY: build
build: 
	docker-compose build --no-cache --force-rm

.PHONY: up
up:
	docker-compose up -d

.PHONY: stop
stop:
	docker-compose stop

.PHONY: down
down:
	docker-compose down

.PHONY: node
node:
	docker-compose exec node bash

.PHONY: start
start:
	cd node; npm start

.PHONY: install
install:
	cd node; npm install