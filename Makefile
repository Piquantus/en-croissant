SHELL := /bin/bash

build:
	./dev.sh

clean:
	rm -rf venv
	rm -rf src/CoachServer/__pycache__
