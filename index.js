const sqlite3 = require('sqlite3').verbose();
const express = require('express')
const bodyParser = require('body-parser')
const envPort = require('./config.js')

var app = express()
var port = envPort.port || 3000;
var hbs = require('express-handlebars')

let db = new sqlite3.Database('nba.db');

app.engine('hbs', hbs({
    extname: 'hbs',
    defaultview: 'main',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/'
}))

app.set('view engine', 'hbs')

app.set('port', process.env.PORT || 9090)

app.use(express.static(__dirname + '/public'))

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ----- [ SAMPLE QUERY, JUST COPY THIS FOR THE OTHERS ] ------
app.get('/', (req,res) => {
  res.render('index')
})

app.post('/', (req,res) => {
  let sql = `SELECT * FROM Players WHERE PlayerID = ?`
  let startTime = (new Date).getTime();

  db.all (sql, [req.body.playerid], (err, rows) => 
      {
        res.render('index', {
          result: rows,
          time: ((new Date).getTime() - startTime)+'ms'
        })
      }
  )

})
// -------------------------------------------------------

app.listen(port, () => {
  console.log(`Server listening at ${port}`);
});