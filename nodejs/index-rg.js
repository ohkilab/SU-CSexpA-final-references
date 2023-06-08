//rg ,test$ ../csv/tag.csv | awk -F, '{print $1","}' | rg -f - ../csv/geotag.csv -m 100
const { spawn } = require('node:child_process')

const rgTag = spawn('rg', [',sketch$', '../csv/tag.csv', '-m', '100', '-r', ''])
const rgGeotag = spawn('rg', ['-f', '-', '../csv/geotag.csv', '-m', '100'])

rgTag.stdout.pipe(rgGeotag.stdin)

rgTag.stdout.on('data', data => {
  // console.log(data.toString())
})

rgGeotag.stdout.on('data', data => {
  console.log(data.toString())
})

rgGeotag.stderr.on('data', data => {
  console.log(data.toString())
})
