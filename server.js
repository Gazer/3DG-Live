var sys = require("sys"),
    http = require("http"),
    path = require("path"),
    fs = require("fs"),
    url = require("url"),
    qs = require("querystring"),
    Client = require('mysql').Client,
    Router = require('./router');

var follower = new function () {
  var callbacks = [],
      lastPost = [];

  this.query = function (request, callback) {
    var since = parseInt(qs.parse(url.parse(request.url).query).since, 10);
    var matching = [];

    for (var i = 0; i < lastPost.length; i++) {
      var post = lastPost[i];

      if (post.timestamp > since) {
        matching.push(post)
      }
    }

    if (matching.length != 0) {
      callback(matching[0]);
    } else {
      callbacks.push({ timestamp: new Date(), callback: callback });
    }
  };

  this.appendPost = function (post) {
    while (callbacks.length > 0) {
      callbacks.shift().callback({ timestamp: new Date(), post: post });
    }

    lastPost.push({ timestamp: new Date(), post: post });

    while (lastPost.length > 25)
      lastPost.shift();
  };
};

var Live3DG = function() {
  var client = new Client();
  var tags = 'quote|b|i|u|url|quote|code|img|color|size|yt|spoiler';
  var bbcode_quote =  new RegExp("\\[/?(?:"+tags+")[^]*].*\\]", "img");
  var query = ' \
    select user.userid, post.pagetext, post.postid, post.threadid, thread.forumid, thread.title as title, \
    forum.title as forum_title, post.dateline as updated_at, post.username as username from post \
      left join thread on thread.threadid = post.threadid \
      left join forum on thread.forumid = forum.forumid \
      left join user on user.userid = post.userid \
      where thread.forumid NOT IN (5,16,106,108,109,96,284,367,141,184,253,252,138) and post.postid = ? \
      limit 1;';

  var router = new Router();
  router.get('(/|/index.html)', function (request, response) {
    _load_static_file('index.html', response);
  });

  router.get('/media/(.*)', function (request, response, file) {
    _load_static_file('media/' + file, response);
  });

  router.get('/widget/', function (request, response, file) {
    _load_static_file('widget.html', response);
  });

  router.get('/stream', function (request, response) {
    follower.query(request, function (post) {
      sys.puts(post.post.postid);
      _respond_with_post(post, response);
	  });
  });

  router.get('/stream/user/(.*)', function (request, response, userid) {
    follower.query(request, function (post) {
      if (post.post.userid == userid) {
        _respond_with_post(post, response);
      }
	  });
  });

  router.get('/stream/thread/(.*)', function (request, response, threadid) {
    follower.query(request, function (post) {
      if (post.post.threadid == threadid) {
        _respond_with_post(post, response);
      }
	  });
  });

  router.get('/stream/forum/(.*)', function (request, response, forumid) {
    follower.query(request, function (post) {
      if (post.post.forumid == forumid) {
        _respond_with_post(post, response);
      }
	  });
  });

  router.get('/push/(.*)', function (request, response, postid) {
    _read_forum(postid);
    response.writeHead(200, { "Content-Type" : "text/html; charset=utf8" });
    response.write("Ok");
    response.end();
  });

  function _respond_with_post(post, response) {
    response.writeHead(200, { "Content-Type" : "application/javascript; charset=utf8" });
    response.write(JSON.stringify(post));
    response.end();
  }

  function _load_static_file(uri, response) {
	  var filename = path.join(process.cwd(), uri);
	  path.exists(filename, function(exists) {
		  if(!exists) {
			  response.writeHead(404, {"Content-Type": "text/plain"});
			  response.write("404 Not Found");
			  response.end();
			  return;
		  }

		  fs.readFile(filename, "binary", function(err, file) {
			  if(err) {
				  response.writeHead(500, {"Content-Type": "text/plain"});
				  response.write(err + "n");
				  response.end();
				  return;
			  }

			  response.writeHead(200);
			  response.write(file, "binary");
			  response.end();
		  });
	  });
  }

  function _remove_bbcode(text)
  {
    return text.toString().replace("\n", '').replace("\r", '').replace(bbcode_quote, '');
  }

  function _read_forum(postid)
  {
    client.query(query, [postid], function selectCb(err, results, fields) {
        if (err) {
          throw err;
        }

        if (results.length > 0) {
          results[0].pagetext = _remove_bbcode(results[0].pagetext);
          follower.appendPost(results[0]);
        } else {
          sys.puts("No results");
        }
      }
    );
  }

  function _start_server() {
    sys.puts('Connected to mysql. Starting posts polling...');

    router.start();
  }

  return {
    init: function (callback) {
      fs.readFile('./server.conf.json', function (err, data) {
        if (err) throw err;
        config = JSON.parse(data.toString().replace('\n', ''));

        client.user = config.user;
        client.password = config.password;
        client.host = config.host;
        client.database = config.database;
        client.charsetNumber = 192;

        client.connect(_start_server);
      });
    }
  }
};

server = new Live3DG();
server.init();
