var last_post = {postid: 0, title: 'fake', username: 'cake'};
var filters = {threadid: undefined, userid: undefined};
var paused = false;

function update_filters()
{
  if ((filters.threadid == undefined) && (filters.userid == undefined)) {
    $('.info h2 a.filters').hide();
  }

  if ($('.info h2 a.filters').length == 0) {
    link = $('<a href="javascript:void(0)" class="filters">(Sacar filtro)</a>');

    link.click(function () {
      filters.threadid = undefined;
      filters.userid = undefined;
      $(this).hide();
    });

    $('.info h2').append(link);
  } else {
    $('.info h2 a.filters').show();
  }
}

function apply_thread_filter(threadid) {
  filters.threadid = threadid;

  update_filters();
}

function apply_user_filter(userid) {
  filters.userid = userid;

  update_filters();
}

function init()
{
  $('a.filter_thread').live('click', function () {
    apply_thread_filter($(this).attr('rel'));
  });
  $('a.filter_user').live('click', function () {
    apply_user_filter($(this).attr('rel'));
  });

  $('div.url a, a.filter_thread, a.filter_user').live('mouseover mouseout', function(event) {
    if (event.type == 'mouseover') {
      paused = true;
    } else {
      paused = false;
    }
  });

  setTimeout(update, 1000);
}

function create_post(post) {
  url = "<a target='_blank' href='http://foros.3dgames.com.ar/showthread.php?p="+post.postid+"#"+post.postid+"'>Ver</a>";
  filter_thread = "<a href='javascript:void(0);' class='filter_thread' rel='"+post.threadid+"'>Ver solo este hilo</a>";
  filter_user = "<a href='javascript:void(0);' class='filter_user' rel='"+post.userid+"'>Ver solo este usuario</a>";
  member = "<a target='_blank' href='http://foros.3dgames.com.ar/members/"+post.userid+".html'>"+post.username+"</a>";
  avatar = "<div class='image' style='background: url(http://profiles.3dgames.com.ar/avatar/"+post.user_hash+"?size=tiny);'></div>";

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
        ' + filter_thread + ' | ' + filter_user + ' \
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
  $.getJSON("stream", function(post) {
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
    setTimeout(update, 1000);
  });
}
