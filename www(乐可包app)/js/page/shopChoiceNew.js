define('page/shopChoiceNew', [
    'base/page',
    'base/scrollbar',
    'base/data',
    'base/util',
    'base/cache',
    'base/message',
    'base/mobile',
    'base/dialog'
], function(Page, Bar, Data, Util, Cache, Message, Mobile, Dialog) {

    var ShopChoice = function() {
        this.back = '';
    }
    $.session.set('newChoice', 'newChoice')
        // 商家点餐之后选择门店列表页面
    ShopChoice.prototype = new Page('shopChoiceNew');

    ShopChoice.prototype.util = function() {

        // 判断如果url链接里面有cid就从url里面取，否则就是用缓存里面的
        var cid = Cache.get('getCID');
        if (Util.getQueryString('cid') != undefined) {
            cid = Util.getQueryString('cid');
            Cache.set('getCID', cid);
        }

        // 订单属性： order_property 堂食1 外卖2 打包3 商城配送4

        // 获取到URL里面page的值，那是上一个页面的名称，之后赋值给返回，即可返回到上一页面
        var page = Util.getQueryString('page');
        var cardId = Util.getQueryString('card_id');

        var is_ajax = 0;// 是否请求了获取店铺接口
        var is_frequency = 0;// 次数，微信请求不到的次数，如果请求两次还请求不到就展示没有定位的列表

        // 获取品牌id
        var brand_id = Util.getQueryString('brand_id');

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli = Util.isAlipay()

        var shopcardname = Cache.get('shop-cardname');
        if (isWeixin || isAli) {
            shopcardname = decodeURIComponent(Util.getQueryString('cardname'));
            if (shopcardname == 'undefined' || shopcardname == null) {
                shopcardname = Cache.get('shop-cardname');
            }
        } else {
            // 读取商铺名缓存
            if (shopcardname == null) {
                shopcardname = decodeURIComponent(Util.getQueryString('cardname'));
                Cache.set('shop-cardname', shopcardname);
            }
        }
        $('#shoplist-shopname').text('品牌店铺列表');
        $('title').text('品牌店铺列表');

        var self = this;

        var ShopChoicePage = {

            listScroll: null,

            init: function() {
                var _self = this;

                //是否是客户端 并且 非微信
                if ($.app.isClient && !isWeixin && !isAli) {
                    //请求客户端获取到用户位置的经纬度
                    Mobile.getlnglat(function(result) {
                        //alert(JSON.parse(result)['lontitude']);
                        //alert(JSON.parse(result)['latitude']);
                        if (result != 0) {
                            _self.shopChoiceById(cardId, JSON.parse(result)['lontitude'], JSON.parse(result)['latitude'], 0);
                        } else {
                            Message.show('#msg', 'GPS定位失败！请检查是否打开了GPS！', 2000, function() {
                                // 跳回商户页面
                                Page.open('merchantHome&card_id=' + Util.getQueryString('card_id'));
                            });
                        }
                    });
                } else {

                    //116.5168413680   39.9234408213  金泰国益大厦
                    //_self.shopChoiceById(cardId, '', '', 1);
                    // 判断微信访问
                    var is_flush = Cache.get('is_wx_flush');
                    if (is_flush != 1) {
                        window.location.reload();
                        Cache.set('is_wx_flush', 1);
                    } else {
                        _self.weixinVisit();
                    }
                }
                // 判断微信访问
                //this.weixinVisit();
                // 点击事件
                this.shopChoiceBind();
                this.listScroll = Bar($('#shopListScroll')[0], true);
            },

            // 根据商家id获取商家所有门店
            shopChoiceById: function(data, addr_lng, addr_lat, type) {
                var _self = this;
                var type_ajax = 2;
                if (isWeixin) {
                    type_ajax = 4;
                }
                is_ajax = 1;
                Data.setAjax('companyBrandShop', {
                    // 'card_id': data,
                    'brand_id': brand_id,
                    'cid': cid,
                    'order_property': 1,
                    'addr_lng': addr_lng,
                    'addr_lat': addr_lat
                }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                    if (respnoseText.code == 20) {
                        // 所有门店信息的显示

                        shopcardname = respnoseText.data.brand_name;
                        _self.displayData(respnoseText.data.shop_list, type);
                    } else {
                        shopcardname = '乐卡包';
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, type_ajax);
            },

            // 所有门店信息显示到页面
            displayData: function(data, type) {
                var content = '';
                var contentNone = ''
                var openTime = '';
                var openTimeM = '';
                var closeTime = '';
                var closeTimeM = '';


                for (var i in data) {
                    var con = '';
                    var img_t = '<img src="../../img/base/take_sj.png">';
                    openTime = data[i].open_time.substr(0, 2)
                    closeTime = data[i].close_time.substr(0, 2)
                    if (openTime <= '06') {
                        openTimeM = '早上'
                    } else if (openTime >= '07' && openTime <= '12') {
                        openTimeM = '上午'
                    } else if (openTime >= '13' && openTime <= '18') {
                        openTimeM = '下午'
                    } else if (openTime >= '18' && openTime <= '23') {
                        openTimeM = '晚上'
                    }

                    if (closeTime <= '06') {
                        closeTimeM = '早上'
                    } else if (closeTime >= '07' && closeTime <= '12') {
                        closeTimeM = '上午'
                    } else if (closeTime >= '13' && closeTime <= '18') {
                        closeTimeM = '下午'
                    } else if (closeTime >= '18' && closeTime <= '23') {
                        closeTimeM = '晚上'
                    }
                    if (closeTime < openTime) {
                        closeTimeM = "次日"
                    }
                    // 0是客户端
                    if (type == 0) {
                        if (data[i].addr_lat == '' && data[i].addr_lng == '') {
                            con = img_t + openTimeM + data[i].open_time.substr(0, 5) + '-' + closeTimeM + data[i].close_time.substr(0, 5);
                        } else {
                            var distance = 0;
                            if (data[i].distance < 0.1) {
                                distance = '<0.1';
                            } else {
                                distance = data[i].distance.toFixed(1);
                            }
                            con = '<span class="distanceLeft">' + img_t + openTimeM + data[i].open_time.substr(0, 5) + '-' + closeTimeM + data[i].close_time.substr(0, 5) + '</span>' +
                                '<span class="distance">距离<b>' + distance + '</b>km</span>';
                        }
                    } else {
                        con = img_t + openTimeM + data[i].open_time.substr(0, 5) + '-' + closeTimeM + data[i].close_time.substr(0, 5);
                    }

                    content += '<div class="shoplist-list-floor" data-type="shopChoice" card_id="' + data[i].card_id + '" shop-id="' + data[i].shop_id + '" shop-name="' + data[i].shop_name + '">' +
                        '<div class="shoplist-pitch">' +
                        '<div class="shoplist-list">' +
                        '<div class="shoplist-border">' +
                        '<div class="shoplist-left">' +
                        '<div class="shoplist-list-title">' + data[i].shop_name + '<span class="shoplist-youjiantou"><span>' + '</div>' +
                        '<div class="shoplist-status-tell"><img src="../../img/base/take_dh.png"><a data-type="tel" href="tel:' + data[i].shop_tel + '">' + data[i].shop_tel + '</a></div>' +
                        '<div class="shoplist-status-tell ma_bo"><div class="shoplist-addr-title"><img src="../../img/base/take_dzz.png"></div><div class="shoplist-addr-content">' + data[i].shop_province + data[i].shop_city + data[i].shop_area + data[i].shop_addr + '</div></div>' +
                        '</div>' +
                        '</div>' +
                        '<span class="hide" data-type="shop_type_info">' + data[i].shop_type_info + '</span>' +
                        '<div class="shoplist-status">' +
                        '<div class="shoplist-status-txt">' +
                        con +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>';

                }
                contentNone += '<div class="peizhi" data-type="">' +
                    '<img src="../../img/base/tb.png" alt="">' +
                    '<p>-&nbsp;系统配置中，暂不支持该功能&nbsp;-</p>'
                '</div>';

                // 添加到页面中
                if (content == '') {
                    $('#shopListMain').html(contentNone);
                } else {
                    $('#shopListMain').html(content);
                }

                // 刷新滚动
                this.listScroll.refresh();
            },

            // 判断微信访问
            weixinVisit: function() {
                var _self = this;

                if (isWeixin || isAli) {
                    $('#download').removeClass('hide');

                    //$('#shopChoice-frame header').addClass('hide');

                    //$('#dishes-content').css('top', '0');

                    document.getElementById('shopListScroll').style.cssText = 'top:45px !important';
                    //document.getElementById('shopChoice-header').style.cssText = 'top:45px !important';

                    // $('#shopChoice-header').addClass('top35')
                    // $('#shopListScroll').addClass('top98')

                    $('.pg-shopChoice div[data-id="scroller"]').css('padding-bottom', '100px');
                    // 分享按钮隐藏
                    $('#shopChoice-share').addClass('hide');

                    $('#download').unbind('click').bind('click', function() {
                        window.location = phpDownload;
                    });

                    if (isWeixin) {
                        // 得到签名数据
                        Data.setAjax('companyShare', {
                            'card_id': '',
                            'url': location.href.split('#')[0],
                            'cid': cid
                        }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                            if (respnoseText.code == 20) {
                                var data = respnoseText.data;
                                //alert(data.signature+'-----1');
                                //setTimeout(function () {
                                _self.wxContent(data);
                                //}, 500);
                            } else {
                                Message.show('#msg', respnoseText.message, 2000);
                                //_self.shopChoiceById(cardId, '', '', 1);
                            }
                        }, 3);
                    } else {
                        _self.shopChoiceById(cardId, '', '', 1);
                    }

                    //$('title').text('京城特色美食推荐');
                } else {
                    $('#download').addClass('hide');

                    $('#shopChoice-share').removeClass('hide');
                    //$('#shopChoice-frame header').removeClass('hide');
                    _self.shopChoiceById(cardId, '', '', 1);
                }
            },

            // 微信分享内容设置
            wxContent: function(data) {
                var _self = this;
                // 微信引入JS文件，通过config接口注入权限验证配置
                //alert(1);
                /*debug: true, // 开启调试模式,调用的所有api的返回值会在客户端//alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                appId: '', // 必填，公众号的唯一标识
                timestamp: , // 必填，生成签名的时间戳
                nonceStr: '', // 必填，生成签名的随机串
                signature: '',// 必填，签名，见附录1
                jsApiList: [] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2

                微信js-sdk开发：http://mp.weixin.qq.com/wiki/7/aaa137b55fb2e0456bf8dd9148dd613f.html#.E6.A6.82.E8.BF.B0
                微信js-sdk-demo：http://203.195.235.76/jssdk/#menu-share*/
                // alert(data.appId+'++'+data.timestamp+'++'+data.nonceStr+'++'+data.signature);
                //alert(999);
                wx.config({
                    debug: false,
                    appId: data.appId,
                    timestamp: data.timestamp,
                    nonceStr: data.nonceStr,
                    signature: data.signature,
                    jsApiList: [
                        'checkJsApi', // 判断当前客户端版本是否支持指定JS接口
                        'onMenuShareTimeline', // 获取“分享到朋友圈”
                        'onMenuShareAppMessage', // 获取“分享给朋友”
                        'onMenuShareQQ', // 获取“分享到QQ”
                        'onMenuShareWeibo', // 获取“分享到腾讯微博”
                        'onMenuShareQZone', // 获取“分享到QQ空间”
                        'scanQRCode', // 扫描二维码
                        'getLocation' // 获取当前地理位置接口
                    ]
                });

                // 微信自定义分享内容和分享结果
                wx.ready(function() { // 通过ready接口处理成功验证

                    /*
                        title: '', // 分享标题
                        desc: '',  // 分享内容
                        link: '', // 分享链接
                        imgUrl: '', // 分享图标
                        success: function () { 
                            // 用户确认分享后执行的回调函数
                        },
                        cancel: function () { 
                            // 用户取消分享后执行的回调函数
                        }
                     */

                    /*wx.checkJsApi({
                      jsApiList: [
                        'getNetworkType',
                        'previewImage'
                      ],
                      success: function (res) {
                        //alert(JSON.stringify(res)+'------------------');
                      }
                    });*/

                    // 标题
                    var cardname = shopcardname;
                    var shareData = {
                        title: '京城特色美食推荐',
                        desc: cardname + '品牌店铺列表',
                        link: window.location.protocol + '//' + window.location.hostname + '/html/index.html?shopChoice&card_id=' + cardId + '&cardname=' + cardname + '&page=merchantHome&cid=' + cid + '&user_id=' + Util.getQueryString('user_id'),
                        imgUrl: window.location.protocol + '//' + window.location.hostname + '/img/business/' + cardId + '/logo.jpg',
                        success: function(res) {
                            //alert('已分享');
                        },
                        cancel: function(res) {
                            //alert('已取消');
                        }
                    };
                    wx.onMenuShareAppMessage(shareData); // 发送给朋友
                    wx.onMenuShareTimeline(shareData); // 分享到朋友圈
                    //wx.onMenuShareQQ(shareData);          // 分享到手机QQ
                    //wx.onMenuShareQZone(shareData);           // 分享到QQ空间

                    // 获取地理位置
                    wx.getLocation({
                        type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
                        success: function(res) {
                            // res.longitude    res.latitude
                            //alert('用户授权-----'+res.latitude+'-----'+res.longitude);
                            var resLoLa = Util.gcj_encrypt(parseFloat(res.latitude), parseFloat(res.longitude));
                            //console.log(res.latitude +'-----'+ res.longitude);
                            _self.shopChoiceById(cardId, resLoLa.lon, resLoLa.lat, 0);
                        },
                        cancel: function(res) {
                            //alert('用户拒绝授权获取地理位置');
                            _self.shopChoiceById(cardId, '', '', 1);
                        },
                        error: function(res) {
                            // alert(res.errMsg);
                        }
                    });
                });
                wx.error(function(res) { // 通过error接口处理失败验证
                    // alert(res.errMsg+"---??????????");
                    _self.shopChoiceById(cardId, '', '', 1);
                });
                if (is_frequency == 2 && is_ajax == 0) {
                    _self.shopChoiceById(cardId, '', '', 1);
                } else {
                    setTimeout(function () {
                        if (is_ajax == 0) {
                            is_frequency = is_frequency + 1;
                            _self.wxContent(data);
                        }
                    }, 2000);
                }
            },

            // 点击事件
            shopChoiceBind: function() {
                var _self = this;
                $('#shopListMain').delegate('div[data-type="shopChoice"]', 'click', function() {

                    var self = this,
                        shopId = $(this).attr('shop-id'),
                        shopName = $(this).attr('shop-name'),
                        type = $(event.target).attr('data-type'),
                        shop_type_info = $(this).find('span[data-type="shop_type_info"]').text();

                    var card_id_t = $(this).attr('card_id');
                    if (type == 'tel') {
                        ////alert('ddd');
                    } else {
                        Cache.set('shop_type_info', shop_type_info);
                        Cache.set('order_property_temporary', 1);
                        ////alert('ttt');
                        $.session.set('card_id', card_id_t)
                        $.session.set('shopName', shopName)
                        $.session.set('brand_id', brand_id)
                        $.session.set('shop_id', shopId)

                        Page.open('merchantHome&brand_id=' + brand_id + '&card_name=' + shopName + '&card_id=' + card_id_t + '&shop_id=' + shopId + '&is_new=1&order_property=1&type=1');
                    }
                });

                // 分享点餐页面
                $('#shopChoice-share').unbind('click').bind('click', function() {
                    $.dialog = Dialog({
                        type: 3,
                        dom: '#share-dialog',
                        success: function() {
                            // 分享到微信好友
                            $('#j-share-to-wx').unbind('click').bind('click', function() {
                                $.dialog.close($.dialog.id);
                                Mobile.choiceShare('0', '0', 'wx48c0ba158b071fb7', cardId, shopcardname);
                            });

                            // 分享到微信朋友圈
                            $('#j-share-to-wx-circle').unbind('click').bind('click', function() {
                                $.dialog.close($.dialog.id);
                                Mobile.choiceShare('0', '1', 'wx48c0ba158b071fb7', cardId, shopcardname);
                            });

                            // 分享给qq好友
                            $('#j-share-to-qq').unbind('click').bind('click', function() {
                                $.dialog.close($.dialog.id);
                                Mobile.choiceShare('1', '0', '', cardId, shopcardname);
                            });
                        }
                    });
                });
            }
        }
        ShopChoicePage.init();
    }

    ShopChoice.prototype.bindPageEvents = function() {
        var self = this;
        // 微信打开
        if (Util.isWeixin()) {
            // 如果缓冲中没有cid，就调用方法请求接口获取cid
            if (!Cache.get('getCID')) {
                Data.setAjax('userCid', '', '#layer', '#msg', { 20: '' }, function(respnoseText) {
                    // 获取到的cid放到缓存中
                    Cache.set('getCID', respnoseText.data);
                    self.util();
                }, 1);
            } else {
                self.util();
            }
        } else {
            self.util();
        }
    }

    return ShopChoice;


});