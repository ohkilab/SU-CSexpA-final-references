// 実行する前に../csv/フォルダーにtag.csvとgeotag.csvを用意してください
//
// 本コードは以下のコマンドの実装、ripgrepインストール必要がある
// rg ,test$ ../csv/tag.csv -r '' | rg -f - ../csv/geotag.csv -m 100
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
  // tagを取得して、tag変数に格納する
  const tag = req.query.tag

  // リクエストが来るときに出力する
  console.log(`requested: ${tag}`)

  // キャッシュ変数にすでに結果があるならそのまま返す、そうじゃないとファイルから検索
  if (cache[tag]) {
    res.send(cache[tag])
  } else {
    // tag.csvとgeotag.csvを検索するプロセスを作成
    const rgTag = spawn('rg', [`,${tag}$`, tagPath, '-m', '100', '-r', ''])
    const rgGeotag = spawn('rg', ['-f', '-', geotagPath, , '-m', '100'])

    // 検索結果の変数
    let searchResult = ''

    // rgTagプロセスからrgGeotagプロセスにパイプする、パイプ文字(|)と同じ機能
    rgTag.stdout.pipe(rgGeotag.stdin)

    // tag.csvからデータが来たときのコールバック
    rgTag.stdout.on('data', data => {
      // console.log(data.toString())
    })

    // geotag.csvからデータがきたときのコールバック
    rgGeotag.stdout.on('data', data => {
      // console.log(data.toString())
      searchResult += data
    })

    // geotag.csvからエラーがきたときのコールバック
    rgGeotag.stderr.on('data', data => {
      // console.log(data.toString())
    })

    // 検索終わったときの処理
    rgGeotag.on('close', () => {
      // console.log('closed', searchResult)

      // JSON形式にする処理
      const searchResultJson = {
        tag: tag,
        results: searchResult.trim().split('\n')
          .map(line => {
            const geotag = line.split(',')

            return {
              lat: Number(geotag[2]),
              lon: Number(geotag[3]),
              date: geotag[1].replaceAll('"', ''),
              url: geotag[4]
            }
          }).sort((a, b) => new Date(b.date) - new Date(a.date))
      }

      // クライアントに送信
      res.send(searchResultJson)

      // キャッシュに格納
      cache[tag] = searchResultJson

      // 送信・キャッシュしたときの出力
      console.log(`sent and cached ${tag}`)
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
