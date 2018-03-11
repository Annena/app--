define('page/payorder', [
    'base/page',
    'base/dialog',
    'base/message',
    'base/cache',
    'base/data',
    'base/pattern',
    'base/config',
    'base/mobile',
    'base/cacheUpdate',
    'base/util',
    'base/scrollbar',
    'common/editOrder',
    'base/pattern'
], function(Page, Dialog, Message, Cache, Data, Pattern, Config, Mobile, Update, Util, Bar, Edit, Pattern) {

    var card_id,
        shop_id,
        shop_name,
        table_id,
        table_name,
        page;
    var order_property = Util.getQueryString('order_property');

    var PayOrder = function() {
        this.back = 'dishes&card_id=' + card_id + '&shop_id=' + shop_id + '&shop_name=' + shop_name;
    }
    // 支付页面
    PayOrder.prototype = new Page('payorder');

    PayOrder.prototype.util = function() {
        // 获取到点菜页传过来的数据
        var disOrder = Cache.get('disOrder');
        var selfThis = this;
        var paystored = Util.getQueryString('paystored');
        var pay_id = Util.getQueryString('pay_id');
        page = Util.getQueryString('page');
        card_id = Util.getQueryString('card_id');
        table_id = Util.getQueryString('table_id');
        table_name = decodeURIComponent(Util.getQueryString('table_name'));
        if (disOrder == null || disOrder == undefined || disOrder == '') {
            shop_name = Util.getQueryString('shop_name');
            shop_id = Util.getQueryString('shop_id');
        } else {
            shop_name = disOrder.shop_name;
            shop_id = disOrder.shop_id;
        }
        //支付宝返回，如果card_id == '' 则返回到APP首页
        if (card_id == '' && paystored != undefined) {
            window.location = phpJump + 'html/index.html';
        }
        $('title').text('订单支付');

        if (pay_id == '' && paystored != undefined) {
            window.location = phpJump + 'html/index.html?orderlist&card_id=' + card_id + '&page=merchantHome&order_list_type=1';
        }
        var scanCodeType = Util.getQueryString('type'),         // 扫描二维码传过来的
            scanCodePayId = Util.getQueryString('pay_id'),      // 扫描结账单二维码传过来的
            scanCodeOrderId = Util.getQueryString('order_id'),  // 扫描快捷支付订单二维码传过来的
            scanType = Util.getQueryString('scanType'),         // 扫描二维码的类型
            is_scan = Util.getQueryString('is_scan'),           // 判断是1就是已经有用户属性第二次扫描过来的之间请求pay接口

            scan_bidn = Util.getQueryString('scan_bidn');       // scan_bidn==1加菜请求过来需要先绑定

        var is_add_a_dish = 0; // 是否加菜过来的，只用来区分点击会员登陆之后的判断使用

        scanCodePayId = scanCodePayId == 'undefined' ? '' : scanCodePayId;

        var is_comm = Util.getQueryString('is_comm'); // is_comm = 1 需要跳到发表点评位置
        var paystored = Util.getQueryString('paystored');

        var order_list_type = page == 'orderlist' ? '&order_list_type=1' : '';

        this.back = page + '&card_id=' + card_id + '&shop_id=' + shop_id + '&shop_name=' + shop_name + order_list_type;

        //order_step  订单状态：1下单  3确认出单 9已结账 0门店取消订单

        var vouchersPrice = 0,          // 抵用劵金额
            canuseVouchePrice = 0,      // 是否选择了使用抵用劵（抵用劵金额）
            recordId = '',              // 抵用劵id
            canuseRecordId = 0,         // 是否选择了使用抵用劵（抵用劵id）
            leMoney = 0,                // 乐币余额+其它商户乐币余额
            leAmount = 0,               // 乐币金额
            lepay = 0,                  // 乐币需要支付的金额
            wxpay = 0,                  // 微信支付金额
            alipay = 0,                 // 支付宝支付金额
            cashier = 0,                // 银台支付金额
            discountSrice = 100,        // 折扣额度
            totalPurchase = 0,          // 用来计算的消费金额
            dishesConsume = 0,          // 消费金额
            cons_money = 0,             // 使用的消费金额
            memberPrice = 0,            // 会员价
            calculationPrice = 0,       // 用来计算是消费金额还是会员价
            distinguishCount = 0,       // 区分用是消费金额还是会员价 0：消费金额，1：会员价
            nDiscountMoney = 0,         // 不参与打折的消费金额
            totalConsumption = 0,       // 应付金额（乐币+抵用劵） = 消费金额 - 优惠金额
            trueTotalConsumption = 0,   // 实付金额（折后金额）（会员卡折扣） = 消费金额 - 优惠金额
            preferentialPrice = 0,      // 优惠金额
            this_le = 0,                //本商户乐币余额
            clickWhat = '',
            payorderInfo = {},          // 存储所有数据
            change_tableInfo = {},      // 可改变内容的存储所有数据
            conflict_pay_info = {},     // 存储冲突用的支付信息
            ch_menu_money_info = {},    // 存储计算处理的优惠金额数组

            promoId = '',               // 优惠方案id
            canusePromoId = 0,          // 优惠方案弹出层选中的id
            discountAmount = 100,       // 折扣优惠方案额度
            discountMoney = 0,          // 优惠方案可折扣金额
            discount_sub_money = 0,     // 优惠方案优惠金额
            dishesPromo = {},           // 所有优惠方案存储
            isUsePromo = true,          // 是否可以优惠方案支付(是否有优惠方案)
            isPromo = true,             // 是否选择了优惠方案
            dishesArray = {},           // 存储所有菜品的数组

            orderData = '',             // 订单数据（有用处就用，没有用处就不用）
            scroll = null,              // 页面滚动条 Bar('#payorderScroll')
            voucherScroll = Bar('#voucherListScroll'), // 选择抵用劵滚动

            discountScroll = null,// 选择优惠方案滚动

            is_click_button = 0;        // 是否可以点击下单按钮 0 不可以 1 可以

            isHasPay = false,           // 是否支付过（部分支付）

            is_input_wx = false,        // 如果输入微信金额则不隐藏微信
            is_input_ali = false,       // 如果输入支付宝金额则不隐藏支付宝
            isUseLe = true,             // 是否可以使用乐币支付
            isLecoin = true,            // 是否选择了使用乐币
            isUseVoucher = true,        // 是否可以使用抵用劵支付
            isVoucher = true,           // 是否选择了使用抵用劵
            isUseDiscount = true,       // 是否可以使用折扣支付
            is_member_price = 0,        // 是否可以使用会员价 0 否 1 是
            isDiscount = true,          // 是否选择了折扣
            isMember = true,            // 是否选择了会员价
            is_wxpay = true,            // 是否支持微信支付
            isWxpay = false,            // 是否选择了微信
            is_alipay = true,           // 是否支持支付宝
            isAlipay = false,           // 是否选择支付宝
            is_add_dis = false,         // 是否显示添加菜品

            yesNoWxPay = true,          // 微信中是否无乐币、无抵用劵默认使用微信支付
            yesNoAliPay = true,         // 微信中是否无乐币、无抵用劵默认使用微信支付

            is_load = 0,                // 是否第一次加载(刷新也算)0 否 1 是
            storage_one = {},           // 存储缓存应对只弹出一次一种类型冲突(初始化)

            isNoDis = false,            // 是否折扣不可取消 true:不可取消，false:可取消
            isNoPro = false,            // 是否优惠方案不可取消 true:不可取消，false:可取消
            isNoMem = false,            // 是否会员价不可取消 true:不可取消，false:可取消
            isNoWx = false,             // 是否微信不可取消 true:不可取消，false:可取消
            isNoali = false,            // 是否支付宝不可取消 true:不可取消，false:可取消

            sumMenuNum = 0,             // 菜品个数，不是份数
            dishesMenu = '';            // 菜品数据
        var clickNum = 0;               // 第几次请求计算数据
        var is_co = 0;                  // 是否跳到点评 0 否 1 是

        // 获取是从点餐、外卖、自提、商城过来的吗
        // 订单属性： order_property 堂食1 外卖2 打包3 商城配送4
        var order_property = Util.getQueryString('order_property');
        if (order_property == undefined) {
            order_property = Cache.get('order_property_temporary');
        } else {
            Cache.set('order_property_temporary', order_property);
        }

        var user_addr = Cache.get('user_addr'),     // 地址(登录状态)
            mod_data = Cache.get('mod_data'),       //地址(未登录状态)
            is_first_single = 0,                    // 是否是首单 0 否 1 是
            is_pay_app = 0,                         // is_pay_app 1是 0否  在线下单是否要求全额支付
            is_invoice = 0,                         // 发票抬头（ is_invoice 1是 0否  是否支持填写发票信息）
            is_chopsticks = 0,                      // 自备餐包的显示 is_chopsticks 1是 0否
            is_chopsticks_t = 0,                    // 是否选择了自备餐包
            no_user_num = 0,                        // 未确认的就餐人数
            user_num = 0,                           // 就餐人数
            // 缓存从这里点击加菜追单到点菜页面，需要的是否必点条件商品，必点锅底，必点小料
            is_bottom_pot = 0,                      // 是否有必点锅底
            is_small_material = 0,                  // 是否有必点小料
            is_cond_commodity = 0,                  // 是否有必点条件商品
            user_num_t = Cache.get('user_num_t'),   // 点菜页面传过来的人数
            meal_package = Cache.get('meal_package'),// 堂食、外卖餐包缓存
            is_meal_package = 0,                    // 餐包是否存在 0 不存在 1 存在
            dinner_time = 0,                        // 就餐时间，没有的时候提0有就转换成10位时间戳提交(只有外卖自提有，其他没有)
            dinner_time_type = 1,                   // 就餐时间类型：1只支持时间 2支持日期时间
            dinner_time_offset = 0,                 // 就餐时间偏移量：当前时间延迟多少分钟
            minimum_takeout = 0,                    // 外卖送餐起送金额
            minimum_pack = 0,                       // 门店自取起定金额
            minimum_store = 0,                      // 商城配送起定金额
            open_time = 0,                          // 门店营业开始时间
            close_time = 0;                         // 门店营业结束时间

        var is_number_of = 1;                       // 就餐人数是否可点击 0否 1 是
        var is_click_btn = 1;                       // 就餐时间、地址是否可点击 0否 1 是
        var page_member_price = 0;                  // 页面显示的会员价可优惠金额
        var is_landed = 0;                          // 是否已登录，根据接口是否返回用户信息判断



        // 获取到是否领卡的缓存，在点击选好了的时候判断是否领卡，如果没有领卡就请求领卡接口，提示领卡成功。
        var yesNoCard = Cache.get(card_id + 'yesNoCard');

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli = Util.isAlipay();

        var is_second = 0;// 三秒请求都没有就报错

        var mySwiper = $('.swiper-container').swiper({
            mode: 'horizontal',
            pagination: '.swiper-pagination',
            observer: true, //修改swiper自己或子元素时，自动初始化swiper
            observeParents: true, //修改swiper的父元素时，自动初始化swiper
        });
        var is_comment = 0; // 是否显示点评 0否 1是
        // 发表点评用的变量
        var imgData = {},
            imgDatatwo = {},
            index = 0,
            max = 9,
            imageLength = 0,
            bodyWidth = $('body').width(),
            bpdyHeight = $('body').height(),
            liWidth = Math.floor((bodyWidth - 30 - 12 - 8) / 4);

        var imgDateList = {}; // 图片数据存储
        var imgDateNUm = 0; // 图片数据key

        //图片方向角 added by lzk
        var Orientation = null;

        // shop_type_info 0 桌台模式  1叫号 2台卡
        var shop_type_info = 1;
        // 说明是扫描桌台二维码到点餐页面然后到这个支付页面的 或者 是扫描预结结账单过来的
        if (scanCodeType == 0 && (scanType == 2 || scanType == 4)) {
            shop_type_info = 1;
            Cache.set('shop_type_info', shop_type_info);
        } else {
            shop_type_info = Cache.get('shop_type_info');
        }

        var trade_type = Util.isWhat();
        //var trade_type = 'ALI'

        var pay = {

            init: function() {
                var self = this;
                // 判断微信访问
                this.weixinVisit();
                Cache.del('payorder-addr');
                var timer, windowInnerHeight;

                function eventCheck(e) {
                    if (e) { //blur,focus事件触发的
                        if (e.type == 'click') { //如果是点击事件启动计时器监控是否点击了键盘上的隐藏键盘按钮，没有点击这个按钮的事件可用，keydown中也获取不到keyCode值
                            setTimeout(function() { //由于键盘弹出是有动画效果的，要获取完全弹出的窗口高度，使用了计时器
                                windowInnerHeight = window.innerHeight; //获取弹出android软键盘后的窗口高度
                                timer = setInterval(function() { eventCheck() }, 100);
                            }, 500);
                        } else {
                            clearInterval(timer);
                        }
                    } else { //计时器执行的，需要判断窗口可视高度，如果改变说明android键盘隐藏了
                        if (window.innerHeight > windowInnerHeight) {
                            clearInterval(timer);

                            //alert('android键盘隐藏--通过点击键盘隐藏按钮');
                            setTimeout(function() {
                                //alert($('#payorderScroll').offset().bottom);
                                //$('#payorderScroll').css('bottom','0px !important');
                                //scroll.disable();
                                //scroll = Bar('#payorderScroll');
                                if ($.app.isAndroid) {
                                    var height = 0;
                                    var storein = $('#payorderScroll').offset().top;

                                    if (storein < 0) {
                                        height = -storein + 85;
                                    } else if (storein == 0 || storein < 85) {
                                        height = 85;
                                    }
                                    //alert(storein+'--'+height)
                                    //$('#order_info').height(height);
                                }

                                //$('#payorderScroll').css('top','200px !important');


                                //scroll.scrollToElement($('[data-id="scroller"]')[0], 100);
                                //scroll.minScrollY = 0;
                                //alert($('#payorderScroll').height()+'---');
                                //scroll.scrollTo(0,0,100);
                                //scroll.scrollTo(0, -$('#payorderScroll').height(), 100, true);
                                //scroll = Bar('#payorderScroll')[0];
                                //scroll.scrollToElement($('#payorderScroll')[0], 100);
                                scroll.refresh();
                            }, 500);
                        }
                    }
                }

                if (paystored == 1) {
                    Message.show('#msg', '支付成功', 2000);
                } else if (paystored == 2) {
                    Message.show('#msg', '支付失败，请重新尝试', 2000);
                }

                $('#wxpay').click(eventCheck).blur(eventCheck);

                discountScroll = new iScroll($('#discountListScroll')[0], {
                    scrollbarClass: 'myScrollbar',
                    bounce: false,
                    hideScrollbar: true,
                    vScrollbar: true,
                    onBeforeScrollStart: function(e) {
                        var target = e.target;
                        while (target.nodeType != 1) target = target.parentNode;
                        if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA')
                        //禁止滚动
                            e.preventDefault();
                    },
                    onRefresh: function() {

                    }
                });

                // 菜品信息、订单点评、发表点评的滑动处理
                this.dishe_commen_scroll();

                //scroll.scrollTo(0, 200, 100, true);
                //alert(location.href);

                // 领取会员卡
                this.membershipCard();
                // 判断并调用相应方法
                //this.orderJudge();

                // 绑定页面事件
                this.bindEvents();


                // 滚动
                scroll.refresh();
                voucherScroll.refresh();
                discountScroll.refresh();
            },

            // 判断微信访问
            weixinVisit: function() {
                var self = this;
                if (isWeixin || isAli) {
                    $('#download').removeClass('hide');
                    $('header').addClass('hide');
                    /*document.getElementById('payorderScroll').style.cssText = 'top:94px !important';
                    document.getElementById('payorder-header').style.cssText = 'top:45px !important';*/

                    $('#payorder-header').addClass('top35');
                    $('#payorderScroll').addClass('top35');
                    $('.selcet-vouchers-nav').addClass('top45');
                    $('#download').unbind('click').bind('click', function() {
                        window.location = phpDownload;
                    });
                    // 得到签名数据
                    Data.setAjax('companyShare', {
                        'card_id': card_id,
                        'url': location.href,
                        'cid': Cache.get('getCID')
                    }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                        if (respnoseText.code == 20) {
                            var datat = respnoseText.data;
                            setTimeout(function() {
                                self.wxContent(datat);
                            }, 500);
                        } else {
                            Message.show('#msg', respnoseText.message, 2000);
                        }
                    }, 2);
                } else {
                    $('header').removeClass('hide');
                    $('#download').addClass('hide');
                }
            },

            // 微信分享内容设置
            wxContent: function(data) {
                var _self = this;
                // 微信引入JS文件，通过config接口注入权限验证配置
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
                    wx.checkJsApi({
                        jsApiList: [
                            'getNetworkType',
                            'previewImage'
                        ],
                        success: function(res) {
                            //alert(JSON.stringify(res)+'------------------');
                        }
                    });
                });
                wx.error(function(res) { // 通过error接口处理失败验证
                    //alert(res.errMsg+"??????????");
                });
            },

            // 菜品信息、订单点评、发表点评的滑动处理
            dishe_commen_scroll: function() {
                //this.scroll = Bar('#detailsScroll');
                var total_height = $(window).height(); // 屏幕高度
                scroll = new iScroll($('#payorderScroll')[0], {
                    scrollbarClass: 'myScrollbar',
                    bounce: false,
                    hideScrollbar: true,
                    vScrollbar: false,
                    onBeforeScrollStart: function(e) {
                        var target = e.target;
                        while (target.nodeType != 1) target = target.parentNode;
                        if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA')
                        //禁止滚动
                            e.preventDefault();
                    },
                    onScrollMove: function() {
                        var jump_top = $('#menuDispaly').offset().top; // 跳转的位置距离顶部高度
                        var orderInfoListH = $('#orderInfoList').offset().top;
                        var menuListH = $('#menuList').offset().top;
                        var commentscontentH = $('#comments-content').offset().top;
                        // 有点评内容的时候才切换，否则就是默认选中菜品信息
                        if (is_comment == 1) {
                            var order_d = 100;
                            if (isWeixin) {
                                order_d = 130;
                            }
                            if (commentscontentH <= 172) {
                                $('#headerMeng').removeClass('hide')
                                $('.comments-content').addClass('current').parent('span').siblings().children('i').removeClass('current');
                            } else if (orderInfoListH <= order_d) {
                                $('#headerMeng').removeClass('hide')
                                $('.orderInfoList').addClass('current').parent('span').siblings().children('i').removeClass('current');
                            } else if (jump_top <= 8) {
                                $('#headerMeng').removeClass('hide')
                                $('.menuList').addClass('current').parent('span').siblings().children('i').removeClass('current');
                            } else {
                                $('#headerMeng').addClass('hide')
                            }
                        }
                        $('#quickNone li p span input').blur()

                    },
                    onScrollEnd: function() {
                        var jump_top = $('#menuDispaly').offset().top; // 跳转的位置距离顶部高度
                        var orderInfoListH = $('#orderInfoList').offset().top;
                        var menuListH = $('#menuList').offset().top;
                        var commentscontentH = $('#comments-content').offset().top;
                        // 有点评内容的时候才切换，否则就是默认选中菜品信息
                        if (is_comment == 1) {
                            var order_d = 100;
                            if (isWeixin) {
                                order_d = 130;
                            }
                            if (commentscontentH <= 172) {
                                $('#headerMeng').removeClass('hide')
                                $('.comments-content').addClass('current').parent('span').siblings().children('i').removeClass('current');
                            } else if (orderInfoListH <= order_d) {
                                $('#headerMeng').removeClass('hide')
                                $('.orderInfoList').addClass('current').parent('span').siblings().children('i').removeClass('current');
                            } else if (jump_top <= 8) {
                                $('#headerMeng').removeClass('hide')
                                $('.menuList').addClass('current').parent('span').siblings().children('i').removeClass('current');
                            } else {
                                $('#headerMeng').addClass('hide')
                            }
                        }
                        $('#quickNone li p span input').blur()
                    },
                    onRefresh: function() {

                    }
                });
            },

            // 领取会员卡
            membershipCard: function() {
                //alert(yesNoCard);
                var self = this;
                // (如果缓存中是空或者没有这个缓存）并且 已登陆，就说明没有领卡，就执行领卡接口
                if ((yesNoCard == '' || yesNoCard == undefined) && $.cookie("user_mobile")) {
                    //alert('88888');
                    //领取会员卡
                    Data.setAjax('companyCard', {
                        'card_id': card_id, // 会员卡id
                        'shop_id': 'ssssssssssss',
                        'cid': Cache.get('getCID')
                    }, '#layer', '#msg', { 20: '', 200215: '' }, function(respnoseText) {
                        // 如果返回20说明用户已经领过卡了，但是可能用户之前有清除过缓存，所以重新记录缓存
                        if (respnoseText.code == 20) {
                            // 已领卡存入缓存
                            Cache.set(card_id + 'yesNoCard', card_id);
                        }
                        // 如果返回200215说明用户没有领过卡，这次就领卡了，提示领取会员卡成功，并记录缓存
                        if (respnoseText.code == 200215) {
                            Message.show('#msg', '领取会员卡成功', 2000);
                            // 已领卡存入缓存
                            Cache.set(card_id + 'yesNoCard', card_id);
                        }
                        if (respnoseText.code == 20 || respnoseText.code == 200215) {
                            // 判断并调用相应方法
                            self.orderJudge();
                        } else {
                            Message.show('#msg', respnoseText.message, 2000);
                        }
                    }, 2);
                } else {
                    //alert('99999');
                    // 判断并调用相应方法
                    self.orderJudge();
                }
            },

            // 判断并调用相应方法
            orderJudge: function() {
                // 判断是扫描过来的，并且是扫描的结账单二维码
                if ((scanCodeType == 0 && scanType == 4) || paystored != undefined) {
                    distinguishCount = 1;
                    // 隐藏备注
                    $('#noteDisplay').addClass('hide');
                    //alert('tttttt');
                    this.orderScanOrder(card_id, scanCodePayId);
                } else if (scanCodeType == 0 && scanType == 5) { // 扫描的快捷支付订单二维码
                    distinguishCount = 0;
                    // 隐藏备注
                    $('#noteDisplay').addClass('hide');
                    // 页面返回的跳转
                    selfThis.back = page + '&card_id=' + card_id;
                    this.orderQuickOrder(card_id, scanCodeOrderId);
                } else if (scanCodeType == 1) {
                    distinguishCount = 1;
                    // 隐藏备注
                    $('#noteDisplay').addClass('hide');
                    // 从app快捷支付未支付列表页面传过来的
                    disOrder = {
                            'trade_type': trade_type,
                            'card_id': card_id,
                            'pay_id': scanCodePayId,
                            'cid': Cache.get('getCID')
                        }
                        // 获取账户及优惠信息
                    this.getOrderInfo(disOrder, 'orderInfo');
                } else {
                    distinguishCount = 1;
                    // 显示备注
                    $('#noteDisplay').removeClass('hide');

                    // 需要先绑定在请求加菜
                    if (scan_bidn == 1) {
                        this.orderScanOrder(card_id, scanCodePayId);
                    } else {
                        disOrder = {
                                'trade_type': trade_type,
                                'order_type_info': 1, //1桌台点餐 2叫号点餐
                                'card_id': card_id, // 会员卡id
                                'shop_id': disOrder.shop_id, // 门店id
                                'table_id': decodeURIComponent(disOrder.table_id), // 桌台id
                                'pay_id': scanCodePayId,
                                'user_num': (user_num_t == undefined ? 0 : user_num_t),
                                'table_name': disOrder.table_name,
                                //'order_type': order_type, // 订单类型 餐厅1 商城2
                                'order_property': order_property, // 订单属性 堂食1（点餐） 外卖2 打包3
                                'consume': disOrder.consume, // 订单消费金额
                                'money': disOrder.money,
                                'sum_menu_num': disOrder.sum_menu_num, // 菜品个数，不是份数
                                'menu': JSON.stringify(disOrder.menu), // 菜品
                                'order_note': null, // 订单备注信息，可以为空
                                'cid': Cache.get('getCID')
                        };
                        // 获取账户及优惠信息
                        this.getOrderInfo(disOrder, 'orderPayInfo', 1);
                    }
                }
            },

            // 获取用户扫描结账单绑定订单详情
            orderScanOrder: function(cardId, payId) {
                var self = this;
                
                var is_scan_repeat = '';

                Data.setAjax('orderScanOrder', {
                    'trade_type': trade_type,
                    'card_id': cardId,
                    'pay_id': payId,
                    // 'is_scan_repeat': 1,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', { 20: '', 200216: '', 430209: '' }, function(respnoseText) {
                    var data = respnoseText.data;
                    //alert(respnoseText.code);
                    if (respnoseText.code == 20) {
                        data_config(data);
                    } else if (respnoseText.code == 200216) { //如果扫描的结账单返回200216订单绑定成功
                        Message.show('#msg', respnoseText.message, 2000, function() {
                            // 跳转到订单列表
                            Page.open('orderlist&card_id=' + cardId + '&page=merchantHome&order_list_type=1');
                        });
                    } else if (respnoseText.code == 200221) {
                        // 扫描订单，如果订单已经有用户，且与扫描用户不一致，返回 200221  和PAY_ID  前端直接跳转到订单详情页。
                        Message.show('#msg', respnoseText.message, 2000, function() {
                            Page.open('orderDetails&card_id=' + cardId + '&pay_id=' + respnoseText.data + '&otherName=pay_id&page=orderlist&order_list_type=1&order_property=' + order_property);
                        });
                    } else {
                        Message.show('#msg', respnoseText.message, 2000, function() {
                            if (respnoseText.code != 400101) {
                                // 跳转到回扫描过来的页面
                                Page.open(page + '&card_id=' + card_id + '&order_property=' + order_property);
                            }
                        });
                    }
                }, 2);


                function data_config (data) {
                    // is_pay 0:未结账，1：已结账
                    if (data.pay_info.is_pay_all == '1') {
                        window.location = phpJump + 'html/index.html?orderDetails&card_id=' + card_id + '&pay_id=' + pay_id + '&otherName=pay_id&page=orderlist&order_list_type=1&is_comm=1&order_property=' + order_property;
                    }
                    if (data.pay_info.is_pay == 0) {
                        // 需要先绑定在请求加菜
                        if (scan_bidn == 1) {
                            disOrder = {
                                    'trade_type': trade_type,
                                    'order_type_info': 1, //1桌台点餐 2叫号点餐
                                    'card_id': card_id, // 会员卡id
                                    'shop_id': shop_id, // 门店id
                                    'table_id': decodeURIComponent(table_id), // 桌台id
                                    'pay_id': scanCodePayId,
                                    'user_num': (user_num_t == undefined ? 0 : user_num_t),
                                    'table_name': table_name,
                                    //'order_type': order_type, // 订单类型 餐厅1 商城2
                                    'order_property': order_property, // 订单属性 堂食1（点餐） 外卖2 打包3
                                    'consume': disOrder.consume, // 订单消费金额
                                    'money': disOrder.money,
                                    'sum_menu_num': disOrder.sum_menu_num, // 菜品个数，不是份数
                                    'menu': JSON.stringify(disOrder.menu), // 菜品
                                    'order_note': null, // 订单备注信息，可以为空
                                    'cid': Cache.get('getCID')
                                };
                                // 获取账户及优惠信息
                            self.getOrderInfo(disOrder, 'orderPayInfo', 1);
                        } else {
                            is_scan = 1; // 这里赋值是因为出现未登录扫描预结单，页面右下角出现下单并支付按钮，应该是立即支付按钮
                            // 扫描预结单说明桌台模式是0
                            shop_type_info = 1;
                            Cache.set('shop_type_info', shop_type_info);
                            table_id = data.table_id;
                            // 基本赋值
                            self.basicReplication(data);
                        }
                    } else if (data.pay_status == 2) {
                        // 已结账弹出层
                        $.dialog = Dialog({
                            type: 2,
                            btn: ['取消', '确定'],
                            content: respnoseText.message,
                            cancelFn: function() { // 取消
                                //$.dialog.close($.dialog.id);
                                // 跳转到订单列表
                                //Page.open('orderlist&card_id='+cardId+'&page=merchantHome&order_list_type=1');
                                Page.open('orderDetails&card_id=' + cardId + '&pay_id=' + data.pay_id + '&page=' + page + '&order_list_type=1&order_property=' + order_property);
                            },
                            closeFn: function() { // 确定
                                // 跳转到订单列表
                                //Page.open('orderlist&card_id='+cardId+'&page=merchantHome&order_list_type=1');
                                Page.open('orderDetails&card_id=' + cardId + '&pay_id=' + data.pay_id + '&page=' + page + '&order_list_type=1&order_property=' + order_property);
                            }
                        });
                    }
                }
            },

            // 获取快捷支付订单详情
            /*orderQuickOrder: function (cardId, orderId) {
                var self = this;

                Data.setAjax('orderQuickOrder', {
                    'card_id': cardId,
                    'order_id': orderId,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {20: ''}, function (respnoseText) {
                    var data = respnoseText.data;
                    if (respnoseText.code == 20) {
                        // 基本赋值
                        self.basicReplication(data);
                    } else {
                        Message.show('#msg', respnoseText.message, 2000, function () {
                            Page.open(page+'&card_id='+card_id);
                        });
                    }
                }, 2);
            },*/

            // 获取基本账户和优惠信息
            getOrderInfo: function(data, url, is_disOrder) {
                var self = this;

                Data.setAjax(url, data, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                    orderData = respnoseText.data;
                    if (respnoseText.code == 20) {
                        table_id = orderData.table_id;
                        // 基本赋值
                        if (url == 'orderPayInfo') {
                            self.basicReplication(orderData, is_disOrder, 1);
                        } else {
                            self.basicReplication(orderData, is_disOrder);
                        }
                    } else if (respnoseText.code == 410204) {
                        Message.show('#msg', respnoseText.message, 2000, function() {
                            Page.open('dishes&card_id=' + card_id + '&shop_id=' + shop_id + '&shop_name=' + shop_name);
                        });
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            },

            // 基本赋值
            basicReplication: function(data, is_disOrder, is_judge_T) {
                if (is_judge_T == 1) {
                    is_add_a_dish = 1;
                }

                // try {

                    // (初始化一次弹出层数据)存储缓存应对只弹出一次一种类型冲突(九种冲突0就是没弹层1就是弹出层了)
                    storage_one = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0};

                    order_property = data.pay_info.order_property;
                    Cache.set('order_property_temporary', order_property);

                    // 存储所有数据
                    payorderInfo = this.dishesStackHandle(data, payorderInfo);
                    // 可改变内容的存储所有数据
                    change_tableInfo = this.dishesStackHandle(data, change_tableInfo);
                    // 存储冲突用的支付信息
                    conflict_pay_info = this.dishesStackHandle(data.pay_info, conflict_pay_info);


                    // 商户页logo
                    $('#merchantLogin').attr('src', '../../img/business/' + card_id + '/logo.jpg');

                    // 如果是未支付订单过来的，就重新赋值shop_type_info
                    if (scanCodeType == 1 || data.order_type_info != undefined) {
                        shop_type_info = data.order_type_info;
                        Cache.set('shop_type_info', data.order_type_info);
                    }

                    // 是否已登录，根据接口是否返回用户信息判断
                    if (!$.cookie("user_mobile") || data.user_account == undefined) {
                        is_landed = 0;
                    } else {
                        is_landed = 1;
                    }

                    // 右上角判断，如果缓存菜品有数据 并且 是请求正常下单接口 就显示修改菜品，否则添加菜品
                    if ((disOrder != undefined && is_disOrder == 1) || (is_landed == 1 && (data.user_id == '' || data.user_id == null)) || (is_landed == 0 && scanCodeType == 0 && scanType == 4 && data.pay_info.wxpay == 0 && data.pay_info.wxpay_temp == 0 && data.pay_info.alipay == 0 && data.pay_info.alipay_temp == 0 && is_scan != 1)) {
                        is_add_dis = false, // 是否显示添加菜品
                        $('#addMenuClick').text('修改菜品');
                        $('#quickNone .payments').removeClass('current');
                        $('#addMenuClick').addClass('hide');
                        if (data.shop_info.is_pay_app == 0) {
                            $('#wait_for_pay').removeClass('hide');
                        }
                        $('#define-pay').text('下单并支付');
                    } else {
                        is_add_dis = true, // 是否显示添加菜品
                            $('#addMenuClick').text('添加菜品');
                        $('#quickNone .payments').addClass('current');
                        $('#addMenuClick').removeClass('hide');
                        $('#wait_for_pay').addClass('hide');
                        $('#define-pay').text('立即支付');
                    }

                    // 全额支付不显示下单按钮
                    // is_pay_app ：1是 0否  在线下单是否要求全额支付
                    if (data.shop_info.is_pay_app == 1) {
                        $('#addMenuClick').addClass('hide');
                        $('#wait_for_pay').addClass('hide');
                    }

                    // 将以下属性添加到页面
                    $('#payorderScroll').removeClass('hide');
                    shop_name = data.pay_info.shop_name;
                    selfThis.back = page + '&card_id=' + card_id + '&shop_id=' + shop_id + '&shop_name=' + shop_name;

                    // 如果没有桌台类型和名称 或者 是叫号 就隐藏这一行
                    if ((data.table_type == undefined && data.table_name == undefined) || shop_type_info == 2) {
                        $('#tableNameDispalay').addClass('hide');
                    } else {
                        $('#tableNameDispalay').removeClass('hide');
                        // 桌台类型 桌台名称
                        var table_type = '',
                            table_name = '',
                            table_number = '';
                        if (data.table_type == undefined) {
                            table_type = '';
                        } else {
                            table_type = data.table_type + ' ';
                        }
                        // shop_type_info 0 桌台模式  1叫号 2台卡
                        if (shop_type_info == 1) {
                            table_number = '桌台号';
                            table_name = data.table_name;
                        } else if (shop_type_info == 2) {
                            table_number = '台卡号';
                            table_name = data.table_name;
                        }
                        if (data.table_id == 999999999) {
                            table_name = '未确认';
                            table_type = '';
                        }
                        if (data.table_type == '无桌台') {
                            $('#tableNumber').text('单号');
                            if (table_name == '生成中') {
                                table_name = '未下单';
                            }
                            $('#tableTypeName').text(table_name);
                        } else {
                            $('#tableNumber').text(table_number + '：');
                            $('#tableTypeName').text(table_type + table_name);
                        }
                    }

                    // 商户名称
                    $('#cardname').text(data.card_name);


                    // 店铺名称
                    if (data.pay_info.f_shop_name != null) {
                        $('#shopName').text(data.pay_info.f_shop_name);
                    } else {
                        $('#shopName').text(data.pay_info.shop_name);
                    }
                    if (data.pay_info.promo != undefined && data.pay_info.promo.promo_name != undefined) {
                        //银台优惠名称
                        $('#sub_moneyu').text('（' + data.pay_info.promo.promo_name + '）');
                    }

                    //显示取消支付  APP上的订单  要求全额支付的   这种订单，不允许取消微信支付
                    if (data.pay_info.wxpay_temp != 0 && data.shop_info.is_pay_app == 0) {
                        isWxpay = true
                        $('#isWxpay').addClass('subset_icon_chcked');
                        $('#wxpay').removeClass('setCol');
                        $('#wxpay').prop('readonly', false);
                    } else {
                    }

                    //显示取消支付  APP上的订单  要求全额支付的   这种订单，不允许取消微信支付
                    if (data.pay_info.alipay_temp != 0 && data.shop_info.is_pay_app == 0) {
                        isAlipay = true;
                        $('#isAlipay').addClass('subset_icon_chcked');
                        $('#alipay').removeClass('setCol');
                        $('#alipay').prop('readonly', false);
                    } else {
                    }

                    // 如果菜品个数不是undefined就赋值
                    if (data.order.new_order != undefined) {
                        // 菜品个数，不是份数
                        sumMenuNum = data.order.new_order.sum_menu_num;
                        // 菜品数据
                        dishesMenu = data.order.new_order.menu;
                    }

                    // 扫描的快捷支付订单二维码,还是通过消费金额来计算
                    if (scanCodeType == 0 && scanType == 5) {
                        // 用来计算的消费金额 = 消费金额
                        totalPurchase = data.consumes;
                    }

                    // 判断是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                    if (data.pay_info.stored == 0 && data.pay_info.voucher == 0 && data.pay_info.wxpay == 0 && data.pay_info.wxpay_temp == 0 && data.pay_info.alipay == 0 && data.pay_info.alipay_temp == 0 && data.pay_info.cash == 0 && data.pay_info.card == 0 && data.pay_info.other == 0) {
                        isHasPay = false;
                        isNoPro = false;// 是否优惠方案不可取消
                    } else {
                        isHasPay = true;
                        isNoPro = true;// 是否优惠方案不可取消
                    }


                    // 折扣额度 判断 已登陆 并且 是未使用乐币、抵用劵支付过的订单（微信可以支付过）
                    if (is_landed == 1 && data.pay_info.stored == 0 && data.pay_info.voucher == 0) {
                        if ((data.pay_info.discount_rate != 100 && data.pay_info.member_price_cashier == '') || data.pay_info.member_price_cashier != '' || data.pay_info.wxpay != 0 || data.pay_info.wxpay_temp != 0 || data.pay_info.alipay != 0 || data.pay_info.alipay_temp != 0 || data.pay_info.cash != 0 || data.pay_info.card != 0 || data.pay_info.other != 0) {
                            discountSrice = data.pay_info.discount_rate;
                        } else {
                            discountSrice = (data.user_account == undefined || data.user_account.discount_rate == undefined) ? 100 : data.user_account.discount_rate;
                        }

                        // 如果付过钱，并且银台优惠方案是折扣方案并且不支持会员折扣，就赋值折扣额度=100
                        // 是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                        if (isHasPay == true && data.pay_info.promo_id != '' && data.pay_info.promo.discount_amount != 100 && data.pay_info.promo.is_member_discount == 0) {
                            discountSrice = 100;
                        }
                    } else {
                        discountSrice = 100;
                    }
                    // 下面都判断如果 discount_rate 会员折扣==100才使用乐币抵用劵，否则不能使用

                    // 没有抵用劵 
                    if (is_landed == 1 && (data.pay_info.discount_rate == 100 || (data.pay_info.discount_rate != 100 && data.pay_info.wxpay == 0 && data.pay_info.wxpay_temp == 0 && data.pay_info.alipay == 0 && data.pay_info.alipay_temp == 0))) {
                        if (

                            data.user_voucher == undefined || data.user_voucher.voucher_check == '' || data.user_voucher.voucher_check == undefined ||
                            (isHasPay == true && data.pay_info.promo_id != '' && data.pay_info.promo.discount_amount != 100 && (data.pay_info.promo.pay_type['all'] == 0 || data.pay_info.promo.pay_type['ct0000000004'] == 0))

                        ) {
                            // 是否选择了抵用劵
                            isVoucher = false;
                            // 没有选择抵用劵，把抵用劵选择框样式去掉
                            $('#isVoucher').removeClass('subset_icon_chcked');
                            // 隐藏抵用劵
                            $('#selectVouch').addClass('hide');
                            // 是否可以使用抵用劵支付
                            isUseVoucher = false;
                        } else {
                            // 是否选择了抵用劵
                            isVoucher = true;
                            // 选择抵用劵，把抵用劵选择框样式加上
                            $('#isVoucher').addClass('subset_icon_chcked');

                            // 抵用劵金额
                            vouchersPrice = data.user_voucher.voucher_check.voucher_money;
                            // 是否选择了使用抵用劵（抵用劵金额）
                            canuseVouchePrice = data.user_voucher.voucher_check.voucher_money;
                            // 抵用劵id
                            recordId = data.user_voucher.voucher_check.record_id;
                            // 是否选择了使用抵用劵（抵用劵id）
                            canuseRecordId = data.user_voucher.voucher_check.record_id;

                            // 是否可以使用抵用劵支付
                            isUseVoucher = true;
                            // 显示抵用劵
                            $('#selectVouch').removeClass('hide');
                            // 抵用劵id填充
                            $('#voucher').attr('record-id', data.user_voucher.voucher_check.record_id);

                            // 可用抵用劵数据填充
                            this.voucherList(data.user_voucher.voucher_list);
                        }
                    }

                    // 这块的代码必须放在加载菜品数据之前，因为人数是这里判断的，不放在菜品数据之前，可以造成餐包不显示的情况
                    // is_judge_T == 1 需要判断是否首单 不是1 就不是首单
                    if (is_judge_T == 1) {
                        // 只有一个订单，并且是new_order，说明是首单
                        var numtt = 0,
                            numtext = '';
                        for (var i in data.order) {
                            numtt++;
                            if (i == 'new_order') {
                                numtext = 'numtext';
                            }
                        }
                        if (numtt == 1 && numtext != '') {
                            is_first_single = 1;
                        }
                    } else {
                        is_first_single = 0;
                    }

                    // 如果是首单 并且 是餐厅堂食 或者 外卖送餐，需要选择就餐人数，不是首单不能选择就餐人数
                    if (is_first_single == 1 && (order_property == 1 || order_property == 2 || order_property == 3)) {
                        is_number_of = 1;
                        $('#number_of_diners,#dinner_time_list').find('div[data_type="img_1"]').removeClass('hide');
                        // 如果是从点菜页面选好就餐人数过来的
                        if (user_num_t != undefined) {
                            $('#number_diners').val(user_num_t);
                            $('#number_of_num').text(user_num_t + '人');
                            user_num = user_num_t;
                        }
                    } else {
                        is_number_of = 0;
                        $('#number_of_diners').find('div[data_type="img_1"]').addClass('hide');
                        $('#number_of_num').text(data.pay_info.user_num + '人');
                        user_num = data.pay_info.user_num;
                    }

                    if (data.pay_info.is_pay_all == 1 && (order_property == 1 || order_property == 2 || order_property == 3)) {
                        is_click_btn = 0;
                        $('#no_order_property_1 .add_def_img').addClass('hide');
                        $('#dinner_time_list').find('div[data_type="img_1"]').addClass('hide');
                    } else {
                        is_click_btn = 1;
                    }
                    if (order_property == 4) {
                        $('#number_of_diners').addClass('hide');
                    }
                    if (order_property == 4 || order_property == 1) {
                        $('#dinner_time_list').addClass('hide');
                    }


                    // 如果没有菜品的话（只有快捷支付订单才没有菜品）
                    if (data.menu == undefined || data.menu == '') {
                        // 隐藏菜品信息那一行文字
                        $('#menuDispaly').addClass('hide');
                        // 隐藏菜品的div
                        $('#menuDispalyT').addClass('hide');
                    } else {
                        // 显示菜品信息那一行文字
                        $('#menuDispaly').removeClass('hide');
                        // 显示菜品的div
                        $('#menuDispalyT').removeClass('hide');
                        // 显示菜品信息
                        this.menuList(data);
                    }

                    // 优惠方案 
                    if ((data.pay_info.wxpay == 0 && data.pay_info.wxpay_temp == 0 && data.pay_info.alipay == 0 && data.pay_info.alipay_temp == 0) || data.pay_info.promo_id != '') {
                        if (data.promo == undefined || data.promo == '' || (isHasPay == true && data.pay_info.promo_id == '')) {
                            // 是否选择了优惠方案
                            isPromo = false;
                            // 没有选择优惠方案，把优惠方案选择框样式去掉
                            $('#isPromo').removeClass('subset_icon_chcked');
                            // 隐藏优惠方案
                            $('#selectDisPromo').addClass('hide');
                            // 是否可以使用优惠方案支付
                            isUsePromo = false;
                            if (data.pay_info.promo_id != '') {
                                promoId = data.pay_info.promo_id;
                            }
                        } else {
                            // 是否选择了优惠方案
                            isPromo = true;
                            // 选择优惠方案，把优惠方案选择框样式加上
                            $('#isPromo').addClass('subset_icon_chcked');

                            // 显示所有折扣优惠方案
                            promoId = this.TablePromo(data.promo);
                            discountScroll.refresh();
                            if (data.pay_info.promo_id != '') {
                                // 优惠方案id
                                promoId = data.pay_info.promo_id;
                                $('#discountPromo').text(data.pay_info.promo.promo_name);
                            } else if (promoId != ''){
                                $('#discountPromo').text(data.promo[promoId].promo_name);
                            } else {
                                // 是否选择了优惠方案
                                isPromo = false;
                                // 选择优惠方案，把优惠方案选择框样式加上
                                $('#isPromo').removeClass('subset_icon_chcked');
                            }
                            canusePromoId = promoId;

                            // 是否可以使用优惠方案支付
                            isUsePromo = true;
                            // 显示优惠方案
                            $('#selectDisPromo').removeClass('hide');
                            // 优惠方案id填充
                            $('#discountPromo').attr('promo_id', promoId);
                        }
                    }
                    // 优惠方案
                    dishesPromo = data.promo;


                    // 乐币余额
                    if (is_landed == 1 && (data.pay_info.discount_rate == 100 || (data.pay_info.discount_rate != 100 && data.pay_info.wxpay == 0 && data.pay_info.wxpay_temp == 0 && data.pay_info.alipay == 0 && data.pay_info.alipay_temp == 0))) {
                        this_le = (data.user_account == undefined || data.user_account.stored_balance == undefined) ? 0 : data.user_account.stored_balance;
                        var pay_card_money = (data.user_account == undefined || data.user_account.currency_stored == undefined || data.user_account.currency_stored == null) ? 0 : data.user_account.currency_stored;
                        leMoney = (data.user_account == undefined || data.user_account.stored_balance == undefined) ? 0 : Util.accAdd(data.user_account.stored_balance, pay_card_money);

                        //支付详情
                        if(data.user_account != undefined && data.user_account.currency_card != '' &&  data.user_account.currency_card != 0 && data.user_account.currency_card != null){
                            $('#lebipay').removeClass('hide');
                            var content = '<li>'+
                                                '<b class="currency_left">'+ data.card_name + '</b>'+
                                                '<b class="currency_right">'+ this_le + '</b>'+
                                            '</li>';
                            //乐币详情模块显示
                            for(var key in data.user_account.currency_card){
                                var stored_balance= Util.accSubtr(data.user_account.currency_card[key].stored_money , data.user_account.currency_card[key].hold_money);

                                content += '<li>'+
                                                '<b class="currency_left">'+ data.user_account.currency_card[key].card_name + '</b>'+
                                                '<b class="currency_right">'+ stored_balance + '</b>'+
                                            '</li>';
                            }
                            $('#lebipay_con').html(content);
                        }else{
                            $('#lebipay').addClass('hide');
                        }

                        // 如果付过钱，并且银台优惠方案是折扣方案并且不支持乐币，就赋值乐币余额=0
                        // 是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                        if (isHasPay == true && data.pay_info.promo_id != '' && data.pay_info.promo.discount_amount != 100 && (data.pay_info.promo.pay_type['all'] == 0 || data.pay_info.promo.pay_type['ct0000000003'] == 0)) {
                            leMoney = 0;
                        }
                    } else {
                        leMoney = 0;
                    }


                    /*会员价可优惠金额显示

                        用户未登录的时候
                            当已点菜品有可以享受会员价优惠的，显示会员价可优惠多少钱，右侧是注册登录
                            当已点菜品不可以享受会员价优惠的，显示会员登录注册
                        用户已登陆的时候
                            有会员价就不管
                            无会员价并且菜品可以享受会员价 并且 会员价优惠高于折扣价优惠，显示会员价可优惠多少钱，右侧是如何享受会员价
                            点击如何享受会员价跳转新页面，并带着member_price_used  会员价使用条件进行判断，
                            
                                支持1进不去
                                支持2显示储值
                                支持3
                                支持4显示授权会员提示

                        member_price_used 1、2、3、4
                        普通会员（所有领卡会员都可享受会员价）         
                        储值会员（有储值过的会员)
                        折扣会员（仅有打折额度的会员可享受会员价）
                        授权会员（仅扫码授权过的会员可享受会员价）*/

                    var discount_s = 100;
                    if (is_landed == 1) {
                        discount_s = data.user_account.discount_rate;
                    }
                    // 无会员价，计算会员价优惠
                    var menu_info_price = this.calcu_member_price(change_tableInfo, discount_s);

                    //判断显示会员登录支付 page_member_price // 页面显示的会员价可优惠金额
                    if (is_landed == 1) {
                        $('#backNomelogin,#registerlogin').addClass('hide');
                        if (data.user_account.is_member_price == 0 && data.pay_info.is_member_price == 0 && menu_info_price.sub_user_price > menu_info_price.sub_user_discount) {
                            $('.pg-payorder .payments h2').css('height', '124px');
                            $('#member_price_disp,#is_halp_member').removeClass('hide');
                            $('#page_member_price').text(menu_info_price.sub_user_price);
                        } else {
                            $('#member_price_disp').addClass('hide');
                            $('.pg-payorder .payments h2').css('height', '84px');
                        }
                    } else {
                        /*当已点菜品有可以享受会员价优惠的，显示会员价可优惠多少钱，右侧是注册登录
                          当已点菜品不可以享受会员价优惠的，显示会员登录注册*/
                        if (menu_info_price.sub_user_price == 0) {
                            $('.pg-payorder .payments h2').css('height', '94px');
                            $('#member_price_disp').addClass('hide');
                            $('#backNomelogin').removeClass('hide');
                        } else {
                            $('.pg-payorder .payments h2').css('height', '124px');
                            $('#backNomelogin,#is_halp_member').addClass('hide');
                            $('#member_price_disp,#registerlogin').removeClass('hide');
                            $('#page_member_price').text(menu_info_price.sub_user_price);
                        }
                    }

                    /*if (leMoney == 0 && (data.pay_info.discount_rate == 100 || (data.pay_info.discount_rate != 100 && data.pay_info.wxpay == 0 && data.pay_info.wxpay_temp == 0))) {
                        $('#menglebi').removeClass('hide');

                        // 如果付过钱，并且银台优惠方案是折扣方案并且不支持乐币，就赋值乐币余额=0
                        // 是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                        if (isHasPay == true && data.pay_info.promo_id != '' && data.pay_info.promo.discount_amount != 100 && (data.pay_info.promo.pay_type['all'] == 0 || data.pay_info.promo.pay_type['ct0000000003'] == 0)) {
                            $('#menglebi').addClass('hide');
                        }
                    } else {
                        $('#menglebi').addClass('hide');
                    }*/

                    // 是否可以使用乐币支付
                    if (leMoney == 0) {
                        // 是否选择了乐币
                        isLecoin = false;
                        // 没有选择乐币，把乐币选择框样式去掉
                        $('#isLecoin').removeClass('subset_icon_chcked');

                        isUseLe = false;
                        // 隐藏
                        $('#UseLe').addClass('hide');
                    } else {
                        // 是否选择了乐币
                        isLecoin = true;
                        // 选择乐币，把乐币选择框样式加上
                        $('#isLecoin').addClass('subset_icon_chcked');
                        lepay = 1;
                        isUseLe = true;
                        // 显示
                        $('#UseLe').removeClass('hide');

                        

                    }

                    if (is_landed == 1 && data.user_account.stored_balance == 0) {
                        $('#stored_value').removeClass('hide');
                        $('#stored_value').text('余额不足，请充值');
                        $('#UseLe').removeClass('hide');

                        $('#clickUseLe').addClass('setCol');
                        $('#stored').addClass('setCol')
                        $('#stored').val(0)
                        $('#stored').prop('readonly', true);
                    } else if (is_landed == 1 && data.user_account.stored_balance != 0) {
                        $('#stored_value').text('储值享优惠');
                    }

                    // 消费金额 = 消费 + 赠菜
                    dishesConsume = Util.accAdd(data.consumes, data.give_menu_consume);
                    // 消费金额
                    $('#consume').text(parseFloat(dishesConsume).toFixed(2));
                    cons_money = dishesConsume;
                    dishesConsume = data.consumes;

                    // 已付 = 乐币 + 抵用劵 + 微信 + 现金 + 银行卡 + 自定义支付
                    var one_money = Util.accAdd(Util.accAdd(Util.accAdd(Util.accAdd(Util.accAdd(Util.accAdd(data.pay_info.stored, data.pay_info.voucher), data.pay_info.wxpay), data.pay_info.cash), data.pay_info.card), data.pay_info.other), data.pay_info.alipay);
                    // 已付金额显示
                    if (one_money != 0) {
                        $('#pay_order_data').removeClass('hide');
                        $('#pay_order_data_money').text(parseFloat(one_money).toFixed(2));
                    } else {
                        $('#pay_order_data').addClass('hide');
                    }

                    // member_price_cashier 该字段有值时，APP上不管用户使用有会员价资格，是否使用会员价属性不允许变更。不再使用a_user_id判断。

                    // is_member_price   是否适用会员价 0，否，1：是
                    // 是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                    if (is_landed == 1) {
                        if (data.pay_info.member_price_cashier != '' || isHasPay == true || data.pay_info.discount_rate != 100) {
                            is_member_price = data.pay_info.is_member_price;
                        } else {
                            if (data.user_account == undefined || data.user_account.is_member_price == undefined || data.user_account.is_member_price === '') {
                                is_member_price = data.pay_info.is_member_price;
                            } else {
                                is_member_price = data.user_account.is_member_price;
                            }
                        }
                    } else {
                        is_member_price = data.pay_info.is_member_price;
                    }

                    // 是否支持会员价选择显示隐藏
                    /*if (!$.cookie("user_mobile") || (is_member_price == 0 && (isHasPay == true || data.pay_info.discount_rate != 100))) {
                        $('#moneyDisplay').addClass('hide');
                        $('#isMember').removeClass('subset_icon_chcked');
                    } else {
                        if (is_member_price == 1) {
                            $('#isMember').addClass('subset_icon_chcked');
                        } else {
                            $('#isMember').removeClass('subset_icon_chcked');
                        }
                        $('#moneyDisplay').removeClass('hide');
                    }*/
                    // 不显示会员价
                    $('#moneyDisplay').addClass('hide');

                    // 微信打开 并且 未登录 隐藏会员优惠
                    if (isWeixin && is_landed == 0) {
                        $('#userPriceDispled,#userDiscountDispled').addClass('hide');
                    }
                    // 支付宝打开 并且 未登录 隐藏会员优惠
                    if (isAli && is_landed == 0) {
                        $('#userPriceDispled,#userDiscountDispled').addClass('hide');
                    }

                    // 是否支持微信支付
                    is_wxpay = data.is_wxpay;
                    is_alipay = data.is_alipay
                        // 判断微信中是否无乐币、无抵用劵默认使用微信支付
                    if (isWeixin || $.app.isClient == true) {
                        yesNoWxPay = true;
                    } else {
                        yesNoWxPay = false;
                    }

                    if (isAli || $.app.isClient == true) {
                        yesNoAliPay = true;
                    } else {
                        yesNoAliPay = false;
                    }

                    // 不是扫描的快捷支付订单才执行下面
                    if (scanCodeType != 0 || scanType != 5) {
                        if (data.pay_info.alipay_temp == 0) {
                            // 是否支持微信支付 shop_type_info 0 桌台模式  1叫号 2台卡 isNoWx 是否不可取消支付
                            if (is_wxpay == true && shop_type_info != 1) {
                                // 是否选择了微信支付
                                isWxpay = true;
                                // 选择微信支付，把微信支付选择框样式去掉
                                $('#isWxpay').addClass('subset_icon_chcked');
                                // 显示
                                $('#wxpayDisplay').removeClass('hide');
                                isNoWx = true;
                                $('#wxpay').removeClass('setCol');
                                $('#wxpay').prop('readonly', false);
                                // 把银台支付金额隐藏出来
                                $('#cashierDisplay').addClass('hide');
                            } else if (is_wxpay == true && yesNoWxPay == true) {
                                // 是否选择了微信支付
                                isWxpay = true;
                                // 选择微信支付，把微信支付选择框样式去掉
                                $('#isWxpay').addClass('subset_icon_chcked');
                                // 显示
                                $('#wxpayDisplay').removeClass('hide');
                                // 是否微信不可取消
                                isNoWx = false;
                                $('#wxpay').removeClass('setCol');
                                $('#wxpay').prop('readonly', false);
                                // 把银台支付金额显示出来
                                $('#cashierDisplay').removeClass('hide');
                            } else {
                                // 是否选择了微信支付
                                isWxpay = false;
                                // 没有选择微信支付，把微信支付选择框样式加上
                                $('#isWxpay').removeClass('subset_icon_chcked');
                                // 隐藏
                                $('#wxpayDisplay').addClass('hide');
                                isNoWx = false;
                                $('#wxpay').addClass('setCol');
                                $('#wxpay').prop('readonly', true);
                                // 把银台支付金额显示出来
                                $('#cashierDisplay').removeClass('hide');
                            }
                        }
                        if (data.pay_info.wxpay_temp == 0) {
                            // 是否支持支付宝支付 shop_type_info 0 桌台模式  1叫号 2台卡 isNoWx 是否不可取消支付
                            if (is_alipay == true && shop_type_info != 1) {
                                // 是否选择了支付宝支付
                                isAlipay = true;
                                // 选择支付宝支付，把支付宝支付选择框样式去掉
                                $('#isAlipay').addClass('subset_icon_chcked');
                                // 显示
                                $('#alipayDisplay').removeClass('hide');
                                isNoali = true;
                                $('#alipay').removeClass('setCol');
                                $('#alipay').prop('readonly', false);
                                // 把银台支付金额隐藏出来
                                $('#cashierDisplay').addClass('hide');
                            } else if (is_alipay == true && yesNoAliPay == true) {
                                // 是否选择了支付宝支付
                                isAlipay = true;
                                // 选择支付宝支付，把支付宝支付选择框样式去掉
                                $('#isAlipay').addClass('subset_icon_chcked');
                                // 显示
                                $('#alipayDisplay').removeClass('hide');
                                // 是否支付宝不可取消
                                isNoali = false;
                                $('#alipay').removeClass('setCol');
                                $('#alipay').prop('readonly', false);
                                // 把银台支付金额显示出来
                                $('#cashierDisplay').removeClass('hide');
                            } else {
                                // 是否选择了支付宝支付
                                isAlipay = false;
                                // 没有选择支付宝支付，把支付宝支付选择框样式加上
                                $('#isAlipay').removeClass('subset_icon_chcked');
                                // 隐藏
                                $('#alipayDisplay').addClass('hide');
                                isNoali = false;
                                $('#alipay').addClass('setCol');
                                $('#alipay').prop('readonly', true);
                                // 把银台支付金额显示出来
                                $('#cashierDisplay').removeClass('hide');
                            }
                        }
                    }

                    if (data.pay_info.wxpay_temp != 0 || data.pay_info.alipay_temp != 0) {
                        if (isLecoin == true && data.pay_info.stored == 0) {
                            isLecoin = false
                                // 选择乐币，把乐币选择框样式加上
                            $('#isLecoin').removeClass('subset_icon_chcked');
                            $('#stored').addClass('setCol')
                            $('#stored').prop('readonly', true);
                        }
                        if (isVoucher == true && data.pay_info.voucher == 0) {
                            isVoucher = false;
                            $('#clickVouch').addClass('setBg');
                            $('#isVoucher').removeClass('subset_icon_chcked');
                        }
                        /*优惠方案取消选中*/
                        if (isPromo == true && data.pay_info.pay_sub_moneys == 0) {
                            isPromo = false;
                            $('#isPromo').removeClass('subset_icon_chcked');
                        }
                        if (isWxpay == false && data.pay_info.wxpay_temp != 0 && data.pay_info.stored == 0 && isWeixin) {
                            isWxpay = true;
                            $('#isWxpay').addClass('subset_icon_chcked');
                            $('#wxpay').removeClass('setCol');
                            $('#wxpay').prop('readonly', false);
                        }

                        if (isAlipay == false && data.pay_info.alipay_temp != 0 && data.pay_info.stored == 0 && isAli) {
                            isAlipay = true;
                            $('#isAlipay').addClass('subset_icon_chcked');
                            $('#alipay').removeClass('setCol');
                            $('#alipay').prop('readonly', false);
                        }
                    }

                    if (is_alipay == true && is_wxpay == true) {
                        $('#wxpayDisplay').removeClass('hide');
                        $('#alipayDisplay').removeClass('hide');
                        if (isWxpay == true) {
                            isAlipay = false;
                            $('#isAlipay').removeClass('subset_icon_chcked');
                            $('#alipay').addClass('setCol');
                            $('#alipay').prop('readonly', true);
                        }
                    }

                    // 如果折扣等于100 或者是 扫描的快捷支付订单 就隐藏折扣，否则显示
                    if (discountSrice == 100 || (scanCodeType == 0 && scanType == 5)) {
                        // 如果没有折扣，折后金额 = 消费金额
                        trueTotalConsumption = calculationPrice;
                        // 是否选择了折扣
                        isDiscount = false;
                        // 没有选择折扣，把折扣选择框样式去掉
                        $('#isDiscount').removeClass('subset_icon_chcked');
                        // 这里折扣在赋值100是因为扫描的快捷支付订单，不显示会员折扣
                        discountSrice = 100;
                        // 是否可以使用折扣支付
                        isUseDiscount = false;
                        // 隐藏
                        $('#discountDisplay').addClass('hide');
                    } else {
                        // 如果有折扣默认选择了折扣
                        isDiscount = true;
                        // 选择折扣，把折扣选择框样式加上
                        $('#isDiscount').addClass('subset_icon_chcked');
                        // 是否可以使用折扣支付
                        isUseDiscount = true;
                        conflict_pay_info['discount_rate'] = discountSrice;
                        // 显示
                        $('#discountDisplay').removeClass('hide');
                        // 如果折扣是0的话就显示0，否则页面显示折扣除以10之后的额度
                        if (discountSrice == 0) {
                            // 折扣额度填充
                            $('#discountRate').text(discountSrice);
                        } else {
                            $('#discountRate').text(discountSrice / 10);
                        }
                    }

                    // 下面都判断如果 discount_rate 会员折扣==100才使用乐币抵用劵，否则不能使用
                    // 是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                    if (data.pay_info.discount_rate != 100 && isHasPay == true) { // 不等于100 不能取消会员折扣
                        isNoDis = true;
                    } else {
                        isNoDis = false;
                    }

                    // 进行转类型，因为返回的是字符串类型需要转成两位小数,toFixed(2)这个函数是用于parseFloat转型之后相加出现精度不准的情况下进行修正精度为两位小数

                    // 消费金额
                    dishesConsume = parseFloat(dishesConsume);
                    // 会员价
                    memberPrice = parseFloat(memberPrice);
                    // 用来计算的金额
                    calculationPrice = parseFloat(calculationPrice);
                    // 用来计算的消费金额
                    totalPurchase = parseFloat(totalPurchase);
                    // 抵用劵金额
                    vouchersPrice = parseFloat(vouchersPrice);
                    // 是否选择了使用抵用劵（抵用劵金额）
                    canuseVouchePrice = parseFloat(canuseVouchePrice);
                    // 乐币余额
                    leMoney = parseFloat(leMoney);
                    // 折后金额
                    trueTotalConsumption = parseFloat(trueTotalConsumption);

                    /*if (data.pay_info.is_pay == 1) {
                        order_step = '已结账';
                    } else if (data.pay_info.cancel_code != 0) {
                        order_step = '已取消';
                    } else if (data.pay_info.is_pay_all == 1) {
                        order_step = '已支付';
                    } else if (data.pay_info.is_comment == 1) {
                        order_step = '已确认';
                    } else {
                        order_step = '确认中';
                    }*/

                    //order_step
                    // 如果是已结账状态或者已确认才显示订单点评，否则隐藏
                    if (data.pay_info.is_pay == 1 || data.pay_info.is_comment == 1) {
                        $('#comments-content').removeClass('hide');
                        $('#orderInfoList').removeClass('hide');
                        // 订单点评信息填充到页面(获取订单点评信息 )
                        this.getOrderComment(data.order_comment);
                        is_comment = 1; // 是否显示点评
                    } else {
                        //$('#menuDispaly').children('span').attr('type','')
                        //$('#menuDispaly span').children('i').removeClass()
                        $('#headerMeng').remove()
                            // 订单点评标题栏隐藏
                        $('#comments-content').addClass('hide');
                        // 订单点评内容隐藏
                        $('#orderInfoList').addClass('hide');
                        is_comment = 0;
                    }



                    // 就餐时间，如果是外卖、自提，支持时间选择，其他不支持
                    if (order_property == 2 || order_property == 3) {
                        $('#dinner_time_display,#dinner_time_list').removeClass('hide');
                        if (order_property == 2) {
                            $('#dinner_time_title').text('送餐时间');
                            $('#dinner_time_text').text('送餐时间：');
                        } else {
                            $('#dinner_time_title').text('自取时间');
                            $('#dinner_time_text').text('自取时间：');
                        }
                        // 判断缓存中有并且是首单就显示，否则不显示
                        var cache_dinner_time = Cache.get('dinner_time');
                        if (cache_dinner_time != '' && cache_dinner_time != undefined && is_first_single == 1) {
                            $('#dinner_time').text(Util.getReturnTime(cache_dinner_time, data.shop_info.dinner_time_type).main_list);
                            dinner_time = cache_dinner_time;
                        } else if (data.pay_info.dinner_time != 0) {
                            $('#dinner_time').text(Util.getReturnTime(data.pay_info.dinner_time, data.shop_info.dinner_time_type).main_list);
                            dinner_time = data.pay_info.dinner_time;
                        } else {
                            $('#dinner_time').text('请选择时间');
                        }
                    } else {
                        $('#dinner_time_display,#dinner_time_list').addClass('hide');
                    }


                    dinner_time_type = data.shop_info.dinner_time_type; // 就餐时间类型：1只支持时间 2支持日期时间
                    dinner_time_offset = data.shop_info.dinner_time_offset; // 就餐时间偏移量：当前时间延迟多少分钟
                    minimum_takeout = data.shop_info.minimum_takeout; // 外卖送餐起送金额
                    minimum_pack = data.shop_info.minimum_pack; // 门店自取起定金额
                    minimum_store = data.shop_info.minimum_store; // 商城配送起定金额
                    open_time = data.shop_info.open_time; // 门店营业开始时间
                    close_time = data.shop_info.close_time; // 门店营业结束时间




                    // 就餐人数弹出层，堂食外卖餐包是否存储
                    if (meal_package == '' || meal_package == undefined) {
                        $('#meal_package').addClass('hide');
                        is_meal_package = 0;
                    } else {
                        $('#meal_package').removeClass('hide');
                        is_meal_package = 1;
                    }

                    // 自备餐包的显示 is_chopsticks 1是 0否  是否允许自带餐具（存在按人数收取餐具费的前提，仅餐厅的堂食、外卖有效）
                    if (is_meal_package == 1 && data.shop_info.is_chopsticks == 1) {
                        $('#chopsticks').removeClass('hide');
                    } else {
                        $('#chopsticks').addClass('hide');
                    }
                    // 点菜传过来的缓存，如果点菜的时候选择了自备餐具，则要选中自备餐具
                    if (Cache.get('is_chopsticks_t') != '' && Cache.get('is_chopsticks_t') != undefined) {
                        is_chopsticks_t = Cache.get('is_chopsticks_t');
                        if (is_chopsticks_t == 1) {
                            $('#chopsticks_rise').prop('checked', true);
                        }
                    }
                    is_chopsticks = data.shop_info.is_chopsticks;

                    // 配送费的显示 special_type（3外卖送餐费 4商城配送费）下架了就没有

                    // 订单属性： order_property 堂食1 外卖2 打包3 商城配送4



                    // 如果是桌台过来的，隐藏地址等信息，否则显示
                    if (order_property == 1) {
                        $('#no_order_property_1').addClass('hide');
                    } else {
                        $('#no_order_property_1').removeClass('hide');

                        // 如果是首单
                        if (is_first_single == 1) {
                            // 外卖下单的有姓名、电话、地址显示，打包下单只有姓名、电话显示
                            // 如果默认地址为空，显示已登录用户默认账号手机号、账号user_name
                            if (Cache.get('isLogin') == true || is_landed == 1) {
                                if (user_addr == '' || user_addr == undefined) {
                                    if (order_property == 2 || order_property == 4) {
                                        $('#add').html("添加收货地址");
                                    } else {
                                        $('#user_name').text($.cookie('user_name'));
                                        $('#user_tel').text(data.user_mobile);
                                        user_addr = {
                                            'user_name': $.cookie('user_name'),
                                            'user_tel': data.user_mobile,
                                            'user_addr': ''
                                        }
                                    }
                                } else {
                                    $('#user_name').text(user_addr.user_name);
                                    $('#user_tel').text(user_addr.user_tel);
                                    $('#user_addr').text(user_addr.user_addr);
                                }
                            } else {
                                if (user_addr) {
                                    $('#user_name').text(user_addr.user_name);
                                    $('#user_tel').text(user_addr.user_tel);
                                    $('#user_addr').text(user_addr.user_addr);
                                } else {
                                    $('#add').html("添加收货地址");
                                }
                            }
                        } else {
                            if (data.pay_info.addr_info == '' || Cache.get('is_add') == 1) {
                                if (user_addr == '') {
                                    $('#add').html("添加收货地址");
                                } else {
                                    Cache.del('is_add');
                                    $('#user_name').text(user_addr.user_name);
                                    $('#user_tel').text(user_addr.user_tel);
                                    $('#user_addr').text(user_addr.user_addr);
                                }
                            } else {
                                $('#user_name').text(data.pay_info.addr_info.name);
                                $('#user_tel').text(data.pay_info.addr_info.tel);
                                $('#user_addr').text(data.pay_info.addr_info.addr);
                                user_addr = {
                                    'user_name': data.pay_info.addr_info.name,
                                    'user_tel': data.pay_info.addr_info.tel,
                                    'user_addr': data.pay_info.addr_info.addr
                                }
                            }
                        }

                        if (order_property == 3) {
                            $('#user_addr').text('');
                        }
                    }
                    var userName = $('#user_name').text();
                    if (userName == '') {
                        $('#user_name').remove();
                    }

                    var order_type_text = '';
                    var order_type_img = '';
                    if (order_property == 1) {
                        order_type_text = '餐厅堂食';
                        order_type_img = '1';
                    } else if (order_property == 2) {
                        order_type_text = '外卖送餐';
                        order_type_img = '2';
                    } else if (order_property == 3) {
                        order_type_text = '门店自取';
                        order_type_img = '3';
                    } else if (order_property == 4) {
                        order_type_text = '商城配送';
                        order_type_img = '4';
                    }
                    $('#order_type_text').text(order_type_text);
                    $('#order_type_img').attr('src', '../../img/base/order_' + order_type_img + '.png');

                    // 发票抬头的判断（is_invoice 1是 0否  是否支持填写发票信息）
                    if (data.shop_info.is_invoice == 1) {
                        $('#invoice_dispaly').removeClass('hide');
                        $('#taxpayer_dispaly').removeClass('hide');
                        // 如果是首单
                        if (is_first_single == 0) {
                            $('#invoice_text').val(data.pay_info.invoice);
                            $('#taxpayer_id').val(data.pay_info.taxpayer_id);
                        }
                    } else {
                        $('#invoice_dispaly').addClass('hide');
                        $('#taxpayer_dispaly').addClass('hide');
                    }
                    //如果支持电子发票，则蕴藏发票
                    if (data.shop_info.is_electronic_invoice == 1) {
                        $('#invoice_dispaly').addClass('hide');
                        $('#taxpayer_dispaly').addClass('hide');
                    }
                    is_invoice = data.shop_info.is_invoice;

                    // is_pay_app ：1是 0否  在线下单是否要求全额支付
                    is_pay_app = data.shop_info.is_pay_app;

                    // 如果是外卖单进来，备注里面的信息则需要修改为“请填写就餐时间及其他就餐需求等”
                    if (order_property == 2) {
                        $('#orderNote').attr('placeholder', '请填写就餐时间及就餐需求等');
                    } else {
                        $('#orderNote').attr('placeholder', '选填，添加备注');
                    }

                    // 如果是外卖模式，并且不全额支付，银台支付改名“货到付款”
                    if (order_property == 2 && is_pay_app == 0) {
                        $('#cashier_pay_up').text('货到付款');
                        $('#cashier_pay_upImg').attr('src', '../../img/base/codLogo.png')
                    } else {
                        $('#cashier_pay_up').text('银台支付');
                        $('#cashier_pay_upImg').attr('src', '../../img/base/cashierLogo.png')
                    }

                    //如果是未登录隐藏会员折扣，乐币 。稍后支付
                    if (is_landed == 0) {
                        $('#discountDisplay').addClass('hide');
                        $('#menglebi').addClass('hide');
                        //$('.loadpay').addClass('hide');
                    }

                    is_load = 1; // 是否第一次加载(刷新也算)0 否 1 是
                    clickNum = 1;
                    // 如果有会员折扣并且有乐币和抵用卷就让用户弹出层选择支付方式
                    if (isUseDiscount == true && (isUseLe == true || isUseVoucher == true)) {
                        // 选择支付方式
                        // 是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                        if (is_landed == 1 && isHasPay == false) {
                            /*&&
                                                    data.pay_info.discount_rate == 100 &&
                                                    data.pay_info.a_user_id == ''*/
                            is_co = 1;
                            this.selectPaymentMethod();
                        } else {
                            // console.log('a19')
                            this.generate_choice_submit(is_member_price);
                        }
                    } else {
                        // console.log('a20')
                        // 计算金额
                        //this.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                        // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                        this.generate_choice_submit(is_member_price);
                    }
                    is_click_button = 1;
                    scroll.refresh();

                /*} catch (err) {
                    Data.setAjax('companyInfo', {
                        'menu_id': "错误信息："  +  err.stack
                    }, '#layer', '#msg', { 20: '' }, function(respnoseText) {


                    }, 0);

                    $('#closeDiv').removeClass('hide');
                    $('#closeDiv_dis').html('')
                    $('#closeDiv_dis').html("错误信息：" + err.stack);
                    displayAlertMessage('#closeDiv', '#closeDiv-closeDiv');
                    // alert("错误信息：" + err.stack);
                }*/
            },

            // 显示所有折扣方案
            TablePromo: function (data) {
                var self = this;
                var content = '';
                var min_content = '';
                var main_content = '';
                var is_auto_num = 0;// 自动优惠方案的数量

                // 当前日期时间戳
                var dateTime = Util.dateTotTime(Util.getLocalDateMin());

                // 优惠方案详细文案(那些菜品、几折、立减金额、立减是否累计、反劵、反卷数量、反劵是否累计)
                var copy_detail = '';

                // 计算满额
                var minimum_money = 0;
                // 满额样式
                var min_class = '',min_class_2 = '',min_img = '';

                // is_auto 是否自动，1自动，0手动
                for (var i in data) {
                    // 判断优惠方案不在有效期内，不显示
                    if (data[i].start_time > dateTime || data[i].end_time < dateTime) {
                        continue;
                    }
                    copy_detail = '';
                    if (data[i].discount_amount != 100 && data[i].discount_amount != 0) {
                        if (data[i].discount_menu_type_ids != '' && data[i].discount_menu_type_ids != 'all') {
                            copy_detail += '部分商品';
                        } else if (data[i].discount_menu_type_ids == 'all') {
                            copy_detail += '全部商品';
                        }
                        copy_detail += Util.accDiv(data[i].discount_amount, 100)+'折;';
                    }
                    if (data[i].minus_amount != 0) {
                        copy_detail += '立减'+data[i].minus_amount+'元';
                        if (data[i].minus_is_repeat == 1) {
                            copy_detail += ',可累计扣减;';
                        } else {
                            copy_detail += ';';
                        }
                    }
                    if (data[i].give_voucher_id != '' && payorderInfo.user_voucher != undefined) {
                        var voucher_name = '';
                        for (var k in payorderInfo.user_voucher.voucher_list) {
                            if (payorderInfo.user_voucher.voucher_list[k].voucher_id == data[i].give_voucher_id) {
                                voucher_name = payorderInfo.user_voucher.voucher_list[k].voucher_name;
                                break;
                            }
                        }
                        copy_detail += '反'+voucher_name+'('+data[i].give_voucher_num+'张);';
                    }

                    if (data[i].is_auto == 1) {
                        is_auto_num++;// 自动优惠方案的数量
                    }

                    // 计算是否满足最低消费
                    minimum_money = self.full_judge(data[i].promo_id);
                    min_class = '',min_class_2 = '',min_img = 'yhq';
                    if (minimum_money < parseFloat(data[i].low_consumption)) {
                        min_class = ' disBox';
                        min_class_2 = ' disBot';
                        min_img = 'yhqh';
                    }

                    content =  '<div class="discount'+min_class+'" name="dis" promo_id="'+data[i].promo_id+'">'+
                                    '<div class="discountBox">'+
                                        '<img class="discountImg" src="../img/base/'+min_img+'.png">'+
                                        '<div class="discountMiddle">'+
                                            '<p class="disP">'+data[i].promo_name+'</p>'+
                                            '<p class="disSpan">'+copy_detail+'</p>'+
                                        '</div>'+
                                        '<span class="subset_icon disRight" name="select"></span>'+
                                    '</div>'+
                                    '<p class="disBottom'+min_class_2+'">最低消费'+data[i].low_consumption+'元方可使用</p>'+
                                '</div>';
                    if (minimum_money < parseFloat(data[i].low_consumption)) {
                        min_content += content;
                    } else {
                        main_content += content;
                    }
                }

                $('#promoDisList').html(main_content+min_content);

                discountScroll.refresh();

                var wxpayCalculation = 0;

                // 最优惠的方案id
                var most_favorable_id = '';
                // 最优惠的方案金额
                var most_favorable_money = 0;

                // 自动优惠方案数量 大于1 才选择最优惠的那个
                if (is_auto_num >= 1) {
                    // 循环得到最优惠的那个优惠方案id
                    $('#promoDisList div[name="dis"]').each(function(i,val){
                        var d_promo_id = $(this).attr('promo_id');
                        if (payorderInfo.promo[d_promo_id].is_auto == 1) {

                            // 计算出用来判断是否满额的金额
                            wxpayCalculation = d_promo_id == '' ? 0 : self.full_judge(d_promo_id);

                            // 如果支付过就判断满额 并且 方案折扣额度是100的，否则只判断满额的
                            // 是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                            if (isHasPay == true) {


                                // 判断如果支付过，并且有自动优惠方案或者点击选择优惠方案的时候，优惠方案跟支付方式或会员价或会员折扣有冲突，就不能选择
                                if (

                                    (payorderInfo.pay_info.is_member_price == 1 && payorderInfo.promo[d_promo_id].is_member_price == 0) ||
                                    (payorderInfo.pay_info.discount_rate != 100 && payorderInfo.promo[d_promo_id].is_member_discount == 0) ||
                                    (payorderInfo.pay_info.stored != 0 && (payorderInfo.promo[d_promo_id].pay_type['all'] == 0 || payorderInfo.promo[d_promo_id].pay_type['ct0000000003'] == 0)) ||
                                    (payorderInfo.pay_info.voucher != 0 && (payorderInfo.promo[d_promo_id].pay_type['all'] == 0 || payorderInfo.promo[d_promo_id].pay_type['ct0000000004'] == 0))

                                    ) {
                                } else {
                                    if (parseFloat(payorderInfo.promo[d_promo_id].low_consumption) >= most_favorable_money && wxpayCalculation >= parseFloat(payorderInfo.promo[d_promo_id].low_consumption) && payorderInfo.promo[d_promo_id].discount_amount == 100 && payorderInfo.promo[d_promo_id].minus_amount == 0) {
                                        most_favorable_money = payorderInfo.promo[d_promo_id].low_consumption;
                                        most_favorable_id = d_promo_id;
                                    }
                                }
                            } else {
                                if (parseFloat(payorderInfo.promo[d_promo_id].low_consumption) >= most_favorable_money && wxpayCalculation >= parseFloat(payorderInfo.promo[d_promo_id].low_consumption)) {
                                    most_favorable_money = payorderInfo.promo[d_promo_id].low_consumption;
                                    most_favorable_id = d_promo_id;
                                }
                            }
                        }
                    });
                } else {
                    // 循环得到最优惠的那个优惠方案id
                    $('#promoDisList div[name="dis"]').each(function(i,val){
                        var d_promo_id = $(this).attr('promo_id');
                        if (payorderInfo.promo[d_promo_id].is_auto == 0) {

                            // 计算出用来判断是否满额的金额
                            wxpayCalculation = d_promo_id == '' ? 0 : self.full_judge(d_promo_id);

                            // 如果支付过就判断满额 并且 方案折扣额度是100的，否则只判断满额的
                            // 是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                            if (isHasPay == true) {


                                // 判断如果支付过，并且有自动优惠方案或者点击选择优惠方案的时候，优惠方案跟支付方式或会员价或会员折扣有冲突，就不能选择
                                if (

                                    (payorderInfo.pay_info.is_member_price == 1 && payorderInfo.promo[d_promo_id].is_member_price == 0) ||
                                    (payorderInfo.pay_info.discount_rate != 100 && payorderInfo.promo[d_promo_id].is_member_discount == 0) ||
                                    (payorderInfo.pay_info.stored != 0 && (payorderInfo.promo[d_promo_id].pay_type['all'] == 0 || payorderInfo.promo[d_promo_id].pay_type['ct0000000003'] == 0)) ||
                                    (payorderInfo.pay_info.voucher != 0 && (payorderInfo.promo[d_promo_id].pay_type['all'] == 0 || payorderInfo.promo[d_promo_id].pay_type['ct0000000004'] == 0))

                                    ) {
                                } else {
                                    if (parseFloat(payorderInfo.promo[d_promo_id].low_consumption) >= most_favorable_money && wxpayCalculation >= parseFloat(payorderInfo.promo[d_promo_id].low_consumption) && payorderInfo.promo[d_promo_id].discount_amount == 100 && payorderInfo.promo[d_promo_id].minus_amount == 0) {
                                        most_favorable_money = payorderInfo.promo[d_promo_id].low_consumption;
                                        most_favorable_id = d_promo_id;
                                    }
                                }
                            } else {
                                if (parseFloat(payorderInfo.promo[d_promo_id].low_consumption) >= most_favorable_money && wxpayCalculation >= parseFloat(payorderInfo.promo[d_promo_id].low_consumption)) {
                                    most_favorable_money = payorderInfo.promo[d_promo_id].low_consumption;
                                    most_favorable_id = d_promo_id;
                                }
                            }
                        }
                    });
                }


                // 循环折扣方案，判断是否有选中的折扣方案（说明是自动的折扣方案），就根据选中的折扣方案计算优惠金额和应收金额
                $('#promoDisList div[name="dis"]').each(function(i,val){
                //jquery each循环,要实现break和continue的功能： break----用return false; continue --用return ture;﻿
                    var d_promo_id = $(this).attr('promo_id');
                    // 如果有自动优惠方案
                    if (((most_favorable_id == d_promo_id && payorderInfo.pay_info.promo_id == '') || payorderInfo.pay_info.promo_id == d_promo_id) && d_promo_id != '') {

                        // 计算出用来判断是否满额的金额
                        wxpayCalculation = d_promo_id == '' ? 0 : self.full_judge(d_promo_id);

                        // 如果合计银台应付金额大于当前最低消费，说明满足使用这个折扣（优惠方案）
                        if (wxpayCalculation >= parseFloat(payorderInfo.promo[d_promo_id].low_consumption) || payorderInfo.pay_info.promo_id != ''){// 转换为两位小数,因为返回的是字符串
                            
                            // 获取到当前优惠方案   discountDishes()方法循环所有优惠方案得到当前优惠方案的折扣菜品
                            var discountMenuTypeIds = payorderInfo.promo[d_promo_id].discount_menu_type_ids;
                            // json字符从转成数组eval
                            //discountMenuTypeIds = eval('('+discountMenuTypeIds+')');
                            
                            var discountAAmount = payorderInfo.promo[d_promo_id].discount_amount;

                            // 调用方法得到，当前桌台所有菜品是否满足当前优惠方案所打折的金额，满足就选中当前优惠方案，并赋值
                            discountMoney = self.calculationDiscountMoney(dishesArray, discountMenuTypeIds);
                            // discountMoney == 0,说明返回的可折扣金额是0，也就是不满足优惠

                            // 有自动优惠方案就，判断当前（没有优惠方案选中 并且 没有支付过） 或者 有优惠方案选中 就选中当前优惠方案
                            // 是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                            if ((payorderInfo.pay_info.promo_id == '' && isHasPay == false && payorderInfo.pay_info.discount_rate == '100' && payorderInfo.pay_info.sub_user_price == 0) || payorderInfo.pay_info.promo_id != '' || (payorderInfo.pay_info.promo_id == '' && payorderInfo.pay_info.discount_rate == '100' && discountAAmount == 100)) {
                                $(this).find('span[name="select"]').addClass('subset_icon_chcked');
                                // 折扣额度
                                discountAmount = payorderInfo.promo[d_promo_id].discount_amount;
                                // 折扣id
                                promoId = d_promo_id;
                                canusePromoId = d_promo_id;
                                most_favorable_id = d_promo_id;
                            }
                            return false;// 跳出循环
                        }
                    }
                });

                return most_favorable_id;
            },

            // 计算当前桌台所有菜品中是否有满足优惠折扣方案可打折的菜品，得到可折扣金额(这个方法应该是没用的)
            calculationDiscountMoney: function  (dishesArray, discountMenuTypeIds) {
                discountMoney = 0;// 可折扣金额
                // dishesArray 菜品数组
                //alert(discountMenuTypeIds);
                // 如果当前优惠方案可打折菜品时all，可打折金额就等于合计银台应付金额
                if (discountMenuTypeIds == 'all') {
                    // discountMoney = Util.accAdd(Util.accAdd(tableCashier,tableWxpay),tableAlipay);// 相加
                    discountMoney = 0;// 相加
                } else {
                    // 如果当前优惠方案可打折菜品是空或者undefined
                    if (discountMenuTypeIds == '' || discountMenuTypeIds == undefined) {
                        discountMoney = 0;// 可折扣金额为0
                    } else {
                        // 去和当前桌台所有菜品循环判断得到可折扣金额
                        // 循环所有菜品
                        for (var i = 0; i < dishesArray.length; i++) {
                            // 循环对比分类
                            for (var k in discountMenuTypeIds) {
                                // 如果当前优惠方案里面可折扣分类id == 当前菜品分类id
                                if (discountMenuTypeIds[k].menu_type_id == dishesArray[i].menu_type_id) {
                                    // 如果当前优惠方案里面当前可折扣分类的菜品ids == all
                                    if (discountMenuTypeIds[k].menu_ids == 'all') {
                                        // 可折扣金额+= 当前菜品的金额
                                        discountMoney += parseFloat(dishesArray[i].menu_price) * parseFloat(dishesArray[i].menu_num);
                                    } else {
                                        // 否则取到当前优惠方案里面可折扣分类的菜品ids的长度
                                        var leng = discountMenuTypeIds[k].menu_ids.split(',').length;
                                        // 循环当前优惠方案可折扣分类的所有菜品
                                        for (var t = 0;t<leng;t++) {
                                            // 如果当前优惠方案可折扣分类的当前菜品 == 当前菜品
                                            if (discountMenuTypeIds[k].menu_ids.split(',')[t] == dishesArray[i].menu_id) {
                                                // 可折扣金额+= 当前菜品的金额
                                                discountMoney += parseFloat(dishesArray[i].menu_price) * parseFloat(dishesArray[i].menu_num);;
                                            }
                                        }
                                    }
                                } /*else {
                                    alert('ttt');
                                }*/
                            }
                        }
                    }
                }
                return discountMoney;
            },

            // 选择优惠方案
            selectPromo: function () {
                // 选择优惠方案
                var _self = this;

                $.dialog = Dialog({
                    type: 3,
                    dom: '#edit-discount-dialog',
                    success: function() {
                        discountScroll.refresh();
                        $('#promoDisList').on('click','div[name="dis"]' , function() {
                            var self = this,
                                promo_id_t = $(self).attr('promo_id'),
                                isEnable = $(self).attr('is-enable'), //0灰色不可点，1可用
                                type = $(event.target).attr('data-type');
                            if (isEnable == 0) {
                                return;
                            } else {
                                // 选中当前的，取消其他的选中
                                $(this).find('span[name="select"]').addClass('subset_icon_chcked').end()
                                    .siblings('div[name="dis"]').find('span[name="select"]').removeClass('subset_icon_chcked');


                                // 最低消费
                                var lowConsumption = payorderInfo.promo[promo_id_t].low_consumption;
                                // 转换为两位小数,因为返回的是字符串
                                lowConsumption = parseFloat(lowConsumption);

                                // 计算出用来判断是否满额的金额
                                var wxpayCalculation = promo_id_t == '' ? 0 : _self.full_judge(promo_id_t);

                                // 如果合计银台应付金额小于最低消费，说明不满足使用这个折扣优惠方案
                                if (wxpayCalculation < lowConsumption){
                                    if (promoId != '') {
                                        $('#promoDisList').find('div[promo_id="'+conflict_pay_info['promo_id']+'"]').find('span[name="select"]').addClass('subset_icon_chcked');
                                    } else {
                                        discountAmount = 100;
                                        promoId = '';
                                        canusePromoId = '';
                                    }
                                    //alert('不满足最低消费额,不能使用此折扣');
                                    Message.show('#msg', '不满足最低消费额！请选择其他优惠', 2000);
                                    // 取消选中优惠方案
                                    $(self).find('span[name="select"]').removeClass('subset_icon_chcked');
                                } else {// 满足当前折扣优惠方案
                                    // 判断如果支付过，并且有自动优惠方案或者点击选择优惠方案的时候，优惠方案跟支付方式或会员价或会员折扣有冲突，就不能选择
                                    // 是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                                    if (

                                        // isHasPay == true && payorderInfo.promo[promo_id_t] != undefined && 
                                        isHasPay == true && payorderInfo.pay_info.promo_id != '' && payorderInfo.pay_info.promo_id != promo_id_t
                                        /*(
                                        (payorderInfo.pay_info.is_member_price == 1 && payorderInfo.promo[promo_id_t].is_member_price == 0) ||
                                        (payorderInfo.pay_info.discount_rate != 100 && payorderInfo.promo[promo_id_t].is_member_discount == 0) ||
                                        (payorderInfo.pay_info.stored != 0 && (payorderInfo.promo[promo_id_t].pay_type['all'] == 0 || payorderInfo.promo[promo_id_t].pay_type['ct0000000003'] == 0)) ||
                                        (payorderInfo.pay_info.voucher != 0 && (payorderInfo.promo[promo_id_t].pay_type['all'] == 0 || payorderInfo.promo[promo_id_t].pay_type['ct0000000004'] == 0))
                                            )*/
                                        ) {
                                        if (promoId != '') {
                                            $('#promoDisList').find('div[promo_id="'+conflict_pay_info['promo_id']+'"]').find('span[name="select"]').addClass('subset_icon_chcked');
                                        } else {
                                            discountAmount = 100;
                                            promoId = '';
                                            canusePromoId = '';
                                        }
                                        // 取消选中优惠方案
                                        $(self).find('span[name="select"]').removeClass('subset_icon_chcked');
                                        Message.show('#msg', '已经支付过的订单，不能再变更优惠方式！', 2000);
                                        return;
                                    } else {
                                        //alert($(current).find('span[data-type="discount"]').text());
                                        // 获取到当前优惠方案  discountDishes()方法循环所有优惠方案得到当前优惠方案的折扣菜品
                                        var discountMenuTypeIds = payorderInfo.promo[promo_id_t].discount_menu_type_ids;
                                        // json字符从转成数组eval
                                        //discountMenuTypeIds = eval('('+discountMenuTypeIds+')');
                                        
                                        // 调用方法得到，当前桌台所有菜品是否满足当前优惠方案所打折的金额，满足就选中当前优惠方案，并赋值
                                        discountMoney = _self.calculationDiscountMoney(dishesArray, discountMenuTypeIds);
                                        if (discountMoney == 0) {
                                            //displayMsgTime(ndPromptMsg, '此桌台中的菜品没有满足当前选中优惠方案的折扣！');
                                        } //else {
                                            // 折扣id
                                            promoId = promo_id_t;
                                            canusePromoId = promo_id_t;
                                            $('#discountPromo').text(payorderInfo.promo[promo_id_t].promo_name);
                                            $('#discountPromo').attr('promo_id', promo_id_t);
                                            // 折扣额度
                                            discountAmount = payorderInfo.promo[promo_id_t].discount_amount;
                                        //}
                                    }
                                }

                                // 关闭弹出层
                                $.dialog.close($.dialog.id);
                                // console.log('a21')
                                // 计算金额
                                //_self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                                // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                                _self.generate_choice_submit('');
                            }
                        });
                    }
                });

                // 点击选择优惠方案左上角返回
                $('#returnDisPayorder').unbind('click').bind('click', function() {
                    // 关闭弹出层
                    $.dialog.close($.dialog.id);
                });
            },

            // 计算出用来判断是否满额的金额
            full_judge: function (promo_id) {
                var self = this;

                var money_full = 0;

                // 是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                if (isHasPay == false) {
                    money_full = payorderInfo.consumes; // 未支付的时候用这个金额，因为如果取消会员折扣或者其他冲突之后应收金额会变化
                } else {
                    money_full = Util.accSubtr(payorderInfo.consumes, payorderInfo.pay_info.sub_user);// 支付过钱的时候用这个金额，因为如果付过钱会员优惠就不能变化了
                }


                // 现金
                var cash_full = payorderInfo.pay_info.cash;
                // 银行卡
                var card_full = payorderInfo.pay_info.card;
                // 乐币、抵用劵、微信
                var stored_full     = Util.accAdd(payorderInfo.pay_info.stored,($('#stored').val() == ''?0:$('#stored').val()));
                var voucher_full    = Util.accAdd(payorderInfo.pay_info.voucher,($('#voucher').text() == ''?0:$('#voucher').text()));
                var wxpay_full      = Util.accAdd(payorderInfo.pay_info.wxpay,($('#wxpay').val() == ''?0:$('#wxpay').val()));
                var wxpay_temp_full = payorderInfo.pay_info.wxpay_temp;
                var alipay_full     = Util.accAdd(payorderInfo.pay_info.alipay,($('#alipay').val() == ''?0:$('#alipay').val()));
                var alipay_temp_full = payorderInfo.pay_info.alipay_temp;
                // 自定义支付方式
                var pay_other_full = payorderInfo.pay_info.other;

                // 选择的优惠方案信息
                var promo_full = self.dishesStackHandle(payorderInfo.promo[promo_id], promo_full);


                // 支付方式配置 0排他 1实收算满额 2全额算满额 3全不算满额 
                
                if (pay_other_full != 0) {
                    money_full = parseFloat(Util.accAdd(money_full, pay_other_full));
                }

                // 如果这个优惠方案 没有折扣 && 没有立减 = 纯反卷 就计算满额，否则不计算满额用消费金额计算
                if (promo_full.discount_amount == 100 && promo_full.minus_amount == 0 && promo_full.give_voucher_id != '') {

                    if (promo_full.pay_type['all'] != undefined && promo_full.pay_type['all'] == 3) {
                        // 应收金额 = 应收金额 - 现金- 银行卡 - 乐币 - 抵用劵 - 微信 - 支付宝
                        money_full = Util.accSubtr(Util.accSubtr(Util.accSubtr(Util.accSubtr(Util.accSubtr(Util.accSubtr(Util.accSubtr(Util.accSubtr(money_full, cash_full), card_full), stored_full), voucher_full), wxpay_full), wxpay_temp_full), alipay_full), alipay_temp_full);
                    } else if (promo_full.pay_type['all'] != undefined && promo_full.pay_type['all'] == 1) {
                        // 应收金额 = 应收金额 + 现金 + 银行卡 - 乐币 - 抵用劵 + 微信 + 支付宝
                        money_full = Util.accAdd(Util.accAdd(Util.accAdd(Util.accAdd(Util.accSubtr(Util.accSubtr(Util.accAdd(Util.accAdd(money_full, cash_full), card_full), stored_full), voucher_full), wxpay_full), wxpay_temp_full), alipay_full), alipay_temp_full);
                    } else if (promo_full.pay_type['all'] != undefined && promo_full.pay_type['all'] == 2) {// 全部算满额
                        // 应收金额 = 应收金额 + 现金 + 银行卡 + 乐币 + 抵用劵 + 微信
                        //money_full = accAdd(accAdd(accAdd(accAdd(accAdd(accAdd(money_full, cash_full), card_full), stored_full), voucher_full), wxpay_full), wxpay_temp_full);
                    } else {
                        if (promo_full.pay_type['ct0000000001'] != 3) {
                            money_full = parseFloat(Util.accAdd(money_full, cash_full));
                        }
                        if (promo_full.pay_type['ct0000000002'] != 3) {
                            money_full = parseFloat(Util.accAdd(money_full, card_full));
                        }
                        if ((promo_full.pay_type['ct0000000003'] == 3 || promo_full.pay_type['ct0000000003'] == 1) && stored_full != 0) {
                            money_full = parseFloat(Util.accSubtr(money_full, stored_full));
                        } /*else {
                            money_full = parseFloat(accAdd(money_full, stored_full));
                        }*/
                        if ((promo_full.pay_type['ct0000000004'] == 3 || promo_full.pay_type['ct0000000004'] == 3) && voucher_full != 0) {
                            money_full = parseFloat(Util.accSubtr(money_full, voucher_full));
                        } /*else {
                            money_full = parseFloat(accAdd(money_full, voucher_full));
                        }*/
                        if (promo_full.pay_type['ct0000000005'] == 3 && (wxpay_full != 0 || wxpay_temp_full != 0)) {
                            money_full = parseFloat(Util.accSubtr(Util.accSubtr(money_full, wxpay_full), wxpay_temp_full));
                        } /*else {
                            money_full = parseFloat(accAdd(accAdd(money_full, wxpay_full), wxpay_temp_full));
                        }*/
                        if (promo_full.pay_type['ct0000000006'] == 3 && (alipay_full != 0 || alipay_temp_full != 0)) {
                            money_full = parseFloat(Util.accSubtr(Util.accSubtr(money_full, alipay_full), alipay_temp_full));
                        }
                    }
                }

                return money_full;
            },

            // 无会员价，计算会员价优惠
            calcu_member_price: function(order_info, discount) {
                //计算金额
                var menu_money_info = {
                    'consumes': '0', //消费金额汇总
                    'sub_user_price': '0', //会员价优惠
                    'sub_user_discount': '0', //会员折扣优惠
                    'sub_user': '0', //会员优惠
                    'pay_sub_moneys': '0', //优惠金额汇总
                    'pay_moneys': '0' //实收金额汇总              
                };

                var member_price = 0,
                    discount_rate = 100,
                    menu_price = 0,
                    _consume = 0,
                    _sub_user_price = 0,
                    _sub_user_discount = 0;

                //菜品优惠处理
                for (var i in order_info['menu']) {
                    for (var j in order_info['menu'][i]) {

                        //会员价
                        member_price = order_info['menu'][i][j]['member_price'];

                        //折扣额度：会员折扣额度
                        discount_rate = (order_info['menu'][i][j]['is_discount'] == 0) ? '100' : discount;

                        //折扣额度：优惠方案折扣额度
                        var discount_amount = '100';

                        //取消的订单不算入优惠金额
                        if (payorderInfo.order[i].order_step != 0) {
                            //菜品金额计算
                            _consume = parseFloat(Util.accMul(order_info['menu'][i][j]['menu_price'], order_info['menu'][i][j]['menu_num']));
                            _sub_user_price = parseFloat(Util.accMul(Util.accSubtr(order_info['menu'][i][j]['menu_price'], member_price), order_info['menu'][i][j]['menu_num']));


                            // （单价 - （单价 * 折扣额度）） * 数量 （会员折扣）
                            var user_discount_money = Util.accMul(member_price, Util.accDiv(discount_rate, 100));
                            if (user_discount_money.toString().indexOf('.') != -1) {
                                user_discount_money = parseFloat('0.' + user_discount_money.toString().split('.')[1].substring(0, 2)) + parseInt(user_discount_money);
                            }

                            _sub_user_discount = Util.accMul(Util.accSubtr(member_price, user_discount_money), order_info['menu'][i][j]['menu_num']);
                            if (_sub_user_discount.toString().indexOf('.') != -1) {
                                _sub_user_discount = parseFloat('0.' + _sub_user_discount.toString().split('.')[1].substring(0, 2)) + parseInt(_sub_user_discount);
                            }


                            var _sub_money = 0;

                            var _sub_user = parseFloat(Util.accAdd(_sub_user_price, _sub_user_discount));
                            var _pay_sub_moneys = parseFloat(Util.accAdd(_sub_money, _sub_user));
                            var _pay_moneys = parseFloat(Util.accSubtr(_consume, _pay_sub_moneys));

                            menu_money_info['consumes'] = parseFloat(Util.accAdd(menu_money_info['consumes'], _consume));
                            menu_money_info['sub_user_price'] = parseFloat(Util.accAdd(menu_money_info['sub_user_price'], _sub_user_price));
                            menu_money_info['sub_user_discount'] = parseFloat(Util.accAdd(menu_money_info['sub_user_discount'], _sub_user_discount));
                            menu_money_info['sub_user'] = parseFloat(Util.accAdd(menu_money_info['sub_user'], _sub_user));
                            menu_money_info['pay_sub_moneys'] = parseFloat(Util.accAdd(menu_money_info['pay_sub_moneys'], _pay_sub_moneys));
                            menu_money_info['pay_moneys'] = parseFloat(Util.accAdd(menu_money_info['pay_moneys'], _pay_moneys));
                        }
                    }
                }

                // 下面这个公式是应对，当优惠金额出现三位小数（15.667）的时候，只取15.66，如果用toFixed(2)的话就会四舍五入变成15.67，所以用下面这个公式
                if (menu_money_info['sub_user'].toString().indexOf('.') != -1) {
                    menu_money_info['sub_user'] = parseFloat('0.' + menu_money_info['sub_user'].toString().split('.')[1].substring(0, 2)) + parseInt(menu_money_info['sub_user']);
                }

                return menu_money_info;
            },

            //再来一单
            clickAnother: function(shopname, ordertypeinfo, shopId) {
                // 获取到的菜品数据，转格式为点餐缓存可以接受的格式
                var menu = payorderInfo.menu;
                var set_menu = payorderInfo.set_menu;
                var orderId = $(this).attr('mengorder_id')
                Cache.set('shop_type_info', ordertypeinfo);
                var allMenuData = {};
                for (var i in menu[orderId]) {
                    if (menu[orderId][i].order_id == mengorder_id) {
                        var dishes = payorderInfo.menu[orderId][i].menu_id
                        if (!dishes) {
                            var menuFlavor = menu[orderId][i].menu_flavor,
                                mneuNote = menu[orderId][i].menu_note,
                                menuIsDiscount = menu[orderId][i].is_discount == 0 ? 0 : 1,
                                menuIsHalf = menu[orderId][i].is_half == 1 ? 1 : 0,
                                menuIsOff = menu[orderId][i].is_off == 0 ? 0 : 1,
                                menuIsInput = menu[orderId][i].is_input == 0 ? 0 : 1,
                                menuIsSetMenu = menu[orderId][i].is_set_menu == 0 ? 0 : 1; // 是否套餐 1是 0否
                            //alert(menu[orderId][i].is_half);
                            dishes = {};
                            dishes.id = menu[orderId][i].menu_id;
                            dishes.type = menu[orderId][i].menu_type_id;
                            dishes.info = menu[orderId][i].menu_info;
                            dishes.name = menu[orderId][i].menu_name;
                            dishes.unit = menu[orderId][i].menu_unit;
                            dishes.count = parseFloat(menu[orderId][i].menu_num);
                            dishes.price = parseFloat(menu[orderId][i].menu_price * menu[orderId][i].menu_num);
                            dishes.flavor = '';
                            dishes.note = '';
                            dishes.dishesPrice = Number(menu[orderId][i].menu_price);
                            dishes.half = menuIsHalf;
                            dishes.input = menuIsInput;
                            dishes.is_set_menu = menuIsSetMenu; // 是否套餐 1是 0否
                            dishes.flavorObj = {};
                            dishes.noteObj = {};
                            dishes.set_menu_info = {}; // 套餐菜品内包含菜品
                        }

                        for (var n in menu[orderId][i].menu_flavor) {
                            var flavor = menu[orderId][i].menu_flavor[n].flavor_name;
                            var flavorId = n;
                            if (flavor && !dishes.flavorObj[flavor]) {
                                dishes.flavorObj[flavor] = {};
                                dishes.flavorObj[flavor].id = dishes.id;
                                dishes.flavorObj[flavor].flavor_id = flavorId.substr(flavorId.length - 1, 1);
                                dishes.flavorObj[flavor].flavor = flavor;
                                dishes.flavorObj[flavor].flavor_name = flavor;
                                dishes.flavorObj[flavor].flavor_count = parseFloat(data[orderId].menu[i].menu_flavor[n].flavor_count);
                                dishes.flavorObj[flavor].flavor_price = 0;
                            }
                        }

                        for (var k in menu[orderId][i].menu_note) {
                            var note = menu[orderId][i].menu_note[k];
                            if (note && !dishes.noteObj[note]) {
                                dishes.noteObj[note] = {};
                                dishes.noteObj[note].note = note;
                                dishes.noteObj[note].note_name = note;
                                dishes.noteObj[note].is_checked = 1; //0：不选中，1：选中
                            }
                        }

                        var num1 = 0;
                        // 套餐菜品缓存处理
                        var g = data.menu[i][f].menu_id;
                        var dishesOne = '';
                        for (var p in data.set_menu[i][g]) {
                            dishes.set_menu_info[num1] = {};
                            if (p == data.menu[i][f].menu_no) {
                                for (var h in data.set_menu[i][g][p]) {
                                    dishes.set_menu_info[num1][w] = {};
                                    dishes.set_menu_info[num1][w][0] = {};
                                    dishes.set_menu_info[num1][w][0].is_choose = '1';
                                    dishes.set_menu_info[num1][w][0].menu_id = data.set_menu[i][g][p][h].menu_id;
                                    dishes.set_menu_info[num1][w][0].menu_name = data.set_menu[i][g][p][h].menu_name;
                                    dishes.set_menu_info[num1][w][0].menu_num = data.set_menu[i][g][p][h].menu_num;
                                    // 口味备注
                                    dishes.set_menu_info[num1][w][0].menu_flavor = {};
                                    for (var e in data.set_menu[i][g][p][h].menu_flavor) {
                                        dishes.set_menu_info[num1][w][0].menu_flavor[e] = {};
                                        dishes.set_menu_info[num1][w][0].menu_flavor[e].flavor_name = data.set_menu[i][g][p][h].menu_flavor[e].flavor_name;
                                        dishes.set_menu_info[num1][w][0].menu_flavor[e].is_choose = '1';
                                    }
                                    dishes.set_menu_info[num1][w][0].menu_note = {};
                                    for (var t in data.set_menu[i][g][p][h].menu_note) {
                                        dishes.set_menu_info[num1][w][0].menu_note[t] = {};
                                        dishes.set_menu_info[num1][w][0].menu_note[t].note_name = data.set_menu[i][g][p][h].menu_note[t];
                                        dishes.set_menu_info[num1][w][0].menu_note[t].is_choose = '1';
                                    }
                                }
                            }
                            num1++;
                        }

                        allMenuData[order[orderId].menu[i].menu_id] = dishes;
                    }
                }

                Cache.set(card_id + '-allmenu', allMenuData);
                Page.open('dishes&card_id=' + card_id + '&shop_id=' + shopId + '&shop_name=' + shopname + '&page=orderlist&again=1');
            },
            // 对返回的点评数据进行判断校验
            getOrderComment: function(data) {
                //alert(comment.list.length);
                if (data) {
                    if (!(data.star_1 == '0' && data.star_2 == '0' && data.list.length == 0)) {

                        if (!(data.star_1 == '0' && data.star_2 == '0')) {
                            $('#comments-caption').removeClass('hide');
                        }

                        if (data.star_1 > '0') {
                            $('#j-service').attr('src', '../img/base/star_' + data.star_1 + '.png').parent('p').removeClass('hide');
                        }

                        if (data.star_2 > '0') {
                            $('#j-quality').attr('src', '../img/base/star_' + data.star_2 + '.png').parent('p').removeClass('hide');
                        }

                        if (data.list.length > 0) {
                            // 暂无点评隐藏出来
                            $('#zanwu').addClass('hide');
                            $('#j-comments-list').html(this.processCommentData(data.list));
                        } else {
                            // 评星隐藏起来
                            //$('#comments-caption').addClass('hide');
                            // 暂无点评显示出来
                            //$('#zanwu').removeClass('hide');
                        }
                    } else {
                        // 暂无点评显示出来
                        $('#zanwu').removeClass('hide');
                    }
                    scroll.refresh();
                }
            },
            // 处理点评数据
            processCommentData: function(data) {
                var content = '';
                var hideOrShow = 'hide'
                for (var i in data) {
                    var nickname = data[i].nickname;
                    // is_reply 0 用户点评  1 回复用户
                    if (data[i].is_reply == 1) {
                        nickname = data[i].nickname + '回复';
                        hideOrShow = ''
                    } else {
                        hideOrShow = 'hide'
                    }
                    var smallpic = '';
                    var num = 0;
                    var imgNum = -1
                    for (var p in data[i].pic.small) {
                        imgNum++
                        num++;
                        if (num > 3) {
                            break;
                        }
                        smallpic +=
                            '<div class="pica">' +
                            '<img imgNum="' + imgNum + '" comment_id="' + data[i].comment_id + '" src="../img/business/' + card_id + '/comment' + data[i].pic.small[p] + '" />' +
                            (num == 3 ?
                                '<span class="circle_wrap">' + data[i].pic.small.length + '</span>' : '') +
                            '</div>'
                    }
                    content += '<li class="commentli clearfix" comment-id="' + data[i].comment_id + '">' +
                        '<div class="comment-border ' + hideOrShow + '">' +
                        '<div class="comment-who">' + nickname + '</div>' +
                        '</div>' +
                        '<div class="comment-txt">' + data[i].content + '</div>' +
                        (data[i].is_reply == 0 ?
                            '<div class="photo_list clearfix">' +
                            smallpic +
                            '</div>' : '') +
                        '<div class="comment-title">' + Util.getLocalTimeDate(data[i].add_time) +
                        '<span class="myping" >' + '<div class="comment-del" data-type="delete"></div>' + '</span>' +
                        '</div>' +
                        '</li>';
                }
                return content;
            },

            // 显示菜品数据
            menuList: function(data, user_num1, is_chopsticks_t1) {
                //cancel_code 取消状态：1门店桌台被占用 2服务员取消订单 3退单
                var cancelCode = {
                        0: '',
                        1: '(门店桌台被占用)',
                        2: '(服务员取消订单)',
                        3: '(退单)',
                        5: '(外卖退单)',
                        7: '(微信支付超时)',
                        8: '(门店当前未营业)',
                        9: '(用户取消订单)'
                    }
                    //order_step  订单状态：1下单 2到店  3确认出单 9已结账 0门店取消订单
                var payName = {
                    1: '已下单',
                    2: '已到店',
                    3: '确认出单',
                    9: '已结账',
                    0: '已取消'
                }
                var contentMain = ''; // 全部订单
                var content = ''; // 单个订单<li class="state"><p><u>'+Util.getDate()+'</u><u>进行中</u></p></li>
                var contentRe = ''; // 套餐菜
                var menu_unit = '';
                var menu_list = ''; //普通菜品数据
                var tableware = ''; //特殊商品
                var order1 = '';
                var order2 = '';

                // 菜品数量
                var mneuNum = 0;
                var num99 = '';

                var quxiao = 1; //1是已取消，

                var exit_step_money = 0; // 取消订单金额
                var ex_order_menu_consume = 0; // 订单金额



                for (var i in data.order) {
                    if (data.order[i].order_step != 0) {
                        quxiao = 0;
                    }
                    if (data.order[i].order_step == 0) {
                        exit_step_money = exit_step_money + parseFloat(data.order[i].consume);
                    }
                    ex_order_menu_consume = ex_order_menu_consume + parseFloat(data.order[i].consume);
                }

                if (exit_step_money == 0) {
                    $('#order_money_disp,#exit_step_disp').addClass('hide');
                } else {
                    $('#order_money_disp,#exit_step_disp').removeClass('hide');
                    // 订单金额
                    $('#order_menu_consume').text(parseFloat(ex_order_menu_consume).toFixed(2));
                    // 取消订单金额
                    $('#exit_step_money').text(parseFloat(exit_step_money).toFixed(2));
                }

                dishesArray = {};// 存储菜品数组
                // 数组循环变量
                var dishesNum = 0;

                //已取消订单CLASS样式
                var yiquxiao = ''
                var yiquxiaoul = ''
                for (var i in data.order) {
                    if (data.order[i].order_step == 0) {
                        yiquxiao = 'quxiao'
                        yiquxiaoul = 'quxiaoul'
                    } else {
                        yiquxiao = 'hide'
                        yiquxiaoul = ''
                    }
                    var consume_t = data.order[i].consume;
                    if (i == 'new_order' && is_first_single == 1) {
                        consume_t = $('#consume').text();
                    }
                    contentMain = contentMain + '<ul class="mengul clearfix ' + yiquxiaoul + '">' +
                        '<li class="' + yiquxiao + '"><img src="../img/base/yiquxiao.png" alt="" /></li>' +
                        '<li style="border-bottom:1px dashed #dcdcdc" class="state">' +
                        '<p>' +
                        '<u>' + (data.order[i].add_time == undefined ?
                            Util.getDate() :
                            Util.getLocalTimeDate(data.order[i].add_time)) + '</u>' +
                        (i == 'new_order' ? '' :
                            '<u>' + (data.order[i].order_step == 0 ? '' : payName[data.order[i].order_step]) +
                            '<b style="color:#fb5555; font-size:12px;" >' + cancelCode[(data.order[i].cancel_code == undefined ? 0 : data.order[i].cancel_code)] + '</b>' +
                            '</u>' +
                            '</p>' +
                            '<p>' +
                            '<u>' + data.order[i].order_id + '</u>') +
                        '<u><i></i><i>' + consume_t + '</i></u>' +
                        '</p>' +
                        '</li>';
                    // 单个订单，套餐菜清空
                    content = '';
                    contentRe = '';
                    menu_list = '';
                    tableware = '';
                    var package_meal = 0,
                        package_menu = '';

                    for (var f in data.menu[i]) {
                        dishesArray[dishesNum] = data.menu[i][f];


                        if (i == 'new_order') {
                            // 根据选择的就餐人数赋值
                            if ((data.menu[i][f].special_type == 1 && order_property == 1) || (data.menu[i][f].special_type == 2 && (order_property == 2 || order_property == 3))) {
                                mneuNum = user_num;
                            } else {
                                mneuNum = data.menu[i][f].menu_num;
                            }
                        } else {
                            mneuNum = (parseFloat(data.menu[i][f].menu_num) + parseFloat(data.menu[i][f].give_menu_num) + parseFloat(data.menu[i][f].cancel_menu_num) + parseFloat((data.menu[i][f].rotate_menu_num == undefined ? 0 : data.menu[i][f].rotate_menu_num)));
                        }

                        var flavorContent = '';
                        for (var j in data.menu[i][f].menu_flavor) {
                            flavorContent += ' — ' + data.menu[i][f].menu_flavor[j].flavor_name + ' x ' + parseFloat(data.menu[i][f].menu_flavor[j].flavor_count) + '<br>';
                        }
                        var noteContent = '';
                        for (var k in data.menu[i][f].menu_note) {
                            noteContent += data.menu[i][f].menu_note[k] + ' ';
                        }
                        if (data.menu[i][f].menu_unit == undefined || data.menu[i][f].menu_unit == '') {
                            menu_unit = '';
                        } else {
                            menu_unit = data.menu[i][f].menu_unit;
                        }


                        /*var is_bottom_pot = 0;    // 是否有必点锅底
                        var is_small_material = 0;  // 是否有必点小料
                        var is_cond_commodity = 0;// 是否有必点条件商品*/

                        if (data.menu[i][f].special_type == 6) {
                            is_bottom_pot = 1;
                        }
                        if (data.menu[i][f].special_type == 7) {
                            is_small_material = 1;
                        }
                        if (data.menu[i][f].special_type == 8) {
                            is_cond_commodity = 1;
                        }


                        var likedClass = ''; // 点赞按钮样式
                        var likedClick = ''; // 点击点赞按钮
                        var svgImage = ''; // svg 点赞图标
                        // 订单状态是3确认出单 或者 9已结账 并且菜品数量大于0（说明退、赠、转 没有把菜全部退、赠、转完） 满足条件的显示点赞按钮
                        if ((data.order[i].order_step == 3 || data.order[i].order_step == 9) && data.menu[i][f].menu_num > 0) {
                            // 判断菜品是否已经点赞 显示不同图标
                            if (data.menu[i][f].is_liked == 1) {
                                likedClass = 'pricespan';
                                likedClick = '';
                                svgImage = '<img  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABBCAYAAACZ1VmMAAAACXBIWXMAABcSAAAXEgFnn9JSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAmtJREFUeNrsnM1twkAQhdcWuVMCJZAOSAdw4BxSQaACQgWQCiBnLqSCmApCB3EH8T2X7IRBQvzOQxFes+9JDhGxIf40bz07O3biStZPt9v0L0O/tfWtzG9Lv03u5vPCBaSkZFAN//Lpt/qBPwuokQc2CQVWWvL3D4+Acvr+2AOdEtZaDcM+vVCAlQ0rN+4nwPqxw1oilvXA6tHC8oP3DIguAdWLObJET8C+j1HD8tEleZU1PWjGHlmiEZCbtaKGpZl65gJXGtD/khOWXQVh2dUkrP+d+sRbddipPnwZLwZJ7JHVrsK4Fgosa2a+ihqWJpnWwX0ZLSytIiC1qizmyJoiV0GdR5amWkkR1VRQSG61KHvIqJVgO6m7X1L1fI8Glg7kkO1Ci6zkSqBeNKIu1cKPV52bh6UrMz1XPRUazbJ2me/BOlNYyzcHRQBqF1pHrsSJnpSc0NgdX/DcSJbUB0ZQff3MW5AAu080mj6AA03A/Od+G+BXSTNJSp/Bg/paJTh35bslUH+T/RSY8W+r4eJTnjrKqjfCAnK9GhmYtJK0iZFltKD8ICxgXkpYRgsSFmBBwgIsSFiABQkLsCBhARYkrNPKdut3hGW0IGEBFiSsE6AO3WRFWId1cI2SsIwWJCzAgoQFWJCwAAsSFmBBwgIsSFiABQkLsCBhARYkLMCChAVYkLAAC25gFWRl61dN3WWNrfkNgZpZn3kjsEZgdGXn2iW1ub8KQAsH3J+d6ok/GCNMIFi7hgcVgDVC+mT3upW1sX9z58P277KGBllWe1WnAdsPeabEVVq7W27ditkOBJJE0uslj5r6FWAA8Ce+FKK+F0UAAAAASUVORK5CYII="/>';
                            } else {
                                likedClass = 'pricespan';
                                likedClick = '';
                                svgImage = '<img data-type="liked" order_id="' + data.order[i].order_id + '" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABBCAYAAACZ1VmMAAAACXBIWXMAABcSAAAXEgFnn9JSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA19JREFUeNrsnN1x2kAQx08MeQ7pACqI3AGuIPKDnw0VGCogVACuAHj2A6QC5ApMB1YH0Xsekl28N97R6ONWnkFHbnfm5oATQvfT/vc+UWQ6tj/39zFkC0gJfZRCeoG0/vL8nBuPLOoY1BCyV0iDkmIEtQRga19g9Tr+/QWBQm8aQfoGaUrv8fMVAN2oZ7171hGyMaRb8KC0UDZDWPR2C+XT0D0ro/xHsYDkZwFNCF7QsF4YjEEJsC1kcyvZsmOCgUUwMopPi4pj1iyGTUL2LMOkNgPPSSqO2VH+EDQsCuxr1jqW2YHyOHTPQltaGNT3KgLNbWMA5eOgYREM23UYNrScwXsWhzE2nppPsHLjufkEK2YDaYXVYMOG8oHC+ph9GLKuRKXn1ZQH41lJnQRpzqvzuOYLLNsz/9UQz05Bw6JOZkxes6047Hth4B0eLJpFsJN7TzXTyIkPLWXXnrWhwJ6x8WGb4H8R63fkUTGBsvK7c/CqQ9cho9+B7HBmYcZaN5xSPn0i+P9/MqRA/spAYTC/qQNFEoyD8iyo9E/zMVeF8WnqGH8mFpQPa4j9C4DasEqjN81bVDyB8/ztYGCP3oxrl+cZkahEKpVTKPZLLUFNac69bUPQ5WwINkBpRBeFFVo5DFZxSX3uWFG+7icG5UlnecVa7JuIPjyyeJJVjPhjCTA472/63tynJfgWrfeR6r5FWHvqy9Su+pL32d72qE6S7AagdEfmio1CAbbieY91+pZ1XyIZ2WZ+6Phbmbl+s4rKegyGS8VyE549Ur7rGTXj2ilWWA39O8pPqDyFVW92XLrzYYrmaiSosAQSVFgCCSosgQQVlkCCCksgQYUlkKDCqpdgWhwCKixHCSosgQQVVrUESxdIFFa5BEvXKBWWowQVlkCCCksgQYUlkKDCEkhQYQkkqLCMbKeOepajBBWWQILBw5JuluupBN0kqLCE+1URVs5cUiXYAMseuK8DRltvxvQ2c7wmn2+A3T61dd22GVU8DyZlr/EvIF/N+3bH86NQ4OS3DnfujWB58bSPwrXZXYnnHX2u2z8j5jX8SUNVhhDvXO4EPXZgb++eYRtZPQGFJtqVGJWcjG+J5K9xDe0gvLAJc3ffTOzx0QXuJMa5RwevvZShdz+12ef6T4ABAGYQXQUiETnhAAAAAElFTkSuQmCC"/>';
                            }
                        } else {
                            likedClass = 'pricespan';
                            likedClick = '';
                            svgImage = '';
                        }
                        if (order_property == 1) {
                            if (data.menu[i][f].special_type == 1) {
                                package_meal += 1;
                            }
                        }
                        if (order_property == 2 || order_property == 3) {
                            if (data.menu[i][f].special_type == 2) {
                                package_meal += 1;
                            }
                        }

                        // 如果勾选了自备餐具 并且 是堂食 有堂食餐包则不选中
                        if ((is_chopsticks_t == 1 || user_num == 0) && order_property == 1 && data.menu[i][f].special_type == 1) {
                            continue;
                        }
                        if ((is_chopsticks_t == 1 || user_num == 0) && (order_property == 2 || order_property == 3) && data.menu[i][f].special_type == 2) {
                            continue;
                        }
                        // is_set_menu 是否套餐，1是 0否
                        if (data.menu[i][f].is_set_menu == 0) {
                            // console.log('lol');
                            order1 = '<li style="color:#666;" class="clearfix" menu-id="' + data.menu[i][f].menu_id + '">' +
                                '<span class="mengspan">' + data.menu[i][f].menu_name + '</span>' +
                                '<span class="mengspan">' +
                                '<b class="' + likedClass + '" ' + likedClick + '>' + parseFloat((data.pay_info.is_pay == 1 ? data.menu[i][f].menu_pay_price : data.menu[i][f].menu_price)).toFixed(2) + '</b>' +
                                '<u class="twou"><i></i><i>' + parseFloat(mneuNum) + menu_unit + '</i></u>' +
                                '<u class="oneu">' + svgImage + '</u>' +
                                '<i></i>' +
                                '</span>' +
                                (data.menu[i][f].menu_flavor == undefined || data.menu[i][f].menu_flavor == '' ? '' :
                                    '<p class="order-infokouwei">' + flavorContent + '</p>') +
                                (data.menu[i][f].menu_note == undefined || data.menu[i][f].menu_note == '' ? '' :
                                    '<p>备注：' + noteContent + '</p>') +
                                '</li>';
                            if (data.menu[i][f].special_type >= 1 && data.menu[i][f].special_type <= 5 && is_first_single == 1) {
                                tableware += order1;
                            } else {
                                content += order1;
                            }
                        } else {
                            var g = data.menu[i][f].menu_id;
                            var dishesOne = '';
                            for (var p in data.set_menu[i][g]) {
                                if (data.menu[i][f].menu_no == '' || data.menu[i][f].menu_no == undefined) {
                                    num99 = 0;
                                } else {
                                    num99 = data.menu[i][f].menu_no;
                                }
                                if (p == num99 || i == 'new_order') {
                                    dishesOne = '';
                                    for (var h in data.set_menu[i][g][p]) {
                                        var num11 = 0;
                                        var flavorOne = '<p class="order-infokouwei" style="padding-left:10%">';
                                        for (var e in data.set_menu[i][g][p][h].menu_flavor) {
                                            flavorOne += ' — ' + data.set_menu[i][g][p][h].menu_flavor[e].flavor_name + ' x ' + parseFloat(data.set_menu[i][g][p][h].menu_flavor[e].flavor_count) + '<br/>';
                                            num11++;
                                        }
                                        flavorOne += '</p>';
                                        if (num11 == 0) {
                                            flavorOne = '';
                                        }

                                        num11 = 0;
                                        var noteOne = '<p>备注：';
                                        for (var r in data.set_menu[i][g][p][h].menu_note) {
                                            noteOne += data.set_menu[i][g][p][h].menu_note[r] + ' ';
                                            num11++;
                                        }
                                        noteOne += '</p>';
                                        if (num11 == 0) {
                                            noteOne = '';
                                        }
                                        var menu_unitOne = '';
                                        if (data.set_menu[i][g][p][h].menu_unit == undefined || data.set_menu[i][g][p][h].menu_unit == '') {
                                            menu_unitOne = '份';
                                        } else {
                                            menu_unitOne = data.set_menu[i][g][p][h].menu_unit;
                                        }
                                        dishesOne += '<p class="dishName" style="color:#a8a8a8;font-size: 13px;width: 94%;padding-left: 1em;">' + data.set_menu[i][g][p][h].menu_name +
                                            '<i>' + parseFloat(data.set_menu[i][g][p][h].menu_num) + menu_unitOne + '<span></span></i>' +
                                            '</p>' + flavorOne + noteOne;
                                    }
                                    order2 = '<li class="clearfix" menu-id="' + data.menu[i][f].menu_id + '">' +
                                        '<span class="mengspan">' + data.menu[i][f].menu_name + '</span>' +
                                        '<span class="mengspan">' +
                                        '<b class="pricespan">' + parseFloat((data.pay_info.is_pay == 1 ? data.menu[i][f].menu_pay_price : data.menu[i][f].menu_price)).toFixed(2) + '</b>' +
                                        '<u class="twou"><i></i><i></i></u>' +
                                        '<u class="oneu">' + svgImage + '</u>' +
                                        '<i></i>' + // menu_sell_price
                                        '</span>' +
                                        dishesOne +
                                        '</li>';
                                    if (data.menu[i][f].special_type >= 1 && data.menu[i][f].special_type <= 5 && is_first_single == 1) {
                                        tableware += order2;
                                    } else {
                                        content += order2;
                                    }

                                }
                            }
                        }
                        // 如果增菜个数大于0，就在页面上显示着一条记录
                        if (data.menu[i][f].give_menu_num > 0) {
                            contentRe += '<li class="clearfix">' +
                                data.menu[i][f].menu_name + 'x' + parseFloat(data.menu[i][f].give_menu_num) +
                                '<div class="tuizeng">赠</div>' +
                                '<span>0/' + menu_unit + '</span>' +
                                '</li>';
                        }
                        // 如果退菜个数大于0或者转菜个数大于0，就在页面上显示着一条记录
                        if (data.menu[i][f].cancel_menu_num > 0 || data.menu[i][f].rotate_menu_num > 0) {
                            contentRe += '<li class="clearfix">' +
                                data.menu[i][f].menu_name + 'x' + (parseFloat(data.menu[i][f].cancel_menu_num) + parseFloat((data.menu[i][f].rotate_menu_num == undefined ? 0 : data.menu[i][f].rotate_menu_num))) +
                                '<div class="tuizeng">退</div>' +
                                '<span>' + parseFloat((data.pay_info.is_pay == 1 ? data.menu[i][f].menu_pay_price : data.menu[i][f].menu_price)).toFixed(2) + '/' + menu_unit + '</span>' +
                                '</li>';
                        }
                    }
                    if (package_meal < 1 && is_first_single == 1 && is_meal_package == 1) {
                        if (is_chopsticks_t == 0 && user_num > 0) {
                            var package = Cache.get('meal_package');
                            // var user_num1 = (user_num1 != undefined) ? user_num1 : package.menu_scope;
                            var hide = is_chopsticks_t1 == 0 ? '' : 'hide';
                            package_menu = '<li style="color:#666;" class="clearfix ' + hide + '" menu-id="' + package.menu_id + '">' +
                                '<span class="mengspan">' + package.menu_name + '</span>' +
                                '<span class="mengspan">' +
                                '<b class="pricespan">' + parseFloat(package.menu_price).toFixed(2) + '</b>' +
                                '<u class="twou"><i></i><i>' + parseFloat(user_num) + '份</i></u>' +
                                '<u class="oneu">' + svgImage + '</u>' +
                                '</li>';
                        }
                    }

                    var orderNote = contentRe + (data.order[i].order_note == '' ? '' : '<li style="border:0;" class="clearfix">' +
                            '备&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;注：' +
                            '<input class="orderNote" type="text" readonly="readonly" id="" placeholder="选填，添加备注" data-description="选填，添加备注">' +
                            '</li>') +
                        (data.pay_info.is_pay == 0 && data.order[i].order_step == 0 ? '<p class="anotherOneP"><span shop-id="' + data.shop_id + '" shop-name="' + data.pay_info.shop_name + '" ordertypeinfo="' + data.order[i].order_type_info + '" mengorder_id="' + data.menu[i][f].order_id + '" data-type="buy" id="" class="anotherOne">再来一单</span></p>' : '') +
                        '</ul>';
                    if (tableware != '') tableware = '<span class="dishedLine"></span>' + tableware;
                    contentMain = contentMain + content + tableware + package_menu + orderNote;
                }
                $('#menuList').html(contentMain);
                scroll.refresh();

                if (is_co == 0) {
                    // 判断如果是订单支付成功、微信支付成功callback后，到详情指定位置发表点评的位置
                    if (is_comm == 1) {
                        setTimeout(function() {
                            $('#menuDispaly span[type="comments-content"]').click();
                        }, 300);
                    } else if (is_comm == 2) {
                        setTimeout(function() {
                            $('#menuDispaly span[type="orderInfoList"]').click();
                        }, 300);
                    }
                }
            },

            // 可用抵用劵列表填充
            voucherList: function(data, is_judge, moneysPro) {
                var content = '';

                // is_enable 0 灰色不可用，1 可选择
                //var className = 'vouchers-content';// 默认可用

                for (var i in data) {

                    /*if (data[i].is_enable == 0) {
                        className = 'vouchers-content-gq';
                    } else if (data[i].is_enable == 1) {  
                        className = 'vouchers-content';
                    }*/

                    // is_judge == 1 的时候根据应付金额进行最低消费判断
                    if (is_judge == 1) {
                        if (moneysPro < data[i].low_consume) {
                            continue;
                        }
                    }

                    content += '<nav class="vouchers-content" is-enable="' + data[i].is_enable + '" record-id="' + data[i].record_id + '">' +
                        '<div class="' + (data[i].is_check == 0 ? '' : 'vorchers-check') + '" data-type="isNO"></div>' +
                        '<div class="vouchers-left">' +
                        '<div class="vorchers-explain-title">' + data[i].voucher_name + '</div>' +
                        '<div class="vorchers-explain-futitle">满' + parseInt(data[i].low_consume) + '元使用</br>' + data[i].shop_info + '</div>' +
                        '</div>' +
                        '<div class="vouchers-right">' +
                        '<div class="vorchers-right-title">' +
                        '<span></span>' +
                        '<b data-type="voucherMoney">' + parseInt(data[i].voucher_money) + '</b>' +
                        '</div>' +
                        '<div class="vorchers-right-futitle">' + Util.getLocalDate(data[i].start_time) +
                        '<p>-</p>' +
                        '<p>' + Util.getLocalDate(data[i].end_time) + '</p>' +
                        '</div>' +
                        '</div>' +
                        (data[i].is_enable == 1 ? '' :
                            '<div class="overdata-unavailable"></div>') +
                        '</nav>';
                }

                $('#voucherList').html(content);
                //alert($('#menuList').html());
                scroll.refresh();
                voucherScroll.refresh();
            },

            // 绑定页面事件
            bindEvents: function() {
                var self = this;

                // 点击菜品信息、订单点评、发表点评切换选中样式
                $('#menuDispalyTop span, #menuDispaly span').on('click', 'i', function(e) {
                    var type = $(this).parent().attr('type');
                    if (is_comment == 1 || (type == 'menuList' && $('#menuList').html() != '')) {
                        $("." + type).addClass('current').parent('span').siblings().children('i').removeClass('current');
                    }
                });
                // 点击1、菜品信息 2、订单点评 3、发表点评滑动到相应位置
                $('#headerMeng, #menuDispaly').on('click', 'span', function(e) {
                    var type = $(this).attr('type');

                    // 如果这三个下面都没有内容，不可点击// is_comment 是否显示点评
                    if ((type == 'menuList' && $('#menuList').html() == '')) {
                        return;
                    } else if ((type == 'orderInfoList' || type == 'comments-content') && is_comment == 0) {
                        return;
                    }

                    var total_height = $(window).height(); // 屏幕高度
                    var jump_top = $('#' + type).offset().top; // 跳转的位置距离顶部高度
                    var jump_height = $('#' + type).height(); // 跳转的内容高度

                    var menuList = $('#menuList').offset().top
                    var orderInfoList = $('#orderInfoList').offset().top
                    var comments_content = $('#comments-content').offset().top
                        //alert(orderInfoList)
                    if (type == 'menuList') {
                        //_self.scroll.scrollTo(0,menuList-100, 100, true);
                        // 这个地方的算法修改
                        // 如果 跳转的位置距离顶部高度 > 屏幕高度，滑动的高度 = 距顶高度 - 100
                        // 否则 跳转的位置距离顶部高度 <= 屏幕高度，滑动的高度 = 跳转的内容高度 - （屏幕高度 - 距顶高度）
                        if (menuList > total_height || menuList < 0) {
                            scroll.scrollTo(0, menuList - 120, 100, true);
                        } else {
                            menuList = jump_height - (total_height - jump_top);
                            if (menuList > 0) {
                                scroll.scrollTo(0, menuList + 50, 100, true);
                            }
                        }
                    } else if (type == 'orderInfoList') {
                        if (isWeixin) {
                            scroll.scrollTo(0, orderInfoList - 130, 100, true);
                        } else {
                            scroll.scrollTo(0, orderInfoList - 100, 100, true);
                        }
                    } else if (type == 'comments-content') {
                        if (isWeixin) {
                            scroll.scrollTo(0, comments_content - 130, 100, true);
                        } else {
                            scroll.scrollTo(0, comments_content - 100, 100, true);
                        }
                    }
                    //alert($('#orderInfoList').offset().top);
                    //_self.scroll.scrollTo(0, $('#menuList').height(), 100, true);
                });

                // 删除订单点评
                $('#j-comments-list').delegate('li', 'click', function(event) {
                    var self = this,
                        commentId = $(self).attr('comment-id'),
                        type = $(event.target).attr('data-type');

                    // 删除评论
                    if (type == 'delete') {
                        $.dialog = Dialog({
                            type: 2,
                            close: false,
                            content: '您确定要删除此评论吗?',
                            btn: ['取消', '确定'],
                            closeFn: function() {
                                Data.setAjax('commentDel', {
                                    'trade_type': trade_type,
                                    'card_id': card_id, // 会员卡id
                                    'comment_id': commentId,
                                    'cid': Cache.get('getCID')
                                }, '#layer', '#msg', { 200205: '' }, function(respnoseText) {
                                    if (respnoseText.code == 200205) {
                                        $(self).remove();
                                        //如果删除评论以后，没有评论了，就把“点评信息”这个条去掉
                                        if ($('#j-comments-list').find('li').size() == 0) {
                                            // 星级隐藏起来
                                            $('#comments-caption').addClass('hide');
                                            // 暂无点评显示起来
                                            $('#zanwu').removeClass('hide');
                                        }
                                    } else {
                                        Message.show('#msg', respnoseText.message, 2000);
                                    }
                                    scroll.refresh();
                                }, 2);
                            }
                        });
                    }
                });

                // 取消订单按钮点击事件
                $('#cancelOrder').unbind('click').bind('click', function() {
                    Data.setAjax('orderCancelOrder', {
                        'pay_id': OrderId,
                        'order_id': orderData.order_id,
                        'card_id': card_id, // 会员卡id
                        'cid': Cache.get('getCID'),
                        'trade_type': trade_type,
                    }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                        if (respnoseText.code == 20) {
                            Message.show('#msg', respnoseText.message, 2000, function() {
                                window.location.reload();
                            });
                        } else {
                            Message.show('#msg', respnoseText.message, 2000, function() {
                                window.location.reload();
                            });
                        }
                    }, 2);
                });
                // 去支付按钮（完成微信支付）点击事件
                $('#toPay').unbind('click').bind('click', function() {
                    /*if (!isWeixin) {
                        window.location.reload();
                    }*/

                    // 判断这个订单是微信公众号支付的还是app支付的，和当前使用是app还是微信进行对比
                    // trade_type 0浏览器 1app 2微信公众号
                    if ((isWeixin && orderData.trade_type == 2) || ($.app.isClient == true && orderData.trade_type == 1)) {
                        _self.requestWxpayjump(orderData.wxpay_data);
                    } else {
                        if (isWeixin) {
                            Message.show('#msg', '微信支付未完成，请在app完成支付！', 2000, function() {
                                return;
                            });
                        } else {
                            Message.show('#msg', '微信支付未完成，请在微信公众号完成支付！', 2000, function() {
                                return;
                            });
                        }
                    }
                });
                //点击放图片
                $('.pica img').on('click', function() {
                    var html = ''
                    var cid = $(this).attr('comment_id')
                    var imgNum = $(this).attr('imgNum')
                    $('.none').removeClass('none')
                    $('.zhu').addClass('swiper-container')
                    $('.swiper-container').height($(window).height())
                    for (var i in payorderInfo.order_comment.list) {
                        if (payorderInfo.order_comment.list[i].comment_id == cid) {
                            for (var p in payorderInfo.order_comment.list[i].pic.big) {
                                html +=
                                    '<div class="pica">' +
                                    '<img  src="../img/business/' + card_id + '/comment' + payorderInfo.order_comment.list[i].pic.big[p] + '" />' +
                                    '</div>'
                            }
                            $('.swiper-wrapper').html(html)
                            $('.swiper-wrapper').children('div').removeClass().addClass('swiper-slide')
                        }
                    }
                    mySwiper.slideTo(imgNum, 0, false); //切换默认slide，速度为0秒
                })
                $(document).ready(function() {
                    $("body").on("click", ".swiper-wrapper div", function() {
                        $(this).parent().parent('.swiper-container').parent().addClass('none')
                    });
                });
                // 点击点赞
                $('#menuList').delegate('li', 'click', function() {
                    var menuId = $(this).attr('menu-id');
                    var eveType = $(event.target).attr('data-type');
                    var order_id = $(this).find('img').attr('order_id');

                    // 点击点赞
                    if (eveType == 'liked') {
                        var self = this;

                        //alert(menuId);
                        Data.setAjax('commentLiked', {
                            'trade_type': trade_type,
                            'card_id': card_id, // 会员id
                            'order_id': order_id, // 订单id
                            'menu_id': menuId, // 菜品id
                            'cid': Cache.get('getCID'),
                            'pay_id': payorderInfo.pay_id
                        }, '#layer', '#msg', { 200207: '' }, function(respnoseText) {
                            orderData = respnoseText.data;
                            if (respnoseText.code == 200207) {
                                // 变成点赞图标
                                // 变成点赞图标
                                /*$(self).find('span').addClass('overdo');
                                 $(self).find('span').removeClass('unoverdo');*/
                                // 删除未点赞svg图标
                                $(self).find('span img').remove();
                                // 添加点赞svg图标  追加在span内部最后面
                                $(self).find('span .oneu').append('<img  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABBCAYAAACZ1VmMAAAACXBIWXMAABcSAAAXEgFnn9JSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAmtJREFUeNrsnM1twkAQhdcWuVMCJZAOSAdw4BxSQaACQgWQCiBnLqSCmApCB3EH8T2X7IRBQvzOQxFes+9JDhGxIf40bz07O3biStZPt9v0L0O/tfWtzG9Lv03u5vPCBaSkZFAN//Lpt/qBPwuokQc2CQVWWvL3D4+Acvr+2AOdEtZaDcM+vVCAlQ0rN+4nwPqxw1oilvXA6tHC8oP3DIguAdWLObJET8C+j1HD8tEleZU1PWjGHlmiEZCbtaKGpZl65gJXGtD/khOWXQVh2dUkrP+d+sRbddipPnwZLwZJ7JHVrsK4Fgosa2a+ihqWJpnWwX0ZLSytIiC1qizmyJoiV0GdR5amWkkR1VRQSG61KHvIqJVgO6m7X1L1fI8Glg7kkO1Ci6zkSqBeNKIu1cKPV52bh6UrMz1XPRUazbJ2me/BOlNYyzcHRQBqF1pHrsSJnpSc0NgdX/DcSJbUB0ZQff3MW5AAu080mj6AA03A/Od+G+BXSTNJSp/Bg/paJTh35bslUH+T/RSY8W+r4eJTnjrKqjfCAnK9GhmYtJK0iZFltKD8ICxgXkpYRgsSFmBBwgIsSFiABQkLsCBhARYkrNPKdut3hGW0IGEBFiSsE6AO3WRFWId1cI2SsIwWJCzAgoQFWJCwAAsSFmBBwgIsSFiABQkLsCBhARYkLMCChAVYkLAAC25gFWRl61dN3WWNrfkNgZpZn3kjsEZgdGXn2iW1ub8KQAsH3J+d6ok/GCNMIFi7hgcVgDVC+mT3upW1sX9z58P277KGBllWe1WnAdsPeabEVVq7W27ditkOBJJE0uslj5r6FWAA8Ce+FKK+F0UAAAAASUVORK5CYII="/>');
                                //$(self).find('span').attr('data-type','noliked');
                                Message.show('#msg', respnoseText.message, 2000);
                            } else {
                                Message.show('#msg', respnoseText.message, 2000);
                            }
                        }, 2);

                    }
                });
                //点击再来一单
                $('.anotherOne').click(function() {
                        var ttype = $(this).attr('data-type');
                        var shopname = $(this).attr('shop-name');
                        var ordertypeinfo = $(this).attr('ordertypeinfo');
                        var shopId = $(this).attr('shop-id');
                        if (ttype == 'buy') {
                            mengorder_id = $(this).attr('mengorder_id')
                            self.clickAnother(shopname, ordertypeinfo, shopId)
                        }
                })
                //点击会员登录
                $('#backNomelogin,#registerlogin').unbind('click').bind('click', function() {
                    // location.href.split('//')[1].split('/')[0]
                    var jump_no = location.href.split('?payorder')[1];
                    // 出现问题，收银台下外卖单，微信未登录扫过来，加菜然后支付页面点击会员登录，登陆成功后，这个订单没有绑定用户
                    // 如果未登录，并且是加菜过来的，加一个需要绑定在请求加菜接口的参数
                    if (is_landed == 0 && is_add_a_dish == 1 && scanCodePayId != '') {
                        Page.open('nomemberlogin' + jump_no + '&scan_bidn=1');
                    } else {
                        Page.open('nomemberlogin' + jump_no);
                    }
                });

                // 点击如何享受会员价
                $('#is_halp_member').unbind('click').bind('click', function() {
                    // 存储缓存url
                    Cache.set('storage_member_ress', location.href.split('?')[1]);
                    Cache.set('member_price_used', payorderInfo.member_price_used);
                    Page.open('enjoymember&card_id=' + card_id);
                });

                // 增加菜品点击事件
                $('#addMenuClick').unbind('click').bind('click', function() {
                    var pay_id = payorderInfo.pay_id == 'new_order' ? '' : payorderInfo.pay_id;

                    var storage_point = {
                        'is_bottom_pot': is_bottom_pot,
                        'is_small_material': is_small_material,
                        'is_cond_commodity': is_cond_commodity
                    }
                    Cache.set('storage_point', storage_point);

                    var shop_id_t = payorderInfo.shop_id;
                    if (payorderInfo.f_shop_id != null && payorderInfo.f_shop_id != '') {
                        shop_id_t = payorderInfo.f_shop_id;
                    }

                    // 如果门店支持全额支付直接结账,且当前订单已经is_pay_all，点追单的时候，不要传pay_id也不要传桌台号（堂食的传桌台号，别的桌台 不传），视同于新下单
                    if (payorderInfo.shop_info.is_pay_checkout == 1 && payorderInfo.pay_info.is_pay_all == 1) {
                        var table_content = '';
                        if (order_property == 1) {
                            table_content = '&table_id=' + payorderInfo.table_id;
                        }
                        Page.open('dishes&card_id=' + card_id + table_content + '&page=merchantHome&type=0&scanType=2&is_jump_choice=1&order_property=' + order_property + '&shop_id=' + shop_id_t);
                    } else {
                        // 跳转点菜页面修改菜品
                        Page.open('dishes&card_id=' + card_id + '&table_id=' + payorderInfo.table_id + '&page=merchantHome&type=0&scanType=2&pay_id=' + pay_id + '&is_jump_choice=1&order_property=' + order_property + '&shop_id=' + shop_id_t);
                    }
                });

                // 抵用劵点击事件
                $('#clickVouch').unbind('click').bind('click', function() {
                    // 是否选择了抵用劵，选择了抵用劵才可以点击
                    if (isVoucher == true) {
                        self.selectVoucher();
                    }
                });
                // 优惠方案点击事件
                $('#clickPromo').unbind('click').bind('click', function() {
                    // 有优惠方案 并且 选择了优惠方案才可以点击
                    if (isUsePromo == true && isPromo == true && dishesPromo != undefined && dishesPromo != '') {
                        self.selectPromo();
                    }
                });

                // 下单点击事件
                $('#wait_for_pay').unbind('click').bind('click', function() {
                    if (is_click_button == 1) {
                        self.addressDialog(1);
                    }
                });

                // 下单并支付点击事件
                $('#define-pay').unbind('click').bind('click', function() {
                    if (is_click_button == 1) {
                        self.addressDialog();
                    }
                });

                // 会员价选择框点击(选择|取消)
                /*$('#isMember').unbind('tap').bind('tap', function () {
                    // 是否可以取消会员价，可以取消
                    if (isNoMem == false) {
                        // 添加隐藏选择框是否选中
                        $('#isMember').toggleClass('subset_icon_chcked');
                        // 判断是否有选中样式
                        if ($('#isMember').hasClass('subset_icon_chcked')) {

                            // 是否选择了会员价，为true
                            isMember = true;

                            // 计算金额
                            //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                            // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                            self.generate_choice_submit(1);
                        } else {

                            // 是否选择了会员价，为false
                            isMember = false;
                            // 计算金额
                            //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                            // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                            self.generate_choice_submit(0);
                        }
                    }
                });*/

                // 折扣选择框点击(选择|取消)
                $('#isDiscount').unbind('tap').bind('tap', function() {
                    clickWhat = 'zhekou'
                        // 是否可以取消折扣，可以取消
                    if (isNoDis == false) {
                        // 添加隐藏选择框是否选中
                        $('#isDiscount').toggleClass('subset_icon_chcked');
                        // 判断是否有选中样式
                        if ($('#isDiscount').hasClass('subset_icon_chcked')) {
                            // 是否选择了折扣，为true
                            isDiscount = true;

                            /*// 可以使用抵用劵
                            if (isUseVoucher == true) {
                                isVoucher = false;
                                $('#isVoucher').removeClass('subset_icon_chcked');
                                $('#clickVouch').addClass('setBg');
                            }
                            // 可以使用乐币
                            if (isUseLe == true) {
                                isLecoin = false;
                                $('#clickUseLe').addClass('setCol');
                                $('#isLecoin').removeClass('subset_icon_chcked');
                                $('#stored').addClass('setCol')
                                $('#stored').val(0)
                                $('#stored').prop('readonly', true);
                            }*/
                            // console.log('a22')
                            // 计算金额
                            //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                            // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                            self.generate_choice_submit('', 1);
                        } else {

                            /*// 可以使用抵用劵
                            if (isUseVoucher == true) {
                                isVoucher = true;
                                $('#isVoucher').addClass('subset_icon_chcked');
                                $('#clickVouch').removeClass('setBg');
                            }
                            // 可以使用乐币
                            if (isUseLe == true) {
                                isLecoin = true;
                                $('#clickUseLe').removeClass('setCol');
                                $('#isLecoin').addClass('subset_icon_chcked');
                                $('#stored').removeClass('setCol')
                                $('#stored').prop('readonly', false);
                            }*/

                            conflict_pay_info['discount_rate'] = 100;

                            // 是否选择了折扣，为false
                            isDiscount = false;
                            // console.log('a23')
                            // 计算金额
                            //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                            // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                            self.generate_choice_submit('', 0, 1);
                        }
                    }
                });

                // 乐币选择框点击(选择|取消)
                $('#isLecoin').unbind('tap').bind('tap', function() {
                    clickWhat = 'lebi'
                        // 如果可以使用乐币，乐币才可以选中取消，否则不能点击取消



                    if (isUseLe == true) {
                        // 添加隐藏选择框是否选中
                        $('#isLecoin').toggleClass('subset_icon_chcked');
                        // 判断是否有选中样式
                        if ($('#isLecoin').hasClass('subset_icon_chcked')) {
                            //alert('ddd');
                            // 是否选择了乐币，为true
                            isLecoin = true;
                            $('#clickUseLe').removeClass('setCol');
                            $('#stored').removeClass('setCol')
                            $('#stored').prop('readonly', false);
                            // 可以使用抵用劵(不强制使用乐币抵用劵所以注释掉)
                            /*if (isUseVoucher == true) {
                                isVoucher = true;
                                $('#isVoucher').addClass('subset_icon_chcked');
                                $('#clickVouch').removeClass('setBg');
                            }*/
                            // 可以使用折扣 应用冲突的时候应该注释掉
                            /*if (isUseDiscount == true) {
                                isDiscount = false;
                                $('#isDiscount').removeClass('subset_icon_chcked');
                                conflict_pay_info['discount_rate'] = 100;
                            }*/
                            lepay = 1; // 解决如果我选中的时候默认有那么一块钱，但是到了计算金额的地方就变化了主要是应付冲突
                            is_load = 1;
                            // console.log('a24')
                            // 计算金额
                            //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                            // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                            self.generate_choice_submit('');
                        } else {
                            // 是否选择了乐币，为false
                            isLecoin = false;
                            $('#clickUseLe').addClass('setCol');
                            $('#stored').addClass('setCol')
                            $('#stored').val(0)
                            $('#stored').prop('readonly', true);
                            // 可以使用抵用劵(不强制使用乐币抵用劵所以注释掉)
                            /*if (isUseVoucher == true) {
                                isVoucher = false;
                                $('#isVoucher').removeClass('subset_icon_chcked');
                                $('#clickVouch').addClass('setBg');
                            }*/
                            lepay = 0;
                            is_load = 2; // 微信用
                            // 如果没有选择抵用劵，说明两个都取消了，这时候才可以使用折扣
                            /*if (isVoucher == false) {
                                // 可以使用折扣
                                if (isUseDiscount == true) {
                                    isDiscount = true;
                                    $('#isDiscount').addClass('subset_icon_chcked');
                                }
                            }*/
                            // console.log('a1')
                            // 计算金额
                            //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                            // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                            self.generate_choice_submit('');
                        }
                    } else {
                        Message.show('#msg', '余额不足，请充值！', 2000);
                    }
                });

                // 抵用劵选择框点击(选择|取消)
                $('#isVoucher').unbind('tap').bind('tap', function() {
                    clickWhat = 'diyongjuan';
                    // 如果可以使用折扣，抵用劵才可以选中取消，否则不能点击取消
                    /*if (isUseDiscount == true) {*/
                    // 添加隐藏选择框是否选中
                    $('#isVoucher').toggleClass('subset_icon_chcked');
                    // 判断是否有选中样式
                    if ($('#isVoucher').hasClass('subset_icon_chcked')) {
                        // 是否选择了抵用劵，为true
                        isVoucher = true;
                        $('#clickVouch').removeClass('setBg');

                        // 可以使用乐币(不强制使用乐币抵用劵所以注释掉)
                        /*if (isUseLe == true) {
                                isLecoin = true;
                                $('#isLecoin').addClass('subset_icon_chcked');
                                $('#clickUseLe').removeClass('setCol');
                            }*/
                        // 可以使用折扣 应用冲突的时候应该注释掉
                        /*if (isUseDiscount == true) {
                                isDiscount = false;
                                $('#isDiscount').removeClass('subset_icon_chcked');
                                conflict_pay_info['discount_rate'] = 100;
                            }*/
                        vouchersPrice = canuseVouchePrice;
                        is_load = 1;
                        // console.log(1111111111111111)
                        // console.log('................')
                        // 计算金额
                        //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                        // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                        self.generate_choice_submit('');
                    } else {
                        // console.log(2222222222222222222222222222)
                        // 是否选择了抵用劵，为false
                        isVoucher = false;
                        $('#clickVouch').addClass('setBg');
                        is_load = 2; // 微信用
                        // 可以使用乐币(不强制使用乐币抵用劵所以注释掉)
                        /*if (isUseLe == true) {
                                isLecoin = false;
                                $('#isLecoin').removeClass('subset_icon_chcked');
                                $('#clickUseLe').addClass('setCol');
                            }*/
                        vouchersPrice = 0;

                        // 如果没有选择乐币，说明两个都取消了，这时候才可以使用折扣
                        /*if (isLecoin == false) {
                                // 可以使用折扣
                                if (isUseDiscount == true) {
                                    isDiscount = true;
                                    $('#isDiscount').addClass('subset_icon_chcked');
                                }
                            }*/

                        // 计算金额
                        //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                        // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                        self.generate_choice_submit('');
                    }
                    /*}*/
                });

                // 优惠方案选择框点击(选择|取消)
                $('#isPromo').unbind('tap').bind('tap', function() {
                    clickWhat = 'fangan';
                    // 如果没有支付过，优惠方案才可以选中取消，否则不能点击取消
                    if (isNoPro == false) {
                        // 添加隐藏选择框是否选中
                        $('#isPromo').toggleClass('subset_icon_chcked');
                        // 判断是否有选中样式
                        if ($('#isPromo').hasClass('subset_icon_chcked')) {
                            // 是否选择了优惠方案，为true
                            isPromo = true;
                            // $('#clickPromo').removeClass('setBg');
                            promoId = canusePromoId;

                            // 可以使用乐币(不强制使用乐币优惠方案所以注释掉)
                            /*if (isUseLe == true) {
                                    isLecoin = true;
                                    $('#isLecoin').addClass('subset_icon_chcked');
                                    $('#clickUseLe').removeClass('setCol');
                                }*/
                            // 可以使用折扣 应用冲突的时候应该注释掉
                            /*if (isUseDiscount == true) {
                                    isDiscount = false;
                                    $('#isDiscount').removeClass('subset_icon_chcked');
                                    conflict_pay_info['discount_rate'] = 100;
                                }*/
                            // is_load = 1;
                            // 计算金额
                            //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                            // console.log(5555555555555555555)
                            // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                            self.generate_choice_submit('');
                        } else {
                            // console.log(6666666666666666666)
                            // 是否选择了优惠方案，为false
                            isPromo = false;
                            // $('#clickPromo').addClass('setBg');
                            // is_load = 2; // 微信用
                            // 可以使用乐币(不强制使用乐币优惠方案所以注释掉)
                            /*if (isUseLe == true) {
                                    isLecoin = false;
                                    $('#isLecoin').removeClass('subset_icon_chcked');
                                    $('#clickUseLe').addClass('setCol');
                                }*/
                            // vouchersPrice = 0;
                            promoId = '';
                            // 如果没有选择乐币，说明两个都取消了，这时候才可以使用折扣
                            /*if (isLecoin == false) {
                                    // 可以使用折扣
                                    if (isUseDiscount == true) {
                                        isDiscount = true;
                                        $('#isDiscount').addClass('subset_icon_chcked');
                                    }
                                }*/

                            // 计算金额
                            //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                            // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                            self.generate_choice_submit('');
                        }
                    }
                });

                // 微信选择框点击(选择|取消)
                $('#isWxpay').unbind('tap').bind('tap', function() {
                    clickWhat = 'weixin'
                        // 是否可以取消微信，可以取消
                    if (isNoWx == false) {
                        // 添加隐藏选择框是否选中
                        $('#isWxpay').toggleClass('subset_icon_chcked');
                        // 判断是否有选中样式
                        if ($('#isWxpay').hasClass('subset_icon_chcked')) {

                            $('#isAlipay').removeClass('subset_icon_chcked');
                            // 是否选择了微信，为true
                            isWxpay = true;
                            $('#wxpay').removeClass('setCol');
                            $('#wxpay').prop('readonly', false);
                            $('#alipay').addClass('setCol')
                            $('#alipay').prop('readonly', true);
                            $('#alipay').val('0')
                            if (isAlipay == true) {
                                isAlipay = false
                                    // 微信金额 = 银台支付金额
                                if (alipay != 0 && alipay != 0) {
                                    wxpay = alipay
                                    $('#wxpay').val(parseFloat(wxpay).toFixed(2));
                                    is_load = 2;
                                    alipay = 0
                                    // console.log('a2')
                                    self.generate_choice_submit('');
                                }
                            } else {
                                wxpay = cashier;
                                cashier = 0
                                $('#wxpay').val(parseFloat(wxpay).toFixed(2));
                                is_load = 2;
                                // console.log('a3')
                                // 计算金额
                                //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                                // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                                self.generate_choice_submit('');
                            }
                        } else {
                            // 是否选择了微信，为false
                            isWxpay = false;
                            $('#wxpay').addClass('setCol');
                            $('#wxpay').prop('readonly', true);
                            // 微信金额 = 0
                            wxpay = 0;
                            $('#wxpay').val(parseFloat(wxpay).toFixed(2));
                            is_load = 2;
                            // console.log('a4')
                            // 计算金额
                            //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                            // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                            self.generate_choice_submit('');
                        }
                    }
                });

                $('#isAlipay').unbind('click').bind('click', function() {
                        clickWhat = 'zhifubao'
                            //是否可以取消支付宝
                        if (isNoali == false) {
                            $('#isAlipay').toggleClass('subset_icon_chcked');
                            if ($('#isAlipay').hasClass('subset_icon_chcked')) {
                                $('#isWxpay').removeClass('subset_icon_chcked');
                                $('#wxpay').prop('readonly', true);
                                $('#alipay').removeClass('setCol')
                                $('#alipay').prop('readonly', false);
                                $('#wxpay').val('0');
                                isAlipay = true
                                if (isWxpay == true) {
                                    isWxpay = false
                                    $('#wxpay').addClass('setCol');

                                    if (wxpay != 0 && wxpay != 0) {
                                        alipay = wxpay
                                        $('#alipay').val(parseFloat(alipay).toFixed(2))
                                        wxpay = 0
                                        is_load = 2;
                                        // console.log('a5')
                                        self.generate_choice_submit('');
                                    }
                                } else {
                                    alipay = cashier
                                    cashier = 0;
                                    $('#alipay').val(parseFloat(alipay).toFixed(2))
                                    is_load = 2;
                                    // console.log('a6')
                                    self.generate_choice_submit('');
                                }
                            } else {
                                isAlipay = false
                                $('#alipay').addClass('setCol');
                                $('#alipay').prop('readonly', true);
                                alipay = 0;
                                is_load = 2;
                                $('#alipay').val(parseFloat(alipay).toFixed(2))
                                // console.log('a7')
                                self.generate_choice_submit('');
                            }
                        }
                    })
                    // 微信支付输入值变化
                $('#wxpay').unbind('input').bind('input', function() {
                    clickWhat = ''
                    is_input_wx = true;
                    // 校验输入值
                    self.checkNum('wxpay', 1);
                    /*var yingfujine = $('#copeWithPay').text();           //获取应付金额
                    var wxVal = $(this).val();                      //获取输入金额
                    var stored = $('#stored').val();
                    if(parseFloat(stored) + parseFloat(wxVal) > yingfujine){
                        $('#wxpay').val(yingfujine - stored);
                    }*/
                });

                $('#alipay').unbind('input').bind('input', function() {
                    clickWhat = ''
                    is_input_ali = true;
                    // 校验输入值
                    self.checkNum('alipay', 1);
                    /*var yingfujine = $('#copeWithPay').text();           //获取应付金额
                    var wxVal = $(this).val();                      //获取输入金额
                    var stored = $('#stored').val();
                    if(parseFloat(stored) + parseFloat(wxVal) > yingfujine){
                        $('#wxpay').val(yingfujine - stored);
                    }*/
                });
                // 乐币支付输入值变化
                $('#stored').unbind('input').bind('input', function() {
                    clickWhat = ''
                    is_load = 2; // 微信用
                    // 校验输入值
                    self.checkNum('stored', 1);
                    /*var yingfujine = $('#copeWithPay').text();           //获取应付金额
                    var stored = $(this).val();                     //获取输入金额
                    var wxVal = $('#wxpay').val();                      //获取微信输入金额
                    if(parseFloat(stored) + parseFloat(wxVal) > yingfujine){
                        $('#stored').val(yingfujine - wxVal);
                    }*/
                });
                // 下面是微信和乐币.支付宝，在不选中的时候，点击输入框，取消焦点事件
                $('#wxpay').unbind('tap').bind('tap', function() {
                    if (isWxpay == false) {
                        $(this).blur();
                    }
                });
                $('#alipay').unbind('tap').bind('tap', function() {
                    if (isAlipay == false) {
                        $(this).blur();
                    }
                });
                $('#stored').unbind('tap').bind('tap', function() {
                    if (isLecoin == false) {
                        $(this).blur();
                    }
                });

                $('#wxFocus').unbind('tap').bind('tap', function() {
                    if (isWxpay == true) {
                        $('#wxpay').focus();
                    }
                });
                $('#aliFocus').unbind('tap').bind('tap', function() {
                    if (isAlipay == true) {
                        $('#alipay').focus();
                    }
                });
                $('#lbFocus').unbind('tap').bind('tap', function() {
                    if (isLecoin == true) {
                        $('#stored').focus();
                    }
                });



                //点击刷新按钮
                $('#newLoad').unbind('click').bind('click', function() {
                    window.location.reload();
                });

                // 乐币需要充值的点击事件
                $('#stored_value').unbind('click').bind('click', function() {
                    Cache.set('loginReturn', location.href.split('?')[1]);
                    Page.open('storedValue&card_id=' + card_id + '&page=payorder&is_type=3');
                });
                // 就餐人数、就餐时间的点击事件，选择或输入就餐人数
                $('#number_of_diners,#dinner_time_list').unbind('click').bind('click', function() {
                    // 如果不可点击则跳出
                    if (is_number_of == 0 && $(this).attr('id') == 'number_of_diners') {
                        return;
                    }
                    if (is_click_btn == 0 && $(this).attr('id') == 'dinner_time_list') {
                        return;
                    }
                    if (is_number_of == 0) {
                        $('#m_number_time').addClass('hide');
                        $('#meals_number span[data-dialog="time"]').text('请选择时间');
                    }
                    // 弹出层选择
                    $.dialog = Dialog({
                        type: 3,
                        close: false,
                        dom: '#number_diners_dialog',
                        success: function() {
                            if (order_property == 2 || order_property == 3) {
                                // 根据就餐时间类型计算就餐时间偏移量、门店营业时间
                                Util.calculation_time(dinner_time_type, dinner_time_offset, dinner_time, open_time, close_time, 0);
                                // 加载就餐时间
                                Util.loaded(dinner_time_type, dinner_time_offset, dinner_time, open_time, close_time);
                            }

                            $('#number_options').find('p').each(function() {
                                // $(this).removeClass('checked');
                            });
                            if (is_chopsticks_t == 0) {
                                $('#number_options').find('p[data-value="' + user_num + '"]').addClass('checked');
                            }
                            $('#number_diners').val(user_num);
                            self.number_of_diners_t(user_num);
                            // 绑定就餐人数输入事件
                            $('#number_diners').unbind('input').bind('input', function() {
                                var number_di = $(this).val();
                                if (number_di < 0 || number_di == 0) {
                                    number_di = '0';
                                }
                                var numPro = /^\d*$/;
                                //查找输入字符第一个为0
                                var resultle = number_di.substr(0, 1);
                                var result2 = number_di.substr(1, 1);
                                if (numPro.test(number_di)) {
                                    if (resultle == 0 && number_di.length > 1 && result2 != '.') {
                                        //替换0为空
                                        number_di = number_di.replace(/0/, "");
                                        if (number_di.substr(0, 1) == '.') {
                                            number_di = 0;
                                        }
                                    }
                                    if (number_di == '') {
                                        number_di = 0;
                                    }
                                    if (number_di > 500) {
                                        number_di = 500;
                                    }
                                } else {
                                    number_di = 0;
                                }
                                $(this).val(number_di);

                                // 取消选中人数样式
                                $('#number_options').find('p').siblings('p').removeClass('checked');

                                self.number_of_diners_t(number_di);
                            });

                            // 绑定人数选择点击事件
                            $('#number_options').find('p').each(function() {
                                $(this).unbind('click').bind('click', function() {
                                    // 选中样式
                                    $(this).addClass('checked').siblings('p').removeClass('checked');
                                    // 点击得到点击的人数
                                    var number_op = $(this).attr('data-value');
                                    $('#number_diners').val(number_op);
                                    self.number_of_diners_t(number_op);
                                });
                            });

                            // 点击确定
                            $('#number_of_determine').unbind('click').bind('click', function() {
                                // debugger;
                                user_num = no_user_num;

                                if (order_property == 2 || order_property == 3) {
                                    var day = $('#num1').find('li[class="current"]').text();
                                    var hour = $('#num2').find('li[class="current"]').text();
                                    var minite = $('#num3').find('li[class="current"]').text();

                                    // 日期转换时间戳
                                    dinner_time = Util.dateTotTime(Util.getLocalDateGenerate(day, hour, minite).list_date);

                                    $('#dinner_time').text(Util.getLocalDateGenerate(day, hour, minite).list_display);
                                }

                                $.dialog.close($.dialog.id);
                                if (is_first_single == 1) {
                                    // 如果存在特殊商品“堂食餐包”，，且“用户是否允许自备餐具”为允许
                                    if (is_meal_package == 1 && is_chopsticks == 1) {
                                        if ($('#chopsticks_rise').is(':checked')) {
                                            is_chopsticks_t = 1;
                                        } else {
                                            is_chopsticks_t = 0;
                                        }
                                    } else {
                                        is_chopsticks_t = 0;
                                    }

                                    /*if (is_chopsticks_t == 1) {
                                        user_num = 0;
                                    }*/

                                    $('#number_of_num').text(user_num + '人');

                                    // 人数赋值处理
                                    for (var i in change_tableInfo.menu.new_order) {
                                        if (change_tableInfo.menu.new_order[i].menu_id == meal_package.menu_id) {
                                            change_tableInfo.menu.new_order[i].menu_num = parseFloat(user_num).toFixed(1);
                                        }
                                    }
                                    // 赋值数据中餐包数量和改变数据
                                    if (user_num == 0 || is_chopsticks_t == 1) {
                                        for (var i in dishesMenu) {
                                            if (i == meal_package.menu_id) {
                                                delete dishesMenu[i];
                                            }
                                        }
                                    } else {
                                        var is_num = 0;
                                        for (var i in dishesMenu) {
                                            if (i == meal_package.menu_id) {
                                                is_num = 1;
                                            }
                                        }
                                        if (is_num == 0) {
                                            dishesMenu[meal_package.menu_id] = {};
                                            dishesMenu[meal_package.menu_id] = self.dishesStackHandle(meal_package, dishesMenu[meal_package.menu_id]);
                                        }
                                        dishesMenu[meal_package.menu_id].menu_num = parseFloat(user_num).toFixed(1);
                                    }
                                }

                                // 如果乐币是选中的就乐币重新计算
                                if (isLecoin == true) {
                                    is_load = 1;
                                } else if (isWxpay == true) {
                                    is_load = 1;
                                } else if (isAlipay == true) {
                                    is_load = 1
                                }
                                // console.log('a8')
                                // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                                self.generate_choice_submit('', '');

                                // 显示菜品信息
                                // console.log(is_chopsticks_t)
                                self.menuList(payorderInfo, user_num, is_chopsticks_t);
                            });

                            // 点击右上角取消
                            $('#number_diners_clo').unbind('click').bind('click', function() {
                                $.dialog.close($.dialog.id);
                                $('#number_options').find('p').each(function() {
                                    $(this).removeClass('checked');
                                });
                            });
                        }
                    });
                });

                // 地址的点击事件，可到地址列表添加修改
                $('#no_order_property_1').unbind('click').bind('click', function() {
                    if (is_click_btn == 0) {
                        return;
                    }
                    Cache.set('is_add', 1);
                    Cache.set("payorder-addr", location.href.split('?')[1]);
                    Page.open('address&card_id=' + card_id + '&page=takeaway')
                });
            },

            // 处理就餐人数弹出层选择人数的时候
            number_of_diners_t: function(num) {
                var self = this

                no_user_num = num;

                // is_meal_package 是否存在堂食餐包
                if ((order_property == 1 || order_property == 2 || order_property == 3) && is_meal_package == 1) {
                    var con = '';
                    if (order_property == 1) {
                        con = '堂食餐包';
                    } else if (order_property == 2) {
                        con = '外卖餐包';
                    } else if (order_property == 3) {
                        con = '外卖餐包';
                    }
                    $('#con_1').text(con);
                    if (is_member_price == 1) {
                        $('#con_2').text(meal_package.member_price);
                    } else {
                        $('#con_2').text(meal_package.menu_price);
                    }
                } else {
                    $('#meal_package').addClass('hide');
                }
            },

            // 校验输入数字 num 0：整数  1：非整数
            checkNum: function(name, num) {
                var self = this;
                var num1 = $('#' + name).val();
                //正则表达式验证必须为数字或者两位小数
                var numPro = /^\d*\.{0,1}\d{0,2}$/;
                if (num == 0) {
                    numPro = /^\d*$/;
                } else {
                    numPro = /^\d*\.{0,1}\d{0,2}$/;
                }
                //查找输入字符第一个为0
                var resultle = num1.substr(0, 1);
                var result2 = num1.substr(1, 1);
                if (numPro.test(num1)) {
                    if (resultle == 0 && num1.length > 1 && result2 != '.') {
                        //替换0为空
                        $('#' + name).val(num1.replace(/0/, ""));
                        if (num1.substr(0, 1) == '.') {
                            $('#' + name).val(0);
                        }
                    }
                    if (num1 == '') {
                        $('#' + name).val(0);
                    }
                    // console.log('a9')
                    //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                    // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                    self.generate_choice_submit('');
                } else {
                    $('#' + name).val(0);
                    // console.log('a10')
                    //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                    // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                    self.generate_choice_submit('');
                }
            },

            // 选择支付方式弹出层
            selectPaymentMethod: function() {
                var self = this;

                $.dialog = Dialog({
                    type: 3,
                    close: false,
                    dom: '#select-pay-dialog',
                    success: function() {
                        //alert($('#payMain').html());

                        // 默认选中乐币抵用卷
                        $('#payMain').find("input").get(0).checked = true;
                        // 点击确认
                        $('#confirm').unbind('click').bind('click', function() {
                            // 其他支付
                            var radio1 = $('#payMain').find('input[data-name="1"]');
                            // 会员折扣
                            var radio2 = $('#payMain').find('input[data-name="2"]');

                            var is_member_discount = 0;

                            // 判断是选中其他支付还是选中会员折扣
                            if (radio1.is(':checked') || radio1.attr('checked') == true) {
                                $('#isDiscount').removeClass('subset_icon_chcked');
                                isDiscount = false;
                                is_member_discount = 0;
                                lepay = 1;
                                vouchersPrice = canuseVouchePrice;
                            } else {
                                $('#isDiscount').addClass('subset_icon_chcked');
                                isDiscount = true;
                                isVoucher = false;
                                $('#isVoucher').removeClass('subset_icon_chcked');
                                $('#clickVouch').addClass('setBg');
                                isLecoin = false;
                                $('#isLecoin').removeClass('subset_icon_chcked');
                                $('#clickUseLe').addClass('setCol');
                                $('#stored').addClass('setCol')
                                $('#stored').val(0)
                                $('#stored').prop('readonly', true);
                                lepay = 0;
                                vouchersPrice = 0;
                                is_member_discount = 1;
                                clickWhat = 'zhekou'

                            }
                            // 关闭弹出层
                            $.dialog.close($.dialog.id);
                            is_load = 1; // 是否第一次加载(刷新也算)0 否 1 是

                            // 判断如果是订单支付成功、微信支付成功callback后，到详情指定位置发表点评的位置
                            if (is_comm == 1) {
                                setTimeout(function() {
                                    $('#menuDispaly span[type="comments-content"]').click();
                                }, 300);
                            } else if (is_comm == 2) {
                                setTimeout(function() {
                                    $('#menuDispaly span[type="orderInfoList"]').click();
                                }, 300);
                            }
                            // console.log('a11')
                            // 计算金额
                            //self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                            // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                            self.generate_choice_submit(is_member_price, is_member_discount);
                        });
                    }
                });
            },

            // 计算金额
            calculationAmount: function(isUseLe, isUseVoucher, isUseDiscount, menu_money_info) {

                /*var menu_money_info = {
                    'consumes'          :   '0',    //消费金额汇总
                    'sub_user_price'    :   '0',    //会员价优惠
                    'sub_user_discount' :   '0',    //会员折扣优惠
                    'sub_user'          :   '0',    //会员优惠
                    'sub_money'         :   '0',    //银台折扣
                    'pay_sub_moneys'    :   '0',    //优惠金额汇总
                    'pay_moneys'        :   '0'     //实收金额汇总                
                };*/

                // 如果可以按人数增加餐包。则需要变更消费金额。
                var property_pring = 0;
                var property_pring_1 = 0;
                var num_1 = 0;
                var user_num_1 = 0;
                // 判断如果菜品数据里面有餐包，就是0 
                for (var i in payorderInfo.menu) {
                    for (var j in payorderInfo.menu[i]) {
                        if (payorderInfo.menu[i][j].special_type == 1 && order_property == 1) {
                            num_1 = 1;
                            user_num_1 = payorderInfo.menu[i][j].menu_num;
                        }
                        if (payorderInfo.menu[i][j].special_type == 2 && (order_property == 2 || order_property == 3)) {
                            num_1 = 1;
                            user_num_1 = payorderInfo.menu[i][j].menu_num;
                        }
                    }
                }
                var is_num_t = 0;
                // 如果存在餐包，并且，没有选择或不允许使用自备餐包，则计算金额
                if (is_first_single == 1 && is_meal_package == 1 && (order_property == 1 || order_property == 2 || order_property == 3) && is_chopsticks_t == 0) {
                    if (num_1 == 0 || user_num_1 != user_num) {
                        is_num_t = 0;
                        var sum_user_num = user_num - user_num_1;
                        // 如果支持会员价，餐包要算会员价
                        var is_money = conflict_pay_info['is_member_price'] == 1 ? meal_package.member_price : meal_package.menu_price;
                        property_pring = Util.accMul(sum_user_num, is_money);
                        property_pring_1 = Util.accMul(sum_user_num, meal_package.menu_price);

                        // 计算餐包会员价优惠
                        if (conflict_pay_info['is_member_price'] == 1) {
                            menu_money_info.sub_user_price = Util.accAdd(menu_money_info.sub_user_price, (Util.accMul((Util.accSubtr(meal_package.menu_price, meal_package.member_price)), sum_user_num)));

                            menu_money_info.pay_sub_moneys = Util.accAdd(menu_money_info.pay_sub_moneys, (Util.accMul((Util.accSubtr(meal_package.menu_price, meal_package.member_price)), sum_user_num)));
                        }
                    }
                } else {
                    if (num_1 == 1 && is_meal_package == 1 && is_first_single == 1) {
                        is_num_t = 1;
                        // 如果支持会员价，餐包要算会员价
                        var is_money = conflict_pay_info['is_member_price'] == 1 ? meal_package.member_price : meal_package.menu_price;
                        property_pring = Util.accMul(user_num, is_money);
                        property_pring = -property_pring;
                        property_pring_1 = Util.accMul(user_num, meal_package.menu_price);
                        property_pring_1 = -property_pring_1;

                        // 计算餐包会员价优惠
                        if (conflict_pay_info['is_member_price'] == 1) {
                            menu_money_info.sub_user_price = Util.accSubtr(menu_money_info.sub_user_price, (Util.accMul((Util.accSubtr(meal_package.menu_price, meal_package.member_price)), user_num)));

                            menu_money_info.pay_sub_moneys = Util.accSubtr(menu_money_info.pay_sub_moneys, (Util.accMul((Util.accSubtr(meal_package.menu_price, meal_package.member_price)), user_num)));
                        }
                    }
                }

                // 消费金额显示
                var property_consume = cons_money;
                property_consume = Util.accAdd(parseFloat(property_consume), parseFloat(property_pring_1));
                $('#consume').text(parseFloat(property_consume).toFixed(2));

                ch_menu_money_info = this.dishesStackHandle(menu_money_info, ch_menu_money_info);

                // 会员价 = 消费金额 - 会员价优惠
                var sub_user_price = parseFloat(Util.accSubtr(menu_money_info.consumes, menu_money_info.sub_user_price)).toFixed(2);
                $('#memberPrice').text(sub_user_price);
                // 已优惠页面显示
                if (menu_money_info.pay_sub_moneys == 0) {
                    $('#preferentialPrice').parent('p').addClass('hide')
                    $('.order-footer-preferential .order-footer-small p').css('height', '50px')
                    $('.order-footer-preferential .order-footer-small p').css('line-height', '50px')
                } else {
                    $('#preferentialPrice').parent('p').removeClass('hide')
                    $('#preferentialPrice').text(parseFloat(menu_money_info.pay_sub_moneys).toFixed(2));
                }
                // 会员价优惠
                if (menu_money_info.sub_user_price == 0) {
                    $('#userPriceDispled').addClass('hide');
                } else {
                    $('#userPriceDispled').removeClass('hide');
                    $('#sub_user_price').text(parseFloat(menu_money_info.sub_user_price).toFixed(2));
                }
                // 会员折扣优惠
                if (menu_money_info.sub_user_discount == 0) {
                    $('#userDiscountDispled').addClass('hide');
                } else {
                    $('#userDiscountDispled').removeClass('hide');
                    $('#sub_user_discount').text(parseFloat(menu_money_info.sub_user_discount).toFixed(2));
                    // 可能出现没有选中会员折扣的情况
                    // 选中会员折扣
                    $('#isDiscount').addClass('subset_icon_chcked');
                    // 是否选择了折扣，为true
                    isDiscount = true;
                }
                //银台折扣
                if (menu_money_info.sub_money == 0 && (conflict_pay_info['promo_id'] == '' || payorderInfo.promo == '')) {
                    $('#sub_money').addClass('hide');
                } else {
                    $('#sub_money').removeClass('hide');conflict_pay_info['promo_id']
                    $('#tableDiscount').text(parseFloat(menu_money_info.sub_money).toFixed(2));
                    $('#sub_moneyu').text('（' + conflict_pay_info['promo']['promo_name'] + '）');
                }
                // app考虑退款的情况，比如下了100的单付了50 退了20的菜，APP打开应付金额应该是100-50+20，应付金额要是70
                // 应付金额 = 实收金额汇总 - 已付乐币 - 已付抵用劵 - 已付微信 - 已付现金 - 已付银行卡 - 已付自定义支付
                var moneysPro = Util.accSubtr(Util.accSubtr(Util.accSubtr(Util.accSubtr(Util.accSubtr(Util.accSubtr(Util.accSubtr(menu_money_info.pay_moneys, payorderInfo.pay_info['stored']), payorderInfo.pay_info['voucher']), payorderInfo.pay_info['wxpay']), payorderInfo.pay_info['cash']), payorderInfo.pay_info['card']), payorderInfo.pay_info['other']), payorderInfo.pay_info['alipay']);
                // 上面减完在加上 退款乐币、抵用劵、微信
                moneysPro = Util.accAdd(Util.accAdd(Util.accAdd(Util.accAdd(moneysPro, payorderInfo.pay_info['re_stored']), payorderInfo.pay_info['re_voucher']), payorderInfo.pay_info['re_wxpay']), payorderInfo.pay_info['re_alipay']);

                if (is_num_t == 1) {
                    // 应付金额 = 应付金额 + 餐包费
                    moneysPro = Util.accAdd(moneysPro, property_pring);
                }

                // 应付金额
                $('#copeWithPay').text(parseFloat(moneysPro).toFixed(2));
                // 实付金额页面显示
                $('#realPay').text(parseFloat(moneysPro).toFixed(2));

                if (payorderInfo.user_voucher != undefined && isVoucher == true && is_landed == 1) {
                    // 使用应付金额判断所有可用抵用劵最低消费是否满足，满足的使用，不满足的不使用
                    var low_1 = 0;
                    if (payorderInfo.user_voucher != undefined && payorderInfo.user_voucher.voucher_list != undefined) {
                        for (var t in payorderInfo.user_voucher.voucher_list) {
                            if (t == canuseRecordId) {
                                low_1 = payorderInfo.user_voucher.voucher_list[t].low_consume;
                            }
                        }
                    }
                    if (moneysPro < low_1) {
                        var voucher_rb = payorderInfo.user_voucher.voucher_list;
                        var vou_mon = 0;
                        var vou_id = '';
                        for (var i in voucher_rb) {
                            if (moneysPro >= voucher_rb[i].low_consume) {
                                if (voucher_rb[i].voucher_money > vou_mon) {
                                    vou_mon = voucher_rb[i].voucher_money;
                                    vou_id = voucher_rb[i].record_id;
                                }
                            }
                        }
                        canuseVouchePrice = vou_mon;
                        canuseRecordId = vou_id;
                        $('#voucher').text(vou_mon);
                        $('#voucher').attr('record-id', vou_id);
                    }

                    // 判断可用抵用劵，重新填充抵用劵列表
                    this.voucherList(payorderInfo.user_voucher.voucher_list, 1, moneysPro);
                }

                // 判断如果应付金额<=0 说明可能是下了一个单支付了然后银台抛弃了用户在追单过来变成负数就不可以在使用乐币抵用劵付钱了
                if (moneysPro <= 0) {
                    isVoucher = false;
                    isUseVoucher = false;
                    $('#clickVouch').addClass('setBg');
                    $('#isVoucher').removeClass('subset_icon_chcked');
                    isLecoin = false;
                    isWxpay = false;
                    isAlipay = false;
                    $('#isLecoin').removeClass('subset_icon_chcked');
                    $('#clickUseLe').addClass('setCol');
                    $('#stored').addClass('setCol')
                    $('#stored').val(0)
                    $('#stored').prop('readonly', true);
                    $('#isWxpay').removeClass('subset_icon_chcked');
                    $('#wxpay').addClass('setCol');
                    $('#wxpay').prop('readonly', true);
                    $('#isAlipay').removeClass('subset_icon_chcked');
                    $('#alipay').addClass('setCol');
                    $('#alipay').prop('readonly', true);
                }

                // 微信输入金额
                wxpay = $('#wxpay').val();
                var wxpaydian = wxpay;
                wxpay = parseFloat(wxpay);

                alipay = $('#alipay').val()
                var alipaydian = alipay;
                alipay = parseFloat(alipay);

                var lepay_m = $('#stored').val();
                var lebidina = lepay_m;
                lepay_m = parseFloat(lepay_m);

                // 会员优惠 = 会员价优惠 + 会员折扣优惠
                preferentialPrice = menu_money_info.sub_user;
                // 实付金额 = 消费金额 - 优惠金额汇总
                trueTotalConsumption = moneysPro;

                // 是否选择了抵用劵
                if (isVoucher == true) { //calculationPrice
                    // 是否选择了使用抵用劵（抵用劵金额）canuseVouchePrice
                    vouchersPrice = canuseVouchePrice;
                    // 是否选择了使用抵用劵（抵用劵id）canuseRecordId
                    recordId = canuseRecordId;
                    // 优惠金额 = 抵用劵金额
                    //preferentialPrice = vouchersPrice;
                } else {
                    // 没有选择抵用劵，这三个金额都是0
                    vouchersPrice = 0;
                    recordId = '';
                    //preferentialPrice = 0;
                }
                // 是否可以使用抵用劵，如果可以使用抵用劵
                if (isUseVoucher == true) {
                    // 抵用劵id填充
                    $('#voucher').attr('record-id', recordId);
                    // 抵用劵页面显示金额
                    $('#voucher').text(vouchersPrice);
                }

                // 应付金额 = 实付金额 - 抵用劵金额
                trueTotalConsumption = parseFloat(Util.accSubtr(trueTotalConsumption, vouchersPrice));

                // 应付金额小于0，那么应付金额就等于0
                if (trueTotalConsumption < 0) {
                    vouchersPrice = moneysPro;

                    trueTotalConsumption = 0;
                }

                //is_load = 0;// 是否第一次加载(刷新也算)0 否 1 是
                var is_load_p = 1;
                // 是否选择了乐币
                if (isLecoin == true) {
                    if (is_load == 1) {
                        lebidina = trueTotalConsumption;
                        leAmount = trueTotalConsumption;
                        is_load_p = 0;
                    } else {
                        leAmount = lepay_m;
                        // 乐币输入的金额 > 乐币应该支付的金额 并且 乐币应该支付的金额 <= 乐币余额
                        if (leAmount > trueTotalConsumption && trueTotalConsumption <= leMoney) {
                            leAmount = trueTotalConsumption;
                            lebidina = trueTotalConsumption;
                        }
                    }
                } else {
                    leAmount = 0;
                }

                // 判断是否显示余额不足或者需要充值或者不显示
                if (leMoney > 0) {
                    $('#stored_value').removeClass('hide');
                    if (trueTotalConsumption > leMoney) {
                        $('#stored_value').text('余额不足，请充值');
                    } else {
                        $('#stored_value').text('储值享优惠');
                    }
                }

                // 如果乐币乐币余额的金额 > 需要支付
                if (leMoney >= trueTotalConsumption && (clickWhat == 'weixin' || clickWhat == 'zhifubao')) {
                    lebidina = 0.00
                    leAmount = 0.00
                    isLecoin = false;
                    $('#clickUseLe').addClass('setCol');
                    $('#stored').addClass('setCol')
                    $('#stored').val(0)
                    $('#stored').prop('readonly', true);
                    $('#isLecoin').removeClass('subset_icon_chcked');
                    lepay = 0;
                    is_load = 2;
                } else if (leMoney >= trueTotalConsumption && (clickWhat == 'lebi' || (clickNum == 1 && payorderInfo.pay_info.wxpay_temp == 0 && payorderInfo.pay_info.alipay_temp == 0))) {
                    isWxpay = false;
                    isAlipay = false;
                    $('#isWxpay').removeClass('subset_icon_chcked');
                    $('#wxpay').addClass('setCol');
                    $('#wxpay').prop('readonly', true);
                    $('#isAlipay').removeClass('subset_icon_chcked');
                    $('#alipay').addClass('setCol');
                    $('#alipay').prop('readonly', true);
                    wxpay = 0.00
                    alipay = 0.00
                    $('#wxpay').val(0)
                    $('#alipay').val(0)
                }

                if (isDiscount == true && clickWhat == 'zhekou') {
                    if (isAlipay == false && ($.app.isClient || (is_wxpay == true && isWeixin))) {
                        isWxpay = true;
                        $('#isWxpay').addClass('subset_icon_chcked');
                        $('#wxpay').removeClass('setCol');
                        $('#wxpay').prop('readonly', false);
                    } else if (isWxpay == false && ($.app.isClient || (is_alipay == true && isAli))) {
                        isAlipay = true
                        $('#isAlipay').addClass('subset_icon_chcked');
                        $('#alipay').removeClass('setCol');
                        $('#alipay').prop('readonly', false);
                    }
                }
                var le_1 = trueTotalConsumption;
                if (leAmount > leMoney) {
                    leAmount = leMoney;
                    lebidina = leMoney;
                }
                // 是否选择了微信
                if (isWxpay == true || (is_wxpay == true && (le_1 > leMoney || leMoney == 0) && payorderInfo.pay_info.alipay_temp == 0)) {
                    if (is_load == 1 || is_load == 2) {
                        wxpaydian = parseFloat(Util.accSubtr(trueTotalConsumption, leAmount));
                        wxpay = parseFloat(Util.accSubtr(trueTotalConsumption, leAmount));
                        is_load_p = 0;
                        if (is_wxpay == true && (le_1 > leMoney || leMoney == 0) && payorderInfo.pay_info.alipay_temp == 0 && isWxpay == false && isAlipay == false && clickNum == 1) {
                            isWxpay = true;
                            $('#isWxpay').addClass('subset_icon_chcked');
                            $('#wxpay').removeClass('setCol');
                            $('#wxpay').prop('readonly', false);
                        }
                    }
                } else {
                    wxpay = 0;
                    // 是否选择支付宝
                }
                if (isAlipay == true || (is_alipay == true && (le_1 > leMoney || leMoney == 0) && payorderInfo.pay_info.wxpay_temp == 0)) {
                    if (is_load == 1 || is_load == 2) {
                        alipaydian = parseFloat(Util.accSubtr(trueTotalConsumption, leAmount));
                        alipay = parseFloat(Util.accSubtr(trueTotalConsumption, leAmount));
                        is_load_p = 0;
                        if (is_alipay == true && (le_1 > leMoney || leMoney == 0) && payorderInfo.pay_info.wxpay_temp == 0 && isAlipay == false && isWxpay == false && clickNum == 1) {
                            isAlipay = true;
                            $('#isAlipay').addClass('subset_icon_chcked');
                            $('#alipay').removeClass('setCol');
                            $('#alipay').prop('readonly', false);
                        }
                    }
                } else {
                    alipay = 0;
                }
                if (payorderInfo.pay_info.alipay_temp != 0 && isWeixin) {
                    isWxpay = true;
                    wxpaydian = parseFloat(Util.accSubtr(trueTotalConsumption, leAmount));
                    wxpay = parseFloat(Util.accSubtr(trueTotalConsumption, leAmount));
                    is_load_p = 0;
                    $('#isWxpay').addClass('subset_icon_chcked');
                    $('#wxpay').removeClass('setCol');
                    $('#wxpay').prop('readonly', false);


                } else if (payorderInfo.pay_info.wxpay_temp != 0 && isAli) {
                    alipaydian = parseFloat(Util.accSubtr(trueTotalConsumption, leAmount));
                    alipay = parseFloat(Util.accSubtr(trueTotalConsumption, leAmount));
                    is_load_p = 0;
                    isAlipay = true;
                    $('#isAlipay').addClass('subset_icon_chcked');
                    $('#alipay').removeClass('setCol');
                    $('#alipay').prop('readonly', false);

                }
                clickNum = 0
                    // 赋值 避免出现"冲突"问题
                lepay = leAmount;
                if (is_load_p == 0) {
                    is_load = 0;
                }

                // 应付金额不是0并且大于0，剩余的应付金额赋值给银台金额
                if (trueTotalConsumption != 0 && trueTotalConsumption > 0) {

                    /*// 如果应付金额 大于乐币余额 leMoney 乐币余额
                    if (trueTotalConsumption > leMoney || isLecoin == false) {*/

                    // shop_type_info 0 桌台模式  1叫号 2台卡
                    // 是桌台模式 并且 （浏览器打开 或者 没有选中微信支付）
                    if (shop_type_info == 1 && (yesNoAliPay == false || yesNoWxPay == false || yesNoAliPay == false || isWxpay == false || isAlipay == false)) {
                        // 银台支付金额 = 应付金额 - 乐币余额 - 微信金额||支付宝金额
                        if (isWxpay == true) {
                            cashier = parseFloat(Util.accSubtr(Util.accSubtr(trueTotalConsumption, leAmount), wxpay));

                            // 如果银台支付金额小于0，那就说明微信支付金额输入的超过实付金额了
                            if (cashier < 0) {
                                cashier = 0;

                                wxpay = parseFloat(Util.accSubtr(trueTotalConsumption, leAmount));
                                $('#wxpay').val(parseFloat(wxpay));
                            } else {
                                // 把微信支付金额显示出来
                                $('#wxpay').val(parseFloat(wxpay));
                            }
                            $('#wxpayDisplay').removeClass('hide');
                        } else if (isAlipay == true) {
                            cashier = parseFloat(Util.accSubtr(Util.accSubtr(trueTotalConsumption, leAmount), alipay));
                            // 如果银台支付金额小于0，那就说明支付宝支付金额输入的超过实付金额了
                            if (cashier < 0) {
                                cashier = 0;
                                alipay = parseFloat(Util.accSubtr(trueTotalConsumption, leAmount));
                                $('#alipay').val(parseFloat(alipay));
                            } else {
                                $('#alipay').val(parseFloat(alipay));
                            }
                            $('#alipayDisplay').removeClass('hide');
                        } else {
                            cashier = parseFloat(Util.accSubtr(trueTotalConsumption, leAmount));
                            if (cashier < 0) {
                                cashier = 0;
                            }
                        }
                        // 把银台支付金额显示出来
                        $('#cashierDisplay').removeClass('hide');
                    } else {
                        trueTotalConsumption = parseFloat(Util.accSubtr(trueTotalConsumption, leAmount));
                        if ((trueTotalConsumption > wxpay) || (trueTotalConsumption > alipay)) {
                            // 把微信支付金额显示出来
                            if (shop_type_info == 1 && isWxpay == true) {
                                // 银台支付金额 = 应付金额 - 微信金额
                                cashier = parseFloat(Util.accSubtr(trueTotalConsumption, wxpay));
                                // 如果银台支付金额小于0，那就说明微信支付金额输入的超过实付金额了
                                if (cashier <= 0) {
                                    cashier = 0;
                                    wxpay = trueTotalConsumption;
                                }
                                // 把银台支付金额显示出来
                                $('#cashierDisplay').removeClass('hide');
                            } else if (shop_type_info == 1 && isAlipay == true) {
                                // 银台支付金额 = 应付金额 - 支付宝金额
                                cashier = parseFloat(Util.accSubtr(trueTotalConsumption, alipay));
                                // 如果银台支付金额小于0，那就说明支付宝支付金额输入的超过实付金额了
                                if (cashier <= 0) {
                                    cashier = 0;
                                    alipay = trueTotalConsumption;
                                }
                                // 把银台支付金额显示出来
                                $('#cashierDissplay').removeClass('hide');
                            }
                        } else {
                            if (isWxpay == true) {
                                wxpay = trueTotalConsumption;
                                wxpaydian = trueTotalConsumption;
                            } else if (isAlipay == true) {
                                alipay = trueTotalConsumption;
                                alipaydian = trueTotalConsumption;
                            }
                        }
                        if (isWxpay == true) {
                            cashier = parseFloat(Util.accSubtr(trueTotalConsumption, wxpay));
                            $('#wxpayDisplay').removeClass('hide');
                            $('#wxpay').val(parseFloat(wxpay));
                            if (wxpaydian != 0) {
                                $('#wxpay').val(parseFloat(wxpaydian).toFixed(2));
                            } else {
                                $('#wxpay').val(parseFloat(wxpay).toFixed(2));
                            }
                        } else {
                            cashier = parseFloat(Util.accSubtr(trueTotalConsumption, alipay));
                            $('#alipayDisplay').removeClass('hide');
                            $('#alipay').val(parseFloat(alipay));
                            if (alipaydian != 0) {
                                $('#alipay').val(parseFloat(alipaydian).toFixed(2));
                            } else {
                                $('#alipay').val(parseFloat(alipay).toFixed(2));
                            }
                        }
                    }
                    /*} else {
                        // 应付金额小于0，那么乐币金额就等于0
                        if (trueTotalConsumption < 0) {
                            leAmount = 0;
                        } else {
                            // 乐币金额 = 应付金额
                            leAmount = trueTotalConsumption;
                        }

                        // 银台应付金额为0
                        cashier = 0;
                        wxpay = 0;
                        $('#wxpay').val(0);
                        // 把微信支付金额隐藏出来
                        $('#wxpayDisplay').addClass('hide');
                        // 把银台支付金额隐藏出来
                        $('#cashierDisplay').addClass('hide');
                    }*/
                } else {
                    cashier = 0;
                }
                // 如果银台值金额 == 0 隐藏
                if (cashier == 0) {
                    // 把银台支付金额隐藏出来
                    $('#cashierDisplay').addClass('hide');
                }

                // // is_input_wx  如果输入微信金额则不隐藏微信
                // if (wxpay == 0 && is_input_wx == false && isWxpay == true) {
                //  $('#wxpayDisplay').addClass('hide');
                // } else {
                //  is_input_wx = true;
                //  $('#wxpayDisplay').removeClass('hide');
                // }

                // // is_input_wx  如果输入微信金额则不隐藏微信
                // if (alipay == 0 && is_input_ali == false && isAlipay == true) {
                //  $('#alipayDisplay').addClass('hide');
                // } else {
                //  is_input_ali = true;
                //  $('#alipayDisplay').removeClass('hide');
                // }



                // 乐币金额
                if (lebidina != 0) {
                    if(this_le >= lebidina){
                        //不显示
                        $('#lebipay').addClass('hide');
                    }else{
                        //显示
                        $('#lebipay').removeClass('hide');
                    }
                    $('#stored').val(lebidina);
                } else {
                    if(this_le >= leAmount || leAmount == 0){
                        //不显示
                        $('#lebipay').addClass('hide');
                    }else{
                        //显示
                        $('#lebipay').removeClass('hide');
                    }
                    $('#stored').val(parseFloat(leAmount));
                }

                // 不可以使用微信支付 或者 不是客户端 或者 不是微信内打开的
                if (is_wxpay == false || ($.app.isClient == false && isWeixin == false)) { //  || $.app.isClient == false
                    // 把微信支付金额隐藏出来
                    $('#wxpayDisplay').addClass('hide');
                    // 为了 shop_type_info 不是0的时候在客户端金额的计算，才写的下面这个代码
                    if (wxpay != 0) {
                        cashier = wxpay;
                    }
                }

                // 不可以使用支付宝支付 或者 不是客户端 或者 不是支付宝内打开的
                if (is_alipay == false || ($.app.isClient == false && isAli == false)) { //  || $.app.isClient == false
                    // 把微信支付金额隐藏出来

                    $('#alipayDisplay').addClass('hide');
                    // 为了 shop_type_info 不是0的时候在客户端金额的计算，才写的下面这个代码
                    if (alipay != 0) {
                        cashier = alipay;
                    }
                }
                // 如果不是扫描的快捷支付订单 并且 是桌台模式 才赋值到页面
                if ((scanCodeType != 0 || scanType != 5) && shop_type_info == 1) {
                    // 银台支付金额
                    $('#cashier').val(parseFloat(cashier).toFixed(2));
                }

                // 判断如果应付金额<=0 说明可能是下了一个单支付了然后银台抛弃了用户在追单过来变成负数就不可以在使用乐币抵用劵付钱了
                if (moneysPro <= 0) {
                    $('#selectVouch,#UseLe').addClass('hide');
                }
            },
            selectVoucher: function() {
                // 选择抵用劵
                var _self = this;
                // 是否可以使用抵用劵，如果可以使用抵用劵就弹出框
                if (isUseVoucher == true) {
                    //$('#edit-voucher-dialog').removeClass('hide');

                    $.dialog = Dialog({
                        type: 3,
                        dom: '#edit-voucher-dialog',
                        success: function() {
                            voucherScroll.refresh();
                            $('#voucherList').delegate('nav', 'click', function() {
                                var self = this,
                                    recordsId = $(self).attr('record-id'),
                                    isEnable = $(self).attr('is-enable'), //0灰色不可点，1可用
                                    type = $(event.target).attr('data-type');

                                if (isEnable == 0) {
                                    return;
                                } else {
                                    var voucherMoney = $(self).find('b[data-type="voucherMoney"]').text();
                                    // 选中当前的，取消其他的选中
                                    $(this).find('div[data-type="isNO"]').addClass('vorchers-check').end()
                                        .siblings('nav').find('div[data-type="isNO"]').removeClass('vorchers-check');
                                    // 抵用劵id
                                    recordId = recordsId;
                                    // 是否选择了使用抵用劵（抵用劵id）
                                    canuseRecordId = recordsId;
                                    // 抵用劵金额
                                    vouchersPrice = voucherMoney;
                                    // 是否选择了使用抵用劵（抵用劵金额）
                                    canuseVouchePrice = voucherMoney;
                                    // 关闭弹出层
                                    $.dialog.close($.dialog.id);
                                    // console.log('a12')
                                    // 计算金额
                                    //_self.calculationAmount(isUseLe,isUseVoucher,isUseDiscount);
                                    // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                                    _self.generate_choice_submit('');
                                }
                            });
                        }
                    });
                }

                // 点击选择抵用劵左上角返回
                $('#returnPayorder').unbind('click').bind('click', function() {
                    // 关闭弹出层
                    $.dialog.close($.dialog.id);
                });
            },
            addressDialog: function(wait) {
                // 地址没有 并且 是外卖
                if ((user_addr == '' || user_addr == undefined) && (order_property == 2 || order_property == 3 || order_property == 4)) {
                    // Message.show('#msg', '您必须选择地址！', 2000, function () {});
                    $.dialog = Dialog({
                        type: 1,
                        btn: ['去设置'],
                        content: '您还没有设置收货地址，请点击这里设置',
                        closeFn: function() { // 确定
                            Cache.set('is_add', 1);
                            Cache.set("payorder-addr", location.href.split('?')[1]);
                            Page.open('address&card_id=' + card_id + '&page=takeaway')
                        }
                    });
                    return;
                } else {
                    this.orderPay(wait);
                }
            },

            // 订单支付
            orderPay: function(wait) {
                // is_pay_app ：1是 0否  在线下单是否要求全额支付
                // 如果是不是桌台模式是台卡或者叫号，并且银台应收金额不是0，就提示
                if (is_landed == 0) {
                    if (isWeixin) {
                        var data = '您必须用微信全额支付'
                    } else if (isAli) {
                        var data = '您必须用支付宝全额支付'
                    } else {
                        var data = '您必须全额支付'
                    }
                } else {
                    var data = '您必须全额支付'
                }
                if ((shop_type_info != 1 || is_pay_app == 1) && cashier != 0) {
                    Message.show('#msg', data, 2000, function() {});
                    return;
                }


                // 点击下单和下单并支付按钮，显示另一个按钮，实现不可重复点击 is_add_dis = false 是否显示添加菜品
                $('#wait_for_pay,#define-pay').addClass('hide');
                $('#no_wait_for_pay').text($('#wait_for_pay').text());
                $('#no_define-pay').text($('#define-pay').text());
                if (is_add_dis == false) {
                    // 全额支付不显示下单按钮
                    // is_pay_app ：1是 0否  在线下单是否要求全额支付
                    if (is_pay_app == 1) {
                        $('#no_wait_for_pay').addClass('hide');
                    } else {
                        $('#no_wait_for_pay').removeClass('hide');
                    }
                }
                $('#no_define-pay').removeClass('hide');


                // 如果选中了折扣样式，并且选择了折扣，并且可以使用折扣
                if ($('#isDiscount').hasClass('subset_icon_chcked') && isDiscount == true && isUseDiscount == true) {
                    // 就把乐币支付金额清零
                    leAmount = '0.00';
                    // 抵用劵id清空
                    recordId = '';
                } else { // 否则的话就设置折扣额度为100
                    discountSrice = 100;
                }

                is_second = 0;// 三秒请求都没有就报错

                // 扫描的快捷支付订单二维码订单
                if (scanCodeType == 0 && scanType == 5) {
                    if (isUseLe == false && isUseVoucher == false) {
                        Message.show('#msg', '您的账户余额不足！', 2000, function() {
                            $('#define-pay').removeClass('hide');
                            $('#no_define-pay').addClass('hide');
                            return;
                        });
                    } else {
                        this.orderQuickOrderPay(wait);
                    }
                } else if (scanCodeType == 0 && scanType == 4) {
                    // 判断是扫描过来的，并且是扫描的结账单二维码
                    this.orderScanOrderPay(wait);
                } else if (scanCodeType == 1 || is_scan == 1) { //is_scan == 1 表示是第二次扫描结账单过来的
                    // 从app快捷支付未支付列表页面订单
                    this.orderOrderPay(wait);
                } else {
                    // 正常下单订单
                    this.getOrderPay(wait);
                }
            },

            // 扫描过来的结账单进行支付
            orderScanOrderPay: function(wait, type) {
                $('#layer').addClass('hide');
                $('#layer').removeClass('hide');
                Message.show('#layer', '<img src="../img/base/loadingnew.gif"><br>正在加载</div>', false);
                //乐币输入金额
                var storedd = $('#stored').val();
                //微信输入的金额
                var wxppay = $('#wxpay').val();
                var alippay = $('#alipay').val();
                var self = this;

                // 点了下单（稍候支付）乐币抵用劵微信全部赋值给银台支付
                var storedwait = 0,
                    voucherwait = 0,
                    wxpaywait = 0,
                    voucher_ridwait = '',
                    cashierwait = 0,
                    alipaywait = 0;
                if (wait == 1) {
                    storedwait = 0;
                    voucherwait = 0;
                    wxpaywait = 0;
                    voucher_ridwait = '', alipaywait = 0;
                    cashierwait = parseFloat(Util.accAdd(Util.accAdd(Util.accAdd(Util.accAdd(storedd, vouchersPrice), wxppay), cashier), alippay)).toFixed(2);
                } else {
                    storedwait = storedd;
                    voucherwait = vouchersPrice;
                    wxpaywait = wxppay;
                    voucher_ridwait = recordId;
                    cashierwait = cashier;
                    alipaywait = alippay
                }


                var pay_moneys = Util.accSubtr(dishesConsume, ch_menu_money_info['pay_sub_moneys']);

                var single = {};
                if (order_property == 3 || order_property == 2 || order_property == 4) {
                    single = {
                        'user_name': user_addr.user_name, // 姓名
                        'user_tel': user_addr.user_tel, // 电话
                        'user_addr': user_addr.user_addr, // 地址
                    };
                }

                if (is_second == 3) {
                    $('#layer').addClass('hide');
                    Message.show('#msg', '获取openid失败', 2000);
                    $('#define-pay').removeClass('hide');
                    $('#no_define-pay').addClass('hide');
                    return;
                }
                var openid = Cache.get('openid');
                var shop_openid = Cache.get('openid_'+card_id);
                if ((openid == undefined || openid['openid'] == '') && isWeixin) {
                    setTimeout(function () {
                        is_second = is_second+1;
                        self.orderScanOrderPay(wait, type);// 重新获取
                    }, 1000);
                } /*else if (openid != undefined && (openid['openid'] == 'NO' || openid['openid'] == 'ERROR' || (shop_openid != undefined && (shop_openid['openid'] == 'NO' || shop_openid['openid'] == 'ERROR'))) && isWeixin) {
                    if (Util.getQueryString('e_type') == 1) {
                        $('#layer').addClass('hide');
                        Message.show('#msg', '获取openid失败', 2000);
                        $('#define-pay').removeClass('hide');
                        $('#no_define-pay').addClass('hide');
                        return;
                    } else {
                        if (openid['openid'] == 'NO' || openid['openid'] == 'ERROR') {
                            Cache.del('openid');
                        } else {
                            Cache.del('openid_'+card_id);
                        }
                        Util.openid_structure(1);// openid构造方法
                        this.orderScanOrderPay(wait, type);// 重新获取
                    }
                }*/ else {
                    $('#layer').addClass('hide');
                    var data = {
                        'is_url': location.href,
                        'card_id': card_id, // 会员卡id
                        'openid': (openid == undefined ? '' : openid['openid']),
                        'shop_openid': (shop_openid == undefined ? '' : shop_openid['openid']),
                        'pay_id': scanCodePayId, // 结账id
                        'trade_type': trade_type,
                        //'order_type': order_type,
                        'order_property': order_property,
                        'invoice': $('#invoice_text').val(),
                        'taxpayer_id': $('#taxpayer_id').val(),
                        'dinner_time': dinner_time, //没有的时候提0立即送餐传 1111111111 其他时间，前端转换成10位时间戳
                        'voucher': parseFloat(voucherwait).toFixed(2),
                        'is_member_price': conflict_pay_info['is_member_price'],
                        'promo_id': conflict_pay_info['promo_id'],
                        'promo': conflict_pay_info['promo'],
                        'pay_sub_moneys': parseFloat(ch_menu_money_info['pay_sub_moneys']).toFixed(2), // 优惠金额汇总
                        'pay_moneys': parseFloat(pay_moneys).toFixed(2), // 实收金额汇总
                        'consumes': parseFloat(dishesConsume).toFixed(2), // 订单消费金额
                        'discount_rate': discountSrice, // 折扣额度
                        'money': parseFloat(trueTotalConsumption).toFixed(2), // 实收金额（折后金额）
                        'stored': parseFloat(storedwait).toFixed(2), // 储值账户（乐币）支付金额
                        'voucher_rid': voucher_ridwait, // 抵用劵账户支付金额
                        'cashier': parseFloat(cashierwait).toFixed(2), // 收银台支付金额
                        'wxpay': parseFloat(wxpaywait).toFixed(2), // 微信支付金额
                        'alipay': parseFloat(alipaywait).toFixed(2), // 支付宝支付金额
                        'cid': Cache.get('getCID')
                    };
                    var dataAjax = $.extend({}, single, data);

                    Data.setAjax('orderScanPay', dataAjax, '#layer', '#msg', { 200214: '' }, function(respnoseText) {
                        if (respnoseText.code == 200214 || respnoseText.code == 200213 || respnoseText.code == 200210) { //扫描订单支付成功
                            if (type == 1) {
                                // 跳转点菜页面修改菜品
                                Page.open('dishes&card_id=' + card_id + '&table_id=' + table_id + '&page=merchantHome&type=0&scanType=2&pay_id=' + scanCodePayId);
                            } else {
                                // 没有全额支付完只能在当前页面，否则跳转到详情页面显示数据
                                if (cashierwait != 0) {
                                    var message = '下单成功'
                                    if (wait != 1) {
                                        message = respnoseText.message;
                                    }
                                    Message.show('#msg', message, 2000, function() {
                                        window.location.href = phpJump + 'html/index.html?payorder&card_id=' + card_id + '&pay_id=' + scanCodePayId + '&page=dishes&type=0&scanType=4&is_scan=1&shop_id=' + payorderInfo.shop_id + '&table_id=' + payorderInfo.table_id + '&is_comm=1';
                                    });
                                } else {
                                    Message.show('#msg', respnoseText.message, 2000, function() {
                                        // 跳转到可点评的订单列表
                                        //Page.open('orderlist&card_id='+card_id+'&page=merchantHome&order_list_type=2');
                                        Page.open('orderDetails&card_id=' + card_id + '&pay_id=' + scanCodePayId + '&otherName=pay_id&page=orderlist&order_list_type=1&is_comm=1');
                                    });
                                }
                            }
                        } else if (respnoseText.code == 200218) {
                            self.wxpayOrder(respnoseText.data, 1, cashierwait);
                        } else if (respnoseText.code == 200228) {
                            self.alipayOrder(respnoseText.data);
                        } else if (respnoseText.code == 200221) {
                            // 扫描订单，如果订单已经有用户，且与扫描用户不一致，返回 200221  和PAY_ID  前端直接跳转到订单详情页。
                            Message.show('#msg', respnoseText.message, 2000, function() {
                                Page.open('orderDetails&card_id=' + card_id + '&pay_id=' + respnoseText.data + '&otherName=pay_id&page=orderlist&order_list_type=1&is_comm=1');
                            });
                        } else {
                            Message.show('#msg', respnoseText.message, 2000);
                            // 点击下单和下单并支付按钮，显示另一个按钮，实现不可重复点击,有了返回数据就显示可点击的按钮 is_add_dis = false,            // 是否显示添加菜品
                            if (is_add_dis == false) {
                                $('#wait_for_pay').removeClass('hide');
                            }
                            $('#define-pay').removeClass('hide');
                            $('#no_wait_for_pay,#no_define-pay').addClass('hide');
                        }
                    }, 2);
                }
            },

            // 从app快捷支付未支付列表页面订单进行支付
            orderOrderPay: function(wait) {
                $('#layer').addClass('hide');
                $('#layer').removeClass('hide');
                Message.show('#layer', '<img src="../img/base/loadingnew.gif"><br>正在加载</div>', false);
                //乐币输入金额
                var storedd = $('#stored').val();
                //微信输入的金额
                var wxppay = $('#wxpay').val();
                var alippay = $('#alipay').val();
                var self = this;

                // 点了下单（稍候支付）乐币抵用劵微信全部赋值给银台支付
                var storedwait = 0,
                    voucherwait = 0,
                    wxpaywait = 0,
                    voucher_ridwait = '',
                    cashierwait = 0,
                    alipaywait = 0;
                if (wait == 1) {
                    storedwait = 0;
                    voucherwait = 0;
                    wxpaywait = 0;
                    voucher_ridwait = '', alipaywait = 0;
                    cashierwait = parseFloat(Util.accAdd(Util.accAdd(Util.accAdd(Util.accAdd(storedd, vouchersPrice), wxppay), cashier), alippay)).toFixed(2);
                } else {
                    storedwait = storedd;
                    voucherwait = vouchersPrice;
                    wxpaywait = wxppay;
                    voucher_ridwait = recordId;
                    cashierwait = cashier;
                    alipaywait = alippay
                }


                var pay_moneys = Util.accSubtr(dishesConsume, ch_menu_money_info['pay_sub_moneys']);

                var single = {};
                if (order_property == 3 || order_property == 2 || order_property == 4) {
                    single = {
                        'user_name': user_addr.user_name, // 姓名
                        'user_tel': user_addr.user_tel, // 电话
                        'user_addr': user_addr.user_addr, // 地址
                    };
                }

                if (is_second == 3) {
                    $('#layer').addClass('hide');
                    Message.show('#msg', '获取openid失败', 2000);
                    $('#define-pay').removeClass('hide');
                    $('#no_define-pay').addClass('hide');
                    return;
                }
                var openid = Cache.get('openid');
                var shop_openid = Cache.get('openid_'+card_id);
                if ((openid == undefined || openid['openid'] == '') && isWeixin) {
                    setTimeout(function () {
                        is_second = is_second+1;
                        self.orderOrderPay(wait);// 重新获取
                    }, 1000);
                } /*else if (openid != undefined && (openid['openid'] == 'NO' || openid['openid'] == 'ERROR' || (shop_openid != undefined && (shop_openid['openid'] == 'NO' || shop_openid['openid'] == 'ERROR'))) && isWeixin) {
                    if (Util.getQueryString('e_type') == 1) {
                        $('#layer').addClass('hide');
                        Message.show('#msg', '获取openid失败', 2000);
                        $('#define-pay').removeClass('hide');
                        $('#no_define-pay').addClass('hide');
                        return;
                    } else {
                        if (openid['openid'] == 'NO' || openid['openid'] == 'ERROR') {
                            Cache.del('openid');
                        } else {
                            Cache.del('openid_'+card_id);
                        }
                        Util.openid_structure(1);// openid构造方法
                        this.orderOrderPay(wait);// 重新获取
                    }
                }*/ else {
                    $('#layer').addClass('hide');
                    var data = {
                        'is_url': location.href,
                        'card_id': card_id, // 会员卡id
                        'trade_type': trade_type,
                        //'order_type': order_type,
                        'order_property': order_property,
                        'invoice': $('#invoice_text').val(),
                        'taxpayer_id': $('#taxpayer_id').val(),
                        'dinner_time': dinner_time, //没有的时候提0立即送餐传 1111111111 其他时间，前端转换成10位时间戳
                        'is_member_price': conflict_pay_info['is_member_price'],
                        'voucher': parseFloat(voucherwait).toFixed(2),
                        'promo_id': conflict_pay_info['promo_id'],
                        'promo': conflict_pay_info['promo'],
                        'pay_sub_moneys': parseFloat(ch_menu_money_info['pay_sub_moneys']).toFixed(2), // 优惠金额汇总
                        'pay_moneys': parseFloat(pay_moneys).toFixed(2), // 实收金额汇总
                        'openid': (openid == undefined ? '' : openid['openid']),
                        'shop_openid': (shop_openid == undefined ? '' : shop_openid['openid']),
                        'pay_id': scanCodePayId, // 订单id
                        'consumes': parseFloat(dishesConsume).toFixed(2), // 订单消费金额
                        'discount_rate': discountSrice, // 折扣额度
                        'money': parseFloat(trueTotalConsumption).toFixed(2), // 实收金额（折后金额）
                        'stored': parseFloat(storedwait).toFixed(2), // 储值账户（乐币）支付金额
                        'voucher_rid': voucher_ridwait, // 抵用劵账户支付金额
                        'cashier': parseFloat(cashierwait).toFixed(2), // 收银台支付金额
                        'wxpay': parseFloat(wxpaywait).toFixed(2), // 微信支付金额
                        'alipay': parseFloat(alipaywait).toFixed(2), // 支付宝支付金额
                        'cid': Cache.get('getCID')
                    };
                    var dataAjax = $.extend({}, single, data);

                    Data.setAjax('orderOrderPay', dataAjax, '#layer', '#msg', { 200210: '', 200211: '' }, function(respnoseText) {
                        if (respnoseText.code == 200211 || respnoseText.code == 200210) { // 订单下单成功
                            // 没有全额支付完只能在当前页面，否则跳转到详情页面显示数据
                            if (cashierwait != 0) {
                                var message = '下单成功';
                                if (wait != 1) {
                                    if (parseFloat(storedwait) == 0 && voucher_ridwait == '' && parseFloat(wxpaywait) == 0 && parseFloat(alipaywait) == 0) {
                                        var message = '下单成功';
                                    } else {
                                        message = respnoseText.message;
                                    }
                                }
                                Message.show('#msg', message, 2000, function() {
                                    window.location.href = phpJump + 'html/index.html?payorder&card_id=' + card_id + '&pay_id=' + scanCodePayId + '&page=dishes&type=0&scanType=4&is_scan=1&shop_id=' + payorderInfo.shop_id + '&table_id=' + payorderInfo.table_id + '&is_comm=1';
                                });
                            } else {
                                Message.show('#msg', respnoseText.message, 2000, function() {
                                    // 跳转到订单详情页面
                                    //Page.open('orderDetails&card_id='+card_id+'&order_id='+respnoseText.data.order_id+'&page=payorder');
                                    Page.open('orderDetails&card_id=' + card_id + '&pay_id=' + respnoseText.data + '&otherName=pay_id&page=orderlist&order_list_type=1&is_comm=1');
                                });
                            }
                        } else if (respnoseText.code == 200218) {
                            self.wxpayOrder(respnoseText.data, 3, cashierwait);
                        } else if (respnoseText.code == 200228) {
                            self.alipayOrder(respnoseText.data);
                        } else {
                            Message.show('#msg', respnoseText.message, 2000);
                            // 点击下单和下单并支付按钮，显示另一个按钮，实现不可重复点击,有了返回数据就显示可点击的按钮 is_add_dis = false,            // 是否显示添加菜品
                            if (is_add_dis == false) {
                                $('#wait_for_pay').removeClass('hide');
                            }
                            $('#define-pay').removeClass('hide');
                            $('#no_wait_for_pay,#no_define-pay').addClass('hide');
                        }
                    }, 2);
                }
            },

            // 正常下单进行支付
            getOrderPay: function(wait, is_type_b) {
                $('#layer').addClass('hide');
                $('#layer').removeClass('hide');
                Message.show('#layer', '<img src="../img/base/loadingnew.gif"><br>正在加载</div>', false);
                //乐币输入金额
                var storedd = $('#stored').val();
                //微信输入的金额
                var wxppay = $('#wxpay').val();
                var alippay = $('#alipay').val();
                var self = this;

                // 点了下单（稍候支付）乐币抵用劵微信全部赋值给银台支付
                var storedwait = 0,
                    voucherwait = 0,
                    wxpaywait = 0,
                    voucher_ridwait = '',
                    cashierwait = 0,
                    alipaywait = 0;
                if (wait == 1) {
                    storedwait = 0;
                    voucherwait = 0;
                    wxpaywait = 0;
                    voucher_ridwait = '', alipaywait = 0;
                    cashierwait = parseFloat(Util.accAdd(Util.accAdd(Util.accAdd(Util.accAdd(storedd, vouchersPrice), wxppay), cashier), alippay)).toFixed(2);
                } else {
                    storedwait = storedd;
                    voucherwait = vouchersPrice;
                    wxpaywait = wxppay;
                    voucher_ridwait = recordId;
                    cashierwait = cashier;
                    alipaywait = alippay
                }

                var consumes_money = payorderInfo.order.new_order == undefined ? dishesConsume : payorderInfo.order.new_order.consume;

                if (is_first_single == 1) {
                    consumes_money = $('#consume').text();
                    dishesConsume = $('#consume').text();
                    var num_t = 0;
                    for (var i in dishesMenu) {
                        num_t++;
                    }
                    sumMenuNum = num_t;
                }

                var pay_moneys = Util.accSubtr(dishesConsume, ch_menu_money_info['pay_sub_moneys']);


                var single = {};
                // order_property 堂食1 外卖2 打包3 商城配送4
                // 是否首单
                if (is_first_single == 1 && (order_property == 1 || order_property == 2 || order_property == 3)) {
                    if (order_property == 1) {
                        single = {
                            'user_num': user_num, // 就餐人数
                            'is_chopsticks': is_chopsticks_t, // 是否选择了自备餐具
                        };
                    } else if (order_property == 2 || order_property == 3) {
                        single = {
                            'user_num': user_num, // 就餐人数
                            'is_chopsticks': is_chopsticks_t, // 是否选择了自备餐具
                            'user_name': user_addr.user_name, // 姓名
                            'user_tel': user_addr.user_tel, // 电话
                            'user_addr': user_addr.user_addr // 地址
                        };
                    }
                } else if (order_property == 3 || order_property == 2 || order_property == 4) {
                    single = {
                        'user_name': user_addr.user_name, // 姓名
                        'user_tel': user_addr.user_tel, // 电话
                        'user_addr': user_addr.user_addr // 地址
                    };
                }

                /*table_id = table_id == '生成中' ? '' : table_id;
                var payIt = payorderInfo.pay_id == 'new_order' ? '' : payorderInfo.pay_id;*/


                if (is_second == 3) {
                    $('#layer').addClass('hide');
                    Message.show('#msg', '获取openid失败', 2000);
                    $('#define-pay').removeClass('hide');
                    $('#no_define-pay').addClass('hide');
                    return;
                }
                var openid = Cache.get('openid');
                var shop_openid = Cache.get('openid_'+card_id);
                if ((openid == undefined || openid['openid'] == '') && isWeixin) {
                    setTimeout(function () {
                        is_second = is_second+1;
                        self.getOrderPay(wait);// 重新获取
                    }, 1000);
                } /*else if (openid != undefined && (openid['openid'] == 'NO' || openid['openid'] == 'ERROR' || (shop_openid != undefined && (shop_openid['openid'] == 'NO' || shop_openid['openid'] == 'ERROR'))) && isWeixin) {
                    if (Util.getQueryString('e_type') == 1) {
                        $('#layer').addClass('hide');
                        Message.show('#msg', '获取openid失败', 2000);
                        $('#define-pay').removeClass('hide');
                        $('#no_define-pay').addClass('hide');
                        return;
                    } else {
                        if (openid['openid'] == 'NO' || openid['openid'] == 'ERROR') {
                            Cache.del('openid');
                        } else {
                            Cache.del('openid_'+card_id);
                        }
                        Util.openid_structure(1);// openid构造方法
                        this.getOrderPay(wait, 1);// 重新获取
                    }
                }*/ else {
                    // $('#layer').addClass('hide');
                    var data = {
                        'is_url': location.href,
                        'order_type_info': 1, //1桌台点餐 2叫号点餐
                        'card_id': card_id, // 会员卡id
                        'trade_type': trade_type,
                        'openid': (openid == undefined ? '' : openid['openid']),
                        'shop_openid': (shop_openid == undefined ? '' : shop_openid['openid']),
                        'shop_id': shop_id, // 门店id
                        'table_id': table_id, // 桌台id
                        'pay_id': payorderInfo.pay_id,
                        //'order_type': order_type, // 订单类型 餐厅1 商城2
                        'order_property': order_property, // 订单属性 堂食1 外卖2 打包3 商城配送4
                        'invoice': $('#invoice_text').val(), // 发票
                        'taxpayer_id': $('#taxpayer_id').val(),
                        'dinner_time': dinner_time, //没有的时候提0立即送餐传 1111111111 其他时间，前端转换成10位时间戳
                        'consume': parseFloat(consumes_money).toFixed(2), // 订单消费金额
                        'consumes': parseFloat(dishesConsume).toFixed(2), // 本次支付的消费金额
                        'order_note': $('#orderNote').val(), // 订单备注信息
                        'discount_rate': discountSrice, // 折扣额度
                        'money': parseFloat(trueTotalConsumption).toFixed(2), // 实收金额（折后金额）
                        'stored': parseFloat(storedwait).toFixed(2), // 储值账户（乐币）支付金额
                        'voucher_rid': voucher_ridwait, // 抵用劵账户id 使用抵用券时，提交抵用券的record_id
                        'cashier': parseFloat(cashierwait).toFixed(2), // 收银台支付金额
                        'sum_menu_num': sumMenuNum, // 菜品个数，不是份数
                        'menu': JSON.stringify(dishesMenu), // 菜品
                        'wxpay': parseFloat(wxpaywait).toFixed(2), // 微信支付金额
                        'alipay': parseFloat(alipaywait).toFixed(2), // 支付宝支付金额
                        'cid': Cache.get('getCID'),
                        'is_member_price': conflict_pay_info['is_member_price'],
                        'voucher': parseFloat(voucherwait).toFixed(2),
                        'promo_id': conflict_pay_info['promo_id'],
                        'promo': conflict_pay_info['promo'],
                        'pay_sub_moneys': parseFloat(ch_menu_money_info['pay_sub_moneys']).toFixed(2), // 优惠金额汇总
                        'pay_moneys': parseFloat(pay_moneys).toFixed(2) // 实收金额汇总
                    };

                    var dataAjax = $.extend({}, single, data);

                    Data.setAjax('orderSubmit', dataAjax, '#layer', '#msg', { 200210: '', 200211: '' }, function(respnoseText) {
                        if (respnoseText.code == 200211 || respnoseText.code == 200210) {
                            // 删除当前商户的点菜缓存
                            Cache.del(card_id + '-allmenu');
                            Cache.del('allMenuData_1');
                            Cache.del('allMenuData_2');
                            Cache.del('allMenuData_3');
                            Cache.del('allMenuData_4');
                            // 删除当前商户用来判断的缓存
                            Cache.del(card_id + '-shop');
                            Cache.del('disOrder');
                            // 没有全额支付完只能在当前页面，否则跳转到详情页面显示数据
                            if (cashierwait != 0) {
                                var message = '下单成功'
                                if (wait != 1) {
                                    if (parseFloat(storedwait) == 0 && voucher_ridwait == '' && parseFloat(wxpaywait) == 0 && parseFloat(alipaywait) == 0) {
                                        var message = '下单成功';
                                    } else {
                                        message = respnoseText.message;
                                    }
                                }
                                Message.show('#msg', message, 2000, function() {
                                    window.location.href = phpJump + 'html/index.html?payorder&card_id=' + card_id + '&pay_id=' + respnoseText.data + '&page=dishes&type=0&scanType=4&is_scan=1&shop_id=' + payorderInfo.shop_id + '&table_id=' + payorderInfo.table_id + '&is_comm=1&order_property=' + order_property;
                                });
                            } else {
                                Message.show('#msg', respnoseText.message, 2000, function() {
                                    // 跳转到订单详情页面
                                    //Page.open('orderDetails&card_id='+card_id+'&order_id='+respnoseText.data.order_id+'&page=payorder');
                                    Page.open('orderDetails&card_id=' + card_id + '&pay_id=' + respnoseText.data + '&otherName=pay_id&page=orderlist&order_list_type=1&is_comm=1&order_property=' + order_property);
                                });
                            }
                        } else if (respnoseText.code == 200218) {
                            self.wxpayOrder(respnoseText.data, 4, cashierwait);
                        } else if (respnoseText.code == 200228) {
                            self.alipayOrder(respnoseText.data);
                        } else {
                            Message.show('#msg', respnoseText.message, 2000);
                            // 点击下单和下单并支付按钮，显示另一个按钮，实现不可重复点击,有了返回数据就显示可点击的按钮 is_add_dis = false,            // 是否显示添加菜品
                            if (is_add_dis == false) {
                                $('#wait_for_pay').removeClass('hide');
                            }
                            $('#define-pay').removeClass('hide');
                            $('#no_wait_for_pay,#no_define-pay').addClass('hide');
                        }
                    }, 2);
                }
            },
            // 支付宝支付
            alipayOrder: function(alipaydata) {
                // 删除当前商户的点菜缓存
                Cache.del(card_id + '-allmenu');
                Cache.del('allMenuData_1');
                Cache.del('allMenuData_2');
                Cache.del('allMenuData_3');
                Cache.del('allMenuData_4');
                $('#alipayDiv').html(alipaydata)
                $('#alipaysubmit').submit()
            },
            // 微信支付跳转
            wxpayOrder: function(weixinPaydata, type, cashierwait) {
                // 删除当前商户的点菜缓存
                Cache.del(card_id + '-allmenu');
                Cache.del('allMenuData_1');
                Cache.del('allMenuData_2');
                Cache.del('allMenuData_3');
                Cache.del('allMenuData_4');
                // 删除当前商户用来判断的缓存
                Cache.del(card_id + '-shop');
                Cache.del('disOrder');

                /*//type 1结账单 2快捷支付订单 3未支付订单 4普通订单
                var page = {
                    'cid': Cache.get('getCID'),
                    'card_id': card_id
                };
                var data = $.extend({}, page, weixinPaydata);
                Cache.set('wxpayjump', data);*/

                if (isWeixin) {
                    function onBridgeReady() {
                        WeixinJSBridge.invoke(
                            'getBrandWCPayRequest', {
                                "appId": weixinPaydata.appId, //公众号名称，由商户传入
                                "timeStamp": weixinPaydata.timeStamp, //时间戳，自1970年以来的秒数
                                "nonceStr": weixinPaydata.nonceStr, //随机串
                                "package": weixinPaydata.package,
                                "signType": weixinPaydata.signType, //微信签名方式：
                                "paySign": weixinPaydata.paySign //微信签名
                            },
                            function(res) {

                                //WeixinJSBridge.log(res.err_msg);

                                // 延时10毫秒在运行，避免出现微信返回没有到这里无反应
                                setTimeout(function() {
                                    if (res.err_msg == "get_brand_wcpay_request:ok") {
                                        //window.location.reload();
                                        var data = {
                                            'cid': Cache.get('getCID'),
                                            'card_id': card_id,
                                            //'order_id': weixinPaydata.order_id,
                                            'prepayid': weixinPaydata.package.split('=')[1],
                                            'noncestr': weixinPaydata.nonceStr,
                                            'timestamp': weixinPaydata.timeStamp,
                                            'sign': weixinPaydata.paySign
                                        };

                                        Data.setCallback(wxConfig + 'wxpay/callback_order_jsapi.php', data, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                                            // 没有全额支付完只能在当前页面，否则跳转到详情页面显示数据
                                            if (cashierwait != 0) {
                                                window.location.href = phpJump + 'html/index.html?payorder&card_id=' + card_id + '&pay_id=' + weixinPaydata.pay_id + '&page=dishes&type=0&scanType=4&is_scan=1&shop_id=' + payorderInfo.shop_id + '&table_id=' + payorderInfo.table_id + '&is_comm=1&order_property=' + order_property;
                                            } else {
                                                Page.open('orderDetails&card_id=' + card_id + '&pay_id=' + weixinPaydata.pay_id + '&otherName=pay_id&page=orderlist&order_list_type=1&is_comm=1&order_property=' + order_property);
                                            }
                                        }, 1);
                                    } else {
                                        window.location.href = phpJump + 'html/index.html?payorder&card_id=' + card_id + '&pay_id=' + weixinPaydata.pay_id + '&page=dishes&type=0&scanType=4&is_scan=1&shop_id=' + payorderInfo.shop_id + '&table_id=' + payorderInfo.table_id + '&is_comm=1&order_property=' + order_property;
                                    }
                                }, 10);
                            }
                        );
                    }
                    if (typeof WeixinJSBridge == "undefined") {
                        if (document.addEventListener) {
                            document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
                        } else if (document.attachEvent) {
                            document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
                            document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
                        }
                    } else {
                        onBridgeReady();
                    }
                } else {
                    // 请求客户端跳转微信并传过去数据
                    Mobile.weixinPay(weixinPaydata.appid, weixinPaydata.partnerid, weixinPaydata.prepayid, weixinPaydata.package, weixinPaydata.noncestr, weixinPaydata.timestamp, weixinPaydata.sign, function(result) {
                        //微信回调值（0：成功，-1：错误，-2：取消）
                        if (result == '0') { //orderData.callback_url
                            var data = {
                                'cid': Cache.get('getCID'),
                                'card_id': card_id,
                                //'order_id': weixinPaydata.order_id,
                                'prepayid': weixinPaydata.prepayid,
                                'noncestr': weixinPaydata.noncestr,
                                'timestamp': weixinPaydata.timestamp,
                                'sign': weixinPaydata.sign
                            };
                            Data.setCallback(wxConfig + 'wxpay/callback_order.php', data, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                                // 没有全额支付完只能在当前页面，否则跳转到详情页面显示数据
                                if (cashierwait != 0) {
                                    window.location.href = phpJump + 'html/index.html?payorder&card_id=' + card_id + '&pay_id=' + weixinPaydata.pay_id + '&page=dishes&type=0&scanType=4&is_scan=1&shop_id=' + payorderInfo.shop_id + '&table_id=' + payorderInfo.table_id + '&is_comm=1&order_property=' + order_property;
                                } else {
                                    Page.open('orderDetails&card_id=' + card_id + '&pay_id=' + weixinPaydata.pay_id + '&otherName=pay_id&page=orderlist&order_list_type=1&is_comm=1&order_property=' + order_property);
                                }
                            }, 1);
                        } else if (result == '-1' || result == '-2') {
                            window.location.href = phpJump + 'html/index.html?payorder&card_id=' + card_id + '&pay_id=' + weixinPaydata.pay_id + '&page=dishes&type=0&scanType=4&is_scan=1&shop_id=' + payorderInfo.shop_id + '&table_id=' + payorderInfo.table_id + '&is_comm=1&order_property=' + order_property;
                        }
                    });
                }
            },

            // 生成当前选择的支付方案，提交检查冲突 // is_dis=1 是否点了取消会员折扣
            generate_choice_submit: function(is_member_price, is_member_discount, is_dis, is_type_t) {

                if (is_member_price === '') {
                    // conflict_pay_info 支付信息
                    is_member_price = conflict_pay_info['is_member_price'];
                }

                // 先赋值原始数据 conflict_pay_info 支付信息
                var u_pay_info = this.dishesStackHandle(conflict_pay_info, u_pay_info);
                // 赋值改变的数据
                /*var stored = $('#stored').val();      //乐币
                var wxpay = $('#wxpay').val();          //微信*/

                // 是否使用会员价 0 否 1 是
                u_pay_info['is_member_price'] = is_member_price;

                // 是否使用会员折扣 is_member_discount 0 不支持 1 支持
                if (is_member_discount == 1) {
                    u_pay_info['discount_rate'] = payorderInfo.user_account.discount_rate;
                } else if (is_member_discount === 0) {
                    u_pay_info['discount_rate'] = 100;
                }

                // 出现问题，当选中会员折扣的时候，因为和优惠方案有冲突，所以会取消优惠方案，再取消选中会员折扣的时候，和优惠方案没有冲突但是没有在选中优惠方案，所以提交支付的时候会报错，无冲突不能取消银台优惠方案
                if (is_type_t != 8 && payorderInfo.pay_info.promo_id != '' &&

                    ((payorderInfo.pay_info.promo.pay_type['ct0000000003'] == 0 && lepay == 0) || payorderInfo.pay_info.promo.pay_type['ct0000000003'] != 0) &&
                    ((payorderInfo.pay_info.promo.pay_type['ct0000000004'] == 0 && vouchersPrice == 0) || payorderInfo.pay_info.promo.pay_type['ct0000000004'] != 0) &&
                    ((payorderInfo.pay_info.promo.pay_type['ct0000000005'] == 0 && wxpay == 0) || payorderInfo.pay_info.promo.pay_type['ct0000000005'] != 0) &&
                    ((payorderInfo.pay_info.promo.pay_type['ct0000000006'] == 0 && alipay == 0) || payorderInfo.pay_info.promo.pay_type['ct0000000006'] != 0) &&
                    (
                        (payorderInfo.pay_info.promo.is_member_discount == 0 && u_pay_info['discount_rate'] == 100 && payorderInfo.pay_info.promo.is_member_price == 1) ||
                        (payorderInfo.pay_info.promo.is_member_price == 0 && u_pay_info['is_member_price'] == 0 && payorderInfo.pay_info.promo.is_member_discount == 1) ||
                        (payorderInfo.pay_info.promo.is_member_discount == 1 && payorderInfo.pay_info.promo.is_member_price == 1) ||
                        (u_pay_info['discount_rate'] == 100 && u_pay_info['is_member_price'] == 0) ||
                        (u_pay_info['discount_rate'] == 100 && payorderInfo.pay_info.promo.is_member_price == 0 && is_dis == 1)

                    )) {
                    if (u_pay_info['discount_rate'] == 100 && payorderInfo.pay_info.promo.is_member_price == 0 && is_dis == 1) {
                        u_pay_info['is_member_price'] = 0;
                    }
                    conflict_pay_info['promo_id'] = payorderInfo['pay_info']['promo_id'];
                    conflict_pay_info['promo'] = this.dishesStackHandle(payorderInfo['pay_info']['promo'], conflict_pay_info['promo']);
                }
                var promo = new Array();                // 优惠方案
                if (promoId != '') {
                    for (var i in payorderInfo.promo) {
                        if (payorderInfo.promo[i].promo_id == promoId) {
                            promo = payorderInfo.promo[i];
                            break;
                        }
                    }
                }

                // alert(u_pay_info['discount_rate'])
                // 处理会员价的选中，因为有些冲突取消会员价后，如果用户在选择跟会员价不冲突的，会员价没有自动选择上，这里是处理要自动选择上
                if (
                        is_landed == 1 &&
                        u_pay_info['is_member_price'] == 0 &&
                        payorderInfo.user_account != undefined &&
                        (payorderInfo.user_account.is_member_price == 1 || payorderInfo.pay_info.is_member_price == 1) &&
                        isHasPay == false &&
                        payorderInfo.pay_type != '' &&
                        (payorderInfo.pay_type['ct0000000003'].is_member_price == 1 || (payorderInfo.pay_type['ct0000000003'].is_member_price == 0 && lepay == 0)) &&
                        (payorderInfo.pay_type['ct0000000004'].is_member_price == 1 || (payorderInfo.pay_type['ct0000000004'].is_member_price == 0 && vouchersPrice == 0)) &&
                        (payorderInfo.pay_type['ct0000000005'].is_member_price == 1 || (payorderInfo.pay_type['ct0000000005'].is_member_price == 0 && wxpay == 0)) &&
                        (payorderInfo.pay_type['ct0000000006'].is_member_price == 1 || (payorderInfo.pay_type['ct0000000006'].is_member_price == 0 && alipay == 0)) &&
                        (u_pay_info['discount_rate'] == 100 || payorderInfo.pay_info.is_member_price_discount != 0) &&
                        (promoId == '' || (promo != '' && promo.is_member_price == 1))

                    ) {

                    u_pay_info['is_member_price'] = 1;
                    is_member_price = 1;
                }






                // 常规支付方式（乐币、抵用劵、微信）
                u_pay_info['stored'] = lepay;
                u_pay_info['voucher'] = vouchersPrice;
                u_pay_info['wxpay'] = wxpay;
                u_pay_info['alipay'] = alipay;

                // 优惠方案
                u_pay_info['promo_id'] = promoId;
                u_pay_info['promo'] = promo;
                // console.log(7777777777777)
                //return u_pay_info;
                // 解决所有冲突
                this.check_pay_temp_user(u_pay_info);

            },
            /**
             *  检查支付方案：用户端，处理所有冲突
             *  u_pay_info：用户提交的支付方案
             *  order_info：用户的订单信息
             **/
            check_pay_temp_user: function(u_pay_info, order_info) {
                // console.log(8888888888888888)
                // console.log(u_pay_info )
                var self = this;
                //获取当前的支付信息
                var u_pay_temp = self.dishesStackHandle(conflict_pay_info, u_pay_temp);
                //获取支付方式信息: 1现金 2银行卡 3乐币 4抵用券 5微信
                var pay_type_info_re = self.dishesStackHandle(payorderInfo.pay_type, pay_type_info_re);
                //校验后的支付信息：u_pay_info + u_pay_temp
                var pay_info_check = self.dishesStackHandle(u_pay_temp, pay_info_check);

                //加入用户账户信息
                pay_info_check['user_account'] = self.dishesStackHandle(payorderInfo.user_account, pay_info_check['user_account']);

                //支付方式整理：只需要校验u_pay_info中有金额的，pay_info_check忽略
                pay_info_check['pay_type'] = {};
                //u_pay_info['principal'] = G::$POST['principal'] = '0.00';
                if (u_pay_info['stored'] != 0) {
                    //u_pay_info['principal'] = G::$POST['principal'] = self::_use_principal(u_pay_info['stored'], pay_info_check['user_account']);
                    pay_info_check['pay_type']['ct0000000003'] = self._format_pay_type('ct0000000003', u_pay_info['stored'], u_pay_info['principal'], pay_type_info_re);
                    pay_info_check['stored'] = parseFloat(Util.accAdd(pay_info_check['stored'], u_pay_info['stored'])).toFixed(2);
                }
                if (u_pay_info['voucher'] != 0) {
                    pay_info_check['pay_type']['ct0000000004'] = self._format_pay_type('ct0000000004', '0', u_pay_info['voucher'], pay_type_info_re);
                    pay_info_check['voucher'] = parseFloat(Util.accAdd(pay_info_check['voucher'], u_pay_info['voucher'])).toFixed(2);
                }
                if (u_pay_info['wxpay'] != 0) {
                    pay_info_check['pay_type']['ct0000000005'] = self._format_pay_type('ct0000000005', u_pay_info['wxpay'], '0', pay_type_info_re);
                    pay_info_check['wxpay'] = parseFloat(Util.accAdd(pay_info_check['wxpay'], u_pay_info['wxpay'])).toFixed(2);
                }
                if (u_pay_info['alipay'] != 0) {
                    pay_info_check['pay_type']['ct0000000006'] = self._format_pay_type('ct0000000006', u_pay_info['alipay'], '0', pay_type_info_re);
                    pay_info_check['alipay'] = parseFloat(Util.accAdd(pay_info_check['alipay'], u_pay_info['alipay'])).toFixed(2);
                }

                //优惠方案与支付方式处理
                var check_member_price_pay_type = self._check_member_price_pay_type(pay_info_check['pay_type'], pay_type_info_re);
                var check_member_discount_pay_type = self._check_member_discount_pay_type(pay_info_check['pay_type'], pay_type_info_re);
                var check_promo_info_pay_type = true;
                var check_promo_info_pay_other = true;
                // u_pay_info['promo'] = {};
                pay_info_check['low_consumption'] = '0';
                if (u_pay_info['promo_id'] != '') {

                    if (u_pay_info['promo_id'] == pay_info_check['promo_id']) {
                        u_pay_info['promo'] = pay_info_check['promo']; //payorderInfo.pay_info['promo']
                    }

                    //为最低消费额度增加线上已经支付部分：线上已经支付部分即使与优惠方案冲突，银台结账时也忽略冲突视同已付，仅仅是不计入满额。
                    pay_info_check['pay_type_user'] = new Array();
                    if (pay_info_check['stored'] != 0) {
                        pay_info_check['pay_type_user']['ct0000000003'] = self._format_pay_type('ct0000000003', pay_info_check['stored'], pay_info_check['principal'], pay_type_info_re);
                    }
                    if (pay_info_check['voucher'] != 0) {
                        pay_info_check['pay_type_user']['ct0000000004'] = self._format_pay_type('ct0000000004', '0', pay_info_check['voucher'], pay_type_info_re);
                    }
                    if (pay_info_check['wxpay'] != 0) {
                        pay_info_check['pay_type_user']['ct0000000005'] = self._format_pay_type('ct0000000005', pay_info_check['wxpay'], '0', pay_type_info_re);
                    }
                    if (pay_info_check['alipay'] != 0) {
                        pay_info_check['pay_type_user']['ct0000000006'] = self._format_pay_type('ct0000000006', pay_info_check['alipay'], '0', pay_type_info_re);
                    }
                    // 返回可计入满额优惠部分
                    var check_promo_info_pay_type_user = self._check_promo_info_pay_type(u_pay_info['promo']['pay_type'], pay_info_check['pay_type_user']);
                    pay_info_check['low_consumption'] = parseFloat(Util.accAdd(pay_info_check['low_consumption'], ((check_promo_info_pay_type_user === false) ? '0' : check_promo_info_pay_type_user))).toFixed(2);

                    //为最低消费额度增加银台支付部分校验
                    check_promo_info_pay_type = self._check_promo_info_pay_type(u_pay_info['promo']['pay_type'], pay_info_check['pay_type']);
                    pay_info_check['low_consumption'] = parseFloat(Util.accAdd(pay_info_check['low_consumption'], ((check_promo_info_pay_type === false) ? '0' : check_promo_info_pay_type))).toFixed(2);

                    check_promo_info_pay_other = self._check_promo_info_pay_type(u_pay_info['promo']['pay_type_other'], pay_info_check['pay_other']);
                    pay_info_check['low_consumption'] = parseFloat(Util.accAdd(pay_info_check['low_consumption'], ((check_promo_info_pay_other === false) ? '0' : check_promo_info_pay_other))).toFixed(2);
                }

                //存在支付记录
                // 是否支付过， isHasPay = false 没有支付过， isHasPay = true 支付过
                if (

                    (payorderInfo['pay_info']['cash'] != 0 ||
                        payorderInfo['pay_info']['card'] != 0 ||
                        payorderInfo['pay_info']['other'] != 0 ||
                        payorderInfo['pay_info']['wxpay'] != 0 ||
                        payorderInfo['pay_info']['wxpay_temp'] != 0 ||
                        payorderInfo['pay_info']['alipay'] != 0 ||
                        payorderInfo['pay_info']['alipay_temp'] != 0 ||
                        payorderInfo['pay_info']['stored'] != 0 ||
                        payorderInfo['pay_info']['voucher'] != 0) &&

                    (
                        payorderInfo.pay_info.promo_id == '' ||
                        (payorderInfo.pay_info.promo_id != '' && (payorderInfo.pay_info.promo.discount_amount != 100 || payorderInfo.pay_info.promo.minus_amount != 0))
                    )

                ) {
                    //提交的优惠方式与之前的不符，不能变更预结账方案
                    if (u_pay_info['discount_rate'] != u_pay_temp['discount_rate'] ||
                        u_pay_info['is_member_price'] != u_pay_temp['is_member_price'] ||
                        (u_pay_info['promo_id']         != u_pay_temp['promo_id'] &&
                            (u_pay_temp['promo_id'] != '' && u_pay_temp['promo']['discount_amount'] != '100' ||
                            u_pay_info['promo_id'] != '' && u_pay_info['promo']['discount_amount'] != '100')
                        ) ||
                        //立减优惠：
                        (u_pay_info['promo_id'] != u_pay_temp['promo_id'] && 
                            (u_pay_temp['promo_id'] != '' && u_pay_temp['promo']['minus_amount'] != '0' ||
                            u_pay_info['promo_id'] != '' && u_pay_info['promo']['minus_amount'] != '0')
                        )
                        ) {

                        Message.show('#msg', '已经支付过的订单，不能再变更优惠方式！', 2000);
                        if (u_pay_temp['is_member_price'] == 1) {
                            // 选中会员价
                            $('#isMember').addClass('subset_icon_chcked');
                            // 是否选择了会员价，为true
                            isMember = true;
                        } else {
                            // 选中会员价
                            $('#isMember').removeClass('subset_icon_chcked');
                            // 是否选择了会员价，为true
                            isMember = false;
                        }
                        if (u_pay_temp['discount_rate'] != 100) {
                            // 选中会员折扣
                            $('#isDiscount').removeClass('subset_icon_chcked');
                            // 是否选择了会员折扣，为true
                            isDiscount = false;
                        } else {
                            // 选中会员折扣
                            $('#isDiscount').removeClass('subset_icon_chcked');
                            // 是否选择了会员折扣，为true
                            isDiscount = false;
                        }
                        /*if (u_pay_temp['promo_id'] == '') {
                            // 取消选中这个优惠方案
                            $('#tablePromo').find('input[promo-id="'+u_pay_info['promo_id']+'"]').prop('checked', false);
                            promoId = '';
                        } else {
                            // 取消选中这个优惠方案
                            $('#tablePromo').find('input[promo-id="'+u_pay_info['promo_id']+'"]').prop('checked', false);
                            // 如果之前有选中的优惠方案，那就再选中那个优惠方案
                            promoId = u_pay_temp['promo_id'];
                            $('#tablePromo').find('input[promo-id="'+u_pay_temp['promo_id']+'"]').prop('checked', true);
                        }*/



                        conflict_pay_info['discount_rate'] = u_pay_temp['discount_rate'];
                        conflict_pay_info['promo_id'] = u_pay_temp['promo_id'];
                        conflict_pay_info['promo'] = u_pay_temp['promo'];
                        // console.log('a13')
                        // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                        self.generate_choice_submit(u_pay_temp['is_member_price']);
                        return;
                    }

                    //不改变优惠方案的前提下，只有做支付方式的判断。

                    //会员价与支付方式判断
                    /*if (u_pay_info['is_member_price'] != 0 && check_member_price_pay_type === false) {
                        Message.show('#msg', '支付方式与会员价冲突！', 2000);
                        //self.conflict_layder()
                        return;
                    }

                    //会员折扣与支付方式判断
                    if (u_pay_info['discount_rate'] != '100' && check_member_discount_pay_type === false) {
                        Message.show('#msg', '支付方式与会员折扣冲突！', 2000);
                        //self.conflict_layder()
                        return;
                    }

                    //银台优惠与支付方式判断
                    if (u_pay_info['promo_id'] != '' && check_promo_info_pay_type === false) {
                        Message.show('#msg', '支付方式与优惠方案冲突！', 2000);
                        return;
                    }*/
                } else {

                    //银台折扣方案变更判断
                    /*if (u_pay_info['promo_id'] != pay_info_check['promo_id']) {

                        //提交的非空，或者是本来为空
                        if (u_pay_info['promo_id'] != '' || pay_info_check['promo_id'] == '') {
                            Message.show('#msg', '不能变更银台折扣方案！', 2000);
                            return;
                        }

                        //优惠方案与 会员价 或 会员折扣 或 支付方式 没有冲突不能取消
                        if (check_promo_info_pay_type !== false &&
                            (u_pay_info['is_member_price'] == 0 || pay_info_check['promo']['is_member_price'] == '2') &&
                            (u_pay_info['discount_rate'] == '100' || pay_info_check['promo']['is_member_discount'] == '2')) {
                            Message.show('#msg', '无冲突不能取消银台折扣方案！', 2000);
                            return;
                        }

                        //优惠方案信息
                        pay_info_check['promo_id']  = '';
                        pay_info_check['promo'] = {};
                        pay_info_check['a_user_id']= '';
                    }*/

                    //会员价判断
                    if (u_pay_info['is_member_price'] != pay_info_check['is_member_price']) {

                        if (u_pay_info['is_member_price'] == 0) {

                            //不做资格判断，无冲突应以之前的为准。

                            //无会员折扣或无冲突 且 无银台优惠或无冲突 且 无支付方式冲突
                            if (check_member_price_pay_type != false &&
                                (u_pay_info['discount_rate'] == '100' || pay_info_check['is_member_price_discount'] != '0') &&
                                (pay_info_check['promo_id'] == '' || pay_info_check['promo']['is_member_price'] != 0)) {
                                Message.show('#msg', '无冲突不能取消会员价！', 2000);
                                // 选中会员价
                                $('#isMember').addClass('subset_icon_chcked');
                                // 是否选择了会员价，为true
                                isMember = true;
                                // console.log('a14')
                                // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                                self.generate_choice_submit(1);
                                return;
                            }
                        } else {

                            //无会员价使用资格 或 有会员折扣且有冲突 或 有银台优惠且有冲突 或 有支付方式冲突
                            if (pay_info_check['user_account']['is_member_price'] == 0 && pay_info_check[
                                    'member_price_cashier'] != '' && pay_info_check['is_member_price'] == 0) {
                                //是否支持会员价 理论上不会走到这里，因为加载数据的时候有判断
                                Message.show('#msg', '不支持会员价！', 2000);
                                return;
                            } else if (check_member_price_pay_type === false) {
                                self.conflict_layder('会员价与支付方式有冲突', '会员价', '支付方式', 1, u_pay_temp, u_pay_info);
                                return;
                            } else if (u_pay_info['discount_rate'] != '100' && pay_info_check['is_member_price_discount'] == 0) {
                                self.conflict_layder('会员价与会员折扣有冲突！', '会员价', '会员折扣', 2, u_pay_temp, u_pay_info);
                                return;
                            } else if (u_pay_info['promo_id'] != '' && u_pay_info['promo']['is_member_price'] == 0) {
                                self.conflict_layder('会员价与优惠方案不能同时享用', '会员价', '优惠方案', 3, u_pay_temp, u_pay_info);
                                return;
                            }
                        }
                        pay_info_check['is_member_price'] = u_pay_info['is_member_price'];
                    }

                    //会员折扣判断
                    if (u_pay_info['discount_rate'] != pay_info_check['discount_rate'] || u_pay_info['promo_id'] != '') {

                        if (u_pay_info['discount_rate'] == '100') {
                            //不做资格判断，无冲突应以之前的为准。

                            //无会员折扣或无冲突 且 无银台优惠或无冲突 且 无支付方式冲突
                            if (check_member_discount_pay_type !== false &&
                                (u_pay_info['is_member_price'] == 0 || pay_info_check['is_member_price_discount'] != 0) &&
                                (u_pay_info['promo_id'] == '' || u_pay_info['promo']['is_member_discount'] != 0)) {
                                Message.show('#msg', '无冲突不能取消会员折扣！', 2000);
                                // 选中会员折扣
                                $('#isDiscount').addClass('subset_icon_chcked');
                                // 是否选择了会员折扣，为true
                                isDiscount = true;
                                // 生成当前选择的支付方案，提交检查冲突，之后在计算金额
                                self.generate_choice_submit('', 1);
                                return;
                            }
                        } else {
                            //无会员折扣使用资格 或 有会员价且有冲突 或 有银台优惠且有冲突 或 有支付方式冲突
                            if (u_pay_info['discount_rate'] != pay_info_check['user_account']['discount_rate']) {
                                Message.show('#msg', '不支持会员折扣！', 2000);
                                return;
                            } else if (check_member_discount_pay_type === false) {
                                self.conflict_layder('会员折扣与支付方式有冲突', '会员折扣', '支付方式', 4, u_pay_temp, u_pay_info);
                                return;
                            } else if (u_pay_info['is_member_price'] != 0 && pay_info_check['is_member_price_discount'] == 0) {
                                self.conflict_layder('会员折扣与会员价有冲突', '会员折扣', '会员价', 5, u_pay_temp, u_pay_info);
                                return;
                            } else if (u_pay_info['promo_id'] != '' && pay_info_check['promo_id'] != '' && u_pay_info['promo']['is_member_discount'] == 0) {
                                self.conflict_layder('会员折扣与优惠方案有冲突', '会员折扣', '优惠方案', 6, u_pay_temp, u_pay_info);
                                return;
                            }
                        }
                        pay_info_check['discount_rate'] = u_pay_info['discount_rate'];
                    }

                    // 银台折扣方案变更判断
                    if (u_pay_info['promo_id'] != pay_info_check['promo_id']) {
                        if (check_promo_info_pay_type === false || check_promo_info_pay_other === false) {
                            // 冲突弹出层
                            self.conflict_layder('优惠方案与支付方式冲突！', '优惠方案', '支付方式', 10, u_pay_temp, u_pay_info);
                            return;
                        }
                        if (u_pay_info['is_member_price'] != 0 && u_pay_info['promo']['is_member_price'] == '0') {
                            // 冲突弹出层
                            self.conflict_layder('优惠方案与会员价冲突！', '优惠方案', '会员价', 11, u_pay_temp, u_pay_info);
                            return;
                        }
                        if (u_pay_info['discount_rate'] != '100' && u_pay_info['promo']['is_member_discount'] == '0') {
                            // 冲突弹出层
                            self.conflict_layder('优惠方案与会员折扣冲突！', '优惠方案', '会员折扣', 12, u_pay_temp, u_pay_info);
                            return;
                        }
                        //优惠方案信息
                        pay_info_check['promo_id'] = u_pay_info['promo_id'];
                        pay_info_check['promo'] = u_pay_info['promo'];
                    }


                    // 支付方式判断
                    var is_payment = 0; // 是否有支付方式 0 否 1 是
                    for (var i in pay_info_check['pay_type']) {
                        is_payment = 1;
                        break;
                    }
                    // u_pay_temp['pay_type'] !== pay_info_check['pay_type']有可能没用
                    if (is_payment == 1 && u_pay_temp['pay_type'] !== pay_info_check['pay_type']) {
                        //会员价与支付方式判断
                        if (u_pay_info['is_member_price'] != 0 && check_member_price_pay_type === false) {
                            // 冲突弹出层
                            self.conflict_layder('支付方式与会员价冲突！', '支付方式', '会员价', 7, u_pay_temp, u_pay_info);
                            return;
                        }

                        //银台优惠与支付方式判断
                        if (u_pay_info['promo_id'] != '' && check_promo_info_pay_type === false) {
                            // 冲突弹出层
                            self.conflict_layder('支付方式与优惠方案冲突！', '支付方式', '优惠方案', 8, u_pay_temp, u_pay_info);
                            return;
                        }

                        //会员折扣与支付方式判断
                        if (u_pay_info['discount_rate'] != '100' && check_member_discount_pay_type === false) {
                            // 冲突弹出层
                            self.conflict_layder('支付方式与会员折扣冲突！', '支付方式', '会员折扣', 9, u_pay_temp, u_pay_info);
                            return;
                        }
                    }
                }

                //输出数据
                //return pay_info_check;

                // 赋值校验过的支付方案，下次在点击的时候有用
                conflict_pay_info = self.dishesStackHandle(pay_info_check, conflict_pay_info);
                // 计算优惠金额（ change_tableInfo 可改变内容的所有信息）
                this.check_sub_moneys(pay_info_check, change_tableInfo);
            },
            /**
             *  冲突弹出层
             *  manage  ：提示消息
             *  choice  ：选择什么冲突（会员价、会员折扣、支付方式、优惠方案）
             *  conflict：跟什么冲突名称（会员价、会员折扣、支付方式、优惠方案）
             *  type    ：1 会员价与支付方式冲突   2 会员价与会员折扣冲突 3 会员价与银台优惠冲突
             *            4 会员折扣与支付方式冲突 5 会员折扣与会员价冲突 6 会员折扣与银台优惠冲突
             *            7 支付方式与会员价冲突   8 支付方式与优惠方案冲突 9 支付方式与会员折扣冲突
             *            10优惠方案与支付方式冲突 11优惠方案与会员价冲突 12优惠方案与会员折扣冲突
             *  u_pay_temp ：银台的支付数据
             *  u_pay_info ：银台提交的支付信息
             **/
            conflict_layder: function(manage, choice, conflict, type, u_pay_temp, u_pay_info) {
                var self = this;

                // (初始化一次弹出层数据)存储缓存应对只弹出一次一种类型冲突(九种冲突0就是没弹层1就是弹出层了)
                //storage_one = {1: 0,2: 0,3: 0,4: 0,5: 0,6: 0,7: 0,8: 0,9: 0};

                if (storage_one[type] == 1) {
                    // console.log('a55'+type)
                    self._chongtu_conflict(type, u_pay_temp, u_pay_info); // 弹出层过一次了就直接触发点击确认按钮事件
                } else {
                    if (type == 3) {
                        $('#chongtu-title').text(manage + '请选择优惠方式！');
                        $('#chongtu-message').text('优惠方案');
                        $('#chongtu-conflict').text('会员价');
                    } else {
                        $('#chongtu-title').text(manage + '是否选择' + choice + '，请选择！');
                        $('#chongtu-message').text(conflict);// 取消
                        $('#chongtu-conflict').text(choice);// 确定
                    }

                    var is_member_price = '';
                    var member_or_discount = '';
                    $.dialog = Dialog({
                        type: 3,
                        close: false,
                        dom: '#chongtu',
                        success: function() {
                            // 点击确认
                            $('#chongtu-conflict').unbind('click').bind('click', function() {
                                self._chongtu_conflict(type, u_pay_temp, u_pay_info);
                            });
                            // 点击取消
                            $('#chongtu-message').unbind('click').bind('click', function() {
                                if (storage_one[type] == 0) {
                                    storage_one[type] = 1; // 弹出一次了就赋值1
                                    // 关闭弹出层 conflict_pay_info
                                    $.dialog.close($.dialog.id);
                                }

                                // 1、2、3会员价 4、5、6会员折扣冲突 7、8、9支付方式冲突
                                if (type == 1 || type == 2 || type == 3) {
                                    // 取消选中会员价
                                    self._pay_mode_up(1, type);
                                    conflict_pay_info['is_member_price'] = 0;
                                    if (type != 3) {
                                        // 请求解决冲突和计算金额方法（合并解决方法）
                                        self.generate_choice_submit(''); 
                                    }
                                } else if (type == 4 || type == 5 || type == 6) {
                                    // 取消选中会员折扣
                                    self._pay_mode_up(2, type);
                                    conflict_pay_info['discount_rate'] = 100;
                                    if (type == 5) {
                                        // 请求解决冲突和计算金额方法（合并解决方法）
                                        self.generate_choice_submit(''); 
                                    }
                                } else if (type == 7 || type == 9) {
                                    if (type == 7) {
                                        member_or_discount = 'is_member_price';
                                    } else {
                                        member_or_discount = 'is_member_discount';
                                    }
                                    // 常规支付方式清0 并且取消选中
                                    if (payorderInfo.pay_type['ct0000000003'][member_or_discount] == 0 && u_pay_info['stored'] != 0) {
                                        // 取消选中乐币
                                        self._pay_mode_up(3);
                                    }
                                    if (payorderInfo.pay_type['ct0000000004'][member_or_discount] == 0 && u_pay_info['voucher'] != 0) {
                                        // 取消选中抵用劵
                                        self._pay_mode_up(4);
                                    }
                                    if (payorderInfo.pay_type['ct0000000005'][member_or_discount] == 0 && u_pay_info['wxpay'] != 0) {
                                        // 取消选中微信
                                        self._pay_mode_up(5);
                                    }
                                    if (payorderInfo.pay_type['ct0000000006'][member_or_discount] == 0 && u_pay_info['alipay'] != 0) {
                                        // 取消选中微信
                                        self._pay_mode_up(6);
                                    }
                                    // 请求解决冲突和计算金额方法（合并解决方法）
                                    self.generate_choice_submit('');
                                } else if (type == 8) {
                                    var promo_t = payorderInfo.pay_info.promo_id == '' ? payorderInfo.promo[u_pay_info['promo_id']] : payorderInfo.pay_info.promo;
                                    // 常规支付方式冲突清0
                                    if (promo_t.pay_type != '' && promo_t.pay_type != 'all') {
                                        if (promo_t.pay_type['ct0000000003'] == 0 && u_pay_info['stored'] != 0) {
                                            // 取消选中乐币
                                            self._pay_mode_up(3);
                                        }
                                        if (promo_t.pay_type['ct0000000004'] == 0 && u_pay_info['voucher'] != 0) {
                                            // 取消选中抵用劵
                                            self._pay_mode_up(4);
                                        }
                                        if (promo_t.pay_type['ct0000000005'] == 0 && u_pay_info['wxpay'] != 0) {
                                            // 取消选中微信
                                            self._pay_mode_up(5);
                                        }
                                        if (promo_t.pay_type['ct0000000006'] == 0 && u_pay_info['alipay'] != 0) {
                                            // 取消选中微信
                                            self._pay_mode_up(6);
                                        }
                                    }
                                    // console.log('a15')
                                    // 请求解决冲突和计算金额方法（合并解决方法）
                                    self.generate_choice_submit('');
                                } else if (type == 10 || type == 11 || type == 12) {
                                    // 取消选中优惠方案
                                    self._pay_mode_up(7, type);
                                    // 出现问题，支付方式与会员折扣冲突，点击取消，只显示了会员折扣，没有会员价优惠，会员价与会员折扣不冲突，所以这里传了会员价
                                    // 请求解决冲突和计算金额方法（合并解决方法）
                                    self.generate_choice_submit(u_pay_info['is_member_price']);
                                }
                            });
                        }
                    });
                }
            },
            // 点击确认执行的事情
            _chongtu_conflict: function(type, u_pay_temp, u_pay_info) {
                var self = this;

                // is_dis=1 是否点了取消会员折扣
                var is_dis = '';

                if (storage_one[type] == 0) {
                    storage_one[type] = 1; // 弹出一次了就赋值1
                    // 关闭弹出层 conflict_pay_info
                    $.dialog.close($.dialog.id);
                }
                if (type == 1 || type == 4) {
                    if (type == 1) {
                        is_member_price = 1;
                        member_or_discount = 'is_member_price';
                        // 选中会员价
                        $('#isMember').addClass('subset_icon_chcked');
                        // 是否选择了会员价，为true
                        isMember = true;
                    }
                    if (type == 4) {
                        conflict_pay_info['discount_rate'] = payorderInfo['user_account']['discount_rate'];
                        member_or_discount = 'is_member_discount';
                        // 选中会员折扣
                        $('#isDiscount').addClass('subset_icon_chcked');
                        // 是否选择了折扣，为true
                        isDiscount = true;
                    }
                    // 常规支付方式清0 并且取消选中
                    if (payorderInfo.pay_type['ct0000000003'][member_or_discount] == 0 && u_pay_info['stored'] != 0) {
                        // 取消选中乐币
                        self._pay_mode_up(3);
                    }
                    if (payorderInfo.pay_type['ct0000000004'][member_or_discount] == 0 && u_pay_info['voucher'] != 0) {
                        // 取消选中抵用劵
                        self._pay_mode_up(4);
                    }
                    if (payorderInfo.pay_type['ct0000000005'][member_or_discount] == 0 && u_pay_info['wxpay'] != 0) {
                        // 取消选中微信
                        self._pay_mode_up(5);
                    }
                    if (payorderInfo.pay_type['ct0000000006'][member_or_discount] == 0 && u_pay_info['alipay'] != 0) {
                        // 取消选中支付宝
                        self._pay_mode_up(6);
                    }
                } else if (type == 2) {
                    // 取消选中会员折扣
                    self._pay_mode_up(2);
                    conflict_pay_info['discount_rate'] = 100;
                    is_member_price = 1;
                    is_dis = 1;
                } else if (type == 3 || type == 6 || type == 8) {
                    // 取消选中优惠方案
                    self._pay_mode_up(7, type);
                    if (type == 3) {
                        is_member_price = 1;
                    }
                    if (type == 6) {
                        conflict_pay_info['discount_rate'] = payorderInfo['user_account']['discount_rate'];
                    }
                } else if (type == 5 || type == 7 || type == 11) {
                    // 取消选中会员价
                    self._pay_mode_up(1);
                    conflict_pay_info['is_member_price'] = 0;
                    is_member_price = 0;
                    if (type == 5) {
                        conflict_pay_info['discount_rate'] = payorderInfo['user_account']['discount_rate'];
                    }
                } else if (type == 9) {
                    // 取消选中会员折扣
                    self._pay_mode_up(2);
                    conflict_pay_info['discount_rate'] = 100;
                    is_dis = 1;
                } else if (type == 10) {
                    for (var i in payorderInfo.promo) {
                        if (payorderInfo.promo[i].promo_id == u_pay_info['promo_id']) {
                            // 常规支付方式冲突清0
                            if (payorderInfo.promo[i].pay_type != '' && payorderInfo.promo[i].pay_type != 'all') {
                                if (payorderInfo.promo[i].pay_type['ct0000000003'] == 0 && u_pay_info['stored'] != 0) {
                                    // 取消选中乐币
                                    self._pay_mode_up(3);
                                }
                                if (payorderInfo.promo[i].pay_type['ct0000000004'] == 0 && u_pay_info['voucher'] != 0) {
                                    // 取消选中抵用劵
                                    self._pay_mode_up(4);
                                }
                                if (payorderInfo.promo[i].pay_type['ct0000000005'] == 0 && u_pay_info['wxpay'] != 0) {
                                    // 取消选中微信
                                    self._pay_mode_up(5);
                                }
                                if (payorderInfo.promo[i].pay_type['ct0000000006'] == 0 && u_pay_info['alipay'] != 0) {
                                    // 取消选中支付宝
                                    self._pay_mode_up(6);
                                }
                            }
                            break;
                        }
                    }
                    is_member_price = conflict_pay_info['is_member_price'];
                } else if (type == 12) {
                    // 取消选中会员折扣
                    self._pay_mode_up(2);
                    conflict_pay_info['discount_rate'] = 100;
                    is_dis = 1;
                }
                // console.log('a16')
                // 请求解决冲突和计算金额方法（合并解决方法）
                self.generate_choice_submit(is_member_price, '', is_dis, type);
            },
            // 选择框取消选中 type 1 会员价 2 会员折扣 3 乐币 4 抵用劵 5 微信 6支付宝 7优惠方案
            _pay_mode_up: function(type, is_type) {
                // console.log('tttt'+type)
                if (type == 1) {
                    // 取消选中会员价
                    $('#isMember').removeClass('subset_icon_chcked');
                    // 是否选择了会员价，为false
                    isMember = false;
                    is_member_price = 0;
                    if (is_type == 3) {
                        // console.log('a17')
                        // 请求解决冲突和计算金额方法（合并解决方法）
                        this.generate_choice_submit(is_member_price);
                    }
                } else if (type == 2) {
                    // 取消选中会员折扣
                    $('#isDiscount').removeClass('subset_icon_chcked');
                    // 是否选择了折扣，为false
                    isDiscount = false;
                    if (is_type == 6 || is_type == 4) {
                        is_member_discount = 0;
                        lepay = 1;
                        vouchersPrice = canuseVouchePrice;
                        is_load = 1;
                        isVoucher = true;
                        $('#isVoucher').addClass('subset_icon_chcked');
                        $('#clickVouch').removeClass('setBg');
                        isLecoin = true;
                        isWxpay = true;
                        isAlipay = true;
                        $('#clickUseLe').removeClass('setCol');
                        $('#stored').removeClass('setCol')
                        $('#stored').prop('readonly', false);
                        $('#isLecoin').addClass('subset_icon_chcked');
                        // console.log('a18')
                        // 请求解决冲突和计算金额方法（合并解决方法）
                        this.generate_choice_submit('', is_member_discount, 1);
                    }
                } else if (type == 3) {
                    lepay = 0;
                    is_load = 1;
                    // 取消选中乐币
                    $('#isLecoin').removeClass('subset_icon_chcked');
                    // 是否选择了乐币，为false
                    isLecoin = false;
                    $('#clickUseLe').addClass('setCol');
                    $('#stored').addClass('setCol');
                    $('#stored').val('0.00');
                    $('#stored').prop('readonly', true);
                } else if (type == 4) {
                    vouchersPrice = 0;
                    is_load = 1;
                    conflict_pay_info['voucher'] = 0;
                    // 取消选中抵用劵
                    $('#isVoucher').removeClass('subset_icon_chcked');
                    // 是否选择了抵用劵，为false
                    isVoucher = false;
                    $('#clickVouch').addClass('setBg');
                } else if (type == 5) {
                    wxpay = 0;
                    is_load = 1;
                    // 取消选中微信
                    $('#isWxpay').removeClass('subset_icon_chcked');
                    // 是否选择了微信，为false
                    isWxpay = false;
                    $('#wxpay').addClass('setCol');
                    $('#wxpay').prop('readonly', true);
                    wxpay = 0;
                    $('#wxpay').val(parseFloat(wxpay).toFixed(2));
                } else if (type == 6) {
                    alipay = 0;
                    is_load = 1;
                    // 取消选中微信
                    $('#isAlipay').removeClass('subset_icon_chcked');
                    // 是否选择了微信，为false
                    isAlipay = false;
                    $('#alipay').addClass('setCol');
                    $('#alipay').prop('readonly', true);
                    alipay = 0;
                    $('#alipay').val(parseFloat(alipay).toFixed(2));
                } else if (type == 7) {
                    // 取消选中优惠方案
                    conflict_pay_info['promo_id'] = '';
                    conflict_pay_info['promo'] = '';
                    promoId = '';
                    // 取消选中优惠方案
                    $('#isPromo').removeClass('subset_icon_chcked');
                    // 是否选择了优惠方案，为false
                    isPromo = false;
                }
            },
            /**
             *  储值本金计算
             **/
            _use_principal: function($stored, $user_account) {

                //判断是否超出商家当日可消费额度
                if (bccomp($stored, $user_account['stored_balance'], 2) > 0 &&
                    bccomp($user_account['hold_money'], '0', 2) > 0) {
                    Message.show('#msg', '430213', 2000);
                }
                var principal = 0;
                /*//计算本金
                $principal_rate     = bcdiv($user_account['principal_money'], $user_account['stored_money'], 5);
                $principal_num      = bcmul($principal_rate, $stored, 5);
                principal           = sprintf("%.2f", $principal_num);*/

                return $principal;
            },
            /**
             *  格式化支付信息
             **/
            _format_pay_type: function($pay_type_id, $pay_money, $preferential_money, $pay_type_info) {
                //输出数据
                return {
                    'pay_type_id': $pay_type_id,
                    'pay_type_name': $pay_type_info[$pay_type_id]['pay_type_name'],
                    'pay_money': $pay_money, //实收金额
                    'preferential_money': $preferential_money, //优惠金额
                    'receipts_integral': $pay_type_info[$pay_type_id]['receipts_integral'],
                    'preferential_integral': $pay_type_info[$pay_type_id]['preferential_integral']
                };
            },
            /**
             *  会员价与支付方式判断
             **/
            _check_member_price_pay_type: function($order_pay_type, $pay_type_info) {
                for (var i in $order_pay_type) {
                    if ($order_pay_type[i].pay_type_id != '' && $pay_type_info[$order_pay_type[i].pay_type_id]['is_member_price'] == 0) {
                        return false;
                    }
                }
                return true;
            },
            /**
             *  会员折扣与支付方式判断
             **/
            _check_member_discount_pay_type: function($order_pay_type, $pay_type_info) {
                for (var i in $order_pay_type) {
                    if ($order_pay_type[i].pay_type_id != '' && $pay_type_info[$order_pay_type[i].pay_type_id]['is_member_discount'] == 0) {
                        return false;
                    }
                }
                return true;
            },
            /**
             *  银台优惠与常规支付方式判断
             **/
            _check_promo_info_pay_type: function($promo_info, $order_pay_type) {
                /*if (!$.isArray($order_pay_type) || !$.isArray($promo_info)) {
                    return false;//或者应该是return 0;
                }*/
                //返回可计入满额优惠部分
                var $low_consumption = '0';
                for (var i in $order_pay_type) {
                    //单独设置的优先级，高于全部
                    if ($promo_info['all'] != undefined && i != 'all') { //isset($promo_info['all']) && !isset($promo_info[$key])
                        $promo_info[i] = $promo_info['all'];
                    }
                    if ($promo_info[i] == '2' || $promo_info == 'all') { //!$.isArray($promo_info) || 
                        //全部支持、或者是满额金额状态为2，实收和优惠都记入满额
                        $low_consumption = parseFloat(Util.accAdd($low_consumption, $order_pay_type[i]['pay_money'])).toFixed(2);
                        $low_consumption = parseFloat(Util.accAdd($low_consumption, $order_pay_type[i]['preferential_money'])).toFixed(2);
                    } else if ($promo_info[i] == '') {
                        //配置中不存在
                        return false;
                    } else if ($promo_info[i] == '1') {
                        //满额金额状态为1，实收可记入满额
                        $low_consumption = parseFloat(Util.accAdd($low_consumption, $order_pay_type[i]['pay_money'])).toFixed(2);
                    } else if ($promo_info[i] == '3') {
                        //满额金额状态为0，全部不记入满额
                        continue;
                    } else {
                        //配置错误
                        return false;
                    }
                }
                return $low_consumption;
            },
            /**
             *  计算优惠金额：该方法不考虑任何冲突问题(用于结账、支付前校验)
             *  pay_info_check ：用户提交的支付方案与之前保存的支付方案u_pay_temp经过校验后的支付方案
             *  order_info ：用户的订单信息
             **/
            check_sub_moneys: function(pay_info_check, order_info) {
                var bat_self = this;
                //计算金额
                var menu_money_info = {
                    'consumes'          : '0',      //消费金额汇总
                    'sub_user_price'    : '0',      //会员价优惠
                    'sub_user_discount' : '0',      //会员折扣优惠
                    'sub_user'          : '0',      //会员优惠
                    'sub_money'         : '0',      //银台折扣
                    'pay_sub_moneys'    : '0',      //优惠金额汇总
                    'pay_moneys'        : '0'       //实收金额汇总              
                };

                var member_price = 0,
                    discount_rate = 100,
                    menu_price = 0,
                    _consume = 0,
                    _sub_user_price = 0,
                    _sub_user_discount = 0;

                /****
                    打折的最低消费额度，只能是会员价、会员折扣后的消费额度。
                    根据支付方式不同，算出来的最低消费额度low_consumption，只能影响返券。
                    因为如果影响打折，会有逻辑问题：消费满200，会员价、会员折扣后是100，银台打8折，支付80元。
                    程序判断80元就不够满额了，因此只能用100算，就是会员价、会员折扣后的消费额。
                ****/

                //整理优惠方案菜品范围 最低消费额度
                var discount_menu_type_ids = {};
                if ((pay_info_check['promo_id'] != '' &&
                    pay_info_check['promo']['discount_menu_type_ids'] != '') ||
                    //立减优惠： 
                    (pay_info_check['promo']['minus_amount'] != '' && pay_info_check['promo']['minus_amount'] > 0)
                    ) { // 注释这个是因为提交给php的时候php需要判断前端不需要判断 &&pay_info_check['low_consumption'] >= pay_info_check['promo']['low_consumption']
                    var _member_discount_price = 0;

                    //菜品优惠处理：预算一下会员价、会员折扣后的消费额，用来看是否满足银台折扣额度
                    var _menu_consumes = '0.00';
                    for (var i in order_info['menu']) {
                        for (var j in order_info['menu'][i]) {

                            //取消的订单不算入优惠金额
                            if (order_info['menu'][i][j]['order_step'] == 0) {
                                continue;
                            }

                            //会员价
                            member_price = (pay_info_check['is_member_price'] == 0) ? order_info['menu'][i][j]['menu_price'] : order_info['menu'][i][j]['member_price'];

                            if (order_info['menu'][i][j]['is_discount'] && pay_info_check['discount_rate'] != '100') {
                                //会员价与会员折扣价冲突处理////////////////////
                                if (pay_info_check['is_member_price_discount'] == '1') {
                                    //有冲突(1)，原价上打折哪个便宜用哪个
                                    _member_discount_price = parseFloat(accMul(order_info['menu'][i][j]['menu_price'], accDiv(pay_info_check['discount_rate'], 100))).toFixed(2);
                                    if (member_price > _member_discount_price) {
                                        member_price = _member_discount_price;
                                    }
                                } else {
                                    //有冲突(0)，原价上打折  无冲突(2)，会员价上打会员折扣
                                    //有冲突还有会员折扣，说明没有会员价，也就是会员价=原价
                                    //结账单价保留6位，减少小数点除不尽的误差
                                    member_price = parseFloat(Util.accMul(member_price, Util.accDiv(pay_info_check['discount_rate'], 100))).toFixed(6);
                                }
                            }

                            //菜品金额计算
                            _consume            = parseFloat(Util.accMul(member_price, order_info['menu'][i][j]['menu_num'])).toFixed(6);
                            //保留2位，并四舍五入
                            _consume = parseFloat(_consume).toFixed(2);
                            _menu_consumes = parseFloat(Util.accAdd(_menu_consumes, _consume));
                        }
                    }
                    //满足额度的，菜品才能进行相应的打折
                    if (_menu_consumes >= pay_info_check['promo']['low_consumption']) {
                        //优惠方案适用菜品整理
                        if (pay_info_check['promo']['discount_menu_type_ids'][0] == undefined || pay_info_check['promo']['discount_menu_type_ids'] == 'all') {
                            if (pay_info_check['promo']['discount_menu_type_ids'] == 'all' || pay_info_check['promo']['minus_amount'] != 0) {
                                discount_menu_type_ids = 'all';
                            } else {
                                Message.show('#msg', '优惠方案所属菜品解析失败！', 2000);
                                return;
                            }
                        } else {
                            for (var i in pay_info_check['promo']['discount_menu_type_ids']) {
                                if (pay_info_check['promo']['discount_menu_type_ids'][i]['menu_type_id'] == undefined || pay_info_check['promo']['discount_menu_type_ids'][i]['menu_ids'] == '') {
                                    Message.show('#msg', '优惠方案所属菜品解析失败！', 2000);
                                    return;
                                }

                                discount_menu_type_ids[pay_info_check['promo']['discount_menu_type_ids'][i].menu_type_id] = pay_info_check['promo']['discount_menu_type_ids'][i]['menu_ids'];
                            }

                        }
                    }
                }

                //立减优惠：将立减优惠转换为折扣优惠
                var mod = '0';  //余数金额
                if (pay_info_check['promo']['minus_amount'] != 0 && pay_info_check['promo']['minus_amount'] > 0) {
                    var consumes        = order_info['consumes'];       //消费金额
                    var minus_amount    = pay_info_check['promo']['minus_amount'];      //立减金额

                    //优惠方案支持会员价上折，则消费金额 = 会员价和会员折扣后的总消费
                    if ((pay_info_check['is_member_price'] == '1' && pay_info_check['promo']['is_member_price'] == '2') || (pay_info_check['discount_rate'] != '100' && pay_info_check['promo']['is_member_discount'] == '2')) {
                        consumes = _menu_consumes;
                    }

                    //立减优惠：累计判断
                    if (pay_info_check['promo']['minus_is_repeat'] == 1) {
                        //最低消费为0时，不能累计
                        if (pay_info_check['promo']['low_consumption'] == 0) {
                            
                        } else {
                            var count           = Util.accDiv(consumes, pay_info_check['promo']['low_consumption']);
                            count = parseFloat(count.toString().split('.')[0]);
                            minus_amount    = parseFloat(Util.accMul(minus_amount, count)).toFixed(2);
                        }
                    }

                    var minus_discount = parseFloat(Util.accDiv(minus_amount, consumes)).toFixed(6);     //立减折扣,保留6位小数

                    if (minus_discount >= 1) {
                        pay_info_check['promo']['discount_amount'] = 0;//免单
                    } else {
                        minus_discount = parseFloat(Util.accSubtr(1, minus_discount)).toFixed(6);
                        pay_info_check['promo']['discount_amount'] = parseFloat(Util.accMul(100, minus_discount)).toFixed(4);    //立减折扣折扣，保留4位
                    }
                    
                    pay_info_check['promo']['discount_menu_type_ids'] = 'all';
                    discount_menu_type_ids = 'all';
                }

                member_price = 0, discount_rate = 100, menu_price = 0, _consume = 0, _sub_user_price = 0, _sub_user_discount = 0;

                //菜品优惠处理
                for (var i in order_info['menu']) {
                    for (var j in order_info['menu'][i]) {

                        //会员价
                        member_price = (pay_info_check['is_member_price'] == 0) ? order_info['menu'][i][j]['menu_price'] : order_info['menu'][i][j]['member_price'];

                        //折扣额度：会员折扣额度
                        discount_rate = (order_info['menu'][i][j]['is_discount'] == 0) ? '100' : pay_info_check['discount_rate'];

                        //折扣额度：优惠方案折扣额度
                        var discount_amount = '100';

                        if ($.type(discount_menu_type_ids) == 'object') {
                            if (discount_menu_type_ids[order_info['menu'][i][j]['menu_type_id']] != undefined &&
                                (discount_menu_type_ids[order_info['menu'][i][j]['menu_type_id']] == 'all' ||
                                    discount_menu_type_ids[order_info['menu'][i][j]['menu_type_id']].indexOf(order_info['menu'][i][j]['menu_id']) != -1)) {
                                //优惠方案折扣额度
                                discount_amount = pay_info_check['promo']['discount_amount'];
                            }
                        } else if (discount_menu_type_ids == 'all') {
                            //优惠方案折扣额度
                            discount_amount = pay_info_check['promo']['discount_amount'];
                        }

                        //优惠方案与会员折扣冲突1处理
                        if (discount_amount != '100' &&
                            discount_rate != '100' &&
                            pay_info_check['promo']['is_member_discount'] == '1') {
                            //有冲突1时，谁的优惠力度大用谁
                            if (discount_amount > discount_rate) {
                                discount_amount = '100';
                            } else {
                                discount_rate = '100';
                            }
                        }

                        //会员价与优惠折扣冲突1处理
                        if (member_price != order_info['menu'][i][j]['menu_price']) {
                            if (discount_amount != '100' &&
                                pay_info_check['promo']['is_member_price'] == '1') {
                                //有冲突1时，谁的优惠力度大用谁
                                menu_price = parseFloat(Util.accMul(order_info['menu'][i][j]['menu_price'], Util.accDiv(discount_amount, 100))).toFixed(2);
                                if (member_price > menu_price) {
                                    member_price = order_info['menu'][i][j]['menu_price'];
                                } else {
                                    discount_amount = '100';
                                }
                            }
                        }

                        //会员价与会员折扣冲突1处理
                        if (member_price != order_info['menu'][i][j]['menu_price']) {
                            if (discount_rate != '100' &&
                                pay_info_check['is_member_price_discount'] == '1') {
                                //有冲突1时，谁的优惠力度大用谁
                                menu_price = parseFloat(Util.accMul(order_info['menu'][i][j]['menu_price'], Util.accDiv(discount_rate, 100))).toFixed(2);
                                if (member_price > menu_price) {
                                    member_price = order_info['menu'][i][j]['menu_price'];
                                } else {
                                    discount_rate = '100';
                                }
                            }
                        }

                        //菜品结账价
                        order_info['menu'][i][j]['menu_pay_price'] = parseFloat(Util.accDiv(Util.accMul(Util.accMul(member_price, discount_rate), discount_amount), 10000));

                        //取消的订单不算入优惠金额
                        if (payorderInfo.order[i].order_step != 0) {
                            //菜品金额计算
                            _consume            = parseFloat(Util.accMul(order_info['menu'][i][j]['menu_price'], order_info['menu'][i][j]['menu_num']));

                            _sub_user_price     = parseFloat(Util.accMul(Util.accSubtr(order_info['menu'][i][j]['menu_price'], member_price), order_info['menu'][i][j]['menu_num']));


                            var _sub_member_discount_price = 0;
                            if (discount_rate != '100') {
                                // （单价 - （单价 * 折扣额度）） * 数量 （会员折扣）
                                var user_discount_money = parseFloat(Util.accMul(member_price, Util.accDiv(discount_rate, 100))).toFixed(6);

                                _sub_member_discount_price = Util.accSubtr(member_price, user_discount_money);
                                member_price                = user_discount_money;
                            }


                            _sub_user_discount  = Util.accMul(_sub_member_discount_price, order_info['menu'][i][j]['menu_num']);
                            if (_sub_user_discount.toString().indexOf('.') != -1) {
                                _sub_user_discount = parseFloat('0.'+_sub_user_discount.toString().split('.')[1].substring(0,2))+parseInt(_sub_user_discount);
                            }
                            var _sub_cashier_discount_price = 0;

                            if (discount_amount != '100') {
                                // （单价 - （单价 * 折扣额度）） * 数量 （银台折扣）
                                var sub_money_money =  parseFloat(Util.accMul(member_price, Util.accDiv(discount_amount, 100))).toFixed(6);
                                _sub_cashier_discount_price =  parseFloat(Util.accSubtr(member_price, sub_money_money)).toFixed(6);
                                member_price                = sub_money_money;
                            }

                            var _sub_money = parseFloat(Util.accMul(_sub_cashier_discount_price, order_info['menu'][i][j]['menu_num'])).toFixed(6);
                            // _sub_money = parseFloat(_sub_money);
                            // 四舍五入保留两位小数，因为toFixed(2)出现一次有4个三位小数的，但是前三个三位小数的都四舍五入了，第四个三位小数的没有四舍五入
                            _sub_money = bat_self.ForDight(_sub_money,2);

                            /*if (_sub_money.toString().indexOf('.') != -1) {
                                _sub_money = parseFloat('0.'+_sub_money.toString().split('.')[1].substring(0,2))+parseInt(_sub_money);
                            }*/



                            var _sub_user = parseFloat(Util.accAdd(_sub_user_price, _sub_user_discount));
                            var _pay_sub_moneys = parseFloat(Util.accAdd(_sub_money, _sub_user));
                            var _pay_moneys = parseFloat(Util.accSubtr(_consume, _pay_sub_moneys));

                            menu_money_info['consumes'] = parseFloat(Util.accAdd(menu_money_info['consumes'], _consume));
                            menu_money_info['sub_user_price'] = parseFloat(Util.accAdd(menu_money_info['sub_user_price'], _sub_user_price));
                            menu_money_info['sub_user_discount'] = parseFloat(Util.accAdd(menu_money_info['sub_user_discount'], _sub_user_discount));
                            menu_money_info['sub_user'] = parseFloat(Util.accAdd(menu_money_info['sub_user'], _sub_user));
                            menu_money_info['sub_money'] = parseFloat(Util.accAdd(menu_money_info['sub_money'], _sub_money));
                            menu_money_info['pay_sub_moneys'] = parseFloat(Util.accAdd(menu_money_info['pay_sub_moneys'], _pay_sub_moneys));
                            menu_money_info['pay_moneys'] = parseFloat(Util.accAdd(menu_money_info['pay_moneys'], _pay_moneys));
                        }
                    }
                }

                // 下面这个公式是应对，当优惠金额出现三位小数（15.667）的时候，只取15.66，如果用toFixed(2)的话就会四舍五入变成15.67，所以用下面这个公式
                if (menu_money_info['sub_money'].toString().indexOf('.') != -1) {
                    menu_money_info['sub_money'] = parseFloat('0.' + menu_money_info['sub_money'].toString().split('.')[1].substring(0, 2)) + parseInt(menu_money_info['sub_money']);
                }
                if (menu_money_info['sub_user'].toString().indexOf('.') != -1) {
                    menu_money_info['sub_user'] = parseFloat('0.' + menu_money_info['sub_user'].toString().split('.')[1].substring(0, 2)) + parseInt(menu_money_info['sub_user']);
                }

                //立减优惠：最后再算余数（以确保金额的准确性）
                if (pay_info_check['promo']['minus_amount'] != 0 && pay_info_check['promo']['minus_amount'] > 0 && discount_amount != 0) {
                    var mod = 0;
                    //如果会员价和银台折扣有冲突，则不计算余数
                    if (menu_money_info['sub_user'] > 0 && (pay_info_check['promo']['is_member_price'] == '1' || pay_info_check['promo']['is_member_discount'] == '1')) {
                        mod = 0;
                    }  else {
                        //立减后的实付金额 = 会员折扣后的消费金额 - 总立减金额
                        var pay_amount = parseFloat(Util.accSubtr(consumes, minus_amount)).toFixed(2);

                        // 计算出会员折扣金额
                        // pay_amount = Util.accMul(pay_amount, Util.accDiv(discount_rate, 100));


                        mod = parseFloat(Util.accSubtr(pay_amount, menu_money_info['pay_moneys'])).toFixed(2);
                        // console.log(consumes+'--'+minus_amount+'---'+menu_money_info['pay_moneys'])
                        //立减优惠：菜品优惠总金额扣除余数
                        menu_money_info['sub_money']            = parseFloat(Util.accSubtr(menu_money_info['sub_money'], mod)).toFixed(2);
                        menu_money_info['pay_sub_moneys']       = parseFloat(Util.accSubtr(menu_money_info['pay_sub_moneys'], mod)).toFixed(2);
                        menu_money_info['pay_moneys']           = parseFloat(Util.accAdd(menu_money_info['pay_moneys'], mod)).toFixed(2);
                    }
                }

                // 兼容以前数据存储格式的几个值计算
                /*pay_info_check['money']       = parseFloat(Util.accSubtr(pay_info_check['consumes'], menu_money_info['sub_user']));
                pay_info_check['cashier']   = parseFloat(Util.accSubtr(pay_info_check['money'], pay_info_check['stored']));
                pay_info_check['cashier']   = parseFloat(Util.accSubtr(pay_info_check['cashier'], pay_info_check['voucher']));
                pay_info_check['cashier']   = parseFloat(Util.accSubtr(pay_info_check['cashier'], pay_info_check['wxpay']));
                pay_info_check['pay_money'] = parseFloat(Util.accSubtr(pay_info_check['cashier'], menu_money_info['sub_money']));
                pay_info_check['pay_money'] = parseFloat(Util.accAdd(pay_info_check['pay_money'], pay_info_check['re_stored']));
                pay_info_check['pay_money'] = parseFloat(Util.accAdd(pay_info_check['pay_money'], pay_info_check['re_voucher']));
                pay_info_check['pay_money'] = parseFloat(Util.accAdd(pay_info_check['pay_money'], pay_info_check['re_wxpay']));*/

                // 赋值校验过的支付方案，下次在点击的时候有用
                conflict_pay_info = this.dishesStackHandle(pay_info_check, conflict_pay_info);

                // 输出数据
                /*return {
                    'menu_money_info'   :   menu_money_info,
                    'menu'              :   order_info['menu']
                };*/
                // 计算金额
                this.calculationAmount(isUseLe, isUseVoucher, isUseDiscount, menu_money_info);
            },
            /*Javascript设置要保留的小数位数，四舍五入。
            *ForDight(Dight,How):数值格式化函数，Dight要格式化的 数字，How要保留的小数位数。
            *这里的方法是先乘以10的倍数，然后去掉小数，最后再除以10的倍数。
            */
            ForDight:function (Dight,How){  
                Dight = Math.round(Dight*Math.pow(10,How))/Math.pow(10,How);  
                return Dight;  
            },
            // 解决菜品对象和分类对象 堆栈 出现的父对象和子对象相关联的问题
            dishesStackHandle: function(p, c) {
                var self = this;
                var c = c || {};
                for (var i in p) {
                    if (typeof p[i] === 'object') {
                        if (i == 'null' || i == null || p[i] == null) {
                            c[i] = '';
                        } else {
                            c[i] = (p[i].constructor === Array) ? [] : {};
                        }
                        self.dishesStackHandle(p[i], c[i]);
                    } else {
                        c[i] = p[i];
                    }
                }
                return c;
            }
        }

        // 发表点评
        var Comment = {

            inin: function() {
                // 设置新增按钮高度
                $('#img-list').find('li').css({
                    //width: liWidth,
                    height: liWidth + 10
                });
                // 设置新增按钮高度
                $('#img-list').find('li img').css({
                    width: liWidth + 10,
                    height: liWidth + 10
                });
                var width = liWidth + 10;
                $('#img-list').find('li').css('line-height', width + 'px');

                var imageStyle = 'style="width:' + width + 'px;height:' + width + 'px;' + 'background:url(/img/base/loading.gif) no-repeat ' + (liWidth / 3) + 'px;"';
                $('#add-client-img').html('<div data-type="img" ' + imageStyle + '><input type="file" id="release-img" class="" accept="image/*"/></div>');
                $('#add-mobile-img').html('<div data-type="img" ' + imageStyle + '></div>');

                // 获取到屏幕宽度，赋值给页面
                //$('#comments-content').width($.app.body_width);
                this.addStarSelect('service', '服务质量');
                this.addStarSelect('quality', '餐品质量');
                this.addComment();

                // 判断是不是客户端
                if ($.app.isClient && $.app.isAndroid) { // && $.app.isAndroid
                    $('#add-mobile-img').removeClass('hide');
                    //$('#add-client-img').addClass('hide');
                    $('#add-client-img').remove();
                } else {
                    $('#add-mobile-img').remove();
                    //$('#add-mobile-img').addClass('hide');
                    $('#add-client-img').removeClass('hide');
                }

                this.bindEvents();

                scroll.refresh();
                //this.load();
            },

            // 添加星星选择
            addStarSelect: function(type, label) {
                $('#' + type + '-select').mobiscroll().image({
                    theme: 'android-holo light',
                    accent: ' ',
                    lang: 'zh',
                    display: 'bottom',
                    mode: 'scroller',
                    labels: ['选择' + label],
                    height: 50,
                    fixedWidth: 200
                });

                $('#' + type + '-select').val(3);

                $('#' + type + '').unbind('tap').bind('tap', function() {
                    $('#comment-info').blur();
                    $('#' + type + '-select').mobiscroll('show');
                    return false;
                });

                $('#' + type + '-select_dummy').hide();

                $('#' + type + '-select').change(function() {
                    var val = $('#' + type + '-select_dummy').val();
                    $('#' + type + '').attr('class', 'star star' + val);
                });
            },

            // 添加点评
            addComment: function() {
                var PayId = Util.getQueryString('pay_id');
                $('#comments-btn').unbind('tap').bind('tap', function() {

                    var service = $('#service-select_dummy').val() || 0, // 点评1
                        quality = $('#quality-select_dummy').val() || 0, // 点评2
                        commentInfo = $('#comment-info').val();

                    if (service == 0 && quality == 0 && commentInfo == '') {
                        Message.show('#msg', '请填写或选择评价信息', 3000);
                        return;
                    }

                    /*if ($('#comment-info').val() == '') {
                        Message.show('#msg', '评论内容不能为空！', 3000);
                        return;
                    }*/

                    // if (service == 0 || quality == 0 || commentInfo == '') {
                    //     Message.show('#msg', '请填写或选择评价信息', 3000);
                    //     return;
                    // }

                    if ($('#comment-info').val().length > 1000) {
                        Message.show('#msg', '点评意见不能大于1000个字', 3000);
                        return;
                    }

                    Data.setAjax('commentPost', {
                        'card_id': card_id,
                        'trade_type': trade_type,
                        'star_1': service, // 评价1
                        'star_2': quality, // 评价2
                        'pay_id': PayId,
                        'content': commentInfo,
                        'cid': Cache.get('getCID'),
                        'uarticle_images': (JSON.stringify(imgData) == '{}') ? '' : imgData,
                    }, '#layer', '#msg', { 200206: '' }, function(respnoseText) {

                        //Cache.set('is_refresh_orderlist', true);
                        if (respnoseText.code == 200206) {
                            Message.show('#msg', respnoseText.message, 2000, function() {
                                /*window.location.reload();*/
                                var apiLink = location.href.split('?')[1];
                                if (is_comm == 1) {
                                    apiLink = location.href.split('?')[1].split('&is_comm=1')[0];
                                }
                                window.location.href = phpJump + 'html/index.html?' + apiLink + '&is_comm=2';
                            });
                        } else {
                            Message.show('#msg', respnoseText.message, 2000);
                        }
                    }, 2);
                });
            },

            // 加载条
            /*load: function() {
                if (this.scroll != null) {
                    this.scroll.destroy();
                }
                this.scroll = new iScroll($('#comments-content')[0], {
                    scrollbarClass: 'myScrollbar',
                    bounce: false,
                    hideScrollbar: true,
                    onBeforeScrollStart: function (e) {
                    }
                });
            }*/

            // 绑定事件
            bindEvents: function() {
                // 手机添加图片
                this.mobileAddimg();
                // 电脑添加图片
                this.clientAddimg();
                // 发表内容
                //this.release();
                // 编辑图片 是否删除s
                this.editImage();
            },

            // 手机添加照片
            mobileAddimg: function() {
                /*$("#add-mobile-img").click(function() {

                    var style = 'style="width:'+liWidth+'px;height:'+liWidth+'px;"';
                    var imageStyle = 'style="width:'+liWidth+
                                            'px;height:'+liWidth+
                                            'px;'+
                                            'background:url(/img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                    $('#add-mobile-img').before('<li id="release_img_'+index+'"'+style+' data-type="user"><div data-type="img" '+imageStyle+'></div><div class="image_layer hide"></div><div class="image_layer_span hide">x</div></li>');

                    $('##albumcamera').removeClass('hide');
                    $.dialog = Dialog({
                        type: 3,
                        dom: '#albumcamera',
                        success: function() {
                            // 拍照
                            $('#camera').unbind('click').bind('click', function() {
                                $.dialog.close($.dialog.id);
                                R.selectMode(navigator.camera.PictureSourceType.CAMERA);
                            });

                            // 选取相册
                            $('#album').unbind('click').bind('click', function() {
                                $.dialog.close($.dialog.id);
                                R.selectMode(navigator.camera.PictureSourceType.PHOTOLIBRARY);
                            });
                        },
                        closeFn: function() {
                            $('#release_img_' +index).remove();
                        },
                        layerFn: function() {
                            $('#release_img_' +index).remove();
                        }
                    });
                });*/

                $("#add-mobile-img").click(function() {

                    var style = 'style="width:' + liWidth + 'px;height:' + liWidth + 'px;"';
                    /*var imageStyle = 'style="width:'+liWidth+
                                            'px;height:'+liWidth+
                                            'px;'+
                                            'background:url(../img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                    $('#add-mobile-img').before('<li id="release_img_'+index+'"'+style+' data-type="user"><div data-type="img" '+imageStyle+'></div><div class="image_layer hide"></div><div class="image_layer_span hide">x</div></li>');*/
                    var imageStyle = 'style="height:' + liWidth + 'px;' +
                        'background:url(../img/base/loading.gif) no-repeat ' + (liWidth / 3) + 'px;"';
                    $('#add-mobile-img').before('<li id="release_img_' + index + '"' + style + ' data-type="user" class="img_add"><div data-type="img" ' + imageStyle + '></div></li>');



                    Comment.selectMode(navigator.camera.PictureSourceType.SAVEDPHOTOALBUM);
                });
            },

            // 选择模式
            selectMode: function(mode) {
                navigator.camera.getPicture(function(imageData) {
                    var num = 0; // 是否有相同图片 0 否 1 是
                    // 判断是否有相同图片
                    for (var i in imgDateList) {
                        if (imgDateList[i] == imageData) {
                            Message.show('#msg', '请选择不同图片上传！', 2000);
                            num = 1;
                            break;
                        }
                    }

                    if (num == 0) {
                        imgDateList[imgDateNUm] = imageData;
                        imgDateNUm++;
                        Comment.drawImage('data:image/jpeg;base64,' + imageData);
                    } else {
                        $('#release_img_' + index).remove();
                    }
                }, function(message) {
                    $('#release_img_' + index).remove();
                }, {
                    quality: 50,
                    destinationType: navigator.camera.DestinationType.DATA_URL, // 返回数据类型
                    sourceType: mode, // 选择类型
                    correctOrientation: true // 设置图片显示为正确的方向（不会出现ios手机或android手机图片旋转）
                });
                scroll.refresh();
            },

            // 电脑添加照片
            clientAddimg: function() {
                var self = this;
                $('#release-img').change(function(event) {
                    var files = event.target.files[0];

                    //图片方向角 added by lzk  
                    self.Orientation = null;

                    // 没有选择任何图片
                    if (files === undefined) {
                        return;
                    }

                    if (/image\/\w+/.test(files.type)) {
                        if (typeof FileReader == 'undefined') {
                            //console.log('不支持FileReader');
                        } else {
                            //console.log('支持FileReader');


                            //获取照片方向角属性，用户旋转控制
                            EXIF.getData(files, function() {
                                EXIF.getAllTags(this);
                                self.Orientation = EXIF.getTag(this, 'Orientation');
                                //return;
                            });


                            var fileReader = new FileReader();

                            //console.log(fileReader);

                            fileReader.readAsDataURL(files);

                            fileReader.onload = function() {
                                //console.log('---');

                                var num = 0; // 是否有相同图片 0 否 1 是
                                // 判断是否有相同图片
                                for (var i in imgDateList) {
                                    if (imgDateList[i] == this.result) {
                                        Message.show('#msg', '请选择不同图片上传！', 2000);
                                        num = 1;
                                        break;
                                    }
                                }

                                if (num == 0) {
                                    imgDateList[imgDateNUm] = this.result;
                                    imgDateNUm++;
                                    var style = 'style="height:' + liWidth + 'px;"';
                                    var imageStyle = 'style="width:' + liWidth +
                                        'px;height:' + liWidth +
                                        'px;' +
                                        'background:url(/img/base/loading.gif) no-repeat ' + (liWidth / 3) + 'px;"';
                                    $('#add-client-img').before('<li id="release_img_' + index + '"' + style + ' data-type="user" class="img_add"><div data-type="img" ' + imageStyle + '></div></li>');
                                    Comment.drawImage(this.result);
                                }
                            };

                            fileReader.onabort = function() {
                                //console.log('abort');
                            };
                            fileReader.onerror = function() {
                                //console.log('error');
                            };
                            fileReader.onloadstart = function() {
                                //console.log('loadstart');
                            };
                            fileReader.onprogress = function() {
                                //console.log('progress');
                            };
                            fileReader.onloadend = function() {
                                //console.log('loadend');
                            };
                        }
                    } else {
                        //console.log('请上传图片');
                        Message.show('#msg', '请上传图片！', 2000);
                    }
                    scroll.refresh();
                });
            },

            // 压缩图片
            drawImage: function(url) {

                imageLength++;

                // 最多只能添加9个图片
                if (imageLength == 9) {
                    $('#add-mobile-img').hide();
                    $('#add-client-img').hide();
                }

                // 如果有图片就隐藏，上传图片四个字
                if (imageLength > 0) {
                    $('#uploadPic').addClass('hide');
                } else {
                    $('#uploadPic').removeClass('hide');
                }

                var img = new Image();
                img.src = url;

                img.onload = function() {

                    Comment.imageDraw(img, 500, 'w', function(big) {

                        // $('#img').attr('src', big);

                        var imgBig = new Image();
                        imgBig.src = big;
                        imgBig.onload = function() {
                            Comment.imageDraw(imgBig, 100, 's', function(small) {
                                // $('#img1').attr('src', small);

                                var imgSmall = new Image();
                                imgSmall.src = small;
                                imgSmall.onload = function() {
                                    var width = imgSmall.width,
                                        height = imgSmall.height,
                                        left = 0,
                                        top = 0,
                                        size = 0,
                                        scale = parseFloat(width / height).toFixed(2),
                                        divWidth = liWidth + 2,
                                        newWidth = 0,
                                        newHeight = 0;

                                    // console.log(width, height);

                                    if (scale > 0) {
                                        size = height;
                                    } else {
                                        size = width;
                                    }

                                    // console.log(size, divWidth);

                                    var cha = size - divWidth;

                                    // console.log('比例'+scale);

                                    if (scale > 1) {
                                        // console.log('宽大');
                                        if (cha > 0) {
                                            newHeight = divWidth;
                                            newWidth = parseInt((height - cha) * scale);
                                        }
                                    } else if (scale < 1) {
                                        // console.log('宽小');
                                        if (cha > 0) {
                                            newWidth = divWidth;
                                            newHeight = parseInt((height - cha) / scale);
                                        }
                                    } else {
                                        newWidth = divWidth;
                                        newHeight = divWidth;
                                    }

                                    // console.log(newWidth, newHeight);

                                    if (scale > 1) {
                                        left = parseInt((newWidth - divWidth) / 2);
                                    } else if (scale < 1) {
                                        top = parseInt((newHeight - divWidth) / 2);
                                    }

                                    // console.log(left, top);

                                    Comment.setImageData(big, small, -left, -top, newWidth, newHeight);
                                };

                            });
                        };

                    }, 1);
                };
                scroll.refresh();
            },

            imageDraw: function(img, size, type, fn, numstt) {
                var self = this;

                // 生成比例
                var width = img.width,
                    height = img.height,
                    scale = width / height;

                //console.log(width, height, scale);

                if (type == 'h') {
                    // 设置图片最大尺寸
                    if (height > size) {
                        height = parseInt(size);
                        width = parseInt(height * scale);
                    }
                } else if (type == 'w') {
                    // 设置图片最大尺寸
                    if (width > size) {
                        width = parseInt(size);
                        height = parseInt(width / scale);
                    }
                } else if (type == 's') {
                    if (width > height) {
                        height = parseInt(size);
                        width = parseInt(height * scale);
                    } else {
                        width = parseInt(size);
                        height = parseInt(width / scale);
                    }
                }

                // 判断浏览器是否支持canvas
                try {
                    document.createElement("canvas").getContext("2d");
                    //console.log('支持');
                } catch (e) {
                    //console.log('不支持');
                }

                // 创建canvas对象
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');

                // 设置图片宽高
                canvas.width = width;
                canvas.height = height;

                // pc端压缩图片
                context.drawImage(img, 0, 0, width, height);


                var big = null;

                //修复ios  
                if (navigator.userAgent.match(/iphone/i)) {
                    //如果方向角不为1，都需要进行旋转 added by lzk
                    if (self.Orientation != "" && self.Orientation != 1 && self.Orientation != null && numstt == 1) {
                        //alert('苹果旋转处理');
                        switch (self.Orientation) {
                            case 6: //需要顺时针（向右）90度旋转
                                //alert('需要顺时针（向右）90度旋转');
                                self.rotateImg(img, 'left', canvas, width, height);
                                break;
                            case 8: //需要逆时针（向左）90度旋转
                                //alert('需要逆时针（向左）90度旋转');
                                self.rotateImg(img, 'right', canvas, width, height);
                                break;
                            case 3: //需要180度旋转
                                //alert('需要180度旋转');
                                self.rotateImg(img, 'right', canvas, width, height); //转两次
                                self.rotateImg(img, 'right', canvas, width, height);
                                break;
                        }
                    }
                    /*if (numstt == 1) {
                        var mpImg = new MegaPixImage(img);
                        mpImg.render(canvas, {
                            maxWidth: width,
                            maxHeight: height,
                            quality: 0.8,
                            orientation: self.Orientation
                        });
                    }*/
                    big = canvas.toDataURL("image/jpeg", 0.8);
                } else if (navigator.userAgent.match(/Android/i)) { // 修复android
                    var encoder = new JPEGEncoder();
                    big = encoder.encode(context.getImageData(0, 0, width, height), 80);
                } else {
                    //alert('---'+self.Orientation);
                    if (self.Orientation != "" && self.Orientation != 1 && self.Orientation != null && numstt == 1) {
                        //alert('电脑旋转处理');
                        switch (self.Orientation) {
                            case 6: //需要顺时针（向右）90度旋转
                                //alert('需要顺时针（向右）90度旋转');
                                self.rotateImg(img, 'left', canvas, width, height);
                                break;
                            case 8: //需要逆时针（向左）90度旋转
                                //alert('需要逆时针（向左）90度旋转');
                                self.rotateImg(img, 'right', canvas, width, height);
                                break;
                            case 3: //需要180度旋转
                                //alert('需要180度旋转');
                                self.rotateImg(img, 'right', canvas, width, height); //转两次
                                self.rotateImg(img, 'right', canvas, width, height);
                                break;
                        }
                    }

                    big = canvas.toDataURL("image/jpeg", 0.8);
                }



                /*var big = canvas.toDataURL('image/jpeg', 0.8);

                // 解决ios4图片变形问题
                if (navigator.userAgent.match(/iphone/i) ) {
                    var mpImg = new MegaPixImage(img);
                    mpImg.render(canvas, { maxWidth: width, maxHeight: height, quality: 0.8});
                    big = canvas.toDataURL('image/jpeg', 0.8);
                }

                // 修复android（部分android手机不能压缩图片）
                if (navigator.userAgent.match(/Android/i) ) {
                    var encoder = new JPEGEncoder();
                    big = encoder.encode(context.getImageData(0, 0, width, height), 80 );
                }*/

                fn(big);
                scroll.refresh();
            },

            //对图片旋转处理 added by lzk  
            rotateImg: function(img, direction, canvas, width, height) {
                //alert(img);
                //最小与最大旋转方向，图片旋转4次后回到原方向
                var min_step = 0;
                var max_step = 3;
                //var img = document.getElementById(pid);
                if (img == null) return;
                //img的高度和宽度不能在img元素隐藏后获取，否则会出错
                /*var height = img.height;
                var width = img.width;*/
                //var step = img.getAttribute('step');
                var step = 2;
                if (step == null) {
                    step = min_step;
                }
                if (direction == 'right') {
                    step++;
                    //旋转到原位置，即超过最大值
                    step > max_step && (step = min_step);
                } else {
                    step--;
                    step < min_step && (step = max_step);
                }
                //img.setAttribute('step', step);
                /*var canvas = document.getElementById('pic_' + pid);
                if (canvas == null) {
                    img.style.display = 'none';
                    canvas = document.createElement('canvas');
                    canvas.setAttribute('id', 'pic_' + pid);
                    img.parentNode.appendChild(canvas);
                }  */
                //旋转角度以弧度值为参数
                var degree = step * 90 * Math.PI / 180;
                var ctx = canvas.getContext('2d');
                switch (step) {
                    case 0:
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        break;
                    case 1:
                        canvas.width = height;
                        canvas.height = width;
                        ctx.rotate(degree);
                        ctx.drawImage(img, 0, -height, width, height);
                        break;
                    case 2:
                        canvas.width = width;
                        canvas.height = height;
                        ctx.rotate(degree);
                        ctx.drawImage(img, -width, -height, width, height);
                        break;
                    case 3:
                        canvas.width = height;
                        canvas.height = width;
                        ctx.rotate(degree);
                        ctx.drawImage(img, -width, 0, width, height);
                        break;
                }
            },

            // 设置图片显示和上传数据
            setImageData: function(big, small, left, top, width, height) {
                setTimeout(function() {

                    // 加载完的图片替换原有图片
                    $('#release_img_' + index, '#img-list').css({
                        //width: liWidth + 2,
                        height: liWidth + 10,
                        border: 'none'
                    }).find('div[data-type="img"]').css({
                        width: liWidth + 10,
                        height: liWidth + 10,
                        background: 'url(' + small + ') ' + left + 'px ' + top + 'px',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: width + 'px ' + height + 'px cover'
                    }).end().find('div[class^=image_layer]').removeClass('hide');

                    imgData[index] = {
                        big: big.substring(23),
                        small: small.substring(23)
                    };


                    //imageLength++;
                    index++;

                    /*// 最多只能添加9个图片
                    if (imageLength == max) {
                        $('#add-mobile-img').hide();
                        $('#add-client-img').hide();
                    }
                    
                    // 如果有图片就隐藏，上传图片四个字
                    if (imageLength > 0) {
                        $('#uploadPic').addClass('hide');
                    } else {
                        $('#uploadPic').removeClass('hide');
                    }*/

                    //Cache.set('imgData',imgData);
                    // 设置还能上传几张照片
                    //$('#remain-upload').text(max-imageLength);
                    scroll.refresh();
                }, 300);
            },

            // 剪切图片
            cutImage: function(img, callback) {
                // 生成比例
                var width = img.width,
                    height = img.height,
                    left = 0,
                    top = 0;

                //console.log(width, height);

                if (width > height) {
                    left = parseInt((width - height) / 2);
                } else {
                    top = parseInt((height - width) / 2);
                }

                //console.log(left, top);

                var t_ctx, t_canvas;
                t_canvas = document.createElement('canvas');
                t_ctx = t_canvas.getContext('2d');
                t_canvas.width = 100;
                t_canvas.height = 100;
                t_ctx.drawImage(img, left, top, 100, 100, 0, 0, 100, 100);
                var small = t_canvas.toDataURL('image/jpeg', 0.8);

                // android无法压缩
                if (navigator.userAgent.match(/Android/i)) {
                    var encoder = new JPEGEncoder();
                    small = encoder.encode(t_ctx.getImageData(0, 0, 100, 100), 80);
                }

                $('#img2').attr('src', small);
                scroll.refresh();
                callback(small);
            },

            // 编辑图片
            editImage: function() {
                $('#img-list').on('click', 'li[data-type="user"]', function(event) {
                    var self = this;
                    var index = $(self).index();
                    var id = $(this).attr('id'),
                        imgID = id.split('release_img_')[1];


                    // 删除
                    /*$.dialog = Dialog({
                        type: 2,
                        content: '您确定要删除此照片吗？',
                        closeFn: function() {
                            $('#' +id).remove();
                            if (imgData[imgID]) {
                                delete imgData[imgID];
                                imageLength--;
                                if (imageLength < max) {
                                    if ($.app.isClient) {
                                        $('#add-mobile-img').show().next('li').hide();
                                    } else {
                                        $('#add-mobile-img').hide().next('li').show();
                                    }
                                }
                                // 还可上传几张图片
                                //$('#remain-upload').text(max-imageLength);
                            }
                        }
                    });*/

                    $('#exit-upper').html('');
                    $('#exit-lower').html('');

                    // 编辑
                    $.dialog = Dialog({
                        type: 3,
                        close: false,
                        dom: '#picedit',
                        success: function() {
                            // 计数，删除用的
                            var index_num = 0;
                            for (var i in imgData) {
                                var imageStyle = 'style="background:url(data:image/jpeg;base64,' + imgData[i].big + ') no-repeat"';
                                $('#exit-upper').append('<div id="exit_img_' + i + '" class="swiper-slide" ' + imageStyle + ' data-type="exit-img"></div>');
                                $('#exit-lower').append('<div id="exit_img_' + i + '" class="swiper-slide" ' + imageStyle + ' data-type="exit-img"><div class="del_bnt" data-type="exit-del" data-id="exit_img_' + i + '" data-num="' + index_num + '"></div></div>');
                                index_num++;
                                //<div class="swiper-slide" style="background-image:url(../img/base/shop-bg03.png)"></div>big
                            }


                            $('#picedit').css({
                                width: '100%',
                                //height: $.app.body_height - 100,
                                background: '#fff'
                            });
                            var galleryTop = new Swiper('.gallery-top', {
                                nextButton: '.swiper-button-next',
                                prevButton: '.swiper-button-prev',
                                spaceBetween: 10,
                            });
                            var galleryThumbs = new Swiper('.gallery-thumbs', {
                                spaceBetween: 10,
                                centeredSlides: true,
                                slidesPerView: 'auto',
                                touchRatio: 0.2,
                                slideToClickedSlide: true
                            });
                            galleryTop.params.control = galleryThumbs;
                            galleryThumbs.params.control = galleryTop;
                            // 定位点击的那个
                            galleryTop.slideTo(index, 0, false); //切换默认slide，速度为0秒
                            galleryThumbs.slideTo(index, 0, false); //切换默认slide，速度为0秒

                            // 切换第一个的时候，有时候切换不过去
                            if (index == 0) {
                                galleryTop.setWrapperTranslate(0);
                                //$('#exit-lower').css({'transition-duration':'0ms','transform':'translate3d(0px, 0px, 0px)'});
                            }
                            // 点击删除
                            $('#exit-lower').unbind('click').on('click', 'div[data-type="exit-del"]', function() {
                                //alert($(this).attr('data-num'));
                                var exit_id = $(this).attr('data-id'),
                                    exit_imgID = exit_id.split('exit_img_')[1],
                                    indexNum = $(this).attr('data-num');

                                imgDatatwo[exit_imgID] = {
                                    exit_imgID: exit_imgID
                                };
                                // 删除当前
                                $('#exit-lower #' + exit_id + ', #exit-upper #' + exit_id).remove();
                                // 移除当前
                                galleryTop.removeSlide(-1);
                                galleryThumbs.removeSlide(-1);
                            });


                            // 点击保存
                            $('#exit-Preser').unbind('click').bind('click', function() {
                                for (var i in imgData) {
                                    for (var j in imgDatatwo) {
                                        if (i == j) {
                                            delete imgDateList[i]; // 删除图片存储数据
                                            delete imgData[i];
                                        }
                                    }
                                }
                                // 删除评论页面里面的
                                for (var k in imgDatatwo) {
                                    $('#img-list #release_img_' + k).remove();
                                    imageLength--;
                                }

                                if (imageLength < max) {
                                    if ($.app.isClient && $.app.isAndroid) {
                                        $('#add-mobile-img').show();
                                        $('#add-client-img').hide();
                                    } else {
                                        $('#add-mobile-img').hide();
                                        $('#add-client-img').show();
                                    }
                                }
                                // 如果有图片就隐藏，上传图片四个字
                                if (imageLength > 0) {
                                    $('#uploadPic').addClass('hide');
                                } else {
                                    $('#uploadPic').removeClass('hide');
                                }

                                $.dialog.close($.dialog.id);
                            });

                            // 点击取消
                            $('#exit-cacel').unbind('click').bind('click', function() {
                                // 清空他，否则在来删除就有问题了
                                imgDatatwo = {};
                                $.dialog.close($.dialog.id);
                            });
                        },
                        closeFn: function() {
                            //$('#release_img_' +index).remove();
                            $.dialog.close($.dialog.id);
                        },
                        layerFn: function() {
                            //$('#release_img_' +index).remove();
                            $.dialog.close($.dialog.id);
                        }
                    });

                });
            },

            // 发表内容
            release: function() {
                $('#release-btn').click(function() {
                    if (Pattern.dataTest('#release-content', '#msg', { 'empty': '不能为空' })) {
                        Data.setAjax('addUserArticle', {
                            'trade_type': trade_type,
                            'uarticle_content': $('#release-content').val(),
                            'uarticle_images': (JSON.stringify(imgData) == '{}') ? '' : JSON.stringify(imgData)
                        }, '#layer', '#msg', { 200: '' }, function(respnoseText) {
                            Cache.set('is_refresh_articlelist', true);
                            Page.open('articlelist&type=user');
                        }, 0);
                    }
                });
            }
        };

        // 微信打开
        if (Util.isWeixin()) {
            // 如果缓冲中没有cid，就调用方法请求接口获取cid
            if (!Cache.get('getCID') || Cache.get('getCID') == '' || Cache.get('getCID') == null) {
                Data.setAjax('userCid', '', '#layer', '#msg', { 20: '' }, function(respnoseText) {
                    // 获取到的cid放到缓存中
                    Cache.set('getCID', respnoseText.data);
                    pay.init();
                    Comment.inin();
                }, 1);
            } else {
                pay.init();
                Comment.inin();
            }
        } else {
            pay.init();
            Comment.inin();
        }
    }

    PayOrder.prototype.bindPageEvents = function() {
        var self = this;
        // 微信打开
        if (Util.isWeixin() || Util.isAlipay()) {
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
    };

    return PayOrder;

});