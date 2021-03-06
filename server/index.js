const express = require('express');
const bodyParser = require('body-parser');
const indeed = require('./externals/indeed.js');

const multer = require('multer');
const path = require('path');
const upload = multer();
const crypto = require('crypto');
const mime = require('mime');

const pgp = require('pg-promise')();
pgp.pg.defaults.ssl = true;
const db = pgp(process.env.DATABASE_URL);

const docConverter = require('./externals/docconverter.js');
const docAnalyzer = require('./externals/naturalLanguageUnderstanding.js');


const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './server/temp');
  },
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
    });
  }
});

app.use(multer({storage: storage}).any());

app.use(express.static(__dirname + '/../react-client/dist'));
app.set('port', (process.env.PORT || 5000));


app.post('/', (req, res, next) => {
  let userReq = {
    body: req.body.query,
    ip: req.headers['x-forwarded-for'],
    userAgent: req.get('user-agent')
  }
  indeed.indeed(userReq, res, next);
});


app.post('/upload', (req, res, next) => {
  docConverter.convertDoc(req, (error, response) => {
    if (error) {
      res.send(error);
    }
    docAnalyzer.analyze(response, (err, keywords) => {
    if (err) {
      res.send(error);
    }
    res.send(keywords);
  })});
});


app.post('/load', (req, res) => {
  db.query(`SELECT * FROM users WHERE facebook_id = '${req.body.id}'`)
    .then(result => {
      if (result.length === 0) {
        throw doNotAutoLoad
      }
      return result[0].id;
    })
    .then(user_id => {
      db.query(`SELECT keywords FROM resumes WHERE user_id = '${user_id}'`)
        .then(result => {
          res.send(result[0].keywords);
        });
    }) 
    .catch(doNotAutoLoad => {
      res.send();
    })
});

app.post('/saveQuery', (req, res) => {
  db.query(`SELECT * FROM users WHERE facebook_id = '${req.body.id}'`)
    .then(result => {
      if (result.length === 0) {
        db.query(`INSERT INTO "public"."users"("facebook_id") VALUES('${req.body.id}') RETURNING "id", "facebook_id";`);
        throw notInDb;
      }
      return result[0].id;
    })
    .then(user_id => {
      db.query(`UPDATE "public"."resumes" SET "keywords"='${req.body.query}' WHERE "user_id"=${user_id} RETURNING "id", "user_id", "keywords";`);
      res.send()        
    })
    .catch(notInDb => {
      db.query(`SELECT id FROM users where facebook_id = '${req.body.id}'`)
        .then(user_id => {
          db.query(`INSERT INTO "public"."resumes"("user_id", "keywords") VALUES(${user_id[0].id}, '${req.body.query}') RETURNING "id", "user_id", "keywords";`);
          res.send();
        });
    });
});

app.listen(app.get('port'), function() {
  console.log('listening on port', app.get('port'));
});

app.post('/', (req, res, next) => {
  indeed.indeed(req, res, next);
});