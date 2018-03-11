define('page/payQuick', [
    'base/page',
    'base/data',
    'base/cache',
    'base/scrollbar',
    'base/util',
    'base/load',
    'base/cache',
    'base/mobile',
    'base/message',
    'base/click'
], function (Page, Data, Cache, Bar, Util, Load, Cache, Mobile, Message, Click) {

    var cardId;
    var PayQuick = function () {
        this.back = 'merchantHome&card_id='+cardId;
    }

    // 扫描支付未支付订单支付页面
    PayQuick.prototype = new Page('payQuick');

    PayQuick.prototype.util = function () {
        // 读取商铺名称缓存
        var shopcardname = Cache.get('shop-cardname');
        // 显示顶部商户名称
        $('#weizhifu-shopname').text('支付');
        $('title').text('支付');

        // 获取到URL里面page的值，那是上一个页面的名称，之后赋值给返回，即可返回到上一页面
        var page = Util.getQueryString('page');
        cardId = Util.getQueryString('card_id');

        this.back = page +'&card_id='+ cardId;

        // 获取到是否领卡的缓存，在点击选好了的时候判断是否领卡，如果没有领卡就请求领卡接口，提示领卡成功。
        var yesNoCard = Cache.get(cardId+'yesNoCard');

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay()
        var content = '#noPayContent';

        /*APP1
        微信2
        点菜宝3
        收银台4*/
        var trade_type = Util.isWhat()

        // 如果用户未登录不显示未支付列表
        if (!$.cookie("user_mobile")) {
            $('#noPayDisplay').addClass('hide');
            $('#noPayContent').addClass('hide');
            
        } else {
            //$('#noPayDisplay').removeClass('hide');
            $('#noPayContent').removeClass('hide');
            // 获取未支付订单
            payQuickListObj(content).getlistData();
        }

        function payQuickListObj (content) {
            var PayQuick = function() {};
            
            PayQuick.prototype = new Load(content, {
                url: 'orderList',
                data: {
                    'card_id': cardId,
                    'trade_type': trade_type,
                    'order_list_type': 3,
                    'cid': Cache.get('getCID')
                }
            });

            PayQuick.prototype.eachData = function(data) {

                var content = '';

                if (data == '') {
                    $('#noPayDisplay').addClass('hide');
                } else {
                    $('#noPayDisplay').removeClass('hide');
                }

                //   cancel_code   1门店桌台被占用   2服务员取消订单 3退单
                var cancelCode = {
                    0: '',
                    1: '桌台被占用',
                    2: '服务员取消',
                    3: '银台退单',
                    5: '外卖退单',
                    7: '微信支付超时',
                    8: '门店当前未营业',
                    9: '用户取消订单'
                };
                var lay_order_step = '';// 最近订单状态，已确认、未确认、取消原因（已取消）order_step  cancel_code

                for (var i in data) {
                    // 判断已支付 或者 已结账的不显示在这个列表
                    if (data[i].order_state == '已支付' || data[i].order_state == '已结账') {
                        continue;
                    }

                    // order_property 堂食1 外卖2 打包3 商城配送4
                    var order_type_text = '';
                    if (data[i].order_property == 1) {
                        order_type_text = '餐厅堂食';
                    } else if (data[i].order_property == 2) {
                        order_type_text = '外卖送餐';
                    } else if (data[i].order_property == 3) {
                        order_type_text = '门店自取';
                    } else if (data[i].order_property == 4) {
                        order_type_text = '商城配送';
                    }

                    if (data[i].order_step == 0) {
                        lay_order_step = cancelCode[data[i].cancel_code];
                    } else if (data[i].order_step == 3) {
                        lay_order_step = '已确认';
                    } else {
                        lay_order_step = '未确认';
                    }

                    var table_type = '',
                        table_name = '';
                    if (data[i].table_type == 1) {
                        table_type = '';
                        table_name = '桌号'+data[i].table_name;
                    } else if (data[i].table_type == 2) {
                        table_type = '';
                        table_name = '包间'+data[i].table_name;
                    } else {
                        table_name = '单号'+data[i].table_name;
                    }

                    content += '<li class="weizhifu-pitchlist" pay_id="'+data[i].pay_id+'" order_property="'+data[i].order_property+'">'+
                                    '<div class="weizhifu-pitch-list-title">'+((data[i].f_shop_name != '' && data[i].f_shop_name != null) ? data[i].f_shop_name : data[i].shop_name)+
                                        '<b class="list_table_name">('+table_type+table_name+')</b>'+
                                        '<span class="weizhifu-pitch-youjiantou"><span></span></span>'+
                                    '</div>'+
                                    '<div class="weizhifu-pitch-left">'+
                                        '<div class="weizhifu-pitch-futitle">'+order_type_text+'：'+ data[i].order_state + '</div>'+
                                        '<div class="weizhifu-pitch-futitle">最近下单：'+
                                            '<b class="list_font_normal list_red">'+lay_order_step+'</b>'+
                                        '</div>'+                                     
                                        '<div class="weizhifu-pitch-futitle">'+Util.getLocalTimeDate(data[i].add_time)+'</div>'+
                                    '</div>'+
                                    '<div class="weizhifu-pitch-right"><span>￥</span>'+parseInt(data[i].consumes)+'</div>'+
                                '</li>';
                }

                return content;
            };

            PayQuick.prototype.viewContent = function(dom) {
                var that = this;
                // 未支付订单点击事件
                $(that.content).delegate('li', 'click', function(e) {
                    var otherId = $(this).attr('pay_id');
                    var order_property = $(this).attr('order_property');
                    var eveType = $(event.target).attr('data-type');
                    // 跳转到支付页面
                    Page.open('payorder&card_id='+cardId+'&pay_id='+otherId+'&page=payQuick&type=1&order_property='+order_property);
                });
            };

            return new PayQuick();
        }

        // 判断微信访问
        weixinVisit();

        // 获取到屏幕宽度，赋值给页面
        $('#orderlistScroll').width($.app.body_width);

        // 扫码支付点击事件
        $('#payQuickScann').unbind('click').bind('click', function () {
            scanningDate();
        });

        // 扫码跳转
        function scanningDate () {
            var _self = this;
            // 不是微信就请求客户端
            if (!isWeixin && !isAli) {
                // 点击扫码支付，显示扫码支付内容
                Mobile.scanner('将二维码放入框内', 1, function(result) {
                    // 扫描得到的二维码处理
                    qrcodeHandle(result);
                });
            }else if(isAli == true){
                    if((Ali.alipayVersion).slice(0,3)>=8.1){
                        Ali.scan({
                            type: 'qr' //qr(二维码) / bar(条形码) / card(银行卡号)
                        }, function(result) {
                            if(result.errorCode){
                                //没有扫码的情况
                                //errorCode=10，用户取消
                                //errorCode=11，操作失败
                            }else{
                                //成功扫码的情况
                                //result.barCode    string  扫描所得条码数据
                                _self.qrcodeHandle(result.qrCode);
                                //result.qrCode string  扫描所得二维码数据
                                //result.cardNumber string  扫描所得银行卡号
                            }
                        });
                    }else{
                        Ali.alert({
                            title: '亲',
                            message: '请升级您的钱包到最新版',
                            button: '确定'
                        });
                    }               
                }else {
                    wx.scanQRCode({
                      needResult: 1,// 默认为0，扫描结果由微信处理，1则直接返回扫描结果
                      //scanType:["qrCode","barCode"],// 可以指定扫二维码还是一维码，默认二者都有
                      //desc: 'scanQRCode desc',// 二维码描述
                      success: function (res) {
                        //Message.show('#msg', JSON.stringify(res), 3000);
                        var result = res.resultStr;
                        // 扫描得到的二维码处理
                        qrcodeHandle(result);
                      }
                    });
                }
        }

        // 扫描得到的二维码处理
        function qrcodeHandle (result) {
            // 将返回的二十一位存到缓存中，如果未登录的情况下进行了扫描，就可以在登录后把二十一位从缓存中取出来再进行该做的事情
            var scanCode = Util.analysisScanning(result);
            //alert(result);
            if (scanCode == false) {
                Message.show('#msg', '二维码有误', 3000);
                return;
            }

            var scanType = scanCode.scanType,   // 二维码类型
                cardIdPay = scanCode.cardId,        // 商户id
                otherId = scanCode.otherId;     // 根据二维码类型对应的其他id
                
            // 跳转的连接里面type=0代表是扫描，scanType=2代表的是扫描类型
            if (scanType == 4) {
                // 结账单二维码 
                //Click.isLogin(true, 'payorder&card_id='+cardId+'&pay_id='+otherId+'&page=payQuick&type=0&scanType=4');
                // 是微信 并且 未登录 跳转到 非会员在线支付页面
                if (isWeixin && !$.cookie("user_mobile")) {
                    // 扫描预结结账二维码处理
                    Util.scanTableCode(cardId, otherId, isWeixin, trade_type, '', '', '', '', 1);
                    /*Cache.set('loginReturn', 'payorder&card_id='+cardId+'&pay_id='+otherId+'&page=payQuick&type=0&scanType=4');
                    Page.open('nomemberlogin');*/
                } else {
                    membershipCard(4, cardId, otherId);
                }
            } else if (scanType == 5) {
                // 快捷支付订单二维码   order_id
                //Page.open('payorder&card_id='+cardIdPay+'&order_id='+otherId+'&page=payQuick&type=0&scanType=5');
                membershipCard(5, cardIdPay, otherId);
            } else {
                Message.show('#msg', '二维码有误', 3000);
                return;
            }
        }

        // 判断微信访问
        function weixinVisit () {
            var self = this;
            if (isWeixin || isAli) {
                $('#download').removeClass('hide');
                $('header').addClass('hide');
                //document.getElementById('payQuick-header').style.cssText = 'top:45px !important';
                //document.getElementById('orderlistScroll').style.cssText = 'top:215px !important';

                $('#payQuick-header').addClass('top35')
                $('#orderlistScroll').addClass('top205')
                $('.weizhifu-nav').addClass('top10')
                $('#download').unbind('click').bind('click', function () {
                    window.location=phpDownload;
                });
                
                // 得到签名数据
                Data.setAjax('companyShare', {
                    'card_id': cardId,
                    'url': location.href,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {20: ''}, function (respnoseText) {
                    if (respnoseText.code == 20) {
                        var datat = respnoseText.data;
                        setTimeout(function () {
                            wxContent(datat);
                        }, 500);
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
                
            } else {
                $('#download').addClass('hide');
                $('header').removeClass('hide');
            }
        }

        // 微信分享内容设置
        function wxContent (data) {
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
            //alert(location.href);
            wx.config({
                debug: false,
                appId: data.appId,
                timestamp: data.timestamp,
                nonceStr: data.nonceStr,
                signature: data.signature,
                jsApiList: [
                    'checkJsApi',           // 判断当前客户端版本是否支持指定JS接口
                    'onMenuShareTimeline',  // 获取“分享到朋友圈”
                    'onMenuShareAppMessage',// 获取“分享给朋友”
                    'onMenuShareQQ',        // 获取“分享到QQ”
                    'onMenuShareWeibo',     // 获取“分享到腾讯微博”
                    'onMenuShareQZone',     // 获取“分享到QQ空间”
                    'scanQRCode',           // 扫描二维码
                    'getLocation'           // 获取当前地理位置接口
                ]
            });
            //alert('1');
            // 微信自定义分享内容和分享结果
            wx.ready(function () {  // 通过ready接口处理成功验证
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
                wx.checkJsApi({
                  jsApiList: [
                    'getNetworkType',
                    'previewImage'
                  ],
                  success: function (res) {
                    //alert(JSON.stringify(res)+'------------------');
                  }
                });
            });
            wx.error(function (res) {// 通过error接口处理失败验证
                //alert(res.errMsg+"??????????");
            });
        }

        // 领取会员卡
        function membershipCard (scanType, cardId, otherId) {
            // 如果缓存中是空或者没有这个缓存，就说明没有领卡，就执行领卡接口
            if (yesNoCard == '' || yesNoCard == undefined) {
                    //领取会员卡
                    Data.setAjax('companyCard', {
                        'card_id': cardId,   // 会员卡id
                        'shop_id': 'ssssssssssss',
                        'cid': Cache.get('getCID')
                    }, '#layer', '#msg', {20: '',200215: ''}, function (respnoseText) {
                        // 如果返回20说明用户已经领过卡了，但是可能用户之前有清除过缓存，所以重新记录缓存
                        if (respnoseText.code == 20) {
                            // 已领卡存入缓存
                            Cache.set(cardId+'yesNoCard', cardId);
                            if (scanType == 4) {
                                // 扫描预结结账二维码处理
                                Util.scanTableCode(cardId, otherId, isWeixin, trade_type, '', '', '', '', 1);
                                // 结账单二维码 
                                /*Click.isLogin(true, 'payorder&card_id='+cardId+'&pay_id='+otherId+'&page=payQuick&type=0&scanType=4');*/
                            } else if (scanType == 5) {
                                // 快捷支付订单二维码   order_id
                                Page.open('payorder&card_id='+cardId+'&order_id='+otherId+'&page=payQuick&type=0&scanType=5');
                            }
                        }
                        // 如果返回200215说明用户没有领过卡，这次就领卡了，提示领取会员卡成功，并记录缓存
                        if (respnoseText.code == 200215) {
                            Message.show('#msg', '领取会员卡成功', 3000, function () {
                                if (scanType == 4) {
                                    // 扫描预结结账二维码处理
                                    Util.scanTableCode(cardId, otherId, isWeixin, trade_type, '', '', '', '', 1);
                                    // 结账单二维码 
                                    //Click.isLogin(true, 'payorder&card_id='+cardId+'&pay_id='+otherId+'&page=payQuick&type=0&scanType=4');
                                } else if (scanType == 5) {
                                    // 快捷支付订单二维码   order_id
                                    Page.open('payorder&card_id='+cardId+'&order_id='+otherId+'&page=payQuick&type=0&scanType=5');
                                }
                            });
                            // 已领卡存入缓存
                            Cache.set(cardId+'yesNoCard', cardId);
                        }
                        
                    }, 2);
            } else {
                    if (scanType == 4) {
                        // 扫描预结结账二维码处理
                        Util.scanTableCode(cardId, otherId, isWeixin, trade_type, '', '', '', '', 1);
                        /*// 结账单二维码 
                        Click.isLogin(true, 'payorder&card_id='+cardId+'&pay_id='+otherId+'&page=payQuick&type=0&scanType=4');*/
                    } else if (scanType == 5) {
                        // 快捷支付订单二维码   order_id
                        Page.open('payorder&card_id='+cardId+'&order_id='+otherId+'&page=payQuick&type=0&scanType=5');
                    }
            }
        }
    };

    PayQuick.prototype.bindPageEvents = function () {

        
        var self = this;
        // 微信打开
        if (Util.isWeixin()) {
            // 如果缓冲中没有cid，就调用方法请求接口获取cid
            if (!Cache.get('getCID')) {
                Data.setAjax('userCid', '', '#layer', '#msg', {20: ''}, function (respnoseText) {
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
    };

    return PayQuick;
});