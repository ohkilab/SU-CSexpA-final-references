//rg ,test$ ../csv/tag.csv | awk -F, '{print $1","}' | rg -f - ../csv/geotag.csv -m 100
const { spawn } = require('node:child_process')
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  const tag = req.query.tag

  console.log(`requested: ${tag}`)

  const rgTag = spawn('rg', [`,${tag}$`, '../csv/tag.csv', '-m', '100', '-r', ''])
  const rgGeotag = spawn('rg', ['-f', '-', '../csv/geotag.csv', '-m', '100'])

  let searchResult = ''

  rgTag.stdout.pipe(rgGeotag.stdin)

  rgTag.stdout.on('data', data => {
    // console.log(data.toString())
  })

  rgGeotag.stdout.on('data', data => {
    // console.log(data.toString())
    searchResult += data
  })

  rgGeotag.stderr.on('data', data => {
    // console.log(data.toString())
  })

  rgGeotag.on('close',() => {
    // console.log('closed', searchResult)
    console.log(`sent ${tag}`)
    res.send({
      tag,
      results: searchResult.trim().split('\n')
      .map(line => {
        const geotag = line.split(',')

        return {
          lat: Number(geotag[2]),
          lon: Number(geotag[3]),
          date: geotag[1].replaceAll('"', ''),
          url: geotag[4]
        }
      }).sort((a,b) => new Date(b.date) - new Date(a.date))
    })
  })
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
