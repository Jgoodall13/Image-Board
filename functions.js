const knox = require('knox');
var spicedPg = require('spiced-pg');
var db = spicedPg(process.env.DATABASE_URL || 'postgres:postgres:password@localhost:5432/imageboard');
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


exports.showAllComments = (imageID) => {
    return new Promise(function(resolve, reject) {
        var query = "SELECT * FROM comments WHERE image_id = $1 ORDER BY created_at DESC";
        db.query(query, [imageID])
            .then((results) => {
                resolve(results.rows);
            }).catch((error) => {
                reject(error);
            });
    });
};
