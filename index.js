const mysql = require('mysql');
const express = require('express')
const bodyParser = require('body-parser')
const envPort = require('./config.js')

var app = express()
var port = envPort.port || 3000;
var hbs = require('express-handlebars')

var con = mysql.createConnection({
  host: "localhost",
  user: "mc02-user",
  password: "password",
  database: "nba-data-warehouse-mysql"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

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

let seasons = ["1996-97","1997-98","1998-99","1999-00","2000-01","2001-02","2002-03","2003-04","2004-05","2005-06","2006-07","2007-08","2008-09","2009-10","2010-11","2011-12","2012-13","2013-14","2014-15","2015-16","2016-17","2017-18","2018-19","2019-20"]
let conferences = ["Western","Eastern"]
let draft_decades = ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s"]

app.get('/', (req,res) => {
  res.render('index')
})

app.get('/drill-down', (req,res) => {
  res.render('drill-down')
})

app.post('/drill-down', (req,res) => {
  let sql = 
  `SELECT t.Conference as conf, t.Division as divi, t.team_abbreviation as team, se.Season as season, AVG(st.AvgPoints) as avg
  FROM teams t 
  JOIN stats st 
  ON t.TeamID = st.TeamID 
  JOIN seasons se
  ON st.SeasonID = se.SeasonID
  GROUP BY t.Conference, t.Division, t.team_abbreviation, se.Season
  ORDER BY t.Conference, t.Division`

  let startTime = (new Date).getTime();

  con.query(sql, function (err, resu) {
    if (err) throw err;
    res.render('drill-down', {
      result: resu,
      time: ((new Date).getTime() - startTime)+'ms' 
    })
  });
})

app.get('/roll-up', (req,res) => {
  res.render('roll-up')
})

app.post('/roll-up', (req,res) => {
  let sql = 
  `SELECT t.Conference as conf,  t.Division as divi, se.Season as season, AVG(st.AvgPoints) as avg
  FROM teams t 
  JOIN stats st 
  ON t.TeamID = st.TeamID 
  JOIN seasons se
  ON st.SeasonID = se.SeasonID
  GROUP BY t.Conference, t.Division, se.Season WITH ROLLUP`

  let startTime = (new Date).getTime();

  con.query(sql, function (err, resu) {
    if (err) throw err;
    res.render('roll-up', {
      result: resu,
      time: ((new Date).getTime() - startTime)+'ms' 
    })
  });
})

app.get('/dice', (req,res) => {
  res.render('dice', {
    seasons: seasons,
    conferences: conferences
  })
})

app.post('/dice', (req,res) => {
  let sql = 
  `SELECT t.Conference as conf, t.Division as divi, t.team_abbreviation as team, se.Season as season, SUM(st.AvgPoints) as sum
  FROM teams t 
  JOIN stats st 
  ON t.TeamID = st.TeamID 
  JOIN seasons se
  ON st.SeasonID = se.SeasonID
  WHERE se.Season = "${req.body.season}"
  AND t.Conference = "${req.body.conference}"
  GROUP BY t.Conference, t.Division, t.team_abbreviation, se.Season
  ORDER BY sum DESC`

  let startTime = (new Date).getTime();

  con.query(sql, function (err, resu) {
    if (err) throw err;
    res.render('dice', {
      seasons: seasons,
      conferences: conferences,
      result: resu,
      time: ((new Date).getTime() - startTime)+'ms' 
    })
  });
})

app.get('/slice', (req,res) => {
  res.render('slice', {
    draft_decades: draft_decades
  })
})

app.post('/slice', (req,res) => {
  let sql = 
  `SELECT t.Conference as conf, t.Division as divi, t.team_abbreviation as team, p.Draft_Decade as decade, AVG(st.AvgPoints) as avg
  FROM teams t 
  JOIN stats st 
  ON t.TeamID = st.TeamID 
  JOIN players p
  ON st.PlayerID = p.PlayerID
  WHERE p.Draft_Decade = "${req.body.draft_decade}"
  GROUP BY t.Conference, t.Division, t.team_abbreviation, p.Draft_Decade
  ORDER BY avg DESC`

  let startTime = (new Date).getTime();

  con.query(sql, function (err, resu) {
    if (err) throw err;
    res.render('slice', {
      draft_decades: draft_decades,
      result: resu,
      time: ((new Date).getTime() - startTime)+'ms' 
    })
  });
})


app.listen(port, () => {
  console.log(`Server listening at ${port}`);
});