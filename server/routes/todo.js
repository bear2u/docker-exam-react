var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({result: "ok"});
});

router.post('/', function(req, res, next) {
  const title = req.body.title;
  const content = req.body.content;
  res.json({resut: 'ok', title, content});
});

module.exports = router;
