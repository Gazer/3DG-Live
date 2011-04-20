var last_post = {postid: 0, title: 'fake', username: 'cake'};
var filters = {threadid: undefined, userid: undefined};
var paused = false;

function init()
{
  $('div.url a, a.filter_thread, a.filter_user').live('mouseover mouseout', function(event) {
    if (event.type == 'mouseover') {
      paused = true;
    } else {
      paused = false;
    }
  });

  setTimeout(set_title, 1200);
  setTimeout(update, 1000);
}

function set_title()
{
  if (last_post.postid == 0) {
    setTimeout(set_title, 1200);
    return;
  }
  url = window.location.toString().split('#')[1];

  if (url.match(/user/)) {
    text = last_post.username;
  } else if (url.match(/thread/)) {
    text = last_post.title;
  } else if (url.match(/forum/)) {
    text = last_post.forum_title;
  }

  $(".info h2").html("&Uacute;ltimas entradas de <strong>" + text + "</strong>");
}
function create_post(post) {
  url = "<a target='_blank' href='http://foros.3dgames.com.ar/showthread.php?p="+post.postid+"#"+post.postid+"'>Ver</a>";
  filter_thread = "<a href='#stream/thread/"+post.threadid+"' target='_blank'>Seguir hilo</a>";
  filter_user = "<a href='#stream/user/"+post.userid+"' target='_blank'>Seguir <strong>"+post.username+"</strong></a>";
  filter_forum = "<a href='#stream/forum/"+post.forumid+"' target='_blank'>Seguir <strong>"+post.forum_title+"</strong></a>";
  member = "<a target='_blank' href='http://foros.3dgames.com.ar/members/"+post.userid+".html'>"+post.username+"</a>";
  avatar = "<img src='http://foros.3dgames.com.ar/image.php?u="+post.userid+"' />";

  var template = ' \
    <div class="post"> \
      <div class="content"> \
        <div class="avatar"> \
          ' + avatar + ' \
        </div> \
        <div class="head"> \
          <span class="nick">' + member + '</span> \
          opin&oacute; en \
          <span class="title">' + post.title + '</span> \
        </div> \
        <div class="text"> \
          ' + post.pagetext + ' \
        </div> \
      </div> \
      <div class="url"> ' + url +'</div> \
      <div class="filters"> \
        ' + filter_forum + ' | ' + filter_user + ' | ' + filter_thread + ' \
      </div> \
      <div class="clear"> \
    </div> \
  </div> \
  ';

  $(template)
    .animate({
      "height": "toggle",
      "opacity": "toggle"
    }, "slow")
    .prependTo('#posts');
}

function update() {
  url = window.location.toString().split('#')[1];
  if (url == undefined) {
    url = 'stream';
  }

  var jqxhr = $.getJSON(url, function(post) {
    if (last_post.postid != post.postid) {
      last_post = post;

      if (!paused) {
        if ((filters.threadid === undefined) && (filters.userid === undefined)) {
          create_post(post);
        } else if ((filters.threadid === post.threadid) && (filters.userid === undefined)) {
          create_post(post);
        } else if ((filters.threadid === undefined) && (filters.userid === post.userid)) {
          create_post(post);
        } else if ((filters.threadid === post.threadid) && (filters.userid === post.userid)) {
          create_post(post);
        }
      }

      if ($('#posts .post').length > 10) {
        $("#posts .post:last-child").fadeOut(function () {
          $(this).remove();
        });
      }
    }
    update();
  }).error(function() { update(); });


}
