// 実行する前に../csv/フォルダーにtag.csvとgeotag.csvを用意してください
//
// 本コードは以下のコマンドの実装、ripgrepインストール必要がある
const { spawn } = require('node:child_process')
const express = require('express')
const app = express()
const port = 3000

// tagとgeotagのパス
const tagPath = '../csv/tag.csv'
const geotagPath = '../csv/geotag.csv'

// キャッシュ用変数
let cache = {}

app.get('/', (req, res) => {
  // パラメータの取得と正規化
  let tags = req.query.tag;
  if (!tags) {
    return res.send({ tag: '', results: [] });
  }
  // 複数タグの場合は配列になるが、単一の場合は文字列なので配列に統一する
  if (!Array.isArray(tags)) {
    tags = [tags];
  }

  const tagOperator = req.query.tagOperator || 'or';
  const sortOrder = req.query.sortOrder || 'desc';

  // キャッシュ用のキーを作成（条件によって結果が変わるため全てを含める）
  const cacheKey = `${tags.join(',')}_${tagOperator}_${sortOrder}`;

  // リクエストが来るときに出力する
  console.log(`requested: ${cacheKey}`)

  // キャッシュ変数にすでに結果があるならそのまま返す、そうじゃないとファイルから検索
  if (cache[cacheKey]) {
    res.send(cache[cacheKey])
  } else {
    // 複数タグ検索のため、正規表現で結合する 例: (cat|dog)
    const regexTags = tags.join('|');
    
    // 正しく全体をソートして上位100件を取るため、検索コマンド時点での「-m 100」制約は外す
    const rgTag = spawn('rg', [`,(${regexTags})$`, tagPath, '-r', ''])
    const rgGeotag = spawn('rg', ['-f', '-', geotagPath])

    // 検索結果の変数
    let searchResult = ''

    // rgTagプロセスからrgGeotagプロセスにパイプする
    rgTag.stdout.pipe(rgGeotag.stdin)

    rgTag.stdout.on('data', data => {})

    rgGeotag.stdout.on('data', data => {
      searchResult += data
    })

    rgGeotag.stderr.on('data', data => {})

    // 検索終わったときの処理
    rgGeotag.on('close', () => {
      const lines = searchResult.trim().split('\n').filter(line => line !== '');
      
      const countMap = {};
      const dataMap = {};

      // 取得した結果をパースし、重複数をカウントする（AND検索用）
      lines.forEach(line => {
        const geotag = line.split(',');
        const url = geotag[4]; // URLを一意のキーとして扱う

        countMap[url] = (countMap[url] || 0) + 1;

        if (!dataMap[url]) {
          dataMap[url] = {
            lat: Number(geotag[2]),
            lon: Number(geotag[3]),
            date: geotag[1].replaceAll('"', ''),
            url: url
          };
        }
      });

      let results = [];
      
      // tagOperator に応じてフィルタリング
      for (const url in dataMap) {
        if (tagOperator === 'and') {
          // and の場合、タグの数だけ重複してヒットしているものを抽出
          if (countMap[url] === tags.length) {
            results.push(dataMap[url]);
          }
        } else {
          // or の場合はすべて追加（重複排除済み）
          results.push(dataMap[url]);
        }
      }

      // 指定された条件でソート
      results.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        if (dateA !== dateB) {
          // dateの昇順または降順
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          // dateが同一の場合はURLを文字列として捉えたときの昇順
          if (a.url < b.url) return -1;
          if (a.url > b.url) return 1;
          return 0;
        }
      });

      // JSON形式にする処理（要件に従い上位100件に絞る）
      const searchResultJson = {
        tag: tags.join(','),
        results: results.slice(0, 100)
      }

      // クライアントに送信
      res.send(searchResultJson)

      // キャッシュに格納
      cache[cacheKey] = searchResultJson

      // 送信・キャッシュしたときの出力
      console.log(`sent and cached ${cacheKey}`)
    })

    // 接続が切れたときにプロセスを終了させる
    req.on('close', () => {
      console.log('session closed, killing processes')
      rgTag.kill()
      rgGeotag.kill()
    })
  }
})

// ポート3000で接続
app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
