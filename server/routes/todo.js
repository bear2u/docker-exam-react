var express = require('express');
var router = express.Router();

var Todo = require('../models/todo');

/* GET home page. */
router.get('/', function(req, res, next) {
  return Todo.find({}).sort({regdate: -1}).then((todos) => res.send(todos));
});

router.post('/', function(req, res, next) {
  const todo = Todo();
  const title = req.body.title;
  const content = req.body.content;

  todo.title = title;
  todo.content = content;

  return todo.save().then((todo) => res.send(todo)).catch((error) => res.status(500).send({error}));
});

module.exports = router;
