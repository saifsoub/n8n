start:
	docker compose -f docker-compose.local.yml up -d

stop:
	docker compose -f docker-compose.local.yml down

restart:
	docker compose -f docker-compose.local.yml down && docker compose -f docker-compose.local.yml up -d

health:
	bash scripts/healthcheck.sh

validate:
	bash scripts/validate-workflows.sh
	bash scripts/validate-secrets.sh
