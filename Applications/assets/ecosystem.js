//-------------------------------------------------
//      Quick Pager jquery plugin
//      Created by dan and emanuel @geckonm.com
//      www.geckonewmedia.com
//
//
//      18/09/09 * bug fix by John V - http://blog.geekyjohn.com/
//      1.2 - allows reloading of pager with new items
//-------------------------------------------------

(function($) {
    var isOnline = true;
    var default_apps = [{ id: "marketplace", name: "Marketplace", description: "Provides access to new applications", url: "http://bazaar.redpitaya.com/", image: "images/download_icon.png", check_online : true },
        { id: "appstore", name: "Store", description: "Provides access to new hardware", url: "http://store.redpitaya.com/", image: "../assets/images/shop.png", check_online : false },
        { id: "github", name: "Github", description: "Our github", url: "https://github.com/redpitaya", image: "../assets/images/github.png", check_online : false },
        { id: "visualprogramming", name: "Visual Programming", description: "Perfect tool for newcomers to have fun while learning and putting their ideas into practice", url: "http://account.redpitaya.com/try-visual-programming.php", image: "images/img_visualprog.png", check_online : true  },
    ];

    var apps = [];

    placeElements = function() {
        var elemWidth = $('.app-item').outerWidth(true);
        var containerWidth = $('#list-container').width();
        var elemsInRow = Math.floor(containerWidth / elemWidth);
        elemsInRow = (elemsInRow == 0) ? 1 : elemsInRow;

        var elemHeight = $('.app-item').outerHeight(true);
        var containerHeight = $('#main-container').height();
        var elemsInCol = Math.floor(containerHeight / elemHeight);
        elemsInCol = (elemsInCol == 0) ? 1 : elemsInCol;



        $("ul.paging").quickPager({
            pageSize: elemsInRow * elemsInCol
        });
    }

    var prepareOffline = function() {
        Offline.options = {
            checks: {
                xhr: {
                    url: '/check_inet'
                }
            },
            checkOnLoad: false,
        };
        Offline.on('up', function() {
            isOnline = true;
        });
        Offline.on('down', function() {
            isOnline = false;
        });
        Offline.check();
        var run = function() {
            Offline.check();
        }
        setInterval(run, 3000);
    }

    var refillList = function() {
        $('.app-item').unbind('click');
        $('.app-item').unbind('mouseenter');
        $('.app-item').unbind('mouseleave');
        $('#main-container').empty();
        $('#main-container').append('<ul class="paging" id="list-container"></ul>');

        $('#list-container').empty();
        for (var i = 0; i < apps.length; i++) {
            var txt = '<li class="app-item" key="' + i + '" >';
            txt += '<a href="#" class="app-link"><div class="img-container"><img class="app-icon" src="' + apps[i]['image'] + '"></div><span class="app-name">' + apps[i]['name'] + '</span></a>';
            txt += '</li>';
            $('#list-container').append(txt);
        }
        $('.app-item').click(clickApp);
        $('.app-item').mouseenter(overApp);
        $('.app-item').mouseleave(leaveApp);
    }

    var getListOfApps = function() {
        $('#loader-desc').html('Getting the list of applications');
        $('body').removeClass('loaded');
        $.ajax({
            url: 'bazaar?apps=',
            cache: false,
            async: true
        }).done(function(result) {
            var url_arr = window.location.href.split("/");;
            var url = url_arr[0] + '//' + url_arr[2] + '/';
            apps = [];
            $.each(result, function(key, value) {
                var obj = {};
                obj['id'] = key;
                obj['name'] = value['name'];
                obj['description'] = value['description'];
                obj['url'] = url + key + '/?type=run';
                obj['image'] = url + key + '/info/icon.png';
                obj['check_online'] = true;
                apps.push(obj);
            });

            for(var i=0; i<default_apps.length; i++)
            {
                apps.push(default_apps[i]);
            }

            refillList();
            placeElements();
            $('body').addClass('loaded');
        }).fail(function(msg) { getListOfApps(); });
    }

    var clickApp = function(e) {
        var key = parseInt($(this).attr('key')) * 1;
        e.preventDefault();
        if(apps[key].check_online)
        {
            if (!isOnline) {
                $('#lic_failed').show();
                $('#ic_missing').modal('show');
                return;
            }
        }
        licVerify(apps[key].url);
    }

    var overApp = function(e) {
        var key = parseInt($(this).attr('key')) * 1;
        $('#description').html(apps[key].description);
    }

    var leaveApp = function(e) {
        $('#description').html("");
    }

    var onSwipe = function(ev) {
        if ($('.simplePagerNav').length == 0)
            return;
        var rel = 1;
        if (ev.direction == Hammer.DIRECTION_LEFT)
            rel = parseInt($('.active-dot').parent().attr('rel')) * 1 + 1;
        else if (ev.direction == Hammer.DIRECTION_RIGHT) {
            var crel = parseInt($('.active-dot').parent().attr('rel')) * 1;
            if (crel == 1) return;
            rel = crel - 1;
        }
        var obj = $('.simplePageNav' + rel).find('a');
        if (obj.length == 0)
            return;
        else obj.click();
    }

    var licVerify = function(success_url) {
        var post_uri = 'http://store.redpitaya.com/upload_id_file/';
        var req_uri = 'http://store.redpitaya.com/get_lic/?rp_mac=';
        $('#loader-desc').html('Preparing application to run');
        $('body').removeClass('loaded');
        $.ajax({
                method: "GET",
                url: "idfile.id"
            })
            .done(function(msg) {
                var obj = jQuery.parseJSON(msg);
                if (obj != undefined && obj != null && obj.mac_address != undefined && obj.mac_address != null)
                    req_uri = req_uri + obj.mac_address;
                $.ajax({
                        method: "POST",
                        url: post_uri,
                        data: 'id_file=' + encodeURIComponent(msg)
                    }).done(function(msg) {
                        if (msg == "OK") {
                            $.ajax({
                                    method: "GET",
                                    url: req_uri
                                }).done(function(msg) {
                                    var res_msg = msg + "\r\n";
                                    $.ajax({
                                            method: "POST",
                                            dataType: 'json',
                                            data: {
                                                'lic.lic': res_msg
                                            },
                                            contentType: 'application/json; charset=utf-8',
                                            url: "/lic_upload",
                                        })
                                        .done(function(msg) {})
                                        .fail(function(msg) {
                                            setTimeout(function() { $('body').addClass('loaded'); }, 2000);
                                            window.location = success_url;
                                        });
                                })
                                .fail(function(msg) {
                                    console.log("LIC: ERR2");
                                    setTimeout(function() { $('body').addClass('loaded'); }, 2000);
                                    window.location = success_url;
                                });
                        } else {
                            console.log("LIC: ERR3");
                            setTimeout(function() { $('body').addClass('loaded'); }, 2000);
                            window.location = success_url;
                        }
                    })
                    .fail(function(msg) {
                        console.log("LIC: ERR4");
                        setTimeout(function() { $('body').addClass('loaded'); }, 2000);
                        window.location = success_url;
                    });
            })
            .fail(function(msg) {
                console.log("LIC: ERR4");
                setTimeout(function() { $('body').addClass('loaded'); }, 2000);
                window.location = success_url;
            });
    }

    $(document).ready(function($) {
        getListOfApps();
        prepareOffline();

        var myElement = document.getElementById('main-container');
        var mc = new Hammer(myElement);
        mc.on('swipe', onSwipe);

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", 'info/info.json', false);
        xmlHttp.send(null);
        var info = JSON.parse(xmlHttp.responseText);
        $('#ver').html(info['description'].substring(0, info['description'].length - 1) + ' ' + info['version']);
    });

    $(window).resize(function($) {
        refillList();
        placeElements();
    });
})(jQuery);
