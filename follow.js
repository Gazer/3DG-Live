var sys = require("sys"),
    EventEmitter = require('events').EventEmitter;

var followers = [];

function Follower(request, response) {
  if (!(this instanceof Follower)) {
    return new Follower(request, response);
  }

  EventEmitter.call(this);

  this.response = response;
  this.request = request;

  followers.push(this);
}

sys.inherits(Follower, EventEmitter);
module.exports = Follower;

Follower.update = function (post) {
  for(key in followers) {
    sys.puts("Actualizando");
    followers[key].emit("updated", post);
  }

  followers = [];
}
