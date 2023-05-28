# 情報科学実験A 参考実装

情報科学実験A 最終課題のベンチマークプログラムの参考実装です。全て仕様を満たしていますが、高速化は一切行われていません。これをベースとして高速化を行うのも良いですし、全く新しいものを開発して頂いても構いません。

## 準備

### CSexp1DB (Docker 無し)

[こちら](https://ohkilab.github.io/SU-CSexpA/content/part3/part3_final_assignment/final_assignment_details.html) を参考にしてデータベース `CSexp1DB` の準備を行なってください。

- データベース名: `CSexp1DB`
- テーブル
    - `geotag`
        - `id`
        - `time`
        - `latitude`
        - `longitude`
        - `url`
    - `tag`
        - `id`
        - `tag`

### CSexp1DB (Docker 有り)

docker がインストールされていれば docker を用いた DB の起動も可能です。  
CSexp1DB の準備が完了していればこの項目を実施する必要はありません。
※ 既に mariadb 等の DB を立ち上げている場合、ポートの重複(3306)で失敗する可能性が高いです。以下のコマンドを実行する際は既に立ち上がっている DB を shutdown してください。

### Requirements

- `csv/tag.csv` ... vpn からダウンロードしてください
- `csv/geotag.csv` ... vpn からダウンロードしてください

```shell
$ make db/start
```

## 参考実装

- [rust]("https://github.com/ohkilab/SU-expA-final-references/rust")
