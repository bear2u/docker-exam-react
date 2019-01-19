var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var todoSchema = new Schema({
    content: String,
    title: String,
    isdone : Boolean,
    regdate: { type: Date, default: Date.now  }
});

module.exports = mongoose.model('todo', todoSchema);