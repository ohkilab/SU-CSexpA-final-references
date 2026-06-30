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
  let tags = req.query.tag;
  if (!tags) {
    return res.send({ tag: '', results: [] });
  }
  if (!Array.isArray(tags)) {
    tags = [tags];
  }

  // タグの重複指定を排除 (例: ?tag=cat&tag=cat と来た場合のバグ対策)
  tags = [...new Set(tags)];

  const tagOperator = req.query.tagOperator || 'or';
  const sortOrder = req.query.sortOrder || 'desc';

  // キャッシュキーの生成（順番によるミスヒットを防ぐためソートして結合）
  const cacheKey = `${[...tags].sort().join(',')}_${tagOperator}_${sortOrder}`;

  console.log(`requested: ${cacheKey}`)

  if (cache[cacheKey]) {
    res.send(cache[cacheKey])
  } else {
    const regexTags = tags.join('|');
    
    const rgTag = spawn('rg', [`,(${regexTags})$`, tagPath, '-r', ''])
    const rgGeotag = spawn('rg', ['-f', '-', geotagPath])

    let searchResult = ''
    let tagOutput = ''

    // プロセス間をパイプで繋ぐ
    rgTag.stdout.pipe(rgGeotag.stdin)

    // パイプで流しつつ、Node.js側でもIDを記録してカウントに使う
    rgTag.stdout.on('data', data => {
      tagOutput += data
    })

    rgGeotag.stdout.on('data', data => {
      searchResult += data
    })

    rgGeotag.stderr.on('data', data => {})

    rgGeotag.on('close', () => {
      const lines = searchResult.trim().split('\n').filter(line => line !== '');
      
      // AND検索のためのIDごとの出現回数カウント
      const idCounts = {};
      if (tagOperator === 'and') {
        tagOutput.trim().split('\n').forEach(id => {
          if (id) {
            idCounts[id] = (idCounts[id] || 0) + 1;
          }
        });
      }

      let results = [];
      
      lines.forEach(line => {
        const geotag = line.split(',');
        const id = geotag[0]; // geotag.csv の先頭要素(写真ID)を取得
        
        // AND検索の場合、検索したタグの数だけIDが出現しているかチェック
        if (tagOperator === 'and' && idCounts[id] < tags.length) {
          return; // 条件を満たさない写真はスキップ
        }

        results.push({
          lat: Number(geotag[2]),
          lon: Number(geotag[3]),
          date: geotag[1].replaceAll('"', ''),
          url: geotag[4]
        });
      });

      // 並び替え処理 
      results.sort((a, b) => {
        if (a.date !== b.date) {
          if (sortOrder === 'asc') {
            return a.date < b.date ? -1 : 1;
          } else {
            return a.date > b.date ? -1 : 1;
          }
        } else {
          return a.url < b.url ? -1 : (a.url > b.url ? 1 : 0);
        }
      });

      const searchResultJson = {
        tag: tags.join(','),
        results: results.slice(0, 100)
      }

      res.send(searchResultJson)
      cache[cacheKey] = searchResultJson
      console.log(`sent and cached ${cacheKey}`)
    })

    req.on('close', () => {
      console.log('session closed, killing processes')
      rgTag.kill()
      rgGeotag.kill()
    })
  }
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
