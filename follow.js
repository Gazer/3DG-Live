var sys = require("sys");

var follows = [];
var last_post = null;

function update (post) {
  find_by_type('user', post.userid);
  find_by_type('thread', post.threadid);
  find_by_type('forum', post.forumid);

  var users = 0;
  var threads = 0;
  var forums = 0;

  for(i=0; i<follows.length; i++) {
    f = follows[i];

    if (f.type == 'user') users++;
    if (f.type == 'thread') threads++;
    if (f.type == 'forum') forums++;

    if ((f.type == 'user') && (f.id == parseInt(post.userid))) {
      follows[i].post = post;
    } else if ((f.type == 'thread') && (f.id == parseInt(post.threadid))) {
      follows[i].post = post;
    } else if ((f.type == 'forum') && (f.id == parseInt(post.forumid))) {
      follows[i].post = post;
    }
  }

  last_post = post;

  var str = 'Following ('+follows.length+')';
  str += ' users : ' + users;
  str += ' threads : ' + threads;
  str += ' forums : ' + forums;
  str += '. RSS = ' + process.memoryUsage().rss;

  sys.puts(str);
  //sys.puts(sys.inspect(follows, true, null));
}

function find_by_type(type, id) {
  id = parseInt(id);
  if (id == 0) return;

  for(key in follows) {
    f = follows[key];

    if ((f.type == type) && (f.id == id)) {
      return f;
    }
  }

  var follow = {
    type: type,
    id: id,
    post: null
  };

  follows.push(follow);

  return follow;
}

exports.fetch_by_user = function (userid) {
  return find_by_type('user', userid).post;
};

exports.fetch_by_thread = function (threadid) {
  return find_by_type('thread', threadid).post;
};

exports.fetch_by_forum = function (forumid) {
  return find_by_type('forum', forumid).post;
};

exports.update = update;

exports.last_post = function () {
  return last_post;
};
