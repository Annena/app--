define('base/mobile', [
    'base/barcodescanner',
    'base/message',
    'base/cache',
    'base/util'
], function (BarcodeScanner, Message, Cache, Util) {

    var barcodeScanner = new BarcodeScanner();
    //截取URL指定字符串
    var version = Util.getQueryString('v');
    
    //定义饭团分享和文章分享的APPID变量
    var app_id = 'wx48c0ba158b071fb7';

    // 判断设备
    function device(android, ios) {
        if (Util.browser.versions.ios) {
            if (ios) {
                ios();
            }
        } else {
            if (android) {
                android();
            }
        }
    }

    //请求客户端首页已经加载完毕
    function getload(fn, tt){
        barcodeScanner.scan(
            function(result) {
                fn(result);
            },
            function(error) {
                tt(error);
            },
            'BarcodeScanner',
            'acLoad'
        );
    }

    // 获取软件版本号
    function getSoftVersion(fn) {
        device(function() {
            barcodeScanner.scan(
                function(result) {
                  fn(result);
                },
                function(error) {
                },
                'BarcodeScanner',
                'getSoftVersion',
                {'description': '获取版本号'}
            );
        }, function() {
            if (version) {
                barcodeScanner.scan(
                    function(result) {
                        fn(result);
                    },
                    function(error) {
                    },
                    'BarcodeScanner',
                    'getSoftVersion',
                    {'description': '获取版本号'}
                );
            } else {
                barcodeScanner.scan(
                    function(result) {
                        fn(result);
                    },
                    function(error) {
                    },
                    'MyPlugin',
                    'getSoftVersion',
                    {'description': '获取版本号'}
                );
            }
        });
       
    }

    // 获取用户从哪来
    function getUserForm(fn) {
        barcodeScanner.scan(
            function(result) {
                
                fn(result);
            },
            function(error) {
            },
            'BarcodeScanner',
            'source_user',
            {}
        );
    }

    // 首页分享
    function homeCardShare(type, shareType,appid) {
        var uid = $.cookie("user_id") ? $.cookie("user_id") : '';
        barcodeScanner.scan(
            function(result) {
            },
            function(error) {
            },
            'BarcodeScanner',
            'wxShare',
            {
                'webpageUrl': phpDownload,
                'whichShare': type,
                'shareType': shareType,
                'title': '乐卡包史上最强大会员卡APP！',
                'description': '一站式领卡享优惠，大量品牌即将入驻！',
                'appid':appid,
                'imageUrl': window.location.protocol + '//' + window.location.hostname + '/img/base/logo.png'
            }
        );
    }

    // 文章分享
    function articleShare(type, shareType, article, cardId, content) {
        //alert(window.location.protocol+'---'+window.location.hostname);
        var uid = $.cookie("user_id") ? $.cookie("user_id") : "";
        var userMobile = $.cookie("user_mobile") ? $.cookie("user_mobile") : "";
        barcodeScanner.scan(
            function(result) {
            },
            function(error) {
            },
            'BarcodeScanner',
            'wxShare',
            {
                'webpageUrl': window.location.protocol + '//' + window.location.hostname + '/html/index.html?messageDetails&card_id='+cardId+'&news_id='+article.news_id+'&page=merchantHome&cid='+Cache.get('getCID')+'&user_id='+uid+'&user_mobile='+userMobile,
                'whichShare': type,
                'shareType': shareType,
                'appid': app_id,
                'title': article.news_title,
                'description': content,
                //'imageUrl': window.location.protocol + '//' + window.location.hostname + '/'+article.icon
                'imageUrl': window.location.protocol + '//' + window.location.hostname + '/'+ 'img/business/'+cardId+'/news/'+article.news_id+'.jpg'
            }
        );
    }

    // 点餐页分享
    function dishesShare(type, shareType,appid, card_id, shop_id, shopcardname) {
        var uid = $.cookie("user_id") ? $.cookie("user_id") : '';
        var userMobile = $.cookie("user_mobile") ? $.cookie("user_mobile") : "";
        barcodeScanner.scan(
            function(result) {
            },
            function(error) {
            },
            'BarcodeScanner',
            'wxShare',
            {
                'webpageUrl': window.location.protocol + '//' + window.location.hostname + '/html/index.html?dishes&card_id='+card_id+'&cardname='+shopcardname+'&shop_id='+shop_id+'&page=shopChoice&cid='+Cache.get('getCID')+'&user_id='+uid+'&user_mobile='+userMobile,
                'whichShare': type,
                'shareType': shareType,
                'title': '京城特色美食推荐',
                'description': shopcardname+'美食菜谱',
                'appid':appid,
                'imageUrl': window.location.protocol + '//' + window.location.hostname + '/img/business/' + card_id + '/logo.jpg'
            }
        );
    }

    // 店铺列表页分享
    function choiceShare(type, shareType,appid, card_id, shopcardname) {
        var uid = $.cookie("user_id") ? $.cookie("user_id") : '';
        var userMobile = $.cookie("user_mobile") ? $.cookie("user_mobile") : "";
        barcodeScanner.scan(
            function(result) {
            },
            function(error) {
            },
            'BarcodeScanner',
            'wxShare',
            {
                'webpageUrl': window.location.protocol + '//' + window.location.hostname + '/html/index.html?shopChoice&card_id='+card_id+'&cardname='+shopcardname+'&page=merchantHome&cid='+Cache.get('getCID')+'&user_id='+uid+'&user_mobile='+userMobile,
                'whichShare': type,
                'shareType': shareType,
                'title': '京城特色美食推荐',
                'description': shopcardname+'店铺列表',
                'appid':appid,
                'imageUrl': window.location.protocol + '//' + window.location.hostname + '/img/business/' + card_id + '/logo.jpg'
            }
        );
    }

    // 商户首页进去店铺列表页分享
    function listShare(type, shareType,appid, card_id) {
        var uid = $.cookie("user_id") ? $.cookie("user_id") : '';
        var userMobile = $.cookie("user_mobile") ? $.cookie("user_mobile") : "";
        barcodeScanner.scan(
            function(result) {
            },
            function(error) {
            },
            'BarcodeScanner',
            'wxShare',
            {
                'webpageUrl': window.location.protocol + '//' + window.location.hostname + '/html/index.html?shopList&card_id='+card_id+'&cardname='+Cache.get('shop-cardname')+'&page=merchantHome&cid='+Cache.get('getCID')+'&user_id='+uid+'&user_mobile='+userMobile,
                'whichShare': type,
                'shareType': shareType,
                'title': '京城特色美食推荐',
                'description': Cache.get('shop-cardname')+'店铺列表',
                'appid':appid,
                'imageUrl': window.location.protocol + '//' + window.location.hostname + '/img/business/' + card_id + '/logo.jpg'
            }
        );
    }

    // 扫描二维码
    function scanner(description, type, fn) {
        $('#layer').removeClass('hide');
        Message.show('#layer', '<img src="../img/base/loadingnew.gif"><br>正在加载</div>', false);
        barcodeScanner.scan(
            function(result) {
                //alert(result+"---1");
                if (Util.browser.versions.ios) {
                    setTimeout(function() {
                        Message.show('#layer', '', 0, function() {});
                        checkScanResult(fn, type, result.text);
                    }, 0);
                } else {
                    Message.show('#layer', '', 0, function() {});
                    checkScanResult(fn, type, result);
                }
            },
            function(error) {
                Message.show('#layer', '', 0, function() {});
            },
            'BarcodeScanner',
            'scan',
            {
                'description': description,
                'intfrom': '取　消'
            }
        );
        if (!Util.browser.versions.ios) {
            setTimeout(function() {
                Message.show('#layer', '', 0, function() {});
            },1500);
        }
    }

    // 校验扫描结果
    function checkScanResult(fn, type, result) {
        //alert('tt');
        // android点击取消返回1，点击返回返回0，ios点击取消返回0
        if (result == '0' || result == '1') {
            return;
        }
        if (typeof result) {
            //alert('ddd');
            fn(result);
        } else {
            Message.show('#msg', '二维码有误', 3000);
        }

        
        //alert(result);
        // 正则验证是否是一位数字
       /* var number = /^[\d]{1}$/;
        //if (number.test(result.substring(0,1))){
            if (result.length == 21) {
                fn(result);
            } else {
                Message.show('#msg', '二维码有误', 3000);
            }*/
        /*} else {
            Message.show('#msg', '二维码有误', 3000);
        }*/
        /*// 扫描充值码
        if ( result.indexOf('card_code') != -1 && type == 1) {
            fn(JSON.parse(result));
        // 扫描桌台
        } else if (result.indexOf('tab_id') != -1 && type == 2) {
            if (JSON.parse(result).tab_id.length == 3) {
                fn(JSON.parse(result));
            } else {
                Message.show('#msg', '桌台不对', 3000);
            }
        // 搜索订单
        } else if (result.indexOf('order_main') != -1 && type == 3) {
            fn(JSON.parse(result));
        } else {
            Message.show('#msg', '二维码有误', 3000);
        }*/
    }

    // 下载URL
    function downloadUrl(url) {
        device(function() {
            navigator.app.loadUrl(encodeURI(url), { openExternal:true});
        }, function() {
            if (version) {
                barcodeScanner.scan(
                    function(result) {
                    },
                    function(error) {
                    },
                    'BarcodeScanner',
                    'downloadUrl',
                    {'url': encodeURI(url)}
                );
            } else {
                barcodeScanner.scan(
                    function(result) {
                    },
                    function(error) {
                    },
                    'BarcodeScanner',//这里修改过，原来是MyPlugin
                    'downloadUrl',
                    {'url': encodeURI(url)}
                );
            }
        });
    }

    // 网络检测
    function checkConnection() {
        //alert(navigator.network.connection.type);
        if (navigator.network) {
            var networkState = navigator.network.connection.type;
            var states = {};
            states[Connection.UNKNOWN]  = 'Unknown connection';
            states[Connection.ETHERNET] = 'Ethernet connection';
            states[Connection.WIFI]     = 'WiFi connection';
            states[Connection.CELL_2G]  = 'Cell 2G connection';
            states[Connection.CELL_3G]  = 'Cell 3G connection';
            states[Connection.CELL_4G]  = 'Cell 4G connection';
            states[Connection.NONE]     = 'No network connection';

            if (networkState == Connection.NONE) {
                return true;
            } else {
                return false;
            }
        }
    }

    // 微信支付
    function weixinPay(appid, partnerid, prepayId, packageValue, nonceStr, timeStamp, sign, fn) {
        barcodeScanner.scan(
            function(result) {
                //alert(result);
                fn(result);
            },
            function(error) {
            },
            'BarcodeScanner',
            'wxPay',
            {
                'appId': appid,
                'partnerId': partnerid,
                'prepayId': prepayId,
                'packageValue': packageValue,
                'nonceStr': nonceStr,
                'timeStamp': timeStamp,
                'sign': sign
            }
        );
    }

    //获取经纬度
    function getlnglat(fn){
        barcodeScanner.scan(
            function(result) {
                fn(result);
            },
            function(error) {
            },
            'BarcodeScanner',
            'latAndlng'
        );
    }


    return {
        getSoftVersion: getSoftVersion,
        scanner: scanner,
        checkConnection: checkConnection,
        downloadUrl: downloadUrl,
        getUserForm: getUserForm,
        getload: getload,
        homeCardShare: homeCardShare,
        articleShare: articleShare,
        dishesShare: dishesShare,
        choiceShare: choiceShare,
        listShare: listShare,
        weixinPay: weixinPay,
        getlnglat: getlnglat
    };
});