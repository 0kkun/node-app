build: 
	docker-compose build --no-cache --force-rm

up:
	docker-compose up -d

stop:
	docker-compose stop

down:
	docker-compose down

.PHONY: node
node:
	docker-compose exec node bash

.PHONY: start
start:
	cd node; npm start