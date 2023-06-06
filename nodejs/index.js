const express = require('express')
const {parse} = require('csv-parse')
const fs = require('fs')

const app = express()
const port = 3000

// tag.csvとgeotag.csvのパス
const tagPath = '../csv/tag.csv'
const geotagPath = '../csv/geotag.csv'

let linecount = 0

const parsedTag = []

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
      // console.log('row: ', tagRow)
      
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
              res.send(geotags)
            }

          })


        // res.send(tags)
        // console.log(tags.map(tag => parsedGeotag.filter(geotag => geotag[0] === tag)))

      }

      // if(tagRow[1] === key) {
      //   // tag.csvの処理は完了でストリームを破棄する
      //   tagReadStream.destroy()
      //
      //   let geotags = []
      //   
      //   // tag.csvのタグが見つかったらgeotag.csvで検索
      //   geotagReadStream
      //     .pipe(parse({delimiter: ','}))
      //     .on('data', geotagRow => {
      //       // if(geotagRow[0] === tagRow[0]) {
      //       //   geotagReadStream.destroy()
      //       //   res.send(geotagRow)
      //       // }
      //
      //       if(geotags.length < 10) {
      //         // console.log(geotagRow)
      //         if(geotagRow[0] === tagRow[0]) {
      //           geotags.push(geotagRow)
      //           console.log(`found ${geotags.length} tags`)
      //         }
      //       } else {
      //         geotagReadStream.destroy()
      //         res.send(geotags)
      //       }
      //     })
      //   // res.send(row[0])
      // }
    })

  // 接続切れたらストリームを破棄する(メモリーリーク防止)
  req.on('close', () => {
    console.log('session closed, destroying streams')
    tagParser.destroy()
    geotagReadStream.destroy()
  })
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
