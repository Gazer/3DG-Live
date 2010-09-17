var sys = require("sys"),
    http = require("http"),
    path = require("path"),
    fs = require("fs"),
    url = require("url"),
    Client = require('mysql').Client,
    Router = require('./router');

var Live3DG = function() {
  var client = new Client();
  var last_post = {postid: -1};
  var bbcode_quote =  new RegExp('\\[quote[^]].*](.*?)\\[/\\1]');
  var query = 'select user.userid, post.pagetext, post.postid, post.threadid, thread.title as title, post.dateline as updated_at, post.username as username from post inner join thread on thread.threadid = post.threadid inner join user on user.userid = post.userid where post.postid > ? and forumid NOT IN (5,16,106,108,109,96,284,367,141,184,253,252,138) order by postid asc limit 1;';

  var router = new Router();
  router.get('/', function (request, response) {
    _load_static_file('index.html', response);
  });

  router.get('/media/(.*)', function (request, response, file) {
    _load_static_file('media/' + file, response);
  });

  router.get('/stream', function (request, response) {
    response.writeHead(200, { "Content-Type" : "application/javascript; charset=utf8" });
    response.write(JSON.stringify(last_post));
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
    client.query(query, [last_post.postid], function selectCb(err, results, fields) {
        if (err) {
          throw err;
        }

        if (results.length > 0) {
          results[0].pagetext = _remove_bbcode(results[0].pagetext)
          last_post = results[0];
          //sys.puts(sys.inspect(results[0], true, null));
        }
      }
    );
  }

  function _start_server() {
    sys.puts('Connected to mysql. Starting posts polling...');
    setInterval(_read_forum, 1000);

    client.query('SELECT max(postid) as max from post', function (err, results, fields) {
      if (err) {
        throw err;
      }

      if (results.length > 0) {
        last_post.postid = results[0].max - 1;
        sys.puts('Last postid ' + last_post.postid);

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
