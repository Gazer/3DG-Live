var url = require("url"),
    sys = require("sys"),
    http = require("http"),
    EventEmitter = require('events').EventEmitter;

function Router() {
  if (!(this instanceof Router)) {
    return new Router();
  }

  EventEmitter.call(this);

  this.routes = [];
  sys.inspect(this.routes, true, null);
}
sys.inherits(Router, EventEmitter);
module.exports = Router;

Router.prototype.start = function () {
  var self = this;

  http.createServer(function (request, response) {
    var uri = url.parse(request.url, true);

    for(i in self.routes) {
      var route = self.routes[i];

      var args = route.regex.exec(uri.pathname);
      if (args !== null) {
        args.shift();
        args.unshift(request, response);
        route.cb.apply(this, args);
        break;
      }
    }
  }).listen(8001);

  sys.puts("Server running at http://localhost:8001/");
};

Router.prototype.get = function (path, callback) {
  this.routes.push({regex: new RegExp('^' + path + '$'), path: path, cb: callback});
};
