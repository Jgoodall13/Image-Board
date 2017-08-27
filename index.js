const express = require('express');
const app = express();
const knox = require('knox');
var multer = require('multer');
var uidSafe = require('uid-safe');
var path = require('path');
var spicedPg = require('spiced-pg');
var db = spicedPg(process.env.DATABASE_URL || 'postgres:postgres:password@localhost:5432/imageboard');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: false
}));

const fn = require('./functions.js');

//TESTING PURPOSES
// const config = require('./secrets.json');
// var auth = `${config.key}:${config.secret}`;
app.use(express.static(__dirname + '/public/'));
let url;
let secrets;
if (process.env.NODE_ENV == 'production') {
    secrets = process.env; // in prod the secrets are environment variables
} else {
    secrets = require('./secrets'); // secrets.json is in .gitignore
}
const client = knox.createClient({
    key: secrets.AWS_KEY,
    secret: secrets.AWS_SECRET,
    bucket: 'jacobimageboard'
});


var diskStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, __dirname + '/uploads');
    },
    filename: function(req, file, callback) {
        uidSafe(24).then(function(uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    }
});

var uploader = multer({
    storage: diskStorage,
    limits: {
        filesize: 2097152
    }
});

app.post('/upload', uploader.single('file'), function(req, res) {
    console.log(req.body);
    // If nothing went wrong the file is already in the uploads directory
    const s3Request = client.put(req.file.filename, {
        'Content-Type': req.file.mimetype,
        'Content-Length': req.file.size,
        'x-amz-acl': 'public-read'
    });

    url = s3Request.url;
    const fs = require('fs');
    const readStream = fs.createReadStream(req.file.path);
    readStream.pipe(s3Request);

    if (req.file) {
        s3Request.on('response', s3Response => {
            const wasSuccessful = s3Response.statusCode == 200;
            res.json({
                success: wasSuccessful
            });
            console.log("success");
            console.log(req.file.filename);
        });
    } else {
        res.json({
            success: false
        });
        console.log("nope");
    }
    db.query("INSERT INTO images (image, username, title, description) values ($1,$2,$3,$4)", [req.file.filename, req.body.username, req.body.title, req.body.description]).catch(function(err) {
        console.log(err);
    });
});

app.get('/upload', function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
});

app.get('/images', function(req, res) {
    db.query('SELECT * FROM IMAGES ORDER BY created_at DESC LIMIT 8').then(function(results) {
        console.log(results.rows);
        for (var i = 0; i < results.rows.length; i++) {
            results.rows[i].url = require('./config.json').s3Url + results.rows[i].image;
        }
        res.json({
            images: results.rows
        });
    }).catch(function(err) {
        console.log(err);
    });
});


app.get('/image/:id', (req, res) => {
    db.query("SELECT * FROM images WHERE id = $1", [req.params.id])
        .then((results) => {
            fn.showAllComments(req.params.id)
                .then((comments) => {
                    console.log(results.rows);
                    res.json({
                        images: results.rows,
                        comments: comments
                    });
                });
        });
});

app.post('/image:id', function(req, res) {
    console.log("we posting in image");
    console.log(req.body);
    db.query("INSERT INTO comments (image_id, username, comment) VALUES ($1,$2,$3)", [req.body.image_id, req.body.user, req.body.comment]).then((results) => {
        res.json({
            comment: req.body.comment,
            image_id: req.body.image_id,
            user: req.body.user
        });
        console.log(results);
    });
});



app.listen(process.env.PORT || 8080, () => console.log("I'm listening old friend"));
