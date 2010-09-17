var sys = require("sys"),
    http = require("http"),
    path = require("path"),
    fs = require("fs"),
    url = require("url"),
    Client = require('mysql').Client,
    Router = require('./router'),
    follower = require('./follow');

var Live3DG = function() {
  var client = new Client();
  var bbcode_quote =  new RegExp('\\[quote[^]].*](.*?)\\[/\\1]');
  var query = ' \
    select user.userid, post.pagetext, post.postid, post.threadid, thread.forumid, thread.title as title, \
    forum.title as forum_title, post.dateline as updated_at, post.username as username from post \
      left join thread on thread.threadid = post.threadid \
      left join forum on thread.forumid = forum.forumid \
      left join user on user.userid = post.userid \
      where thread.forumid NOT IN (5,16,106,108,109,96,284,367,141,184,253,252,138) and post.postid > ? \
      order by postid asc limit 1;';

  var router = new Router();
  router.get('/', function (request, response) {
    _load_static_file('index.html', response);
  });
  router.get('/index.html', function (request, response) {
    _load_static_file('index.html', response);
  });

  router.get('/media/(.*)', function (request, response, file) {
    _load_static_file('media/' + file, response);
  });

  router.get('/stream', function (request, response) {
    response.writeHead(200, { "Content-Type" : "application/javascript; charset=utf8" });
    response.write(JSON.stringify(follower.last_post()));
    response.end();
  });

  router.get('/stream/user/(.*)', function (request, response, userid) {
    post = follower.fetch_by_user(userid);

    response.writeHead(200, { "Content-Type" : "application/javascript; charset=utf8" });
    response.write(JSON.stringify(post));
    response.end();
  });

  router.get('/stream/thread/(.*)', function (request, response, threadid) {
    post = follower.fetch_by_thread(threadid);

    response.writeHead(200, { "Content-Type" : "application/javascript; charset=utf8" });
    response.write(JSON.stringify(post));
    response.end();
  });

  router.get('/stream/forum/(.*)', function (request, response, forumid) {
    post = follower.fetch_by_forum(forumid);

    response.writeHead(200, { "Content-Type" : "application/javascript; charset=utf8" });
    response.write(JSON.stringify(post));
    response.end();
  });

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
    return text.replace(/\[\/?(?:b|i|u|url|quote|code|img|color|size)*?.*?\]/img, '');
  }

  function _read_forum()
  {
    var last_post = follower.last_post();

    client.query(query, [last_post.postid], function selectCb(err, results, fields) {
        if (err) {
          throw err;
        }

        if (results.length > 0) {
          results[0].pagetext = _remove_bbcode(results[0].pagetext)
          follower.update(results[0]);
          //sys.puts(sys.inspect(results[0], true, null));
        }
      }
    );
  }

  function _start_server() {
    sys.puts('Connected to mysql. Starting posts polling...');

    client.query('SELECT max(postid) as max from post', function (err, results, fields) {
      if (err) {
        throw err;
      }

      if (results.length > 0) {
        follower.update({userid: 0, threadid: 0, postid: results[0].max - 1});
        setInterval(_read_forum, 1000);
        router.start();
      }
    });
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
