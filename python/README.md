# Python3

## 主な使用ライブラリ

- [FastAPI](https://fastapi.tiangolo.com/ja/) ... Web Framework
- [aiofiles](https://github.com/Tinche/aiofiles) ... ファイルIOの非同期版
- [aiocsv](https://github.com/MKuranowski/aiocsv) ... CSVパーサの非同期版
- [click](https://click.palletsprojects.com/en/8.1.x/) ... 主にコマンドライン引数の定義・パース処理に使用

## 手法の概要
:warning: 本リポジトリで提供している実装はあくまで参考実装です。おそらくタイムアウトします。

1. 前処理として、`tag.csv` と `geotag.csv` をマージ (ID で INNER JOIN) した結果を生成する。これを `merged.csv` と呼ぶことにする。

    マージ結果は以下のようなものである：
    ```csv
    cat,2013-02-28 19:38:40,43.648559,-79.38533,http://farm9.static.flickr.com/8508/8516430451_9d672ff08f.jpg
    animal,2013-02-28 19:38:40,43.648559,-79.38533,http://farm9.static.flickr.com/8508/8516430451_9d672ff08f.jpg
    pizza,2013-03-02 13:02:09,37.604511,-122.457795,http://farm9.static.flickr.com/8510/8521963923_c4f589bc09.jpg
    ```

2. Web サーバーでは、HTTP リクエストが飛んでくるたびに `merged.csv` をオープンして1行ずつ読み、クエリのタグと一致する行だけ集める。

3. 集めた行のデータを日付の降順でソートしてから、上位100件を JSON でレスポンスする。

## セットアップ

1. 以下の手順で pyenv をインストールする。

    ※ pyenv を入れる目的は、指定したバージョンの Python インタプリタをインストールし、指定したディレクトリ以下でのみ特定バージョンの Python インタプリタを使うようにするためである。

    1. pyenv のインストール + Python のビルド に必要なパッケージをインストールする。
    ```sh
    sudo apt update
    sudo apt install -y git openssl libssl-dev libbz2-dev libreadline-dev libsqlite3-dev
    ```

    2. GitHub から pyenv をクローンする。
    ```sh
    git clone https://github.com/pyenv/pyenv.git ~/.pyenv
    ```

    3. `~/.bashrc` の末尾に以下の3行を追加する。
    ```sh
    export PYENV_ROOT="$HOME/.pyenv"
    export PATH="$PYENV_ROOT/bin:$PATH"
    eval "$(pyenv init -)"
    ```

    4. シェルを再起動する。
    ```sh
    exec $SHELL -i
    ```

    5. pyenv コマンドが使えるようになっていればOK。
    ```sh
    pyenv --version
    ```


2. poetry をインストールする。

    ※ poetry は Python のライブラリを管理するためのツールである。

    ```sh
    curl -sSL https://install.python-poetry.org | python3 -
    ```

    poetry コマンドが使えるようになっていればOK。
    ```sh
    poetry --version
    ```

3. 本リポジトリの `python/` ディレクトリに移動すると、自動で Python3.11.* がインストールされるはず。

    ※ ちなみにソースコードからビルドするので数分かかると思います。

    ```sh
    cd 〇〇/△△/SU-expA-final-references/python

    # cd すると pyenv が `.python-version` ファイルを検知して、
    # 自動で Python3.11.* をインストールするはず

    # もしインストールが始まらない場合は以下を実行すればよい。
    pyenv local 3.11
    ```

4. 依存ライブラリをインストールする。

    ```sh
    poetry install
    ```

セットアップは以上。


## 実行方法

:bulb: 毎回 `poetry run` を先頭につけるのがメンドウだという人は `poetry shell` を実行すれば良いです (`exit` でもとのシェルに戻ります)。

### マージCSVの生成
data/ に `tag.csv` と `geotag.csv` を配置した状態で以下を実行すると、`data/merged.csv` が生成される。
```
make run/prepare
```

### サーバーの起動
1. sample.env ファイルを参考にして .env ファイルを作る。

    `PREPARED_CSV_PATH='data/merged.csv'` とすればOKです。
    ちなみに sample.env の内容そのままにした場合は `data/sample.merged.csv` がマージ済みCSVとして読み込まれます。

    実際の `merged.csv` は 2.1GB ほどあってタイムアウトすると思うので動作確認だけしたい場合は `sample.merged.csv` を利用すると良いでしょう。

    詳細は [app/config.py](./app/config.py) を参照してください。


2. 起動する (<kbd>Ctrl</kbd>+<kbd>C</kbd> で終了) 。
    ```sh
    make run/server
    ```

    ```console
    $ curl localhost:8080/ping
    "pong"

    $ curl 'localhost:8080/?tag=cat'
    {"tag":"cat","results":[{"lat":18.466475,"lon":-66.121375,"date":"2013-07-17 12:22:42","url":"http://farm6.static.flickr.com/5535/9442001154_cf0154ae0e.jpg"}]}
    ```


### ソースコードの欠陥チェック + 型チェック
```sh
make lint
```
