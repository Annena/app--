define('page/enjoymember', [
    'base/page',
    'base/scrollbar',
    'base/cache',
    'base/data',
    'base/mobile',
    'base/util',
    'base/dialog',
    'base/message'
], function (Page, Bar, Cache, Data, Mobile, Util, Dialog, Message){

    
    var enjoymember = function () {
        this.back = '';
    };

    // 如何享受会员价页面
    enjoymember.prototype = new Page('enjoymember');

    enjoymember.prototype.util = function () {

        // 获取到URL里面page的值，那是上一个页面的名称，之后赋值给返回，即可返回到上一页面
        var page = Util.getQueryString('page');
        var cardId = Util.getQueryString('card_id');
        var member_price_used = Cache.get('member_price_used');// 会员价使用条件

        this.back = Cache.get('storage_member_ress');

        $('title').text('如何享受会员价');

        var member_used = ',';
        for (var i in member_price_used) {
            if (member_price_used[i] == 1) {
                member_used += '1';
            } else if (member_price_used[i] == 2) {
                member_used += ',2';
            } else if (member_price_used[i] == 3) {
                member_used += ',3';
            } else if (member_price_used[i] == 4) {
                member_used += ',4';
            }
        }

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        var trade_type = Util.isWhat();

        var is_jsapi = false;

        var is_second = 0;// 三秒请求都没有就报错

        var scanCodeType = Util.getQueryString('type'),// 扫描二维码传过来的
            scanType = Util.getQueryString('scanType'),// 扫描二维码传过来的 3 就是买储值卡 7 就是推荐在线售储值卡员工
            a_user_id = Util.getQueryString('a_user_id'),// 扫描推荐在线售储值卡员工id
            scanCodeRecordId = Util.getQueryString('record_id'),// 扫描二维码传过来的
            is_type = Util.getQueryString('is_type');   // 支付页面点击储值过来的

        var loginReturn = Cache.get('loginReturn');
        if (is_type == 3) {
            this.back = loginReturn;
        }

        var Stored = {

            scroll: null,

            init: function () {

                this.scroll = Bar('#storedValueScroll');

                // 判断微信访问
                this.weixinVisit();

                if (member_used.indexOf('2') > -1) {
                    $('#stored_member').removeClass('hide');
                    // 显示账户储值信息和储值列表
                    this.getStoredDetails();
                } else {
                    $('#stored_member').addClass('hide');
                }
                if (member_used.indexOf('4') > -1) {
                    $('#authorization_member').removeClass('hide');
                } else {
                    $('#authorization_member').addClass('hide');
                }

                // 存储服务员id，和时间戳
                if (scanCodeType != undefined && scanCodeType == 0 && scanType == 7) {
                    // 获取当前时间戳，并且存储起来
                    var currentTime = Util.dateTotTime(Util.getLocalTime(new Date()));
                    var a_user_time = Cache.get('a_user_time');
                    if (a_user_time == undefined || a_user_time == '') {
                        a_user_time = {};
                    }
                    a_user_time[cardId] = {
                        'a_user_id': a_user_id,
                        'a_us_time': currentTime
                    };
                    Cache.set('a_user_time', a_user_time);
                }

                // 绑定点击事件
                this.bindStoredClick();

                this.scroll.refresh();
            },

            // 显示账户储值信息
            getStoredDetails: function () {
                var self = this;
                // 请求数据之前先清空数据
                /*$('#valuenmoney').text('0.00');
                $('#salemoney').text('0.00');
                $('#balance').text('0.00');
                $('#availableBalance').text('0.00');*/

                Data.setAjax('accountInfo', {
                    'card_id': cardId,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {20: ''}, function (respnoseText) {
                    var data = respnoseText.data;
                    if (respnoseText.code == 20) {
                        is_jsapi = data.is_jsapi;
                        /*if ($.cookie("user_mobile")) {
                            // 把返回的数据（累计储值，累计消费，储值余额,当日可使用余额）显示到页面
                            var storedAmount = parseFloat(data.account_info.stored_amount),
                                storedConsume = parseFloat(data.account_info.stored_consume);
                                availableBalance = parseFloat(data.account_info.hold_money);

                            var total = parseFloat(storedAmount - storedConsume).toFixed(2);
                            total = parseFloat(total) - availableBalance;

                            // 累计储值
                            $('#valuenmoney').text(parseFloat(storedAmount).toFixed(2));
                            // 累计消费
                            $('#salemoney').text(parseFloat(storedConsume).toFixed(2));
                            // 当日可用金额
                            $('#balance').text(parseFloat(total).toFixed(2));
                            // 今日冻结金额
                            $('#availableBalance').text(availableBalance.toFixed(2));
                        }*/
                        // 显示储值卡列表
                        self.storedListDate(data.stored_list, data);
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            },

            // 显示储值卡列表
            storedListDate: function (data, dataMenu) {
                var self = this;

                var content = '';

                for (var i in data) {
                    // 任意金额 或者 售卖方式是仅支持全部门店 或者 售卖方式是仅支持部分门店，不显示
                    if (data[i].is_custom == 1 || data[i].sale_mode == 4 || data[i].sale_mode == 5) {
                        continue;
                    }

                    content += '<li>'+
                                    '<p class="listImg" stored-id="'+data[i].stored_id+'">'+
                                        '<img src="../img/base/storedValuedtczj.png">'+
                                    '</p>'+
                                    '<p class="onep">'+data[i].stored_name+'</p>'+
                                    '<p class="twop">'+
                                        '储<span>'+parseFloat(data[i].stored_money)+'</span>元&nbsp;'+
                                        (data[i].give_money == 0 ? '' :
                                        '<b>赠<i>'+parseFloat(data[i].give_money)+'</i>元</b>')+
                                    '</p>'+
                                    (data[i].give_voucher_id == null || data[i].give_voucher_id == '' ? '' :
                                    '<p class="thrp">赠'+data[i].give_voucher_name+data[i].give_voucher_num+'张</p>')+
                                    '<p class="foup" data-type="buy_now" stored_id="'+data[i].stored_id+'">立即<br>购买</p>'+                                
                                '</li>';
                }

                $('#stored_list').html(content);

                // 储值卡立即购买点击事件
                $('#stored_list').find('li').each(function () {
                    $(this).find('p[data-type="buy_now"]').unbind('tap').bind('tap', function () {
                        var stored_id = $(this).attr('stored_id');
                        if ($.app.isClient == true && dataMenu.is_app == false && dataMenu.is_ali == false) {
                            Message.show('#msg', '该商户不支持微信和支付宝支付，无法购买！', 2000);
                        } else if (isAli && dataMenu.is_ali == false) {
                            Message.show('#msg', '该商户不支持支付宝支付，无法购买！', 2000);
                        } else if (isWeixin && is_jsapi == false) {
                            Message.show('#msg', '该商户不支持微信支付，无法购买！', 2000);
                        } else if ($.app.isClient == false && !isWeixin && !isAli) {
                            Message.show('#msg', '请在手机上购买！', 2000);
                        } else {
                            if (!$.cookie("user_mobile")) {
                                Message.show('#msg', '登录后才能购买！', 2000, function () {
                                    Cache.set('loginReturn', location.href.split('?')[1]);
                                    Page.open('login');
                                });
                            } else {
                                if ($.app.isClient == true) {
                                    $.dialog = Dialog({
                                        type: 3,
                                        close: false,
                                        dom: '#aliORwechatPay',
                                        success: function() {
                                            if (dataMenu.is_app == false || dataMenu.is_ali == false) {
                                                $('#aliORwechatPay').addClass('force-height');
                                            } else {
                                                $('#aliORwechatPay').removeClass('force-height');
                                            }
                                            if (dataMenu.is_app == false) {
                                                $('#wechatpayDisp').addClass('hide');
                                            } else {
                                                $('#wechatpayDisp').removeClass('hide');
                                                $('#wechatpay').attr('stored_id',stored_id);
                                                $('#wechatpay').unbind('click').bind('click',function(){
                                                    self.paybefore(stored_id, 1);
                                                });
                                            }
                                            if (dataMenu.is_ali == false) {
                                                $('#alipayDisp').addClass('hide');
                                            } else {
                                                $('#alipayDisp').removeClass('hide');
                                                $('#alipay').attr('stored_id',stored_id);
                                                $('#alipay').unbind('click').bind('click',function(){
                                                    self.paybefore(stored_id, 2);
                                                });
                                            }
                                        }
                                    });
                                } else if (isWeixin) {
                                    self.paybefore(stored_id, 1);
                                } else if (isAli) {
                                    self.paybefore(stored_id, 2);
                                }
                            }
                        }
                    });
                });
                this.scroll.refresh();
            },
            paybefore:function(stored_id,type){
                $('#layer').addClass('hide');
                $('#layer').removeClass('hide');
                Message.show('#layer', '<img src="../img/base/loadingnew.gif"><br>正在加载</div>', false);
                var self = this;
                if(type == 1){
                    stored_pay_type = 'wxpay';
                }else if(type == 2){
                    stored_pay_type = 'alipay';
                }
                // 得到服务员id的存储时间，判断是否在两小时内（两小时有效），在两小时内就提交该服务员id
                // 当前时间的时间戳
                var currentTime = Util.dateTotTime(Util.getLocalTime(new Date()));
                var two_hours = 7200;// 两小时就是 7200 秒
                var a_user_time = Cache.get('a_user_time');
                if (a_user_time != undefined && a_user_time[cardId] != undefined) {
                    var b_time = a_user_time[cardId].a_us_time + two_hours;
                    if (b_time > currentTime) {
                        a_user_id = a_user_time[cardId].a_user_id;
                    } else {
                        a_user_id = '';
                    }
                } else {
                    a_user_id = '';
                }

                if (is_second == 3) {
                    $('#layer').addClass('hide');
                    Message.show('#msg', '获取openid失败', 2000);
                    return;
                }
                var openid = Cache.get('openid');
                if ((openid == undefined || openid['openid'] == '') && isWeixin && $.cookie("user_mobile")) {
                    setTimeout(function () {
                        is_second = is_second+1;
                        self.paybefore(stored_id, type);// 重新获取
                    }, 1000);
                } /*else if (openid != undefined && (openid['openid'] == 'NO' || openid['openid'] == 'ERROR') && isWeixin && $.cookie("user_mobile")) {
                    if (Util.getQueryString('e_type') == 1) {
                        $('#layer').addClass('hide');
                        Message.show('#msg', '获取openid失败', 2000);
                        return;
                    } else {
                        if (openid['openid'] == 'NO' || openid['openid'] == 'ERROR') {
                            Cache.del('openid');
                        } else {
                            Cache.del('openid_'+card_id);
                        }
                        Util.openid_structure(1);// openid构造方法
                        this.paybefore(stored_id, type);// 重新获取
                    }
                }*/ else {
                    $('#layer').addClass('hide');
                    // 请求接口
                    Data.setAjax('accountStored', {
                        'card_id': cardId,
                        'cid': Cache.get('getCID'),
                        'stored_id': stored_id,
                        'a_user_id': a_user_id,// 推荐售卖服务员ID
                        'trade_type': trade_type,
                        'openid': (openid == undefined ? '' : openid['openid']),
                        'stored_pay_type':stored_pay_type
                    }, '#layer', '#msg', {20: ''}, function (respnoseText) {
                        var data = respnoseText.data;
                        if (respnoseText.code == 20) {
                            if(type == 1){
                                // 请求微信支付跳转
                                self.wxpayOrder(data);
                            }else if(type == 2){
                                // 请求微信支付跳转
                                self.alipayOrder(data);
                            }
                        } else {
                            Message.show('#msg', respnoseText.message, 2000);
                        }
                    }, 2);
                }            
            },
            alipayOrder: function(alipaydata){
                // $('#biz_content').val(alipaydata.biz_content)
                // $('#app_id').val(alipaydata.app_id)
                // $('#method').val(alipaydata.method)
                // $('#version').val(alipaydata.version)
                // $('#format').val(alipaydata.format)
                // $('#sign_type').val(alipaydata.sign_type)
                // $('#timestamp').val(alipaydata.timestamp)
                // $('#alipay_sdk').val(alipaydata.alipay_sdk)
                // $('#notify_url').val(alipaydata.notify_url)
                // $('#return_url').val(alipaydata.return_url)
                // $('#charset').val(alipaydata.charset)
                // $('#sign').val(alipaydata.timestamp)
                // $('#alipaysubmit').attr('action','')
                $('#alipayDiv').html(alipaydata)
                $('#alipaysubmit').submit()
            },
            // 微信支付跳转
            wxpayOrder: function (weixinPaydata) {
                if (isWeixin) {
                    function onBridgeReady(){
                        //alert(JSON.stringify(weixinPaydata));
                        WeixinJSBridge.invoke(
                            'getBrandWCPayRequest', {
                                "appId":weixinPaydata.appId,     //公众号名称，由商户传入
                                "timeStamp":weixinPaydata.timeStamp,         //时间戳，自1970年以来的秒数
                                "nonceStr" : weixinPaydata.nonceStr, //随机串
                                "package" : weixinPaydata.package,
                                "signType" : weixinPaydata.signType,       //微信签名方式：
                                "paySign" : weixinPaydata.paySign//微信签名
                            },
                            function(res){
                                //WeixinJSBridge.log(res.err_msg);
                                //alert(res.err_code+res.err_desc+res.err_msg);

                                //alert(res.err_msg);
                                //alert(JSON.stringify(res));
                                
                                // 延时10毫秒在运行，避免出现微信返回没有到这里无反应
                                setTimeout(function () {
                                    if(res.err_msg == "get_brand_wcpay_request:ok" ) {
                                        //window.location.reload();
                                        var data = {
                                            'cid': Cache.get('getCID'),
                                            'card_id': cardId,
                                            //'order_id': weixinPaydata.order_id,
                                            'prepayid': weixinPaydata.package.split('=')[1],
                                            'noncestr': weixinPaydata.nonceStr,
                                            'timestamp': weixinPaydata.timeStamp,
                                            'sign': weixinPaydata.paySign
                                        };

                                        Data.setCallback(wxConfig+'wxpay/callback_stored_jsapi.php', data, '#layer', '#msg', {20: ''}, function(respnoseText) {
                                            if (is_type == 3) {
                                                Page.open(loginReturn);
                                            } else {
                                                window.location.reload();
                                            }
                                        }, 1);
                                    } else {
                                        window.location.reload();
                                    }
                                }, 10);
                            }
                        );
                    }
                    if (typeof WeixinJSBridge == "undefined"){
                        if( document.addEventListener ){
                            document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
                        }else if (document.attachEvent){
                            document.attachEvent('WeixinJSBridgeReady', onBridgeReady); 
                            document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
                        }
                    }else{
                        onBridgeReady();
                    }
                } else {
                    // 请求客户端跳转微信并传过去数据
                    Mobile.weixinPay(weixinPaydata.appid, weixinPaydata.partnerid,weixinPaydata.prepayid, weixinPaydata.package, weixinPaydata.noncestr, weixinPaydata.timestamp, weixinPaydata.sign, function(result) {
                        //微信回调值（0：成功，-1：错误，-2：取消）
                        if (result == '0') {//orderData.callback_url
                            //alert(555)
                            var data = {
                                'cid': Cache.get('getCID'),
                                'card_id': cardId,
                                //'order_id': weixinPaydata.order_id,
                                'prepayid': weixinPaydata.prepayid,
                                'noncestr': weixinPaydata.noncestr,
                                'timestamp': weixinPaydata.timestamp,
                                'sign': weixinPaydata.sign
                            };
                            Data.setCallback(wxConfig+'wxpay/callback_stored.php', data, '#layer', '#msg', {20: ''}, function(respnoseText) {
                                if (is_type == 3) {
                                    Page.open(loginReturn);
                                } else {
                                    window.location.reload();
                                }
                            }, 1);
                        } else if (result == '-1' || result == '-2') {
                            window.location.reload();
                        }
                    });
                }
            },

            // 绑定点击事件
            bindStoredClick: function () {
                var self = this;

                // 点击二维码进行储值
                $('#scanningBtn').unbind('click').bind('click', function () {
                    if ($.app.isClient == false && !isWeixin && !isAli) {
                        Message.show('#msg', '请在手机上扫描！', 2000);
                    } else {
                        if (!$.cookie("user_mobile")) {
                            Message.show('#msg', '登录后才能扫描！', 2000);
                        } else {
                            self.scanningDate();
                        }
                    }
                });

                // 点击输入框X号清除内容点击事件
                $('#inputDel').unbind('click').bind('click', function () {
                    $('#changeInput').val('');
                });
            },

            // 扫描二维码储值
            scanningDate: function () {
                var _self = this;
                // 不是微信就请求客户端
                if (!isWeixin && !isAli) {
                    Mobile.scanner('将二维码放入框内，即可账户充值', 1, function(result) {
                        // 扫描得到的二维码处理
                        _self.qrcodeHandle(result);
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
                } else {
                    wx.scanQRCode({
                      needResult: 1,// 默认为0，扫描结果由微信处理，1则直接返回扫描结果
                      //scanType:["qrCode","barCode"],// 可以指定扫二维码还是一维码，默认二者都有
                      //desc: 'scanQRCode desc',// 二维码描述
                      success: function (res) {
                        //Message.show('#msg', JSON.stringify(res), 3000);
                        var result = res.resultStr;
                        // 扫描得到的二维码处理
                        _self.qrcodeHandle(result);
                      }
                    });
                }
            },

            // 扫描得到的二维码处理
            qrcodeHandle: function (result) {
                // 将返回的二十一位存到缓存中，如果未登录的情况下进行了扫描，就可以在登录后把二十一位从缓存中取出来再进行该做的事情
                var scanCode = Util.analysisScanning(result);

                if (scanCode == false) {
                    Message.show('#msg', '二维码有误', 3000);
                    return;
                }
                var scanType = scanCode.scanType,   // 二维码类型
                    cardIdPay = scanCode.cardId,        // 商户id
                    otherId = scanCode.otherId;     // 根据二维码类型对应的其他id
                // 跳转的连接里面type=0代表是扫描，scanType=2代表的是扫描类型
                if (scanType == 3) {
                    // 储值二维码   record_id 跳转储值页面  
                    scanCodeType = 0;
                    scanCodeRecordId = otherId;
                    Stored.recharge(otherId);
                } else if (scanType == 7) {
                    window.location.href=phpJump+'html/index.html?storedValue&card_id='+cardIdPay+'&a_user_id='+otherId+'&page=merchantHome&type=0&scanType=7';
                } else {
                    Message.show('#msg', '二维码有误', 3000);
                    return;
                }
            },

            // 判断微信访问
            weixinVisit: function () {
                var self = this;
                if (isWeixin || isAli) {
                    $('#download').removeClass('hide');
                    $('header').addClass('hide');
                    //document.getElementById('storedvalue-header').style.cssText = 'top:45px !important';

                    $('#storedvalue-header').addClass('top35');
                    $('#storedValueScroll').addClass('top84');
                 
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
                                self.wxContent(datat);
                            }, 500);
                        } else {
                            Message.show('#msg', respnoseText.message, 2000);
                        }
                    }, 2);
                } else {
                    $('#download').addClass('hide');
                    $('header').removeClass('hide');
                }
            },

            // 微信分享内容设置
            wxContent: function (data) {
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
            },

            // 储值
            recharge: function (data) {
                var self = this;
                Data.setAjax('accountRecharge', {
                    'card_id': cardId,  // 会员卡id
                    'record_id': data, // 储值码
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {20: ''}, function(respnoseText) {
                    //alert(respnoseText.code);
                    if (respnoseText.code == 20) {
                        $.dialog = Dialog({
                            type: 1,
                            btn: ['确定'],
                            content: '储值成功！金额已存入您的账户！</p>',
                            closeFn: function() {//确定
                                $.dialog.close($.dialog.id);
                                if (is_type == 3) {
                                    Page.open(loginReturn);
                                } else {
                                    Stored.getStoredDetails();
                                }
                            }
                        });
                    } else {
                        Message.show('#msg', respnoseText.message, 2000, function () {
                            // 报错也重新请求接口，显示账户储值信息
                            self.getStoredDetails();
                        });
                    }
                    //$('#input-purchase').val('');
                    
                }, 2);
            }

        };

        Stored.init();
    };

    enjoymember.prototype.bindPageEvents = function () {
        var self = this;
        // 微信打开
        if (Util.isWeixin() || Util.isAlipay()) {
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

    return enjoymember;
});