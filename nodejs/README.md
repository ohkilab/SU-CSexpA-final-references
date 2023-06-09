# 情報科学実験A最終課題サンプル実装（Node.js版）

## 事前準備
このコードを実行するために以下のソフトが必要

[ripgrep](https://github.com/BurntSushi/ripgrep)
[nodeとnpm](https://nodejs.org/ja)

ripgrepは以下のコマンドで導入できる

### macOS (homebrew)
```sh
brew install ripgrep
```

### Ubuntu Linux / Raspbian / Windows WSL
```sh
sudo apt-get install ripgrep
```

nodeとnpmは以下のコマンド導入できる

### macOS (homebrew)
```sh
brew install node
```

### Ubuntu Linux / Raspbian / Windows WSL
```sh
sudo apt-get install nodejs npm
```

## 実行方法
初回の実行では、dependencyを導入する必要がある
dependencyをインストールするためには、カレントディレクトリを本ディレクトリにして以下のコマンドを実行する

```sh
npm install
```

サーバーを起動するために以下のコマンドを実行する
```sh
npm start
```

または
```sh
node index.js
```
