const express = require('express')
const {parse} = require('csv-parse')
const fs = require('fs')

const app = express()
const port = 3000

// tag.csvとgeotag.csvのパス
const tagPath = '../csv/tag.csv'
const geotagPath = '../csv/geotag.csv'

app.get('/',(req, res) => {
  // GETパラメータからtagを取得
  const key = req.query.tag
  
  console.log(`${key} requested`)

  const geotagReadStream = fs.createReadStream(geotagPath)

  let tags = []
  let geotags = []

  const tagParser = fs.createReadStream(tagPath).pipe(parse({delimiter: ',', from_line: 1, skip_records_with_empty_values: true, trim: true}))

  tagParser
    .on('data', tagRow => {
      // デバッグ用のログ、有効時には検索が遅くなる
      
      if(tags.length < 100) {
        if(tagRow[1] === key) {
          tags.push(tagRow[0])
          console.log('found' + tags.length)
        }
      } else {
        tagParser.destroy()

        const geotagParser = geotagReadStream
          .pipe(parse({delimiter: ',', from_line: 1, skip_records_with_empty_values: true}))

        geotagParser
          .on('data', row => {

            // console.log(row)
            if(geotags.length < 100) {
              if(tags.includes(row[0])) {
                console.log('found ' + geotags.length + ' geotags')
                geotags.push(row)
              }
            } else {
              geotagParser.destroy()
              res.send({
                tag: key,
                results: geotags.map(geotag => ({
                    lat: geotag[2],
                    lon: geotag[3],
                    date: geotag[1],
                    url: geotag[4]
                  })
                )
              })
            }
          })

        req.on('close', () => {
          geotagParser.destroy()
        })
      }
    })

  // 接続切れたらストリームを破棄する(メモリーリーク防止)
  req.on('close', () => {
    // console.log('session closed, destroying streams')
    tagParser.destroy()
    geotagReadStream.destroy()
  })
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
