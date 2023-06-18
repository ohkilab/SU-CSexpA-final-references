# 情報科学実験A最終課題サンプル実装（PHP版）

## grep_method.php

apache+phpで動作します。以下のようにapacheのホームディレクトリに`grep_method.php`,`geotag.csv`,`tag.csv`を配置していください。ホームディレクトリについて、記載は`/var/www/html/`としていますが各自の環境に合わせて適時読み替えてください。

```
/var/www/html/
            ├── php/
            │   └── grep_method.php
            └── csv/
                ├── geotag.csv
                └── tag.csv
```

試しにapacheが起動している状態で、ブラウザで`{ipアドレス:ポート番号}/php/grep_method.php?tag=cat`を開くと検索結果を見ることができると思います。プログラム中では①リクエストパラメータの読み取り②grepによるタグ抽出③レスポンスの作成の三つが実施されています。並列化、キャッシュ保持など高速化の余地があるためチャレンジしてみてください
