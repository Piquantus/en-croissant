install-depedencies:
	sudo npm install 
	curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
	export NVM_DIR="$HOME/.nvm"
	[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
	nvm install --lts
	nvm use --lts
	node -v
	npm uninstall -g pnpm
	npm install -g pnpm
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	source $HOME/.cargo/env
	rustup --version
	cargo --version
	rustc --version

fix-Wsl:
	sudo apt update
	sudo apt install -y \
	pkg-config \
	libglib2.0-dev \
	libgobject-2.0-dev \
	libgtk-3-dev \
	libatk1.0-dev \
	libgdk-pixbuf2.0-dev \
	libpango1.0-dev \
	libwebkit2gtk-4.1-dev \
	libayatana-appindicator3-dev \
	librsvg2-dev \
	patchelf \
	build-essential

build: 
	cd src-tauri
	cargo clean
	cd ..
	pnpm build