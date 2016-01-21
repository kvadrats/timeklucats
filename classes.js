var Config = require('./config.js').Config,
    crypto = require('crypto');



exports.Chat = function(participants, messages) {
  this.id = -1;
  this.participants = participants;
  this.messages = messages || [];
};

exports.Message = function(sender, text) {
  this.id = -1;
  this.sender = sender;
  this.text = text;
  this.date = new Date();
};

exports.Password = function(pass) {
  return crypto.createHash('sha256').update(Config.pepper + pass).digest('base64');
};
