define('page/dishes', [
    'base/page',
    'base/scrollbar',
    'base/cache',
    'base/data',
    'base/util',
    'base/image',
    'base/dialog',
    'base/message',
    'base/click',
    'base/mobile',
    'base/pattern'
], function(Page, Bar, Cache, Data, Util, LoadImage, Dialog, Message, Click, Mobile, Pattern) {

    var Dishes = function() {
        if (Util.getQueryString('card_id') == undefined && Util.getQueryString('scanType') != undefined) {
            this.back = Clickache.get('loginReturn').split('backPage=')[1].split('&')[0] + '&card_id=' + Cache.get('loginReturn').split('card_id=')[1].split('&')[0];
        } else {
            if (Cache.get('order_property_temporary') == 1) {
                this.back = 'shopChoice&card_id=' + Util.getQueryString('card_id');
            } else {

                if (Util.getQueryString('order_property') == 4) {
                    this.back = 'merchantHome&card_id=' + Util.getQueryString('card_id')
                } else {
                    this.back = 'takeaway&card_id=' + Util.getQueryString('card_id');
                }
            }
        }
    };

    var orderId = null;


    var shop_name = decodeURIComponent(Util.getQueryString('shop_name'));

    // 点餐页面
    Dishes.prototype = new Page('dishes');

    Dishes.prototype.util = function() {
        // DOM
        var ndClassIfication = $('#classification ul'), // 分类列表
            ndMenu = $('#menu'), // 菜品
            ndMenuContent = $('#menu-content'), // 菜品内容
            ndDishesTotalCount = $('#dishes-total-count'), // 总菜品
            ndDishesTotalPrice = $('#dishes-total-price'), // 总价格
            ndFooter = $('#dishes-footer'), // 页脚
            ndSaveButton = $('#save-button'), // 选好保存按钮
            ndClearMenu = $('#clear-menu'), // 清空数据
            ndDishesListUl = $('#layerdishesList ul'), // 已点菜品列表
            ndDishesList = $('#layerdishesList'), // 已点菜品
            ndDishesListContent = $('#dishesList-content'), // 已点菜品内容
            ndDishesContent = $('#dishes-content'); // 点菜内容高度

        var dishesTotalCount = 0, // 点菜总数量
            dishesTotalPrice = 0, // 点菜总价格
            classTotal = {}, // 点菜分类统计
            totalScroll = Bar($("#classification")[0], false), // 点菜分类滚动条
            dishesScroll = null, // 点菜内容滚动条 Bar(ndMenu[0])
            discount = 0, // 折扣金额
            clearMenu = []; // 估清菜品


        var storageDataPck = {}, // 存储套餐菜弹出层数据
            changeNumSerial = 0; // 套餐数量序号

        var is_eat = 0, // 堂食餐包     0 已下架 1 未下架
            is_takeout = 0, // 外卖餐包     0 已下架 1 未下架
            is_takeout_room = 0, // 外卖送餐费    0 已下架 1 未下架
            is_shopping_room = 0, // 商城送餐费    0 已下架 1 未下架
            is_packing_box = 0; // 打包盒      0 已下架 1 未下架

        var is_bottom_pot = 0; // 是否有必点锅底
        var is_small_material = 0; // 是否有必点小料

        var is_save_button = 0; // 去结算按钮是否可点击，0否1是

        var allMenuData_1 = {}; //餐厅堂食存储数据
        var allMenuData_2 = {}; //外卖存储数据
        var allMenuData_3 = {}; //门店自取存储数据
        var allMenuData_4 = {}; //商城存储数据

        var is_click_scroll = 0; // 是否点击滑动


        var tableId = Util.getQueryString('table_id'); // 桌台id
        var tableName = ''; // 桌台名称

        // 是否授权会员  0：否，1：是
        var is_authority = 0;

        var yuclick = '';
        var ndDataId = '';
        // 获取到前一个页面的名称
        var page = Util.getQueryString('page'),
            card_id = Util.getQueryString('card_id'),
            shop_id = Util.getQueryString('shop_id'),
            loginReturn = Cache.get('loginReturn'),
            scanCodeType = Util.getQueryString('type'), // 扫描二维码传过来的
            scanCodeTableId = Util.getQueryString('table_id'), // 扫描二维码传过来的
            pay_id = Util.getQueryString('pay_id'), // 追单过来的

            is_jump_choice = Util.getQueryString('is_jump_choice'); // 追单过来的is_jump_choice == 1就不跳转选择非会员选择的界面
        // is_jump_choice == 0表示非追单

        // 获取是从堂食、外卖、自提、商城过来的吗
        // 订单属性： order_property 堂食1 外卖2 打包3 商城配送4
        var order_property = Util.getQueryString('order_property');
        if (order_property == undefined) {
            order_property = Cache.get('order_property_temporary');
        } else {
            Cache.set('order_property_temporary', order_property);
        }

        // 存储就餐时间、起送金额需要的参数
        var business_time = Cache.get('business_time');

        var is_first_single = is_jump_choice == 1 ? 0 : 1, // 是否是首单 0 否 1 是
            is_chopsticks = 0, // 自备餐包的显示 is_chopsticks 1是 0否
            is_chopsticks_t = 0, // 是否选择了自备餐包
            no_user_num = 0, // 未确认的就餐人数
            user_num = 0, // 就餐人数
            dinner_time = 0, // 就餐时间，没有的时候提0有就转换成10位时间戳提交(只有外卖自提有，其他没有)
            dinner_time_type = 1, // 就餐时间类型：1只支持时间 2支持日期时间
            dinner_time_offset = 0, // 就餐时间偏移量：当前时间延迟多少分钟
            minimum_takeout = 0, // 外卖送餐起送金额
            minimum_pack = 0, // 门店自取起定金额
            minimum_store = 0, // 商城配送起定金额
            minimum_money = 0, // 使用的起送金额
            open_time = 0, // 门店营业开始时间
            close_time = 0; // 门店营业结束时间

        // 外卖、自提才支持就餐时间选择所以赋值
        if (order_property == 2 || order_property == 3) {
            dinner_time_type = business_time.dinner_time_type;
            dinner_time_offset = business_time.dinner_time_offset;
            open_time = business_time.open_time;
            close_time = business_time.close_time;
        }
        if (order_property == 2) {
            minimum_money = business_time.minimum_takeout;
        }
        if (order_property == 3) {
            minimum_money = business_time.minimum_pack;
        }
        if (order_property == 4) {
            minimum_money = business_time.minimum_store;
        }

        // 处理当在一个商户点了菜有餐具，到另一个商户没餐具，结果造成，另一个商户读取到了不属于自身的餐具，所以删除缓存
        Cache.del('meal_package');

        // 从订单详情过来的，缓存了追单过来，需要的是否有必点条件商品，必点锅底，必点小料
        var storage_point = Cache.get('storage_point');

        // 判断如果url链接里面有cid就从url里面取，否则就是用缓存里面的
        var cid = Cache.get('getCID');
        if (Util.getQueryString('cid') != undefined) {
            cid = Util.getQueryString('cid');
            Cache.set('getCID', cid);
        }
        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli = Util.isAlipay();
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
        shopcardname = '乐卡包';

        // shop_type_info 1 桌台 2 叫号
        var shop_type_info = 1;


        weixinVisit();
        // 判断微信访问
        function weixinVisit() {
            var self = this;
            if (isWeixin || isAli) {
                $('#download').removeClass('hide');
                $('header').addClass('hide');
                //$('#dishes-frame header').addClass('hide');
                //$('.pg-dishes #dishes-content').css('top', '117px !important');
                //document.getElementById('dishes-content').style.cssText = 'top:95px !important';
                //document.getElementById('dishes-header').style.cssText = 'top:45px !important';
                //$('.pg-dishes #dishes-header').css('top', '67px !important');

                $('#dishes-header').addClass('top35')
                // $('#dishes-content').addClass('top84')
                $('#dishes-content').addClass('top45')
                $('.pg-dishes ul[data-id="scroller"]').css('padding-bottom', '130px');
                $('.pg-dishes div[data-id="scroller"]').css('padding-bottom', '130px');



                // 分享按钮隐藏
                $('#dishes-share').addClass('hide');

                $('#download').unbind('click').bind('click', function() {
                    window.location = phpDownload;
                });

                //$('title').text('京城特色美食推荐');
                // 得到签名数据
                Data.setAjax('companyShare', {
                    'card_id': card_id,
                    'url': location.href,
                    'cid': cid
                }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                    if (respnoseText.code == 20) {
                        var datat = respnoseText.data;
                        setTimeout(function() {
                            wxContent(datat);
                        }, 500);
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);

            } else {
                $('#download').addClass('hide');
                $('header').removeClass('hide');
                //$('.pg-dishes #dishes-content').css('top', '50px !important');
                //$('#dishes-frame header').removeClass('hide');
                //$('.pg-dishes .dishes-header').css('top', '0px !important');
            }
        }
        // 微信分享内容设置
        function wxContent(data) {
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
            //alert('1');
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
                wx.checkJsApi({
                    jsApiList: [
                        'getNetworkType',
                        'previewImage'
                    ],
                    success: function(res) {
                        //alert(JSON.stringify(res)+'------------------');
                    }
                });

                var uid = $.cookie("user_id") ? $.cookie("user_id") : "";
                var userMobile = $.cookie("user_mobile") ? $.cookie("user_mobile") : "";
                // 标题
                var cardname = shopcardname;
                //alert('ddd');
                var shareData = {
                    title: '京城特色美食推荐',
                    desc: cardname + '美食菜谱',
                    link: window.location.protocol + '//' + window.location.hostname + '/html/index.html?dishes&card_id=' + card_id + '&order_property='+order_property+'&cardname=' + cardname + '&shop_id=' + shop_id + '&page=shopChoice&cid=' + cid + '&user_id=' + uid + '&user_mobile=' + userMobile,
                    imgUrl: window.location.protocol + '//' + window.location.hostname + '/img/business/' + card_id + '/logo.jpg',
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
            });
            wx.error(function(res) { // 通过error接口处理失败验证
                //alert(res.errMsg+"??????????");
            });
        }

        // 获取到是否领卡的缓存，在点击选好了的时候判断是否领卡，如果没有领卡就请求领卡接口，提示领卡成功。
        var yesNoCard = Cache.get(card_id + 'yesNoCard');

        if (page != undefined) {
            if (page == 'orderlist') {
                this.back = page + '&card_id=' + card_id + '&page=merchantHome&order_list_type=1';
            } else if (page == 'shopChoiceNew') {
                this.back = 'shopChoiceNew=&card_id=' + Util.getQueryString('card_id') + '&brand_id=' + Util.getQueryString('brand_id') + '&page=merchantHome'
            } else {
                this.back = page + '&card_id=' + card_id;
            }
        }

        var DishesList = {

            isShow: false,

            dishesListScroll: function() {
                return new iScroll(ndDishesListContent[0], {
                    scrollbarClass: 'myScrollbar',
                    bounce: false,
                    hideScrollbar: true
                });
            },

            startDishesList: function() {
                var _self = this;

                $('#displsy-disheslist').unbind('click').bind('click', function() {
                    if (_self.isShow == false) {
                        DishesList.showDishesList();
                    } else {
                        DishesList.hideDishesList();
                    }
                });
            },

            // 显示点菜列表
            showDishesList: function() {
                var _self = this;
                ndDishesList.show();
                _self.dishesListScroll().refresh();
                ndFooter.css('z-index', 1000);
                $('#cart-btn').addClass('dishes-footer-round-upcart').removeClass('dishes-footer-round');
                $('#dishes-total-price').addClass('dishes-footer-big-right').removeClass('dishes-footer-big');
                $.dialog = Dialog({
                    type: 4,
                    dom: '#dishes-footer',
                    layerFn: function() {
                        DishesList.hideDishesList();
                    }
                });

                _self.isShow = true;
            },

            // 隐藏点菜列表
            hideDishesList: function() {
                var _self = this;
                ndDishesList.hide();
                ndFooter.css('z-index', 0);
                $('#cart-btn').addClass('dishes-footer-round').removeClass('dishes-footer-round-upcart');
                $('#dishes-total-price').addClass('dishes-footer-big').removeClass('dishes-footer-big-right');
                $.dialog.close($.dialog.id);

                calDishes(dishesTotalCount, dishesTotalPrice);
                _self.isShow = false;
            }
        };

        // 获取缓存数据并进行调用
        //Update.updateDataInfo(2);
        Cache.del(card_id + '-allmenu');
        var allMenuData = Cache.get(card_id + '-allmenu'), // 点菜缓存
            cardIdAndshopId = Cache.get(card_id + '-shop'), // 用来判断的缓存
            menuInfo = Cache.get('menuInfo'), // 基础数据
            allPackage = Cache.get('allPackage'); // 套餐数据

        allMenuData_1 = Cache.get('allMenuData_1');
        allMenuData_2 = Cache.get('allMenuData_2');
        allMenuData_3 = Cache.get('allMenuData_3');
        allMenuData_4 = Cache.get('allMenuData_4');

        switch (Number(order_property)) {
            case 1:
                allMenuData = dishesStackHandle(allMenuData_1, allMenuData);
                break;
            case 2:
                allMenuData = dishesStackHandle(allMenuData_2, allMenuData);
                break;
            case 3:
                allMenuData = dishesStackHandle(allMenuData_3, allMenuData);
                break;
            case 4:
                allMenuData = dishesStackHandle(allMenuData_4, allMenuData);
                break;
        }

        Cache.set('card_id', card_id);
        //console.log(allMenuData);
        //alert(card_id);
        // 获取门店菜品(有店铺号或者登陆)
        //if (shopNo || $.cookie('user_name')) { 

        // 扫描桌台二维码跳转过来的
        // 如果从URL传过来的type不是undefined并且是0，说明他是扫描二维码过来的
        if (scanCodeType != undefined && scanCodeType == 0 && order_property == 1) {
            // 先请求获取桌台详情接口
            Data.setAjax('companyTable', {
                'card_id': card_id,
                'table_id': scanCodeTableId,
                'cid': cid
            }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                var data = respnoseText.data;
                if (respnoseText.code == 20) {
                    // 是扫描过来的，才用扫描里面的桌台id赋值
                    tableId = scanCodeTableId;
                    //tableName = data.table_name;
                    shop_id = data.shop_id;
                    Cache.set('shop-cardname', data.card_name);
                    $('#dishes-shopname').text(Cache.get('shop-cardname'));
                    $('title').text(Cache.get('shop-cardname'));
                    // 检测缓存 在请求显示数据
                    testingCache(card_id, data.shop_id);
                } else {
                    Message.show('#msg', respnoseText.message, 2000);
                }
            }, 2);
        } else {
            // 如果是orderlist说明是再来一单过来的就检测缓存直接请求接口
            if (page == 'orderlist') {
                dishesData(card_id, shop_id);
                // 请求店铺接口，得到 shop_type_info 0 桌台模式  1叫号 2台卡，解决再来一单得到的shop_type_info不准确
                //shopListData(shop_id);
            } else {
                // 检测缓存 在请求显示数据
                testingCache(card_id, shop_id);
            }
        }

        // 检测判断缓存
        function testingCache(card_id, shop_id) {
            // 菜品缓存，缓存规则
            // 每个商户有一个菜品缓存，在用户选择某个店进去的时候，存储缓存，进入当前商户另一个店的时候，判断是否和当前商户上一个店缓存相等，相等就不删除，不相等就allMenuData = {};，但是在点击加号的时候存储用来判断的缓存，覆盖上一个店的缓存，在点完菜品之后，直接支付成功就删除掉当前商户的菜品缓存

            // 点菜存储缓存规则         缓存名：商户id-allmenu   缓存中数据：菜品数据
            // 用来判断的缓存存储规则   缓存名：商户id-shop      缓存中数据：商户id-门店id

            // 如果没有缓存
            if (cardIdAndshopId == undefined) {
                Cache.set(card_id + '-shop', card_id + '-' + shop_id); // 存储缓存
                // 如果点菜没有缓存就等于空
                if (allMenuData == undefined) {
                    //alert('tt');
                    allMenuData = {};
                }
            } else {
                // 如果点菜没有缓存就等于空
                if (allMenuData == undefined) {
                    //alert('dd');
                    allMenuData = {};
                }
                // 如果缓存中的card_id==当前的card_id,
                if (cardIdAndshopId.split('-')[0] == card_id) {
                    //alert(cardIdAndshopId.split('-')[1]+'---'+shop_id);
                    // 如果缓存中的shop_id!=当前的shop_id,就allMenuData = {},但是在点击加号的时候存储用来判断的缓存，覆盖上一个店的缓存
                    if (cardIdAndshopId.split('-')[1] != shop_id) {
                        //alert('ttrr');
                        //Cache.del(card_id+'-allmenu');
                        //Cache.del(card_id+'-shop');
                        //Cache.set(card_id+'-shop',card_id+'-'+shop_id);// 存储缓存
                        allMenuData = {};
                    }
                } else { // 不等于当前的card_id就创建缓存
                    Cache.set(card_id + '-shop', card_id + '-' + shop_id); // 存储缓存
                }
            }
            dishesData(card_id, shop_id);
        }

        // 分享点餐页面
        $('#dishes-share').unbind('click').bind('click', function() {
            $.dialog = Dialog({
                type: 3,
                dom: '#share-dialog',
                success: function() {
                    // 分享到微信好友
                    $('#j-share-to-wx').unbind('click').bind('click', function() {
                        $.dialog.close($.dialog.id);
                        //$.getJSON('customer.php?r=Counter/Write&page_type=share_article_weixin&page_id=red&UUID='+uuid);
                        //Data.getShareIntegral('index');
                        Mobile.dishesShare('0', '0', 'wx48c0ba158b071fb7', card_id, shop_id, shopcardname);
                    });

                    // 分享到微信朋友圈
                    $('#j-share-to-wx-circle').unbind('click').bind('click', function() {
                        $.dialog.close($.dialog.id);
                        //$.getJSON('customer.php?r=Counter/Write&page_type=share_article_weixin&page_id=red&UUID='+uuid);
                        //Data.getShareIntegral('index');
                        Mobile.dishesShare('0', '1', 'wx48c0ba158b071fb7', card_id, shop_id, shopcardname);
                    });

                    // 分享给qq好友
                    $('#j-share-to-qq').unbind('click').bind('click', function() {
                        $.dialog.close($.dialog.id);
                        //$.getJSON('customer.php?r=Counter/Write&page_type=share_article_weixin&page_id=red&UUID='+uuid);
                        //Data.getShareIntegral('index');
                        Mobile.dishesShare('1', '0', '', card_id, shop_id, shopcardname);
                    });
                }
            });
        });

        // 请求店铺接口
        function shopListData(shopId) {
            Data.setAjax('companyShop', {
                'card_id': card_id,
                'cid': cid,
                'addr_lng': '',
                'addr_lat': ''
            }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                if (respnoseText.code == 20) {
                    var data = respnoseText.data;
                    for (var i in data) {
                        if (data[i].shop_id == shopId) {
                            shop_type_info = data[i].shop_type_info;
                            Cache.set('shop_type_info', shop_type_info);
                            //alert(shop_type_info);
                        }
                    }
                } else {
                    Message.show('#msg', respnoseText.message, 2000);
                }
            }, 2);
        }

        // 请求接口，显示菜品数据
        function dishesData(cardId, shopId) {
            Data.setAjax('companyMenu', {
                'card_id': cardId,
                'pay_id': pay_id,
                'shop_id': shopId,
                //'order_type': order_type,
                'order_property': order_property,
                'cid': cid
            }, '#layer', '#msg', { 20: '' }, function(respnoseText) {

                menuInfo = respnoseText.data;
                if (respnoseText.code == 20 || respnoseText.code == 200108) {
                    shopcardname = menuInfo.card_name;
                    shop_type_info = menuInfo.shop_type_info;
                    Cache.set('shop_type_info', shop_type_info);
                    // 如果(是客户端  或者 是微信)并且 是桌台模式 && 是否需要扫描二维码 是需要  就显示点选中了弹出层里面的扫描二维码,隐藏输入框
                    if (($.app.isClient == true || isWeixin || isAli) && shop_type_info == 1 && is_wx_scan == 1) {
                        $('#j-edit-scan-table').removeClass('hide');
                        $('#ManualCode').addClass('hide');
                    } else {
                        $('#j-edit-scan-table').addClass('hide');
                        $('#ManualCode').removeClass('hide');
                    }
                    // discount = respnoseText.data.guodi_discount;
                    // Util.info(clearMenu);
                    // 是否授权会员，返回20 否，返回200108 是
                    // if (respnoseText.code == 20) {
                    //     is_authority = 0;
                    // } else if (respnoseText.code == 200108) {
                    //     is_authority = 1;
                    // }
                    is_authority = menuInfo.is_member_price;

                    // 就餐时间，如果是外卖、自提，支持时间选择，其他不支持
                    if (order_property == 2 || order_property == 3) {
                        $('#dinner_time_display').removeClass('hide');
                        if (order_property == 2) {
                            $('#dinner_time_title').text('送餐时间');
                        } else {
                            $('#dinner_time_title').text('自取时间');
                        }
                    } else {
                        $('#dinner_time_display').addClass('hide');
                        $('#times').text('选择人数');
                    }

                    processLocalData(menuInfo, clearMenu);
                } else { //420211 没有菜品
                    shopcardname = '乐卡包';
                    Message.show('#msg', respnoseText.message, 2000);
                }

                $('#dishes-shopname').text(shopcardname);
                $('title').text(shopcardname);
            }, 2);
        }

        //} else {
        //processLocalData(menuInfo, clearMenu);
        //}

        // 处理数据
        function processLocalData(menuInfo, clearMenu) {
            var categoryContent = ''; // 分类列表
            var menuContent = ''; // 菜品列表
            var userCollect = ''; // 我的收藏分类
            var userCollectMenu = ''; // 我的收藏菜品
            var is_collDisplay = 0; // 是否默认第一个显示我的收藏 0 是 1 否
            var length = 0;

            if (menuInfo.user_collect == undefined) {
                is_collDisplay = 0;
            }

            // 赋值是否允许自备餐具
            is_chopsticks = menuInfo.shop_info.is_chopsticks;

            // 遍历分类，处理分类下菜品
            for (var i in menuInfo) {
                if (menuInfo[i].menu_list != undefined) {
                    length += 1;
                }
                if (i == 'shop_info') {
                    continue;
                }
                if (i == 'user_collect') {
                    userCollect = '<li data-href="#myCollect"><a>我的收藏</a></li>';
                    userCollectMenu += '<div class="disheDiv" id="myCollect"><div class="dishes-right-title" id="myCollect">我的收藏</div><ul id="myCollect" data-type="' + i + '">';
                    userCollectMenu += foreachData(menuInfo[i].menu_list, '我的收藏', clearMenu, menuInfo.is_like, 0);
                    is_collDisplay = 0;
                } else {
                    categoryContent += '<li data-href="#' + menuInfo[i].menu_type_id + '"><a>' + menuInfo[i].menu_type + '</a></li>';
                    menuContent += '<div class="disheDiv" id="' + menuInfo[i].menu_type_id + '"><div class="dishes-right-title" id="' + menuInfo[i].menu_type_id + '">' + menuInfo[i].menu_type + '</div><ul id="' + menuInfo[i].menu_type_id + '" data-type="' + i + '">';
                    menuContent += foreachData(menuInfo[i].menu_list, menuInfo[i].menu_type, clearMenu, menuInfo.is_like, 1);
                }
                if (i == 'user_collect' && menuInfo[i] == '') {
                    is_collDisplay = 1;
                }
                //alert(foreachData(menuInfo[i], i, clearMenu));
                //alert($('#menu').find('div ul li'));
            }

            userCollect += categoryContent;
            userCollectMenu += menuContent;
            if (length == 0) {
                $('#dishes-content').addClass('hide');
                $('#dishes-footer').addClass('hide');
                $('#m_empty').removeClass('hide');
                return;
            }

            // 写入内容到页面上
            //Cache.set(card_id+'-allmenu', allMenuData);
            $('#j-menu-loading').addClass('hide');
            ndClassIfication.html(userCollect).removeClass('hide');
            ndMenuContent.html(userCollectMenu);
            totalScroll.refresh();


            // 变量应对重复刷新问题
            var menu_refresh = {};

            //循环判断是否显示某个分类
            for (var t in menuInfo) {
                if (menuInfo[t].menu_list == undefined) {
                    //删除不需要显示的分类
                    $('#classification').find('li[data-href="#' + menuInfo[t].menu_type_id + '"]').remove();
                    //删除菜品中分类的标题
                    $('#menu-content').find('div[id="' + menuInfo[t].menu_type_id + '"]').remove();
                }
                // 是否删除分类 0，否，1是
                var num = 1;
                for (var y in menuInfo[t].menu_list) {

                    // 变量应对重复刷新问题
                    menu_refresh[menuInfo[t].menu_list[y].menu_id] = {};
                    menu_refresh[menuInfo[t].menu_list[y].menu_id] = dishesStackHandle(menuInfo[t].menu_list[y], menu_refresh[menuInfo[t].menu_list[y].menu_id]);

                    if (menuInfo[t].menu_list[y].is_off == undefined) {
                        //删除不需要显示的分类
                        $('#classification').find('li[data-href="#' + menuInfo[t].menu_type_id + '"]').remove();
                        //删除菜品中分类的标题
                        $('#menu-content').find('div[id="' + menuInfo[t].menu_type_id + '"]').remove();
                    } else if (menuInfo[t].menu_list[y].is_off != 2 && menuInfo[t].menu_list[y].menu_scope != 2 && (parseFloat(menuInfo[t].menu_list[y].number) == 0 || parseFloat(menuInfo[t].menu_list[y].sales) < parseFloat(menuInfo[t].menu_list[y].number))) { //menuInfo[t].menu_list[y].is_off != 1 &&
                        // is_off 1：估清,2:下架 menu_scope适用范围 1:app 2:点菜宝 3:全部，判断如果此分类下只要有一个菜品不是估请并且不是下架并且不是点菜宝 并且 （限量是0 或者 销量<限量），就不删除此分类，否则就删除此分类
                        num = 0;
                    }
                }
                if (num == 1) {
                    //删除不需要显示的分类
                    $('#classification').find('li[data-href="#' + menuInfo[t].menu_type_id + '"]').remove();
                    //删除菜品中分类的标题
                    $('#menu-content').find('div[id="' + menuInfo[t].menu_type_id + '"]').remove();
                }
            }


            // 判断显示了几个分类，
            var num_1 = 0;
            ndClassIfication.find('li').each(function() {
                num_1++;
            });


            var total_height = $(window).height(); // 屏幕高度
            dishesScroll = new iScroll($('#menu')[0], {
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
                onScrollMove: function() { // 内容移动的回调
                    is_click_scroll = 0;
                    // console.log('1---'+Math.random())
                    var num2 = 0;
                    //var jump_top = $('#menuDispaly').offset().top;// 跳转的位置距离顶部高度
                    ndClassIfication.find('li').each(function() {
                        num2 = num2 + 1;

                        // 当前分类距离顶部高度
                        var this_top = $($(this).attr('data-href')).offset().top;

                        var top_height = 60;
                        if (isWeixin || isAli) {
                            top_height = 100;
                        }
                        if (num2 == num_1 && num2 > 2) {
                            var num_hi = $($(this).attr('data-href')).height();
                            var num_hi_1 = total_height - top_height;

                            if (num_hi < num_hi_1 && this_top < total_height) {
                                $(this).addClass('dishes-left-check').siblings('li').removeClass('dishes-left-check');
                            }
                        } else {
                            // 如果右侧当前分类距离顶部高度 <= 50px 就选中左侧当前分类
                            if (this_top <= top_height) {
                                $(this).addClass('dishes-left-check').siblings('li').removeClass('dishes-left-check');
                                /*// 左侧分类距离顶部高度 + 60 > 屏幕高度，或者，左侧分类距离顶部高度 + 60 <= 0 就向上滑动
                                var left_top = $(this).offset().top + 60;
                                if (left_top > total_height || left_top <= 0) {
                                    dishesScroll.scrollToElement($(this)[0], 100);
                                }*/
                            }
                        }

                        //dishesScroll.refresh();
                        totalScroll.refresh();
                    });
                },
                onScrollEnd: function() { // 在滚动结束前的回调
                    if (is_click_scroll == 0) {
                        // console.log('2---'+Math.random())
                        var num2 = 0;

                        ndClassIfication.find('li').each(function() {
                            num2 = num2 + 1;

                            // 当前分类距离顶部高度
                            var this_top = $($(this).attr('data-href')).offset().top;

                            var top_height = 60;
                            if (isWeixin || isAli) {
                                top_height = 100;
                            }
                            if (num2 == num_1 && num2 > 2) {
                                var num_hi = $($(this).attr('data-href')).height();
                                var num_hi_1 = total_height - top_height;

                                if (num_hi < num_hi_1 && this_top < total_height) {
                                    $(this).addClass('dishes-left-check').siblings('li').removeClass('dishes-left-check');
                                }
                            } else {

                                // 如果右侧当前分类距离顶部高度 <= 50px 就选中左侧当前分类
                                if (this_top <= top_height) {
                                    $(this).addClass('dishes-left-check').siblings('li').removeClass('dishes-left-check');
                                    /*// 左侧分类距离顶部高度 + 60 > 屏幕高度，或者，左侧分类距离顶部高度 + 60 <= 0 就向上滑动
                                    var left_top = $(this).offset().top + 60;
                                    if (left_top > total_height || left_top <= 0) {
                                        dishesScroll.scrollToElement($(this)[0], 100);
                                    }*/
                                }
                            }

                            //dishesScroll.refresh();
                            totalScroll.refresh();
                        });
                    }
                },
                onRefresh: function() { // Refresh的回调

                }
            });

            dishesScroll.refresh();


            //console.log(menu_refresh);
            //alert('dd');
            // 循环判断再来一单跳转过来的关于菜品可能删除了、没有口味等等
            // 下面这个赋值是防止，如果收藏里面有套餐菜品，出现备注全选的问题
            var repeat_chang = dishesStackHandle(allMenuData, repeat_chang);
            for (var e in allMenuData) {
                //alert(allMenuData[e].id);

                var num2 = 0;

                for (var r in menu_refresh) {
                    //alert(menu_refresh[r].menu_id);
                    if (menu_refresh[r].menu_id == allMenuData[e].id) {

                        //alert('tt');
                        num2 = 1;
                        // menu_scope适用范围 1:app 2:点菜宝 3:全部 || 限量!=0 并且 销量>=限量时自动估清，手机APP端和点菜宝端不显示菜品
                        if (menu_refresh[r].is_off == 1 || menu_refresh[r].is_off == 2 || (menu_refresh[r].menu_scope != 1 && menu_refresh[r].menu_scope != 3) || (parseFloat(menu_refresh[r].number) != 0 && parseFloat(menu_refresh[r].sales) >= parseFloat(menu_refresh[r].number))) {
                            //alert('dd');
                            num2 = 0;
                        } else {
                            // 是否输入数量 0：否 1：是
                            var is_input = menu_refresh[r].is_input;
                            // 是否半份 0：否 1：是
                            var is_half = menu_refresh[r].is_half;
                            // 是否有口味 0：否 1：是
                            var num1 = 1;
                            //alert(allMenuData[e].flavorObj.flavor_name);
                            if (allMenuData[e].flavorObj == '') {
                                //alert('1');
                                num1 = 0;
                            }
                            //alert(JSON.stringify(allMenuData[e].flavorObj));
                            var dd = JSON.stringify(allMenuData[e].flavorObj);
                            if (dd == '{}') {
                                //alert('dd');
                                num1 = 0;
                            }
                            /*else {
                                                           num1 = 1;
                                                       }*/
                            //alert(allMenuData[e].flavorObj.flavor_name);
                            for (var a in allMenuData[e].flavorObj) {
                                //alert(allMenuData[e].flavorObj[a].flavor_name);
                                if (allMenuData[e].flavorObj[a].flavor_name == undefined) {
                                    //alert('2');
                                    num1 = 0;
                                    break;
                                }
                            }

                            // 先将该菜品的一些值赋值给缓存(分类id，名称，单位，价格)
                            allMenuData[e].type = menu_refresh[r].menu_type_id;
                            allMenuData[e].name = menu_refresh[r].menu_name;
                            allMenuData[e].unit = menu_refresh[r].menu_unit;
                            allMenuData[e].is_set_menu = menu_refresh[r].is_set_menu;
                            //allMenuData[e].set_menu_info = {};
                            //allMenuData[e].set_menu_info = menu_refresh[r].set_menu.set_menu_info;


                            // 是否授权会员，0 否，1 是
                            if (is_authority == 0) {
                                //menu_price 菜品原价 member_price 会员价
                                allMenuData[e].dishesPrice = menu_refresh[r].menu_price;
                            } else if (is_authority == 1) {
                                //menu_price 菜品原价 member_price 会员价
                                allMenuData[e].dishesPrice = menu_refresh[r].member_price;
                            }

                            allMenuData[e].flavor = menu_refresh[r].menu_flavor;
                            allMenuData[e].note = menu_refresh[r].menu_note;

                            // 限售数量 = 限量 - 销量
                            var limited = parseFloat(Util.accSubtr(menu_refresh[r].number, menu_refresh[r].sales));


                            // 套餐数据处理
                            if (allMenuData[e].is_set_menu == 1) {
                                if (limited > 0 && Util.getQueryString('again') == 1) {
                                    allMenuData[e].set_menu_info = {};
                                } else {

                                    for (var a in repeat_chang[e].set_menu_info) {
                                        for (var b in repeat_chang[e].set_menu_info[a]) {
                                            for (var m in repeat_chang[e].set_menu_info[a][b]) {
                                                if (allMenuData[e].set_menu_info[a][b][m].is_choose == '1') {
                                                    var choo_tih = {};
                                                    choo_tih = dishesStackHandle(menu_refresh[r].set_menu[b], choo_tih);
                                                    var dhoo_tih = {};
                                                    var dhoo_num = 0;

                                                    for (var c in menu_refresh[r].set_menu[b]) {
                                                        if (allMenuData[e].set_menu_info[a][b][m].menu_id == menu_refresh[r].set_menu[b][c].menu_id) {
                                                            choo_tih[c].is_choose = '1';
                                                            dhoo_tih = dishesStackHandle(choo_tih[c], dhoo_tih);
                                                            dhoo_num = c;
                                                        } else {
                                                            choo_tih[c].is_choose = '0';
                                                        }
                                                    }

                                                    if (dhoo_tih.menu_flavor != '' && dhoo_tih.menu_flavor != undefined) {
                                                        for (var c in dhoo_tih.menu_flavor) {
                                                            for (var d in repeat_chang[e].set_menu_info[a][b][m].menu_flavor) {

                                                                if (repeat_chang[e].set_menu_info[a][b][m].menu_flavor[d].flavor_name == dhoo_tih.menu_flavor[c].flavor_name && repeat_chang[e].set_menu_info[a][b][m].menu_flavor[d].is_choose == '1') {

                                                                    choo_tih[dhoo_num].menu_flavor[c].is_choose = '1';
                                                                }
                                                            }
                                                        }
                                                    }

                                                    if (dhoo_tih.menu_note != '' && dhoo_tih.menu_note != undefined) {
                                                        for (var c in dhoo_tih.menu_note) {
                                                            for (var d in repeat_chang[e].set_menu_info[a][b][m].menu_note) {
                                                                if (repeat_chang[e].set_menu_info[a][b][m].menu_note[d].note_name == dhoo_tih.menu_note[c].note_name && repeat_chang[e].set_menu_info[a][b][m].menu_note[d].is_choose == '1') {
                                                                    choo_tih[dhoo_num].menu_note[c].is_choose = '1';
                                                                }
                                                            }
                                                        }
                                                    }
                                                    allMenuData[e].set_menu_info[a][b] = {};
                                                    allMenuData[e].set_menu_info[a][b] = dishesStackHandle(choo_tih, allMenuData[e].set_menu_info[a][b]);
                                                }
                                            }
                                        }
                                    }





                                }
                            } else {
                                allMenuData[e].set_menu_info = '';
                            }


                            // 如果没有口味
                            if (num1 == 0) {
                                //alert('3');
                                // 如果不能输入数量并且不是半份就把该菜品数量取整重新计算价钱
                                if (is_input == 0 && is_half == 0) {
                                    allMenuData[e].count = parseInt(allMenuData[e].count);
                                } else if (is_input == 0 && is_half == 1) {
                                    // 如果不能输入数量并且是半份就把该菜品数量除以0.5取整在乘以0.5
                                    allMenuData[e].count = parseInt(parseFloat(allMenuData[e].count) / 0.5) * 0.5;
                                }
                                // 如果限量!=0 并且 限售数量<缓存菜品数量 并且是再来一单过来的  缓存菜品数量=0
                                /*if (menu_refresh[r].number != 0 && limited < allMenuData[e].count && Util.getQueryString('again') == 1) {
                                    allMenuData[e].count = 0;
                                }*/
                                if (limited > 0 && Util.getQueryString('again') == 1) {
                                    allMenuData[e].count = 0;
                                }

                                allMenuData[e].price = parseFloat(allMenuData[e].count * allMenuData[e].dishesPrice).toFixed(2);
                            } else if (num1 == 1) { // 如果有口味
                                //alert('rrr');
                                // 循环口味和备注，去除订单菜品信息缓存中当前菜品没有的口味和备注
                                for (var c in allMenuData[e].flavorObj) {
                                    var nums1 = 0;
                                    for (var z in menu_refresh[r].menu_flavor) {
                                        if (menu_refresh[r].menu_flavor[z] == allMenuData[e].flavorObj[c].flavor_name) {
                                            nums1 = 1;
                                        }
                                    }
                                    if (nums1 == 0) {
                                        //alert('dddd');
                                        delete allMenuData[e].flavorObj[c];
                                    }
                                }

                                for (var q in allMenuData[e].noteObj) {
                                    var nums2 = 0;
                                    for (var u in menu_refresh[r].menu_note) {
                                        if (menu_refresh[r].menu_note[u] == allMenuData[e].noteObj[q].note_name) {
                                            nums2 = 1;
                                        }
                                    }
                                    if (nums2 == 0) {
                                        delete allMenuData[e].noteObj[q];
                                    }
                                }
                                //console.log(allMenuData);
                                // 如果不能输入数量并且不是半份就把该菜品的口味循环，每个口味都进行取整，在进行相加，在赋值给菜品数量

                                // 如果不能输入数量并且是半份就把该菜品的口味循环，每个口味数量都除以0.5取整在乘以0.5，，在进行相加，在赋值给菜品数量

                                // 存储菜品数量
                                var nums3 = 0;
                                for (var l in allMenuData[e].flavorObj) {
                                    if (is_input == 0 && is_half == 0) {
                                        nums3 += parseInt(allMenuData[e].flavorObj[l].flavor_count);
                                        allMenuData[e].flavorObj[l].flavor_count = parseInt(allMenuData[e].flavorObj[l].flavor_count);
                                    } else if (is_input == 0 && is_half == 1) {
                                        nums3 += parseInt(parseFloat(allMenuData[e].flavorObj[l].flavor_count) / 0.5) * 0.5;
                                        allMenuData[e].flavorObj[l].flavor_count = parseInt(parseFloat(allMenuData[e].flavorObj[l].flavor_count) / 0.5) * 0.5;
                                    } else {
                                        nums3 += parseFloat(allMenuData[e].flavorObj[l].flavor_count);
                                    }
                                    // 如果限售数量>0 口味数量=0
                                    if (limited > 0 && Util.getQueryString('again') == 1) {
                                        //alert('ddd');
                                        nums3 = 0;
                                        allMenuData[e].flavorObj[l].flavor_count = 0;
                                    }

                                    allMenuData[e].flavorObj[l].flavor_price = parseFloat(allMenuData[e].flavorObj[l].flavor_count * allMenuData[e].dishesPrice).toFixed(2);
                                    //console.log(allMenuData[e].flavorObj[l].flavor_price+'---');
                                }

                                allMenuData[e].count = parseFloat(nums3).toFixed(1);
                                allMenuData[e].price = parseFloat(nums3 * allMenuData[e].dishesPrice).toFixed(2);
                                //console.log(allMenuData[e].price);
                            }

                        }
                    }
                }

                //alert(num2);
                if (num2 == 0) {
                    //alert('1');
                    delete allMenuData[e];
                    //break;
                }
            }

            Cache.set(card_id + '-allmenu', allMenuData);
            //console.log(allMenuData);
            setTimeout(function() {
                // 分类定位
                cateGoryPosition(is_collDisplay);
            }, 300);
            // 点菜
            subscribeDishes();

            // 查看已点菜品
            DishesList.startDishesList();

            //分类列表刷新
            totalScroll.refresh();
        }

        // 遍历菜品数据
        function foreachData(allMenu, type, clearMenu, is_like, is_coll) {
            var li = '';
            var is_menu_info = 0;// 是否显示菜品说明

            for (var i in allMenu) {
                //alert(allMenu[i].menu_name);
                // 判断菜品是否估清（估清菜品直接不显示）
                if (clearMenu[type] && clearMenu[type][allMenu[i].menu_id]) {
                    // console.log('估清：' + allMenu[i].base.menu_name);
                    //alert('ddd');
                    // 估清菜品缓存中有点菜记录，删除点菜记录
                    if (allMenuData && allMenuData[allMenu[i].menu_id]) {
                        delete allMenuData[allMenu[i].menu_id];
                    }
                    continue;
                }

                // 如果是估清就进行下一个循环 1：估清,2:下架  
                if (allMenu[i].is_off == 2) { //allMenu[i].is_off == 1 || 估请的菜品需要显示出来
                    continue;
                }
                // menu_scope适用范围 1:app 2:点菜宝 3:全部
                if (allMenu[i].menu_scope != 1 && allMenu[i].menu_scope != 3) {
                    continue;
                }

                // 是特殊商品类型，11百度外卖配送费 12 饿了么外卖配送费 13 美团外卖配送费
                if (allMenu[i].special_type == 11 || allMenu[i].special_type == 12 || allMenu[i].special_type == 13) {
                    continue;
                }

                // 限量!=0 并且 销量>=限量时自动估清，手机APP端和点菜宝端不显示菜品
                if (parseFloat(allMenu[i].number) != 0 && parseFloat(allMenu[i].sales) >= parseFloat(allMenu[i].number)) {
                    //alert('ddd');
                    continue;
                }

                // 如果是堂食，并且有堂食餐包，就存储缓存
                if (order_property == 1 && allMenu[i].special_type == 1) {
                    Cache.set('meal_package', allMenu[i]);
                }
                // 如果是外卖，并且有外卖餐包，就存储缓存
                if ((order_property == 2 || order_property == 3) && allMenu[i].special_type == 2) {
                    Cache.set('meal_package', allMenu[i]);
                }

                /*is_eat = 0,           // 堂食餐包     0 已下架 1 未下架
                is_takeout = 0,         // 外卖餐包     0 已下架 1 未下架
                is_takeout_room = 0,    // 外卖送餐费    0 已下架 1 未下架
                is_shopping_room = 0,   // 商城送餐费    0 已下架 1 未下架
                is_packing_box = 0,     // 打包盒      0 已下架 1 未下架*/

                if (allMenu[i].special_type == 1) {
                    is_eat = 1;
                } else if (allMenu[i].special_type == 2) {
                    is_takeout = 1;
                } else if (allMenu[i].special_type == 3) {
                    is_takeout_room = 1;
                } else if (allMenu[i].special_type == 4) {
                    is_shopping_room = 1;
                } else if (allMenu[i].special_type == 5) {
                    is_packing_box = 1;
                }

                // 判断如果有菜是特殊商品（12345）则不显示
                if (allMenu[i].special_type == 1 || allMenu[i].special_type == 2 || allMenu[i].special_type == 3 || allMenu[i].special_type == 3 || allMenu[i].special_type == 4 || allMenu[i].special_type == 5) {
                    continue;
                }

                /*var is_bottom_pot = 0;    // 是否有必点锅底
                var is_small_material = 0;  // 是否有必点小料*/

                if (allMenu[i].special_type == 6) {
                    is_bottom_pot = 1;
                }
                if (allMenu[i].special_type == 7) {
                    is_small_material = 1;
                }

                // 下面菜品上要显示打包盒价格
                var pack_price = 0;
                var pack_conte = '';
                // 根据打包盒菜品id得到打包盒菜品数据
                if (allMenu[i].pack_id == '' || allMenu[i].pack_id == null || order_property == 1) {
                    pack_conte = '';
                } else {
                    pack_price = dishesLoopJudgeId(allMenu[i].pack_id);
                    pack_price = pack_price == false ? 0 : pack_price.menu_price;
                    pack_conte = '<span style="color: #888;font-size:10px;" class="p-ash-pakeout">&nbsp;<span>打包盒</span><b data-type="pack_price">' + parseFloat(pack_price) + '</b>元</span>';
                }

                // 是否显示点赞
                //var is_liked = '<div class="zank">'+parseInt(allMenu[i].liked_sum)+'</div>';
                var is_liked = '';

                // 图片下面样式出现一条缝
                var feng = '';

                if (is_like == 1) {
                    feng = 'over_on';
                    // 点赞数量
                    if (allMenu[i].liked_sum == 0) {
                        feng = 'over_onnone';
                        is_liked = '';
                    } else if (allMenu[i].liked_sum <= 999999) {
                        is_liked = '<div class="zank"><svg version="1.1" id="图层_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 43.7 42.6" style="enable-background:new 0 0 43.7 42.6;" xml:space="preserve"><style type="text/css">.st0{fill:#FB5555;stroke:#FB5555;stroke-miterlimit:10;}.st1{fill:none;stroke:#FB5555;stroke-miterlimit:10;}</style><symbol  id="zanka" viewBox="-18 -15.6 36 31.3"><path class="st0" d="M-5.2-15.1c-0.9,0-1.9,1.3-1.9,1.9V1.2l0,0c0,0.9,1.4,2.3,3.7,3.6C-1.9,5.6-1,8-1,9.8c0,0.9-0.2,1.6-0.6,2.1c-0.7,0.9-0.9,1.6-0.9,2c0,0.7,0.5,1.2,1.3,1.2c0.9,0,1.9-0.5,2.8-1.5c0.8-0.8,1.2-2.1,1.2-3.7c0-2.9-1.3-6.1-1.4-6.2c0-0.1,0-0.1,0-0.2c0-0.1,0-0.2,0.1-0.3c0.2,0,0.3-0.1,0.5-0.1h13.6c0.6,0,1.8-0.8,1.9-1.8C17.4,1.1,12.7-13,12.7-13c-0.3-0.8-1.3-2.1-1.9-2.1L-5.2-15.1"/><path class="st0" d="M-16-14.2c-0.8,0-1.5,0.7-1.5,1.5V0.8c0,0.8,0.7,1.5,1.5,1.5h2.4c0.8,0,1.5-0.7,1.5-1.5v-13.7c0-0.8-0.7-1.5-1.5-1.5L-16-14.2"/></symbol><g id="zankb"><use xlink:href="#zanka"  width="36" height="31.3" x="-18" y="-15.6" transform="matrix(1 0 0 -1 21.8333 21.3167)" style="overflow:visible;"/></g></svg>' + parseInt(allMenu[i].liked_sum) + '</div>';
                    } else {
                        is_liked = '<div class="zank"><svg version="1.1" id="图层_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 43.7 42.6" style="enable-background:new 0 0 43.7 42.6;" xml:space="preserve"><style type="text/css">.st0{fill:#FB5555;stroke:#FB5555;stroke-miterlimit:10;}.st1{fill:none;stroke:#FB5555;stroke-miterlimit:10;}</style><symbol  id="zanka" viewBox="-18 -15.6 36 31.3"><path class="st0" d="M-5.2-15.1c-0.9,0-1.9,1.3-1.9,1.9V1.2l0,0c0,0.9,1.4,2.3,3.7,3.6C-1.9,5.6-1,8-1,9.8c0,0.9-0.2,1.6-0.6,2.1c-0.7,0.9-0.9,1.6-0.9,2c0,0.7,0.5,1.2,1.3,1.2c0.9,0,1.9-0.5,2.8-1.5c0.8-0.8,1.2-2.1,1.2-3.7c0-2.9-1.3-6.1-1.4-6.2c0-0.1,0-0.1,0-0.2c0-0.1,0-0.2,0.1-0.3c0.2,0,0.3-0.1,0.5-0.1h13.6c0.6,0,1.8-0.8,1.9-1.8C17.4,1.1,12.7-13,12.7-13c-0.3-0.8-1.3-2.1-1.9-2.1L-5.2-15.1"/><path class="st0" d="M-16-14.2c-0.8,0-1.5,0.7-1.5,1.5V0.8c0,0.8,0.7,1.5,1.5,1.5h2.4c0.8,0,1.5-0.7,1.5-1.5v-13.7c0-0.8-0.7-1.5-1.5-1.5L-16-14.2"/></symbol><g id="zankb"><use xlink:href="#zanka"  width="36" height="31.3" x="-18" y="-15.6" transform="matrix(1 0 0 -1 21.8333 21.3167)" style="overflow:visible;"/></g></svg>999999+</div>';
                    }
                } else {
                    feng = 'over_onnone';
                    is_liked = '';
                }

                var menu_id = '';
                // is_coll 0 收藏  1 不是收藏
                if (is_coll == 0) {
                    menu_id = allMenu[i].menu_id + '-myCollect';
                } else {
                    menu_id = allMenu[i].menu_id;
                }

                // 如果是大图，并且有 菜品说明 才显示
                if (allMenu[i].list_style == 2 && allMenu[i].menu_info != '') {
                    is_menu_info = 1;
                } else {
                    is_menu_info = 0;
                }
                //菜品标签里面的内容遍历出来
                var menu_byname_str='';
                var menu_byname_array=allMenu[i].menu_byname;
                if(menu_byname_array.constructor==Array){
                    for(var j=0;j<menu_byname_array.length;j++){
                        menu_byname_str += '<span>'+menu_byname_array[j]+'</span>';            
                    }
                }else{
                   menu_byname_str += '<span>'+allMenu[i].menu_byname+'</span>';
                }

                li += '<li class="clearfix ' + (allMenu[i].list_style == 2 ? "biggPic" : '') + '" id="' + menu_id + '" data-type="' + i + '">' +
                    '<div class="dishes__img">' +
                    //'<div class="on_over_wrap">'+
                    (parseFloat(Util.accSubtr(allMenu[i].number, allMenu[i].sales)) == 0 ? '' :
                        '<div class="' + feng + '">限售:<span data-type="limDisplay">' + parseFloat(Util.accSubtr(allMenu[i].number, allMenu[i].sales)) + '</span>份</div>') +
                    '<span data-type="limited" class="hide">' + parseFloat(Util.accSubtr(allMenu[i].number, allMenu[i].sales)) + '</span>' +
                    (allMenu[i].list_style == 2 ? '<img src="../../img/base/no-pic.png" alt="菜品图片" data-src="../../img/business/' + card_id + '/menu/' + allMenu[i].menu_id + '_max.jpg?' + Math.random() + '" data-dishes-type="' + type + '">' : '<img src="../../img/base/no-pic.png" alt="菜品图片" data-src="../../img/business/' + card_id + '/menu/' + allMenu[i].menu_id + '.jpg?' + Math.random() + '" data-dishes-type="' + type + '">') +
                    //'</div>'+
                    is_liked +
                    '</div>' +
                    //'<div class="dishes__content">'+
                    '<div class="on_up '+(is_menu_info == 0 ? '' : 'menu_info_class')+'">' +
                    '<div class="dishes__content__name" data-type="menuName">' + allMenu[i].menu_name + '</div>' +
                    // 备注名称
                    ((allMenu[i].menu_byname == undefined || allMenu[i].menu_byname == '') ? '' : '<div class="dishes__content__engname '+(is_menu_info == 0 ? '' : 'menu_info_width')+'" data-type="menu_byname">' + menu_byname_str + '</div>') +
                    // 菜品说明
                    (is_menu_info == 0 ? '' :
                    '<div class="popu_menu">'+allMenu[i].menu_info+'</div>')+
                    '<div class="on_down clearfix">' +
                    /*(allMenu[i].menu_price == allMenu[i].member_price ?
                    '<div class="dishes__price"><span></span>¥<b data-type="menuPrice">' + parseFloat(allMenu[i].menu_price) + '</b></div>'
                    :
                    '<div class="dishes__group__price">'+
                        '<p><span>原价:¥</span><b data-type="menuPrice">' + parseFloat(allMenu[i].menu_price) + '</b></p>'+
                        '<p><span>会员:¥</span><b data-type="memberPrice">' + parseFloat(allMenu[i].member_price) + '</b></p>'+
                    '</div>')+*/
                    (allMenu[i].menu_price == allMenu[i].member_price ?
                        '<div class="dishes__group__price add_distan_reset">' +
                        (pack_conte == '' ? '' :
                            '<p class="p-ash">' + pack_conte + '</p>') +
                        '<p class="p-red"><span>单价:¥</span><b data-type="memberPrice">' + parseFloat(allMenu[i].member_price) + '</b></p>' +
                        '</div>' :
                        /* 是否授权 0：否，1：是 */
                        (is_authority == 0 ?
                            '<div class="dishes__group__price">' +
                            '<p class="p-red"><span>原价:¥</span><b data-type="menuPrice">' + parseFloat(allMenu[i].menu_price) + '</b>' + pack_conte + '</p>' +
                            '<p class="p-ash"><span>会员:¥</span><b data-type="memberPrice">' + parseFloat(allMenu[i].member_price) + '</b></p>' +
                            '</div>' :
                            '<div class="dishes__group__price">' +
                            '<p class="p-ash"><span>原价:¥</span><b data-type="menuPrice">' + parseFloat(allMenu[i].menu_price) + '</b>' + pack_conte + '</p>' +
                            '<p class="p-red"><span>会员:¥</span><b data-type="memberPrice">' + parseFloat(allMenu[i].member_price) + '</b></p>' +
                            '</div>')) +

                    '<div class="dishes__content__operate clearfix">' +
                    // 如果是估请的不显示加号，显示文字“已售罄”
                    (allMenu[i].is_off == 1 ? '<span class="sold_out">已售罄</span>' :
                        '<span class="dishes__lower hide" data-type="dishes__lower"></span>' +
                        '<span class="dishes__count hide" data-type="dishes__count"></span>' +
                        '<span class="dishes__add" data-type="dishes__add"></span>') +
                    '</div>' +
                    '</div>' +
                    '</div>' +


                    //'</div>'+
                    '<div class="hide" data-type="isInput">' + allMenu[i].is_input + '</div>' +
                    '<div class="hide" data-type="menuFlavor">' + JSON.stringify(allMenu[i].menu_flavor) + '</div>' +
                    '<div class="hide" data-type="menuNote">' + JSON.stringify(allMenu[i].menu_note) + '</div>' +
                    '<div class="hide" data-type="menuInfo">' + allMenu[i].menu_info + '</div>' +
                    '<div class="hide" data-type="menuUnit">' + allMenu[i].menu_unit + '</div>' +
                    '<div class="hide" data-type="isCollect">' + allMenu[i].is_collect + '</div>' +
                    '<div class="hide" data-type="menuTypeId">' + allMenu[i].menu_type_id + '</div>' +
                    '</li>';
            }
            li += '</ul></div>';

            // 自备餐包的显示 is_chopsticks 1是 0否  是否允许自带餐具（存在按人数收取餐具费的前提，仅餐厅的堂食、外卖有效）
            if (((order_property == 1 && is_eat == 1) || ((order_property == 2 || order_property == 3) && is_takeout == 1)) && is_chopsticks == 1) {
                $('#chopsticks').removeClass('hide');
            } else {
                $('#chopsticks').addClass('hide');
            }

            return li;
        }

        // 分类定位
        function cateGoryPosition(is_collDisplay) {
            ndClassIfication.find('li').on("click", function() {
                is_click_scroll = 1;
                //添加当前点击分类背景颜色
                //$(this).addClass("totalback");
                //当前的li添加背景，siblings遍历除当前之外的li，删除背景
                $(this).addClass('dishes-left-check').siblings('li').removeClass('dishes-left-check');

                dishesScroll.refresh();
                totalScroll.refresh();
                // 标注选中分类
                dishesScroll.scrollToElement($($(this).attr('data-href'))[0], 100);
                //alert('标注选中分类');
            });
            // 触发分类高亮
            //ndClassIfication.find('li:eq(0)').trigger('click');
            if (is_collDisplay == 0) {
                ndClassIfication.find('li:eq(0)').trigger('click');
            } else {
                ndClassIfication.find('li:eq(1)').trigger('click');
            }
        }

        // 根据菜品id循环得到当前菜品数据
        // special_type 1 堂食餐包 2 外卖餐包 3 外卖送餐费 4 商城送餐费 5 打包盒
        function dishesLoopJudgeId(menu_id, special_type) {
            for (var i in menuInfo) {
                for (var j in menuInfo[i].menu_list) {
                    if (menu_id == '') { // 特殊商品查询
                        if (menuInfo[i].menu_list[j].special_type == special_type) {
                            return menuInfo[i].menu_list[j];
                        }
                    } else {
                        if (menuInfo[i].menu_list[j].menu_id == menu_id) {
                            return menuInfo[i].menu_list[j];
                        }
                    }
                }
            }
            return false;
        }

        // 点菜计算
        function subscribeDishes() {
            ndMenuContent.find('ul').each(function() {
                var classKey = $(this).attr('id');
                // 当前分类历史点菜总个数, 总价格
                classTotal[classKey] = {};
                classTotal[classKey].count = 0;
                classTotal[classKey].price = 0;
            });
            //setTimeout(function () {
            ndMenuContent.find('ul').each(function() {
                var slef = this;
                // 获取当前分类
                var classKey = $(this).attr('id');
                var ndClassDishesCount = $('[data-href=#' + classKey + ']');

                $(this).find('li').each(function() {
                    var li = this;
                    var dishesAddBtn = $(li).find('span[data-type="dishes__add"]'), // 加菜按钮
                        dishesLowerBtn = $(li).find('span[data-type="dishes__lower"]'), // 减菜按钮
                        ndDishesCount = $(li).find('span[data-type="dishes__count"]'), // 点菜份数
                        ndDishesId = $(li).attr('id'), // 菜品名称

                        ndPackageImg = $(li).find('img[data-dishes-type]'), // 菜品图片
                        ndDishesName = $(li).find('div[data-type="menuName"]'), // 菜品名称
                        ndIsInput = $(li).find('div[data-type="isInput"]').text(), // 是否输入数量
                        ndMenuFlavor = $(li).find('div[data-type="menuFlavor"]').text(), // 口味
                        ndMenuNote = $(li).find('div[data-type="menuNote"]').text(), // 备注
                        ndMenuUnit = $(li).find('div[data-type="menuUnit"]').text(); // 菜品单位

                    ndMenuFlavor = eval('(' + ndMenuFlavor + ')'); // 从json字符串转换成数组

                    var pack_price = $(li).find('div[data-type="pack_price"]').text(); // 打包盒价格

                    // 限售数量
                    var limited = $(li).find('span[data-type="limited"]').text();

                    // is_collection 0 是收藏 1 不是收藏
                    var is_collection = ndDishesId.indexOf('-') == -1 ? 1 : 0;
                    var ndDishesIdPro = ndDishesId;
                    if (is_collection == 0) {
                        ndDishesId = ndDishesId.split('-')[0];
                    }
                    var classKeyPro = classKey;
                    if (classKey == 'myCollect') {
                        //alert('ddd');
                        classKey = $(li).find('div[data-type="menuTypeId"]').text();
                    }

                    //alert(yuclick);
                    // 有点菜数量的菜品设置为已点
                    if (allMenuData[ndDishesId] && allMenuData[ndDishesId].count > 0) {

                        if (classKeyPro != 'myCollect' && allMenuData[ndDishesIdPro] && allMenuData[ndDishesIdPro].count > 0) {

                            // 本分类点菜总分数累加，总价格累加
                            classTotal[classKey].count += parseFloat(allMenuData[ndDishesId].count);
                            classTotal[classKey].price += parseFloat(allMenuData[ndDishesId].price);
                            //alert(classTotal[classKey].count+'---'+classTotal[classKey].price);
                        }
                        //alert(classTotal[classKey].count);
                        ndDishesCount.text(parseFloat(parseFloat(allMenuData[ndDishesId].count).toFixed(1)));
                        dishesLowerBtn.removeClass('hide');
                        ndDishesCount.removeClass('hide');
                        //dishesAddBtn.removeClass('dishes__noadd').addClass('dishes__add');
                        if (ndMenuFlavor == '' && ndIsInput == 0) {
                            addDishes(allMenuData[ndDishesId], 0, ndIsInput, limited);
                        } else {
                            addDishes(allMenuData[ndDishesId], 1, ndIsInput, limited);
                        }
                    }

                    setTimeout(function() {
                        LoadImage(ndPackageImg.attr('data-src'), ndPackageImg);
                    }, 500);
                    // 不是微信打开才能点击
                    //if (!isWeixin) {
                    // 点击菜品图片
                    ndPackageImg.unbind('click').bind('click', function() {
                        // 未登录登陆
                        /*if (!$.cookie("user_mobile")) {
                            Click.isLogin(true, 'dishes&card_id='+card_id+'&shop_id='+shop_id+'&backPage='+page+'&page=');
                        } else {*/
                        classKey = $(li).find('div[data-type="menuTypeId"]').text();
                        //yuclick = $(li).attr('data-type');// 获取到当前点击的菜品的标识
                        //ndDataId = $(slef).attr('data-type');// 图片用的id

                        // 收藏获取
                        yuclick = $('#' + ndDishesId).attr('data-type');
                        ndDataId = $('ul[id="' + classKey + '"]').attr('data-type');

                        // 校验弹层需要的数据
                        checkLayerData('arbitrarily', ndDishesId, classKey, null, 1, limited);
                        //}
                    });

                    // 点击菜品名称，也可以打开弹出层
                    ndDishesName.unbind('click').bind('click', function() {
                        // 未登录登陆
                        /*if (!$.cookie("user_mobile")) {
                            Click.isLogin(true, 'dishes&card_id='+card_id+'&shop_id='+shop_id+'&backPage='+page+'&page=');
                        } else {*/
                        classKey = $(li).find('div[data-type="menuTypeId"]').text();
                        //yuclick = $(li).attr('data-type');// 获取到当前点击的菜品的标识
                        //ndDataId = $(slef).attr('data-type');// 图片用的id

                        // 收藏获取
                        yuclick = $('#' + ndDishesId).attr('data-type');
                        ndDataId = $('ul[id="' + classKey + '"]').attr('data-type');

                        // 校验弹层需要的数据
                        checkLayerData('arbitrarily', ndDishesId, classKey, null, 1, limited);
                        //}
                    });

                    // 添加菜
                    dishesAddBtn.unbind('tap').bind('tap', function() {
                        //alert(limited);
                        classKey = $(li).find('div[data-type="menuTypeId"]').text();

                        //yuclick = $(li).attr('data-type');// 获取到当前点击的菜品的标识
                        //ndDataId = $(slef).attr('data-type');// 图片用的id

                        // 收藏获取
                        yuclick = $('#' + ndDishesId).attr('data-type');
                        ndDataId = $('ul[id="' + classKey + '"]').attr('data-type');

                        // 未登录登陆
                        /*if (!$.cookie("user_mobile")) {
                            Click.isLogin(true, 'dishes&card_id='+card_id+'&shop_id='+shop_id+'&backPage='+page+'&page=');
                        } else {*/
                        //加号距底高度 = 屏幕高度 - （加号高度 + 加号距上高度）
                        var he = $(window).height() - ($(this).height() + 2 + $(this).offset().top);
                        //得到需要向上滚动的高度(如果距底部的高度 < 选好了那个条（也就是选好了遮盖住了加号）)
                        if (he < $('#dishes-footer').height()) {
                            //he加括号，是因为he有可能是负数
                            var scroll = $('#dishes-footer').height() - (he) + 20;
                            //scrollTo 在指定的time时间内让内容滚动条x/y的位置,参数(x,y,time,relative)
                            dishesScroll.scrollTo(0, scroll, 100, true);
                        }
                        //alert("距顶部高度--"+$(this).offset().top+"--自身高度--"+$(this).height());
                        //alert("计算得出的距底高度--"+he);
                        //alert("选好了条的高度--"+$('#dishes-footer').height());

                        //alert(ndMenuFlavor+'--'+ndMenuFlavor[0]);
                        // 是空就没有口味,否则有口味,是空并且不可以输入数量
                        if (ndMenuFlavor == '' && ndIsInput == 0) {
                            checkLayerData('add', ndDishesId, classKey, null, 0, limited);
                        } else {
                            // 校验弹层需要的数据
                            checkLayerData('add', ndDishesId, classKey, null, 1, limited);
                        }
                        //}
                    });
                    //}

                    // 减少菜
                    dishesLowerBtn.unbind('tap').bind('tap', function() {
                        classKey = $(li).find('div[data-type="menuTypeId"]').text();
                        //yuclick = $(li).attr('data-type');// 获取到当前点击的菜品的标识
                        //ndDataId = $(slef).attr('data-type');// 图片用的id

                        // 收藏获取
                        yuclick = $('#' + ndDishesId).attr('data-type');
                        ndDataId = $('ul[id="' + classKey + '"]').attr('data-type');

                        // 是空就没有口味,否则有口味,是空并且不可以输入数量
                        if (ndMenuFlavor == '' && ndIsInput == 0) {
                            checkLayerData('lower', ndDishesId, classKey, null, 0, limited);
                        } else {
                            // 校验弹层需要的数据
                            checkLayerData('lower', ndDishesId, classKey, null, 1, limited);
                        }
                    });
                });
                //alert(classTotal[classKey].count);
                // 计算当前分类点菜总数并重新在页面写入
                calClassDishes(ndClassDishesCount, classTotal[classKey].count);
                dishesTotalCount += classTotal[classKey].count;
                dishesTotalPrice += classTotal[classKey].price;

            });
            //},100);
            // 计算所有菜品点菜总个数，总价钱并写入页面
            calDishes(dishesTotalCount, dishesTotalPrice);

            // 保存菜品
            saveData();

            // 点击清空菜品按钮
            ndClearMenu.unbind('click').bind('click', function() {
                $.dialog = Dialog({
                    type: 2,
                    content: '您确定要清空所有已点菜品吗？',
                    closeFn: function() {
                        clearAllBeenDishes();
                    }
                });
            });
        }

        // 清空所有菜品点菜记录
        function clearAllBeenDishes() {
            if (dishesTotalCount > 0) {

                // 清空已点的菜品
                ndMenuContent.find('ul').each(function() {

                    // 获取当前分类
                    var ul = this;
                    var classKey = $(ul).attr('id');
                    var ndClassDishesCount = $('[data-href=#' + classKey + ']');

                    if (ndClassDishesCount.find('span').text() > 0 || classKey == 'myCollect') {
                        $(ul).find('li').each(function() {
                            var menuCount = $(this).find('span[data-type="dishes__count"]').text();

                            if (menuCount > 0) {
                                //$(this).find('span[data-type="dishes__add"]').removeClass('dishes__add').addClass('dishes__noadd');        // 加菜按钮
                                $(this).find('span[data-type="dishes__lower"]').addClass('hide'), // 减菜按钮
                                    $(this).find('span[data-type="dishes__count"]').text('').addClass('hide'); // 点菜份数

                                // 限售数量初始化
                                $(this).find('span[data-type="limDisplay"]').text($(this).find('span[data-type="limited"]').text());

                                // 不是收藏才运行下面
                                if (classKey != 'myCollect') {
                                    ndDishesId = $(this).attr('id'); // 菜品名称

                                    allMenuData[ndDishesId].count = 0;
                                    allMenuData[ndDishesId].price = 0;
                                    allMenuData[ndDishesId].set_menu_info = {}; // 清空套餐份数数据

                                    // 清除菜品口味数量，价钱以及备注信息
                                    if (allMenuData[ndDishesId].flavorObj && allMenuData[ndDishesId].flavor) {
                                        for (var i in allMenuData[ndDishesId].flavorObj) {
                                            if (allMenuData[ndDishesId].flavorObj[i].flavor_count > 0) {
                                                //alert(i);
                                                allMenuData[ndDishesId].flavorObj[i].flavor_count = 0;
                                                allMenuData[ndDishesId].flavorObj[i].flavor_price = 0;
                                            }
                                        }

                                        for (var i in allMenuData[ndDishesId].noteObj) {
                                            if (allMenuData[ndDishesId].noteObj[i].is_checked > 0) {
                                                allMenuData[ndDishesId].noteObj[i].is_checked = 0; //0：不选中，1：选中
                                            }
                                        }
                                    }
                                }
                            }
                        });
                        if (classKey != 'myCollect') {
                            classTotal[classKey].count = 0;
                            classTotal[classKey].price = 0;
                            calClassDishes(ndClassDishesCount, classTotal[classKey].count);
                        }
                    }
                });

                // 清空已点菜品列表上的菜品
                ndDishesListUl.find('li').remove();
                $('#cart-btn').addClass('dishes-footer-round').removeClass('dishes-footer-round-upcart');
                $('#dishes-total-price').addClass('dishes-footer-big').removeClass('dishes-footer-big-right');
                ndDishesList.hide();
                DishesList.isShow = false;

                dishesTotalCount = 0;
                dishesTotalPrice = 0;
            }
            calDishes(dishesTotalCount, dishesTotalPrice);
            Cache.set(card_id + '-allmenu', allMenuData);

            // 清空存储缓存数据
            switch (Number(order_property)) {
                case 1:
                    allMenuData_1 = {};
                    allMenuData_1 = dishesStackHandle(allMenuData, allMenuData_1);
                    Cache.set('allMenuData_1', allMenuData_1);
                    break;
                case 2:
                    allMenuData_2 = {};
                    allMenuData_2 = dishesStackHandle(allMenuData, allMenuData_2);
                    Cache.set('allMenuData_2', allMenuData_2);
                    break;
                case 3:
                    allMenuData_3 = {};
                    allMenuData_3 = dishesStackHandle(allMenuData, allMenuData_3);
                    Cache.set('allMenuData_3', allMenuData_3);
                    break;
                case 4:
                    allMenuData_4 = {};
                    allMenuData_4 = dishesStackHandle(allMenuData, allMenuData_4);
                    Cache.set('allMenuData_4', allMenuData_4);
                    break;
            }
        }

        // 校验弹层需要的数据，在进行编辑菜品  is_layer 是否弹出层，0：否，1：是
        function checkLayerData(type, dishesId, dishesClassName, dishesFlavor, is_layer, limited) {
            //console.log(allMenuData[dishesId]);
            var dishes = allMenuData[dishesId];

            var dishesClass = classTotal[dishesClassName];

            // 判断菜品是否可点半份
            var amount = 1,
                amountPrice = 0;

            //alert(ndDataId+'---'+yuclick);
            var baseMenu = menuInfo[ndDataId].menu_list[yuclick];
            if (!dishes) {
                var menuFlavor = baseMenu.menu_flavor,
                    mneuNote = baseMenu.menu_note,
                    menuIsDiscount = baseMenu.is_discount == 0 ? 0 : 1,
                    menuIsHalf = baseMenu.is_half == 1 ? 1 : 0,
                    menuIsOff = baseMenu.is_off,
                    menuIsInput = baseMenu.is_input == 0 ? 0 : 1,
                    menuIsCollect = baseMenu.is_collect == 0 ? 0 : 1,
                    menuIsSetMenu = baseMenu.is_set_menu == 0 ? 0 : 1; // 是否套餐 1是 0否
                //alert(baseMenu.is_half);
                dishes = {};
                dishes.id = dishesId;
                dishes.menu_type_id = baseMenu.menu_type_id;
                dishes.type = dishesClassName;
                dishes.info = baseMenu.menu_info;
                dishes.name = baseMenu.menu_name;
                dishes.unit = baseMenu.menu_unit;
                dishes.number = baseMenu.number; // 限量
                dishes.sales = baseMenu.sales; // 销量
                dishes.special_type = baseMenu.special_type; // 特定商品
                dishes.pack_id = baseMenu.pack_id; // 打包盒id
                dishes.count = 0;
                dishes.price = 0;
                dishes.is_off = menuIsOff;
                dishes.flavor = menuFlavor;
                dishes.note = mneuNote; // is_authority是否授权，0：否，1：是，否就用原价
                dishes.dishesPrice = is_authority == 0 ? Number(baseMenu.menu_price) : Number(baseMenu.member_price); // member_price(会员价)menu_price(原价)
                dishes.half = menuIsHalf;
                dishes.menu_price = baseMenu.menu_price; // 计算起送金额用的销售价
                dishes.input = menuIsInput;
                dishes.collect = menuIsCollect;
                dishes.is_set_menu = menuIsSetMenu; // 是否套餐 1是 0否
                dishes.flavorObj = {};
                dishes.noteObj = {};
                dishes.set_menu_info = {}; // 套餐菜品内包含菜品
            }
            // half是否半份，0：否，1：是，input是否可输入数量，0：否，1：是
            if (dishes.half == 1 && dishes.input == 0) {
                amount = 0.5;
                amountPrice = dishes.dishesPrice / 2;
            } else {
                amountPrice = dishes.dishesPrice;
            }

            // 是否套餐1是 0否
            if (dishes.is_set_menu == 1) {
                $('#dishesListDialog').removeClass('hide');
                // 普通菜品div隐藏，套餐菜品div显示 还有加号显示
                $('#normalDishes,#normalButton').addClass('hide');
                $('#setMealDishes,#setMealButton,#plusDishes').removeClass('hide');
                $.dialog = Dialog({
                    type: 3,
                    close: false,
                    dom: '#dishesListDialog',
                    success: function() {
                        // 套餐数量序号初始化0
                        //changeNumSerial = 0;
                        // 弹出层显示数据
                        checkLayerList(dishesId, limited, dishes.is_set_menu);
                    }
                });
            } else {
                // is_layer 是否弹出层，0：否，1：是
                if (is_layer == 1) {
                    $('#dishesListDialog').removeClass('hide');
                    // 套餐菜品div隐藏，普通菜品div显示，还有加号隐藏
                    $('#normalDishes,#normalButton').removeClass('hide');
                    $('#setMealDishes,#setMealButton,#plusDishes').addClass('hide');

                    $.dialog = Dialog({
                        type: 3,
                        close: true,
                        dom: '#dishesListDialog',
                        success: function() {
                            //Bar($('#dishes-detail-content')[0]);
                            // 显示数据
                            checkLayerList(dishesId, limited, dishes.is_set_menu);
                        }
                    });
                } else {
                    checkLayerEdit(type, '', 0, null, '', 0, limited);
                }
            }

            // 显示菜品弹出框数据
            function checkLayerList(ndDishesId, limited, is_set_menu) {
                //alert(ndDishesId);
                // 菜品名称
                var menuName = $('#' + ndDishesId).find('div[data-type="menuName"]').text();
                // 备注名称
                var menu_byname = $('#' + ndDishesId).find('div[data-type="menu_byname"]').html();
                // 菜品单价
                var menuPrice = 0;
                // 原价
                var num1 = $('#' + ndDishesId).find('b[data-type="menuPrice"]').text();
                // 会员价
                var num2 = $('#' + ndDishesId).find('b[data-type="memberPrice"]').text();
                if (num1 == '') {
                    menuPrice = num2;
                } else {
                    if (is_authority == 0) {
                        menuPrice = num1;
                    } else {
                        menuPrice = num2;
                    }
                }
                // 菜品单位
                var menuUnit = $('#' + ndDishesId).find('div[data-type="menuUnit"]').text();
                // 菜品说明
                var menu_info = $('#' + ndDishesId).find('div[data-type="menuInfo"]').text();

                // 是否收藏 is_collect 1已收藏 0未收藏
                var isCollect = $('#' + ndDishesId).find('div[data-type="isCollect"]').text();
                // 未登录不显示收藏
                if (!$.cookie("user_mobile")) {
                    // 隐藏取消收藏 和 加入收藏
                    $('#joinCollect').addClass('hide');
                    $('#cancelCollect').addClass('hide');
                } else {
                    if (isCollect == 1) {
                        // 隐藏加入收藏 显示取消收藏
                        $('#joinCollect').addClass('hide');
                        $('#cancelCollect').removeClass('hide');
                    } else {
                        // 隐藏取消收藏 显示加入收藏
                        $('#joinCollect').removeClass('hide');
                        $('#cancelCollect').addClass('hide');
                    }
                }
                // 菜品分类id
                var menuTypeId = $('#' + ndDishesId).find('div[data-type="menuTypeId"]').text();

                // 菜品图片
                $('#dishes-img').attr('src', '../../img/base/no-pic.png');
                $('#dishes-img').attr('data-src', '../../img/business/' + card_id + '/menu/' + ndDishesId + '_max.jpg?' + Math.random());

                setTimeout(function() {
                    LoadImage($('#dishes-img').attr('data-src'), $('#dishes-img'));
                }, 5);

                // 菜品名称
                $('#dishes-name').text(menuName);
                // 菜品标签名称
                if (menu_byname == '') {
                    if (menu_info == '') {
                        $('.s_cai_engname').addClass('hide');
                    } else {
                        $('.s_cai_engname').removeClass('hide');
                    }
                } else {
                    $('.s_cai_engname').removeClass('hide');
                    $('.s_cai_engname').html(menu_byname);
                }
                // 菜品单价/单位
                if (menuUnit == undefined || menuUnit == '') {
                    $('#dishes-price').text('￥' + menuPrice);
                } else {
                    $('#dishes-price').text('￥' + menuPrice + '/' + menuUnit);
                }

                // 菜品说明
                if (menu_info == '') {
                    $('#dishes-info').addClass('hide');
                } else {
                    $('#dishes-info').removeClass('hide');
                    $('#dishes-info').text(menu_info);
                }

                // 滑动到弹出层顶部
                $("#dishesScrollTop").scrollTop(0);


                // 如果是估请的，不显示弹出层里面的每份和加减按钮
                if (dishes.is_off == 1) {
                    $('#sold_out_ex').removeClass('hide');
                    $('#plusDishes').addClass('hide');
                } else {
                    $('#sold_out_ex').addClass('hide');
                }

                // 是否套餐 1是 0否
                if (is_set_menu == 1) {
                    var borrowReplace = {};
                    // 赋值新对象 处理 套餐弹出层
                    borrowReplace = dishesStackHandle(dishes, borrowReplace);
                    var set_num = 0;

                    storageDataPck = dishesStackHandle(borrowReplace, storageDataPck);
                    storageDataPck.set_menu_info = {};
                    // 设置初始化数组中套餐数量标号
                    for (var i in borrowReplace.set_menu_info) {
                        storageDataPck.set_menu_info[set_num] = {};
                        storageDataPck.set_menu_info[set_num] = dishesStackHandle(borrowReplace.set_menu_info[i], storageDataPck.set_menu_info[set_num]);
                        set_num++;
                    }
                    // 套餐数量序号初始化
                    if (set_num == 0) {
                        changeNumSerial = 0;
                    } else {
                        changeNumSerial = set_num - 1;
                    }
                    setMealLayerHandle(menuTypeId, ndDishesId, isCollect, '', set_num);
                } else {
                    normalLayerHandle(ndDishesId, limited, menuName, menuTypeId, isCollect);
                }
            }

            // 套餐菜品弹出层处理
            function setMealLayerHandle(menuTypeId, ndDishesId, isCollect, is_ident, num_ident) {
                // 点击套餐加号的时候，套餐数量序号加1 wfk/

                //alert(JSON.stringify(storageDataPck.set_menu_info[changeNumSerial]));
                // 如果这个对象是空的，就显示下面最初数据，不是空的就显示这个对象的数据
                if ((is_ident == '1' || num_ident == 0) && JSON.stringify(storageDataPck.set_menu_info[changeNumSerial]) == undefined) {
                    // 初始化数据
                    storageDataPck.set_menu_info[changeNumSerial] = dishesStackHandle(baseMenu.set_menu, storageDataPck.set_menu_info[changeNumSerial]);
                }
                // 判断如果每个菜的口味没有选中的，就默认选中第一个
                for (var i in storageDataPck.set_menu_info) {
                    for (var j in storageDataPck.set_menu_info[i]) {
                        for (var k in storageDataPck.set_menu_info[i][j]) {
                            if (storageDataPck.set_menu_info[i][j][k].menu_flavor != '') {
                                var num_text = 0;

                                var is_flavor_ch = 0; // 是否有选中的口味，1是 0否
                                for (var g in storageDataPck.set_menu_info[i][j][k].menu_flavor) {
                                    if (storageDataPck.set_menu_info[i][j][k].menu_flavor[g].is_choose == 1) {
                                        is_flavor_ch = 1;
                                    }
                                }

                                if (is_flavor_ch == 0) {
                                    for (var p in storageDataPck.set_menu_info[i][j][k].menu_flavor) {
                                        if (num_text == 0) {
                                            storageDataPck.set_menu_info[i][j][k].menu_flavor[p].is_choose = '1';
                                        }
                                        num_text++;
                                    }
                                }
                            }
                        }
                    }
                }

                // 显示套餐内菜品
                var content = '';
                var setMenus = {};
                var is_yes_no = 0; // 是否可以换菜品，0否，1是
                var menu_id = ''; // 获取到的数据菜品id
                var storage_num = 0; // 处理显示的序号，点击减号之后序号就会乱，所以用这个
                var bgnone = '' //li   class

                for (var i in storageDataPck.set_menu_info) {
                    var dispNum = parseFloat(storage_num) + 1;
                    if (dishes.is_off == 1) {
                        $('#mengFen').text('');
                    } else {
                        $('#mengFen').text(dispNum + "份");
                    }
                    content += '<ul>' +
                        '<h5>' +
                        '<span data-type="serial_number">' + dispNum + '</span>' +
                        (dishes.is_off == 1 ? '' :
                            '<span class="deletetaocan" data-num="' + i + '" data-type="del"></span>') +
                        '</h5>';
                    for (var k in storageDataPck.set_menu_info[i]) {
                        setMenus = {};
                        menu_id = '';
                        is_yes_no = 0;
                        var num9 = 0;
                        for (var y in storageDataPck.set_menu_info[i][k]) {
                            if (storageDataPck.set_menu_info[i][k][y].is_choose == 1) {
                                setMenus = storageDataPck.set_menu_info[i][k][y];
                                menu_id = storageDataPck.set_menu_info[i][k][y].menu_id;
                            }
                            num9++;
                        }
                        if (num9 > 1) {
                            is_yes_no = 1;
                        } else {
                            is_yes_no = 0;
                        }

                        var huan = '',
                            flavor = '',
                            note = '';
                        if (is_yes_no != 0) {
                            huan = '换菜';
                        }
                        if (setMenus.menu_flavor != '') {
                            flavor = '口味';
                        }
                        if (setMenus.menu_note != '') {
                            note = '备注';
                        }
                        if ((huan != '' && flavor != '') || (huan != '' && note != '')) {
                            huan += '、';
                        }
                        if (flavor != '' && note != '') {
                            flavor += '、';
                        }
                        content += '<li ' + (huan == '' && flavor == '' && note == '' ? "class='bgnone'" : '') + ' data-id="' + setMenus.menu_id + '" data-grade="' + i + '" data-number="' + k + '" data-is="' + is_yes_no + '">' +
                            '<i>' + setMenus.menu_name + '</i>' +
                            (huan == '' && flavor == '' && note == '' ? '' :
                                '<span>(' +
                                huan + flavor + note +
                                ')</span>') +
                            '</li>';
                    }
                    content += '</ul>';
                    storage_num++;
                }
                $('#setMealDishes div').html(content);

                // 套餐菜品弹出层绑定点击事件处理
                setMealBindClickHandle(menuTypeId, ndDishesId, isCollect);
            }

            // 套餐菜品弹出层绑定点击事件处理
            function setMealBindClickHandle(menuTypeId, ndDishesId, isCollect) {
                // 点击套餐里面每个菜进行，换菜、口味、备注
                $('#setMealDishes div').find('li').on("click", function() {
                    var set_menu_id = $(this).attr('data-id');
                    var is_yes_no = $(this).attr('data-is');
                    var data_grade = $(this).attr('data-grade');
                    var data_number = $(this).attr('data-number');

                    var set_menu_data = dishesLoopJudgeId(set_menu_id);
                    // 如果，可以换菜，或者，有口味，或者，有备注，点击才弹层
                    if (is_yes_no == 1 || set_menu_data.menu_flavor != '' || set_menu_data.menu_note != '') {
                        //$('.app_layer').addClass('hide').unbind();
                        // 显示换菜，口味，备注弹出层
                        $.dialog = Dialog({
                            type: 3,
                            close: false,
                            dom: '#setMealListDialog',
                            success: function() {
                                // 滑动到弹出层顶部
                                $("#setMealScrollTop").scrollTop(0);
                                // 换菜、口味、备注详情弹出层内容显示
                                changeFdFlaNoteDisplay(is_yes_no, data_number, set_menu_data, menuTypeId, ndDishesId, isCollect, data_grade);
                            }
                        });
                    }
                });

                // 点击套餐每份后面的减号去掉菜品
                $('#setMealDishes div').find('span[data-type="del"]').on("click", function() {
                    var data_numone = $(this).attr('data-num');
                    // 先删除页面
                    $(this).parent().parent().remove();
                    // 后删除数组
                    for (var i in storageDataPck.set_menu_info) {
                        if (data_numone == i) {
                            delete storageDataPck.set_menu_info[i];
                        }
                    }
                    var change_num = 1;
                    // 循环修改套餐份数序号
                    $('#setMealDishes div').find('ul').each(function() {
                        $(this).find('span[data-type="serial_number"]').text(change_num);
                        if (dishes.is_off == 1) {
                            $('#mengFen').text('');
                        } else {
                            $('#mengFen').text(change_num + "份");
                        }
                        change_num++;
                    });
                });

                // 点击加入收藏
                $('#joinCollect').unbind('click').bind('click', function() {
                    isCollect = $('#' + ndDishesId).find('div[data-type="isCollect"]').text();
                    //alert($('#'+ndDishesId).html());
                    checkCollect(menuTypeId, ndDishesId, isCollect);
                });

                // 点击取消收藏
                $('#cancelCollect').unbind('click').bind('click', function() {
                    isCollect = $('#' + ndDishesId).find('div[data-type="isCollect"]').text();
                    checkCollect(menuTypeId, ndDishesId, isCollect);
                });

                // 点击套餐加号加菜
                $('#plusDishes').unbind('click').bind('click', function() {
                    changeNumSerial++;
                    // 套餐菜品弹出层处理
                    setMealLayerHandle(menuTypeId, ndDishesId, isCollect, '1');
                    // 滑到弹出层底部
                    $("#dishesScrollTop").scrollTop($("#dishesScrollTop").height() + 500);
                });

                // 点击确定按钮
                $('#setMealConfirm').unbind('click').bind('click', function() {
                    // 如果是估请的菜，点击确定相当于点击取消
                    // 清空菜品标签
                    $('.s_cai_engname').html("");
                    if (dishes.is_off == 1) {
                        // 清空 套餐存储数据
                        storageDataPck = {};
                        storageClassNumPck = {};

                        $.dialog.config.dom = '#dishesListDialog';
                        $.dialog.close($.dialog.id);
                    } else {
                        // 循环storageDataPck 删除点击减号删除的// 设置初始化数组中套餐数量标号
                        var num = 0;
                        var borrowReplaceOne = {};
                        borrowReplaceOne = dishesStackHandle(storageDataPck.set_menu_info, borrowReplaceOne);
                        storageDataPck.set_menu_info = {};
                        // 设置初始化数组中套餐数量标号
                        for (var i in borrowReplaceOne) {
                            storageDataPck.set_menu_info[num] = {};
                            storageDataPck.set_menu_info[num] = dishesStackHandle(borrowReplaceOne[i], storageDataPck.set_menu_info[num]);
                            num++;
                        }

                        // 循环storageDataPck的长度
                        /*var num = 0;
                        for (var i in storageDataPck.set_menu_info) {
                            num++;
                        }*/
                        // 判断限售数量
                        if (num > limited && limited > 0) {
                            Message.show('#msg', '此菜品为限量销售菜品，请联系离您最近的服务员', 2000);
                            return;
                        }
                        // 赋值存储数据
                        allMenuData[ndDishesId] = dishesStackHandle(storageDataPck, allMenuData[ndDishesId]);

                        /*// 分类总数量，减去之前的套餐数量，加上storageDataPck的长度就是新的分类总数量
                            dishesClass.count = dishesClass.count - allMenuData[ndDishesId].count + num;
                            dishesClass.price = dishesClass.price - allMenuData[ndDishesId].price + num * allMenuData[ndDishesId].dishesPrice;
                            // 点菜总数量和金额
                            dishesTotalCount = dishesTotalCount - allMenuData[ndDishesId].count + num;
                            dishesTotalPrice = dishesTotalPrice - allMenuData[ndDishesId].price + num * allMenuData[ndDishesId].dishesPrice;
                            // 套餐数量重新赋值 = storageDataPck的长度
                            dishes.count = num;
                            dishes.price =  num * dishes.dishesPrice;
                            allMenuData[ndDishesId].count = num;
                            allMenuData[ndDishesId].price = num * allMenuData[ndDishesId].dishesPrice;*/

                        // 分类总数量，减去之前的套餐数量，加上storageDataPck的长度就是新的分类总数量
                        dishesClass.count = Util.accAdd(Util.accSubtr(dishesClass.count, allMenuData[ndDishesId].count), num);
                        dishesClass.price = Util.accAdd(Util.accSubtr(dishesClass.price, allMenuData[ndDishesId].price), Util.accMul(num, allMenuData[ndDishesId].dishesPrice));
                        // 点菜总数量和金额
                        dishesTotalCount = Util.accAdd(Util.accSubtr(dishesTotalCount, allMenuData[ndDishesId].count), num);
                        dishesTotalPrice = Util.accAdd(Util.accSubtr(dishesTotalPrice, allMenuData[ndDishesId].price), Util.accMul(num, allMenuData[ndDishesId].dishesPrice));
                        // 套餐数量重新赋值 = storageDataPck的长度
                        dishes.count = num;
                        dishes.price = Util.accMul(num, dishes.dishesPrice);
                        allMenuData[ndDishesId].count = num;
                        allMenuData[ndDishesId].price = Util.accMul(num, allMenuData[ndDishesId].dishesPrice);

                        //当前菜品所在分类总数量，总价格（收藏问题）
                        classTotal[dishesClassName] = dishesClass;

                        Cache.set(card_id + '-shop', card_id + '-' + shop_id); // 存储缓存
                        // 点菜写入缓存
                        Cache.set(card_id + '-allmenu', allMenuData);

                        dishesElement(dishes, dishesClassName, type, '', '', 0, 0, limited);

                        $.dialog.config.dom = '#dishesListDialog';
                        $.dialog.close($.dialog.id);
                        //$('#dishesListDialog').removeAttr('data-id').hide();
                        //$('div[class="app_layer"]').addClass('hide')//.unbind();
                        //$('#app_layer').addClass('hide').unbind();
                    }
                });

                // 点击取消按钮
                $('#setMealExit').unbind('click').bind('click', function() {
                    // 清空菜品标签
                    $('.s_cai_engname').html("");
                    // 清空 套餐存储数据
                    storageDataPck = {};
                    storageClassNumPck = {};
                    // 套餐数量序号初始化0
                    //changeNumSerial = 0;

                    $.dialog.config.dom = '#dishesListDialog';
                    $.dialog.close($.dialog.id);
                    //$('#dishesListDialog').removeAttr('data-id').hide();
                    //$('div[class="app_layer"]').addClass('hide')//.unbind();
                    //$('#app_layer').addClass('hide').unbind();
                });
            }

            // 换菜、口味、备注详情弹出层内容显示
            function changeFdFlaNoteDisplay(is_yes_no, data_number, set_menu_data, menuTypeId, ndDishesId, isCollect, data_grade) {
                // 赋值新对象，处理，换菜、口味、备注
                var changeFlavorNote = dishesStackHandle(storageDataPck.set_menu_info[data_grade][data_number], changeFlavorNote);

                // 显示换菜
                if (is_yes_no == 1) {
                    $('#changeFoodTitle,#changeFoodData').removeClass('hide');
                    var changeFoodData = '';
                    var changeFoodDataChecked = '';
                    for (var i in changeFlavorNote) {
                        if (changeFlavorNote[i].is_choose == 1) {
                            changeFoodDataChecked = 'checked';
                        } else {
                            changeFoodDataChecked = '';
                        }
                        //var changeFoodDataList = dishesLoopJudgeId(changeFlavorNote[i].menu_id);
                        changeFoodData += ' <p data-id="' + changeFlavorNote[i].menu_id + '" data-number="' + i + '">' +
                            '<span>' + changeFlavorNote[i].menu_name + '</span>' +
                            '<input name="only" ' + changeFoodDataChecked + ' type="radio">' +
                            '</p>';
                    }
                    $('#changeFoodData').html(changeFoodData);
                } else {
                    $('#changeFoodTitle,#changeFoodData').addClass('hide');
                }

                var serialNumber = 0; // 序号
                // 循环得到，点击的那个菜品id的序号
                for (var i in changeFlavorNote) {
                    if (changeFlavorNote[i].is_choose == 1) {
                        serialNumber = i;
                        break;
                    }
                }

                // 显示口味备注
                flavorNoteDisplay(changeFlavorNote, serialNumber);

                // 绑定点击换菜中内容，切换下面口味备注
                $('#changeFoodData').find('p').on('click', function() {
                    var dataId = $(this).attr('data-id');
                    var dataNumber = $(this).attr('data-number');
                    serialNumber = dataNumber;
                    // 点击整行选中单选按钮
                    $(this).find('input').prop('checked', true);
                    var num_one = 0;
                    // 初始化口味备注
                    for (var i in changeFlavorNote[dataNumber].menu_flavor) {
                        if (num_one == 0) {
                            changeFlavorNote[dataNumber].menu_flavor[i].is_choose = '1';
                        } else {
                            changeFlavorNote[dataNumber].menu_flavor[i].is_choose = '0';
                        }
                        num_one++;
                    }
                    for (var i in changeFlavorNote[dataNumber].menu_note) {
                        changeFlavorNote[dataNumber].menu_note[i].is_choose = '0';
                    }

                    // 显示口味备注
                    flavorNoteDisplay(changeFlavorNote, dataNumber);
                });

                // 点击确定按钮
                $('#changeConfirm').unbind('click').bind('click', function() {
                    // 循环换菜列表，得到选中的那个，然后循环storageDataPck数组，把选中的is_choose变成1，其他变成0
                    if (is_yes_no == 1) {
                        var changeDataId = '';
                        $('#changeFoodData').find('p').each(function() {
                            var data_id = $(this).attr('data-id');
                            var chang_input = $(this).find('input');
                            if (chang_input.is(':checked')) {
                                changeDataId = data_id;
                                return false;
                            }
                        });
                        for (var i in changeFlavorNote) {
                            if (changeFlavorNote[i].menu_id == changeDataId) {
                                changeFlavorNote[i].is_choose = '1';
                            } else {
                                changeFlavorNote[i].is_choose = '0';
                            }
                        }
                    }
                    // 得到变化的口味
                    if (changeFlavorNote[serialNumber].menu_flavor != '') {
                        $('#changeFlavorData').find('p').each(function() {
                            var change_flavor = $(this).find('span').text();
                            var chang_flavor_input = $(this).find('input');
                            if (chang_flavor_input.is(':checked')) {
                                for (var i in changeFlavorNote[serialNumber].menu_flavor) {
                                    if (changeFlavorNote[serialNumber].menu_flavor[i].flavor_name == change_flavor) {
                                        changeFlavorNote[serialNumber].menu_flavor[i].is_choose = '1';
                                    } else {
                                        changeFlavorNote[serialNumber].menu_flavor[i].is_choose = '0';
                                    }
                                }
                                return false;
                            }
                        });
                    }
                    // 得到变化的备注
                    if (changeFlavorNote[serialNumber].menu_note != '') {
                        $('#changeNoteData ul').find('li').each(function() {
                            var change_note = $(this).find('b').text();
                            var chang_note_input = $(this).find('input');
                            if (chang_note_input.is(':checked')) {
                                for (var i in changeFlavorNote[serialNumber].menu_note) {
                                    if (changeFlavorNote[serialNumber].menu_note[i].note_name == change_note) {
                                        changeFlavorNote[serialNumber].menu_note[i].is_choose = '1';
                                    }
                                }
                            } else {
                                for (var i in changeFlavorNote[serialNumber].menu_note) {
                                    if (changeFlavorNote[serialNumber].menu_note[i].note_name == change_note) {
                                        changeFlavorNote[serialNumber].menu_note[i].is_choose = '0';
                                    }
                                }
                            }
                        });
                    }
                    // 赋值给存储的,这里要是不行的话，就用那个堆栈方法处理
                    storageDataPck.set_menu_info[data_grade][data_number] = dishesStackHandle(changeFlavorNote, storageDataPck.set_menu_info[data_grade][data_number]);
                    // 套餐菜品弹出层处理
                    setMealLayerHandle(menuTypeId, ndDishesId, isCollect);

                    $('#setMealListDialog').removeAttr('data-id').hide();
                    //$('.app_layer').addClass('hide').unbind();
                    //$('#app_layer').addClass('hide').unbind();
                    $('div[class="app_layer"]').removeClass('hide');
                    //$('#app_layer').removeClass('hide');
                });

                // 点击取消按钮
                $('#changeExit').unbind('click').bind('click', function() {
                    changeFlavorNote = {};
                    $('#setMealListDialog').removeAttr('data-id').hide();
                    //$('.app_layer').addClass('hide').unbind();
                    //$('#app_layer').addClass('hide').unbind();
                    $('div[class="app_layer"]').removeClass('hide');
                    //$('#app_layer').removeClass('hide');
                });
            }

            // 换菜显示口味备注
            function flavorNoteDisplay(set_menu_data, serial_num) {
                var isFlavor = 0; // 是否有口味 0：否，1：是
                var isNote = 0; // 是否有备注 0：否，1：是

                // 显示口味
                if (set_menu_data[serial_num].menu_flavor != '') {
                    isFlavor = 1;
                    $('#changeFlavorTitle,#changeFlavorData').removeClass('hide');
                    var changeFlavorData = '';
                    for (var i in set_menu_data[serial_num].menu_flavor) {
                        var flavor_checked = set_menu_data[serial_num].menu_flavor[i].is_choose == 0 ? '' : 'checked';
                        changeFlavorData += '<p>' +
                            '<span>' + set_menu_data[serial_num].menu_flavor[i].flavor_name + '</span>' +
                            '<input name="onlyW" ' + flavor_checked + ' type="radio">' +
                            '</p>';
                    }
                    $('#changeFlavorData').html(changeFlavorData);
                } else {
                    isFlavor = 0;
                    $('#changeFlavorTitle,#changeFlavorData').addClass('hide');
                }
                // 显示备注
                if (set_menu_data[serial_num].menu_note != '') {
                    isNote = 1;
                    $('#changeNoteTitle,#changeNoteData').removeClass('hide');
                    var changeNoteData = '';
                    for (var i in set_menu_data[serial_num].menu_note) {
                        var note_checked = set_menu_data[serial_num].menu_note[i].is_choose == 0 ? '' : 'checked';
                        changeNoteData += ' <li class="popustasteli" id="">' +
                            '<div class="popustastelidiv">' +
                            '<input name="note" ' + note_checked + ' type="checkbox">' +
                            '<b>' + set_menu_data[serial_num].menu_note[i].note_name + '</b>' +
                            '</div>' +
                            '</li>';
                    }
                    $('#changeNoteData ul').html(changeNoteData);
                } else {
                    isNote = 0;
                    $('#changeNoteTitle,#changeNoteData').addClass('hide');
                }

                // 绑定口味点击事件，点击整行就选中单选按钮
                $('#changeFlavorData').find('p').on('click', function() {
                    $(this).find('input').prop('checked', true);
                });
            }

            // 普通菜品弹出层处理
            function normalLayerHandle(ndDishesId, limited, menuName, menuTypeId, isCollect) {
                // 是否可以输入数量(0：否，1：是)
                var isInput = $('#' + ndDishesId).find('div[data-type="isInput"]').text();
                // 菜品口味
                var menuFlavor = $('#' + ndDishesId).find('div[data-type="menuFlavor"]').text();
                menuFlavor = eval('(' + menuFlavor + ')'); // 从json字符串转换成数组
                // 菜品备注
                var menuNote = $('#' + ndDishesId).find('div[data-type="menuNote"]').text();
                menuNote = eval('(' + menuNote + ')');

                var isFlavor = 0; // 是否有口味 0：否，1：是
                var isNote = 0; // 是否有备注 0：否，1：是

                // 菜品口味
                if (menuFlavor == '') {
                    isFlavor = 0;
                    // 标题
                    $('#flavorTitle').text('菜品数量');
                    var contentNo = '<li id="' + ndDishesId + '_flavor_0">' +
                        '<div class="popustastediv">' + menuName + '</div>' +
                        (dishes.is_off == 1 ? '' :
                            (isInput == 0 ?
                                '<div class="popus__content__operate clearfix">' +
                                '<span class="popus__lower" data-type="popus__lower"></span>' +
                                '<span class="popus__count" data-type="popus__count">' + dishes.count + '</span>' +
                                '<span class="popus__add" data-type="popus__add"></span>' +
                                '</div>' :
                                '<div class="popustastediv">' +
                                '<div class="slinput">' +
                                '<input type="number" data-type="popus__count" placeholder="请输入数量" value="' + dishes.count + '">' +
                                '</div>' +
                                '<div class="qingchu" data-type="empty">清空</div>' +
                                '</div>')) +
                        '</li>';
                    $('#flavorData').html(contentNo);
                } else {
                    isFlavor = 1;
                    // 标题
                    $('#flavorTitle').text('口味');
                    var content = '';
                    for (var i in menuFlavor) {
                        // 如果缓存中没有循环中的某个口味，就删除缓存中的那个口味
                        if (dishes.flavor[i] == undefined) {
                            delete dishes.flavor[i];
                        }
                        content += '<li id="' + ndDishesId + '_flavor_' + i + '">' +
                            '<div class="popustastediv" data-type="flavor">' + menuFlavor[i] + '</div>' +
                            (dishes.is_off == 1 ? '' :
                                (isInput == 0 ?
                                    '<div class="popus__content__operate clearfix">' +
                                    '<span class="popus__lower" data-type="popus__lower"></span>' +
                                    '<span class="popus__count" data-type="popus__count">' + (dishes.flavorObj[menuFlavor[i]] == undefined ? '0' : dishes.flavorObj[menuFlavor[i]].flavor_count) + '</span>' +
                                    '<span class="popus__add" data-type="popus__add"></span>' +
                                    '</div>' :
                                    '<div class="popustastediv">' +
                                    '<div class="slinput">' +
                                    '<input type="number" data-type="popus__count" placeholder="请输入数量" value="' + (dishes.flavorObj[menuFlavor[i]] == undefined ? '0' : dishes.flavorObj[menuFlavor[i]].flavor_count) + '">' +
                                    '</div>' +
                                    '<div class="qingchu" data-type="empty">清空</div>' +
                                    '</div>')) +
                            '</li>';
                    }
                    $('#flavorData').html(content);
                }
                // 菜品备注
                if (menuNote == '') {
                    isNote = 0;
                    // 标题隐藏
                    $('#noteTitle').addClass('hide');
                    // 内容隐藏
                    $('#noteDisplay').addClass('hide');
                } else {
                    isNote = 1;
                    // 标题显示
                    $('#noteTitle').removeClass('hide');
                    // 内容显示
                    $('#noteDisplay').removeClass('hide');
                    var noteContent = '';
                    var isChecked = ''; //''：不选中，'checked'：选中
                    for (var k in menuNote) {
                        //alert(dishes.noteObj[k]);
                        if (dishes.noteObj[menuNote[k]] == undefined) {
                            isChecked = '';
                        } else if (dishes.noteObj[menuNote[k]].is_checked == 1) {
                            //alert('dd');
                            isChecked = 'checked';
                        } else {
                            isChecked = '';
                        }

                        noteContent += '<li class="popustasteli" id="' + ndDishesId + '_note_' + k + '">' +
                            '<div class="popustastelidiv">' +
                            (dishes.is_off == 1 ? '' :
                                '<input name="note" ' + isChecked + ' type="checkbox">') +
                            '<b>' + menuNote[k] + '</b>' +
                            '</div>' +
                            '</li>';
                    }
                    $('#noteData').html(noteContent);
                }

                // 弹出层绑定点击事件
                checkLayerBind(isInput, isFlavor, isNote, menuTypeId, ndDishesId, isCollect, limited);
            }

            // 弹出层绑定点击事件
            function checkLayerBind(isInput, isFlavor, isNote, menuTypeId, ndDishesId, isCollect, limited) {
                // 加减点击事件
                $('#flavorData').find('li').each(function() {
                    var self = this;
                    var popusLowerBtn = $(self).find('span[data-type="popus__lower"]'), // 减菜按钮
                        popusCountBtn = $(self).find('span[data-type="popus__count"]'), // 口味份数
                        popusAddBtn = $(self).find('span[data-type="popus__add"]'), // 加菜按钮
                        popusCountInput = $(self).find('input[data-type="popus__count"]'), // 输入的份数
                        emptyBtn = $(self).find('div[data-type="empty"]'), // 清空按钮
                        flavorName = $(self).find('div[data-type="flavor"]').text(), // 口味名称
                        flavorId = $(self).attr('id'); // 口味id

                    // 点击加菜
                    popusAddBtn.unbind('tap').bind('tap', function() {
                        // isFlavor 1有口味，0：没口味// 口味放到缓存中
                        checkLayerEdit('add', flavorName, isFlavor, null, flavorId, isInput, limited);
                    });

                    // 点击减菜
                    popusLowerBtn.unbind('tap').bind('tap', function() {
                        // isFlavor 1有口味，0：没口味// 口味放到缓存中
                        checkLayerEdit('lower', flavorName, isFlavor, null, flavorId, isInput, limited);
                    });

                    // 输入份数
                    popusCountInput.unbind('input').bind('input', function() {
                        var count = popusCountInput.val();

                        var numPro = /^\d*\.{0,1}\d{0,1}$/;
                        if (numPro.test(count)) {
                            var resultle = count.substr(0, 1);

                            if (count.indexOf('.') != -1) {
                                if (count.split('.')[1] == '') {
                                    count = 'true';
                                    //alert(count);
                                }
                            }
                            if (count.length <= 2) {
                                if (count.length == 2 && resultle == 0 && count.indexOf('.') == -1) {
                                    count = count.substr(1, 2);
                                } else if (count.indexOf('.') != -1 && resultle == '.') {
                                    count = 0;
                                }

                                if (count == '') {
                                    count = 0;
                                }
                            }
                        } else if (count == '') {
                            count = 0;
                        } else {
                            Message.show('#msg', '只能输入一位小数和数字', 3000);
                            count = 0;
                        }
                        //alert(count);
                        if (count != 'true') {

                            count = parseFloat(count);
                            //alert('ddd--'+count);
                            // isFlavor 1有口味，0：没口味// 口味放到缓存中
                            checkLayerEdit('chans', flavorName, isFlavor, count, flavorId, isInput, limited);
                        }
                    });

                    // 点击清空
                    emptyBtn.unbind('tap').bind('tap', function() {
                        //popusCountInput.val('0');
                        checkLayerEdit('chans', flavorName, isFlavor, 0, flavorId, isInput, limited);
                    });

                });

                // 点击加入收藏
                $('#joinCollect').unbind('click').bind('click', function() {
                    isCollect = $('#' + ndDishesId).find('div[data-type="isCollect"]').text();
                    //alert($('#'+ndDishesId).html());
                    checkCollect(menuTypeId, ndDishesId, isCollect);
                });

                // 点击取消收藏
                $('#cancelCollect').unbind('click').bind('click', function() {
                    isCollect = $('#' + ndDishesId).find('div[data-type="isCollect"]').text();
                    checkCollect(menuTypeId, ndDishesId, isCollect);
                });

                // 备注选中取消事件
                $('#noteData').find('li').each(function() {
                    var self = this;
                    var note = $(self).find('input[type="checkbox"]'),
                        noteName = $(self).find('b').text(),
                        noteId = $(self).attr('id'); // 口味id

                    note.unbind('change').bind('change', function() {
                        if ($(this).is(':checked') || $(this).attr('checked') == true) {
                            // 菜品备注的选中
                            checkNoneNote(1, noteName, isNote, noteId);
                        } else {
                            // 菜品备注的取消
                            checkNoneNote(0, noteName, isNote, noteId);
                        }
                    });
                });

                // 点击确定按钮
                $('#dishesDialogBtn').unbind('click').bind('click', function() {
                     // 清空菜品标签
                    $('.s_cai_engname').html("");
                    $.dialog.close($.dialog.id);
                });

                // 点击取消按钮
                $('#dishesDialogClose').unbind('click').bind('click', function() {
                     // 清空菜品标签
                    $('.s_cai_engname').html("");
                    $.dialog.close($.dialog.id);
                    // 实现步骤，在创建dishes的时候，在创建一个基础数据，然后用基础数据改变dishes里面的数据
                    checkCacel();
                });
            }

            // 收藏的请求接口事件
            function checkCollect(menuTypeId, ndDishesId, isCollect) {
                var id = ndDishesId;
                if (ndDishesId.indexOf('-') != -1) {
                    ndDishesId = ndDishesId.split('-')[0];
                }
                Data.setAjax('companyMenuCollect', {
                    'card_id': card_id,
                    'menu_id': ndDishesId,
                    'menu_type_id': menuTypeId,
                    'is_del': isCollect, // is_del 1取消收藏 0 加入收藏
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                    if (respnoseText.code == 20) {
                        Message.show('#msg', respnoseText.message, 2000, function() {
                            if (isCollect == 1) {
                                // 从我的收藏里面删除一列 并修改按钮和文字为 加入收藏
                                // 隐藏取消收藏 显示加入收藏
                                $('#joinCollect').removeClass('hide');
                                $('#cancelCollect').addClass('hide');
                                // 从我的收藏删除这个菜
                                $('#' + ndDishesId + '-myCollect').remove();

                                $('#' + ndDishesId).find('div[data-type="isCollect"]').text(0);
                                // 关闭层
                                $.dialog.close($.dialog.id);

                            } else {
                                // 从我的收藏里面加入一列 并修改按钮和文字为 取消收藏
                                // 隐藏加入收藏 显示取消收藏
                                $('#joinCollect').addClass('hide');
                                $('#cancelCollect').removeClass('hide');
                                $('#' + ndDishesId).find('div[data-type="isCollect"]').text(1);
                                // copy复制这个菜到我的收藏
                                var num = $('ul[id="myCollect"] li').length + 1;
                                //$('ul[id="myCollect"]').prepend($('#'+ndDishesId).clone());
                                $('ul[id="myCollect"]').prepend('<li class="clearfix" id="' + ndDishesId + '-myCollect" data-type="' + num + '">' + $('#' + ndDishesId).html() + '</li>');
                                // 点餐总数量、总价格等于0，因为他下面方法就重新计算了
                                dishesTotalCount = 0;
                                dishesTotalPrice = 0;
                                subscribeDishes();
                            }
                        });
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            }

            // 取消当地菜品所点的所有东西
            function checkCacel() {}

            // 菜品口味的添加修改
            function checkLayerEdit(type, flavor, isFlavor, inputCount, flavorId, isInput, limited) {

                // 有口味但口味对象不存在, 创建口味对象
                if (flavor && !dishes.flavorObj[flavor]) {
                    dishes.flavorObj[flavor] = {};
                    dishes.flavorObj[flavor].id = dishes.id;
                    dishes.flavorObj[flavor].flavor_id = flavorId.substr(flavorId.length - 1, 1);
                    dishes.flavorObj[flavor].flavor = flavor;
                    dishes.flavorObj[flavor].flavor_name = flavor;
                    dishes.flavorObj[flavor].flavor_count = 0;
                    dishes.flavorObj[flavor].flavor_price = 0;
                }

                /*// isFlavor 1有口味，0：没口味
                if (isFlavor == 1) {
                    // 有口味的就是添加修改口味，之后计算菜品数量
                    if (type == 'add') {
                        dishes.flavorObj[flavor].flavor_count += amount;
                        dishes.flavorObj[flavor].flavor_price += amountPrice;
                        // 计算当前菜品所在分类总数量，总价格
                        dishesClass.count += amount;
                        dishesClass.price += amountPrice;
                        // 改变总价钱，总数量
                        dishesTotalCount += amount;
                        dishesTotalPrice += amountPrice;
                    } else if (type == 'lower') {
                        if (dishes.flavorObj[flavor].flavor_count != 0) {
                            dishes.flavorObj[flavor].flavor_count -= amount;
                            dishes.flavorObj[flavor].flavor_price -= amountPrice;
                        }
                        // 计算当前菜品所在分类总数量，总价格
                        dishesClass.count -= amount;
                        dishesClass.price -= amountPrice;
                        // 改变总价钱，总数量
                        dishesTotalCount -= amount;
                        dishesTotalPrice -= amountPrice;
                    } else if (type == 'chans') {
                        dishes.flavorObj[flavor].flavor_count = inputCount;
                        dishes.flavorObj[flavor].flavor_price = inputCount * amountPrice;
                    }

                    // 得到输入数量之前当前菜品的数量和总价格，用来计算当前菜品所在分类总数量，总价格
                    var dishesCount = dishes.count;
                    var dishesPrice = dishes.price;
                    // 循环口味之前先清0
                    dishes.count = 0;
                    dishes.price = 0;

                    // 循环所有口味，得到菜品数量，价格
                    for (var i in dishes.flavorObj) {
                        dishes.count += dishes.flavorObj[i].flavor_count;
                        dishes.price += dishes.flavorObj[i].flavor_price;
                    }

                    if (type == 'chans') {
                        // 计算当前菜品所在分类总数量，总价格并计算所有菜品总数量，总价钱
                        if (inputCount == 0) {
                            dishesClass.count = dishesClass.count - dishesCount;
                            dishesClass.price = dishesClass.price - dishesPrice;
                            // 计算所有菜品总数量，总价钱
                            dishesTotalCount = dishesTotalCount - dishesCount;
                            dishesTotalPrice = dishesTotalPrice - dishesPrice;
                        } else {
                            dishesClass.count = dishesClass.count - dishesCount + inputCount;
                            dishesClass.price = dishesClass.price - dishesPrice + inputCount * amountPrice;
                            // 计算所有菜品总数量，总价钱
                            dishesTotalCount = dishesTotalCount - dishesCount;
                            dishesTotalPrice = dishesTotalPrice - dishesPrice + inputCount * amountPrice;
                        }

                    }

                } else if (isFlavor == 0) {
                    // 没口味的时候就就变成了添加修改菜品
                    if (type == 'add') {
                        dishes.count += amount;
                        dishes.price += amountPrice;
                    } else if (type == 'lower') {
                        if (dishes.count != 0) {
                            dishes.count -= amount;
                            dishes.price -= amountPrice;
                        }
                    } else if (type == 'chans') {
                        dishes.count = inputCount;
                        dishes.price = inputCount * amountPrice;
                    }
                }*/

                //alert(dishes.flavorObj[flavor].flavor_count+'---'+dishes.flavorObj[flavor].flavor_price);
                // isFlavor 1有口味，0：没口味
                if (type == 'add') {
                    if (isFlavor == 1) {
                        dishes.flavorObj[flavor].flavor_price = parseFloat(dishes.flavorObj[flavor].flavor_price);
                        //alert(dishes.flavorObj[flavor].flavor_count+'---'+amount);
                        dishes.flavorObj[flavor].flavor_count += parseFloat(amount);
                        dishes.flavorObj[flavor].flavor_price += parseFloat(amountPrice);
                    } else {
                        dishes.count += amount;
                        dishes.price += parseFloat(amountPrice);
                    }
                    //alert(dishesTotalPrice);
                    //alert(dishes.flavorObj[flavor].flavor_count+'---'+dishes.flavorObj[flavor].flavor_price);
                    //alert(dishesClass.count+'---'+amount);
                    // 计算当前菜品所在分类总数量，总价格
                    dishesClass.count += amount;
                    dishesClass.price += parseFloat(amountPrice);
                    // 改变总价钱，总数量
                    dishesTotalCount += amount;
                    dishesTotalPrice += parseFloat(amountPrice);
                    //alert(dishesTotalPrice);
                } else if (type == 'lower') {
                    if (isFlavor == 1) {
                        if (dishes.flavorObj[flavor].flavor_count != 0) {
                            dishes.flavorObj[flavor].flavor_count -= amount;
                            dishes.flavorObj[flavor].flavor_price -= amountPrice;

                            // 计算当前菜品所在分类总数量，总价格
                            dishesClass.count -= amount;
                            dishesClass.price -= amountPrice;
                            // 改变总价钱，总数量
                            dishesTotalCount -= amount;
                            dishesTotalPrice -= amountPrice;
                        }
                    } else {
                        if (dishes.count != 0) {
                            dishes.count -= amount;
                            dishes.price -= amountPrice;

                            // 计算当前菜品所在分类总数量，总价格
                            dishesClass.count -= amount;
                            dishesClass.price -= amountPrice;
                            // 改变总价钱，总数量
                            dishesTotalCount -= amount;
                            dishesTotalPrice -= amountPrice;
                        }
                    }

                } else if (type == 'chans') {
                    // 获取到输入的值
                    var inputNum = inputCount;

                    // 得到输入数量之前当前菜品的数量和总价格，用来计算当前菜品所在分类总数量，总价格
                    var dishesCount = dishes.count;
                    var dishesPrice = dishes.price;

                    //alert(dishesCount+'--'+dishesPrice);
                    if (isFlavor == 1) {
                        dishes.flavorObj[flavor].flavor_count = inputNum;
                        dishes.flavorObj[flavor].flavor_price = inputNum * amountPrice;
                    } else {
                        dishes.count = inputNum;
                        dishes.price = inputNum * amountPrice;
                    }

                    // 有口味的时候循环得到所有输入框相加的总数
                    if (isFlavor == 1) {
                        inputCount = 0;
                        for (var i in dishes.flavorObj) {
                            //alert(dishes.flavorObj[i].flavor_count);
                            inputCount += dishes.flavorObj[i].flavor_count;
                        }
                    }
                    //alert(inputNum+'--'+inputCount);
                    // 因为float数值相加精度容易不准，所以要转格式
                    inputCount = inputCount.toFixed(1);
                    //alert(inputCount);
                    inputCount = parseFloat(inputCount);
                    //alert(inputCount);

                    // 计算当前菜品所在分类总数量，总价格并计算所有菜品总数量，总价钱
                    if (inputCount == 0) {
                        //alert('2--'+dishesTotalCount);
                        dishesClass.count = dishesClass.count - dishesCount;
                        dishesClass.price = dishesClass.price - dishesPrice;
                        // 计算所有菜品总数量，总价钱
                        dishesTotalCount = dishesTotalCount - dishesCount;
                        dishesTotalPrice = dishesTotalPrice - dishesPrice;
                    } else {
                        //alert('1--'+dishesTotalCount);
                        dishesClass.count = dishesClass.count - dishesCount + inputCount;
                        dishesClass.price = dishesClass.price - dishesPrice + inputCount * amountPrice;
                        // 计算所有菜品总数量，总价钱
                        dishesTotalCount = dishesTotalCount - dishesCount + inputCount;
                        dishesTotalPrice = dishesTotalPrice - dishesPrice + inputCount * amountPrice;
                    }

                }

                //alert(dishesClass.count+'--'+dishesClass.price+'--'+dishesTotalCount+'--'+dishesTotalPrice);
                // 因为float数值相加精度容易不准，所以要转格式
                dishesClass.count = parseFloat(dishesClass.count).toFixed(1);
                dishesClass.price = parseFloat(dishesClass.price).toFixed(2);
                dishesTotalCount = parseFloat(dishesTotalCount).toFixed(1);
                dishesTotalPrice = parseFloat(dishesTotalPrice).toFixed(2);

                dishesClass.count = parseFloat(dishesClass.count);
                dishesClass.price = parseFloat(dishesClass.price);
                dishesTotalCount = parseFloat(dishesTotalCount);
                dishesTotalPrice = parseFloat(dishesTotalPrice);
                //alert(dishesClass.count+'--'+dishesClass.price+'--'+dishesTotalCount+'--'+dishesTotalPrice);

                if (isFlavor == 1) {
                    // 循环口味之前先清0
                    dishes.count = 0;
                    dishes.price = 0;

                    // 循环所有口味，得到菜品数量，价格
                    for (var i in dishes.flavorObj) {
                        dishes.count += dishes.flavorObj[i].flavor_count;
                        dishes.price += parseFloat(dishes.flavorObj[i].flavor_price);
                        //alert(dishes.price);
                    }

                }
                //alert(dishes.count);
                // 因为float数值相加精度容易不准，所以要转格式
                dishes.count = parseFloat(dishes.count).toFixed(1);
                dishes.price = parseFloat(dishes.price).toFixed(2);

                dishes.count = parseFloat(dishes.count);
                dishes.price = parseFloat(dishes.price);

                Cache.set(card_id + '-shop', card_id + '-' + shop_id); // 存储缓存
                //alert(limited+'---'+dishes.count);
                //当前菜品所在分类总数量，总价格（收藏问题）
                classTotal[dishesClassName] = dishesClass;
                // 点菜写入缓存
                allMenuData[dishesId] = dishes;
                Cache.set(card_id + '-allmenu', allMenuData);

                // 判断如果可售数量>0 并且 点菜数量＞可售数量，跳出提示框“此菜品为限量销售菜品，请联系离您最近的服务员”。
                if (limited > 0 && dishes.count > limited) {
                    if (type == 'add') { // 递归自调用，容易造成递归溢出，不过可以无视这个错误
                        checkLayerEdit('lower', flavor, isFlavor, null, flavorId, isInput, limited);
                    } else if (type == 'lower') {
                        checkLayerEdit('lower', flavor, isFlavor, null, flavorId, isInput, limited);
                    } else if (type == 'chans') {
                        limited = parseFloat(limited);
                        checkLayerEdit('chans', flavor, isFlavor, limited, flavorId, isInput, limited);
                    }
                    Message.show('#msg', '此菜品为限量销售菜品，请联系离您最近的服务员', 2000);
                } else {
                    //alert('3');
                    dishesElement(dishes, dishesClassName, type, flavor, flavorId, isFlavor, isInput, limited);
                }
            }

            // 菜品备注的选中取消
            function checkNoneNote(is_checked, note, isNote, noteId) {
                // 有备注但是备注对象不存在，创建备注对象
                if (note && !dishes.noteObj[note]) {
                    dishes.noteObj[note] = {};
                    dishes.noteObj[note].note = note;
                    dishes.noteObj[note].note_name = note;
                    dishes.noteObj[note].is_checked = 0; //0：不选中，1：选中
                }

                // 有备注
                if (isNote == 1) {
                    if (is_checked == 1) {
                        dishes.noteObj[note].is_checked = 1;
                    } else {
                        dishes.noteObj[note].is_checked = 0;
                    }
                }
                Cache.set(card_id + '-shop', card_id + '-' + shop_id); // 存储缓存

                // 备注写入缓存
                allMenuData[dishesId] = dishes;
                Cache.set(card_id + '-allmenu', allMenuData);
            }
        }

        // 加菜减菜点击后干的事情
        function dishesElement(dishes, dishesClassName, type, flavor, flavorId, isFlavor, isInput, limited) {
            var ndClassDishesCount = $('[data-href=#' + dishesClassName + ']');

            // 口味份数
            var popusCountBtn = $('#' + flavorId).find('span[data-type="popus__count"]');
            var popusInputBtn = $('#' + flavorId).find('input[data-type="popus__count"]');
            if (dishes.flavor && flavor) {
                popusCountBtn.text(dishes.flavorObj[flavor].flavor_count);
                popusInputBtn.val(dishes.flavorObj[flavor].flavor_count);
            } else {
                popusCountBtn.text(dishes.count);
                popusInputBtn.val(dishes.count);
            }

            // 点菜份数
            var dishesAddBtn = $('#' + dishes.id).find('span[data-type="dishes__add"]'), // 加菜按钮
                dishesLowerBtn = $('#' + dishes.id).find('span[data-type="dishes__lower"]'), // 减菜按钮
                ndDishesCount = $('#' + dishes.id).find('span[data-type="dishes__count"]'); // 点菜份数

            // 点菜份数   收藏的东西
            var codishesAddBtn = $('#' + dishes.id + '-myCollect').find('span[data-type="dishes__add"]'), // 加菜按钮
                codishesLowerBtn = $('#' + dishes.id + '-myCollect').find('span[data-type="dishes__lower"]'), // 减菜按钮
                condDishesCount = $('#' + dishes.id + '-myCollect').find('span[data-type="dishes__count"]'); // 点菜份数

            ndDishesCount.text(dishes.count);
            condDishesCount.text(dishes.count);

            // 限售数量
            var limDisplay = $('#' + dishes.id).find('span[data-type="limDisplay"]');
            limDisplay.text(parseFloat(Util.accSubtr(limited, dishes.count)));
            // 限售数量 收藏
            var condlimDisplay = $('#' + dishes.id + '-myCollect').find('span[data-type="limDisplay"]');
            condlimDisplay.text(parseFloat(Util.accSubtr(limited, dishes.count)));

            //alert('ddd');
            if (type == 'lower') {
                //alert(dishes.count);
                // 没有口味的菜
                if (isFlavor == 0) {

                    // 数量减完了
                    if (dishes.count <= 0) {

                        // 页面点菜按钮切换显示
                        dishesLowerBtn.addClass('hide');
                        ndDishesCount.addClass('hide');

                        // 收藏
                        codishesLowerBtn.addClass('hide');
                        condDishesCount.addClass('hide');

                        //dishesAddBtn.removeClass('dishes__add').addClass('dishes__noadd');

                        //$('#cart-btn').addClass('dishes-footer-round').removeClass('dishes-footer-round-upcart');
                        //$('#dishes-total-price').addClass('dishes-footer-big').removeClass('dishes-footer-big-right');

                        // 从已点菜品中删除此菜
                        removeDishes(dishes.id, isFlavor, isInput);
                    } else {
                        changeDishesToDishesList(dishes.id, dishes, 0, isInput, limited);
                    }
                } else {
                    //alert(dishes.count);
                    if (dishes.count <= 0) {
                        // 页面点菜按钮切换显示
                        dishesLowerBtn.addClass('hide');
                        ndDishesCount.addClass('hide');

                        // 收藏
                        codishesLowerBtn.addClass('hide');
                        condDishesCount.addClass('hide');

                        //dishesAddBtn.removeClass('dishes__add').addClass('dishes__noadd');

                        if (dishes.count <= 0) {
                            // 从已点菜品中删除此菜
                            removeDishes(dishes.id, isFlavor, isInput);
                        }
                    } else {
                        //alert('ddd');
                        if (dishes.count <= 0) {
                            // 从已点菜品中删除此菜
                            removeDishes(dishes.id, isFlavor, isInput);
                        } else {
                            //alert('ttt');
                            changeDishesToDishesList(dishes.id, dishes, 1, isInput, limited);
                        }
                    }
                }
            } else {
                // 数量减完了,主要针对输入数量的时候可能会清零
                if (dishes.count <= 0) {
                    // 页面点菜按钮切换显示
                    dishesLowerBtn.addClass('hide');
                    ndDishesCount.addClass('hide');

                    // 收藏
                    codishesLowerBtn.addClass('hide');
                    condDishesCount.addClass('hide');

                    // 从已点菜品中删除此菜
                    removeDishes(dishes.id, isFlavor, isInput);
                } else {
                    //alert('ddd');
                    // 页面点菜按钮切换显示
                    dishesLowerBtn.removeClass('hide');
                    ndDishesCount.removeClass('hide');

                    // 收藏
                    codishesLowerBtn.removeClass('hide');
                    condDishesCount.removeClass('hide');

                    //dishesAddBtn.removeClass('dishes__noadd').addClass('dishes__add');
                    //alert('dd');
                    // 添加菜品到已点菜品列表
                    addDishes(dishes, isFlavor, isInput, limited);
                }

            }
            //alert('ttt');
            // 计算当前分类点菜总数并重新在页面写入
            calClassDishes(ndClassDishesCount, classTotal[dishesClassName].count);
            //alert(dishesTotalCount);
            // 计算所有菜品点菜总个数，总价钱并写入页面
            calDishes(dishesTotalCount, dishesTotalPrice);
        }

        // 删除菜品
        function removeDishes(id, isFlavor, isInput) {
            // 起送金额判断
            minimum_judge();

            //$.dialog.close($.dialog.id);
            //alert(id);
            $('#dishes_' + id).remove();
            DishesList.dishesListScroll().refresh();
            if (ndDishesListUl.find('li').length == 0) {
                ndDishesList.hide();
                ndFooter.css('z-index', 0);
                DishesList.isShow = false;
                // 有弹出层并且没有口味，并且不可以输入数量，关闭弹出层
                if ($.dialog && isFlavor == 0 && isInput == 0) {
                    $.dialog.close($.dialog.id);
                }
            }
        }

        // 添加已点菜品到点菜列表
        function addDishes(dishes, isFlavor, isInput, limited) {
            // 有口味和没有口味进行不同的处理
            //if (!dishes.flavor) {
            changeDishesToDishesList(dishes.id, dishes, isFlavor, isInput, limited);
            /*} else {
                for (var i in dishes.flavorObj) {
                    if (dishes.flavorObj[i].count > 0) {
                        var ndDishes = dishes.id + '_' + dishes.flavorObj[i].flavor_name;
                        changeDishesToDishesList(ndDishes, dishes.flavorObj[i], 2);
                    }
                }
            }*/
        }

        // 起送金额判断
        function minimum_judge() {
            // 是首单才计算起送金额
            switch (Number(order_property)) {
                case 1:
                    allMenuData_1 = {};
                    allMenuData_1 = dishesStackHandle(allMenuData, allMenuData_1);
                    Cache.set('allMenuData_1', allMenuData_1);
                    break;
                case 2:
                    allMenuData_2 = {};
                    allMenuData_2 = dishesStackHandle(allMenuData, allMenuData_2);
                    Cache.set('allMenuData_2', allMenuData_2);
                    break;
                case 3:
                    allMenuData_3 = {};
                    allMenuData_3 = dishesStackHandle(allMenuData, allMenuData_3);
                    Cache.set('allMenuData_3', allMenuData_3);
                    break;
                case 4:
                    allMenuData_4 = {};
                    allMenuData_4 = dishesStackHandle(allMenuData, allMenuData_4);
                    Cache.set('allMenuData_4', allMenuData_4);
                    break;
            }
            if (is_first_single == 1 && (order_property == 2 || order_property == 3 || order_property == 4)) {
                var order_money = 0; // 订单售卖价格

                for (var i in allMenuData) {
                    order_money = Util.accAdd(order_money, Util.accMul(allMenuData[i].menu_price, allMenuData[i].count));
                }

                // 如果订单售卖价格小于起送金额，不能点击
                if (order_money < minimum_money) {
                    is_save_button = 0;
                    var mininum = parseFloat(Util.accSubtr(minimum_money, order_money));
                    var cont_tit = '起送';
                    if (order_property != 2) {
                        cont_tit = '起定';
                    }
                    $('#save-button').html('还差' + mininum + cont_tit);
                    $('#save-button').css('background', '#999999');
                } else {
                    is_save_button = 1;
                    $('#save-button').html('去结算');
                    $('#save-button').css('background', '#E70012');
                }
            } else {
                is_save_button = 1;
                $('#save-button').html('去结算');
                $('#save-button').css('background', '#E70012');
            }
        }

        // 添加菜品到已点菜品
        function changeDishesToDishesList(id, data, type, isInput, limited) {

            // 起送金额判断
            minimum_judge();


            // 判断是否有口味
            var flavor = type == 1 ? '' : data.flavor;

            // 限售数量  在这里赋值限售数量是为了从缓存过来赋值用的
            var limDisplay = $('#' + id).find('span[data-type="limDisplay"]');
            limDisplay.text(parseFloat(Util.accSubtr(limited, data.count)));
            // 限售数量 收藏
            var condlimDisplay = $('#' + id + '-myCollect').find('span[data-type="limDisplay"]');
            condlimDisplay.text(parseFloat(Util.accSubtr(limited, data.count)));

            if ($('#dishes_' + id).length > 0) {
                $('#dishes_' + id).find('div[class="money"]').text('¥ ' + parseFloat(data.price));
                $('#dishes_' + id).find('span[data-class="layer_dishes_count"]').text(parseFloat(data.count));
                $('#dishes_' + id).find('marquee[class="flavor"]').text(flavor);
            } else {
                // 下面判断当添加到已点菜品，菜品名称超过九个字符，就滚动，否则正常显示
                var content = '<li id="dishes_' + id + '" class="clearfix">' +
                    '<div class="name">' +
                    (data.name.length > 8 ?
                        '<marquee scrollamount="3" align="left">' + data.name + '</marquee>' :
                        data.name) +
                    '</div>' +
                    '<span data-type="lim" class="hide">' + limited + '</span>' +
                    '<div class="money">¥ ' + parseFloat(data.price) + '</div>' +
                    '<div class="dishes__content__operate clearfix">' +
                    '<span class="dishes__lower" data-class="layer_dishes_lower"></span>' +
                    '<span class="dishes__count" data-class="layer_dishes_count">' + parseFloat(data.count) + '</span>' +
                    '<span class="dishes__add" data-class="layer_dishes_add"></span>' +
                    '</div>' +
                    '</li>';
                ndDishesListUl.append(content);
                dishesListEdit(id, data, type, isInput);
            }
        }

        // 已点菜品列表页加菜
        function dishesListEdit(id, data, type, isInput) {
            //alert('ddd');
            // 1: 没有口味，2: 有口味
            var addDishesBtn = $('#dishes_' + id).find('[data-class="layer_dishes_add"]'),
                lowerDishesBtn = $('#dishes_' + id).find('[data-class="layer_dishes_lower"]');

            // 限售数量
            var limited = $('#dishes_' + id).find('span[data-type="lim"]').text();

            // 加菜
            addDishesBtn.unbind('tap').bind('tap', function() {
                yuclick = $('#' + id).attr('data-type');
                ndDataId = $('ul[id="' + data.type + '"]').attr('data-type');
                if (type == 0 && isInput == 0) {
                    checkLayerData('add', id, data.type, null, 0, limited);
                } else {
                    checkLayerData('add', id, data.type, null, 1, limited);
                }
            });

            // 减菜
            lowerDishesBtn.unbind('tap').bind('tap', function() {
                yuclick = $('#' + id).attr('data-type');
                ndDataId = $('ul[id="' + data.type + '"]').attr('data-type');
                if (type == 0 && isInput == 0) {
                    checkLayerData('lower', id, data.type, null, 0, limited);
                } else {
                    checkLayerData('lower', id, data.type, null, 1, limited);
                }
            });
        }

        // 保存数据
        function saveData() {
            ndSaveButton.unbind('tap').bind("tap", function() {
                // 去结算按钮不可点击
                if (is_save_button == 0) {
                    return;
                }

                // 如果菜品列表显示，将其关闭
                if (DishesList.isShow == true) {
                    DishesList.hideDishesList();
                }
                /*var is_bottom_pot = 0;     // 是否有必点锅底
                var is_small_material = 0;  // 是否有必点小料*/
                var is_pot = 0,
                    is_meterial = 0; // 是否点了必点锅底、小料 0 否 1 是
                var is_condition = 0; // 是否点了必点条件商品 0 否 1 是

                // storage_point 从订单详情页面追单过来的，是否有必点
                // is_jump_choice 是否是追单过来的

                // 判断是否点了必点条件商品
                for (var i in allMenuData) {
                    if (allMenuData[i].special_type == 8 && allMenuData[i].count > 0) {
                        is_condition = 1;
                    }
                }

                // 因为追单过来的，当前菜品中点了必点条件商品也要点必点锅底和小料，当前菜品中没有点必点条件商品就看追单过来的之前订单是否点过必点商品
                if (is_condition == 0) {
                    if (is_jump_choice == 1 && storage_point.is_cond_commodity == 1) {
                        is_condition = 1;
                    }
                }
                for (var i in allMenuData) {
                    if (allMenuData[i].count > 0) {
                        if (is_bottom_pot == 1 && allMenuData[i].special_type == 6) {
                            is_pot = 1;
                        }
                        if (is_small_material == 1 && allMenuData[i].special_type == 7) {
                            is_meterial = 1;
                        }
                    }
                }
                // 有必点条件商品，如果是追单过来的，有必点锅底、小料就标识
                if (is_jump_choice == 1) {
                    if (is_bottom_pot == 1 && is_pot == 0 && storage_point.is_bottom_pot == 1) {
                        is_pot = 1;
                    }
                    if (is_small_material == 1 && is_meterial == 0 && storage_point.is_small_material == 1) {
                        is_meterial = 1;
                    }
                }

                // 如果锅底、小料，不存在，赋值点了锅底小料，这样就进不去弹出层
                if (is_bottom_pot == 0) {
                    is_pot = 1;
                }
                if (is_small_material == 0) {
                    is_meterial = 1;
                }

                // 如果点了必点条件商品，是否点了必点锅底、小料
                if (is_condition == 1 && (is_pot == 0 || is_meterial == 0 || is_jump_choice == 1)) {

                    var special_type_exit = '';
                    // 没点锅底或者小料提示消息
                    if (is_pot == 0 && is_meterial == 0) {
                        special_type_exit = '您还没有点“'+menuInfo.special_6_name+'”和“'+menuInfo.special_7_name+'”呢?';
                    }
                    if (is_pot == 0) {
                        special_type_exit = '您还没有点“'+menuInfo.special_6_name+'”呢?';
                    }
                    if (is_meterial == 0) {
                        special_type_exit = '您还没有点“'+menuInfo.special_7_name+'”呢?';
                    }

                    // 变成空是可能追单过来有必点条件商品，然后用户自己又点了必点商品所以就是空了
                    if (special_type_exit == '' && is_jump_choice == 1) {
                        // 补齐和桌台号处理
                        placeAnOrder_auto();
                    } else {
                        if (order_property == 4) {
                            $.dialog = Dialog({
                                type: 1,
                                close: false,
                                btn: ['返回补点'],
                                content: special_type_exit,
                                closeFn: function() {
                                    $.dialog.close($.dialog.id);
                                }
                            });
                        } else {
                            $.dialog = Dialog({
                                type: 2,
                                close: false,
                                btn: ['返回补点', '不需要'],
                                content: special_type_exit,
                                cancelFn: function() { // 补点
                                    $.dialog.close($.dialog.id);
                                },
                                closeFn: function() { // 追单
                                    $.dialog.close($.dialog.id);
                                    // 如果是首单 并且 是餐厅堂食 或者 外卖送餐，需要选择就餐人数，不是首单不能选择就餐人数
                                    if (is_first_single == 1 && (order_property == 1 || order_property == 2 || order_property == 3)) {
                                        // 下单前就餐人数处理
                                        placeAnOrder_handle(1, special_type_exit);
                                    } else {
                                        // 补齐和桌台号处理
                                        placeAnOrder_auto();
                                    }
                                }
                            });
                        }
                    }
                } else {
                    if (is_first_single == 1 && (order_property == 1 || order_property == 2 || order_property == 3)) {
                        placeAnOrder_handle();
                    } else {
                        // 补齐和桌台号处理
                        placeAnOrder_auto();
                    }
                }
            });

        }

        // 下单前就餐人数处理和之后必点处理
        function placeAnOrder_handle(is_t, special_type_exit) {
            // 下单前就餐人数处理
            // if(is_first_single == 0) {
            //     $('#m_number_time').addClass('hide');
            // }
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
                    // 必点选追单，默认选中追单
                    if (is_t == 1) {
                        $('#number_options').find('p').each(function() {
                            $(this).removeClass('checked');
                        });
                        $('#number_options').find('p[data-value="0"]').addClass('checked');
                        $('#number_diners').val(0);
                        user_num = 0;
                    } else {
                        $('#number_options').find('p').each(function() {
                            $(this).removeClass('checked');
                        });
                        if (is_chopsticks_t == 0 && user_num != 0) {
                            $('#number_options').find('p[data-value="' + user_num + '"]').addClass('checked');
                        }
                        if (user_num != 0) {
                            $('#number_diners').val(user_num);
                        } else {
                            $('#number_diners').val('');
                        }
                    }
                    number_of_diners_t(user_num);

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

                        number_of_diners_t(number_di);
                    });

                    // 绑定人数选择点击事件
                    $('#number_options').find('p').each(function() {
                        $(this).unbind('click').bind('click', function() {
                            // 选中样式
                            $(this).addClass('checked').siblings('p').removeClass('checked');
                            // 点击得到点击的人数
                            var number_op = $(this).attr('data-value');
                            $('#number_diners').val(number_op);
                            number_of_diners_t(number_op);
                        });
                    });

                    // 点击确定
                    $('#number_of_determine').unbind('click').bind('click', function() {
                        var number_diners = $('#number_diners').val()
                        if (number_diners == '') {
                            Message.show('#msg', '请选择就餐人数', 2000);
                            return false;
                        }
                        $.dialog.close($.dialog.id);
                        user_num = no_user_num;

                        if (order_property == 2 || order_property == 3) {
                            var day = $('#num1').find('li[class="current"]').text();
                            var hour = $('#num2').find('li[class="current"]').text();
                            var minite = $('#num3').find('li[class="current"]').text();

                            // 日期转换时间戳
                            dinner_time = Util.dateTotTime(Util.getLocalDateGenerate(day, hour, minite).list_date);
                        }

                        // 如果是必点追单过来并且选的人数不是0，就弹出必点弹出层
                        if (is_t == 1 && user_num != 0) {
                            $.dialog = Dialog({
                                type: 1,
                                close: false,
                                btn: ['返回补点'],
                                content: special_type_exit,
                                closeFn: function() {
                                    $.dialog.close($.dialog.id);
                                }
                            });
                        } else {
                            // 如果存在特殊商品“堂食餐包”，，且“用户是否允许自备餐具”为允许
                            if (((order_property == 1 && is_eat == 1) || ((order_property == 2 || order_property == 3) && is_takeout == 1)) && is_chopsticks == 1) {
                                if ($('#chopsticks_rise').is(':checked')) {
                                    is_chopsticks_t = 1;
                                } else {
                                    is_chopsticks_t = 0;
                                }
                            } else {
                                is_chopsticks_t = 0;
                            }

                            // 没有选中自备餐包 并且 是首单 并且 是堂食 或者 是外卖 就添加餐包
                            if (is_chopsticks_t == 0 && is_first_single == 1 && (order_property == 1 || order_property == 2 || order_property == 3)) {

                            }
                            // 补齐和桌台号处理
                            placeAnOrder_auto();
                        }
                    });

                    // 点击右上角取消
                    $('#number_diners_clo').unbind('click').bind('click', function() {
                        $.dialog.close($.dialog.id);
                    });
                }
            });
        }

        // 处理就餐人数弹出层选择人数的时候
        function number_of_diners_t(num) {
            no_user_num = num;
            // is_meal_package 是否存在堂食餐包
            if (((order_property == 1 && is_eat == 1) || ((order_property == 2 || order_property == 3) && is_takeout == 1))) {
                var con = '';
                if (order_property == 1) {
                    con = '堂食餐包';
                    if (is_eat == 0) {
                        $('#meal_package').addClass('hide');
                    }
                } else if (order_property == 2 || order_property == 3) {
                    con = '外卖餐包';
                    if (is_takeout == 0) {
                        $('#meal_package').addClass('hide');
                    }
                }
                var meal_package = Cache.get('meal_package');
                $('#con_1').text(con);
                if (is_authority == 1) {
                    $('#con_2').text(meal_package.member_price);
                } else {
                    $('#con_2').text(meal_package.menu_price);
                }
            } else {
                $('#meal_package').addClass('hide');
            }
        }

        // 补齐和桌台号处理
        function placeAnOrder_auto() {
            /*is_eat = 0,           // 堂食餐包     0 已下架 1 未下架
            is_takeout = 0,         // 外卖餐包     0 已下架 1 未下架
            is_takeout_room = 0,    // 外卖送餐费    0 已下架 1 未下架
            is_shopping_room = 0,   // 商城送餐费    0 已下架 1 未下架
            is_packing_box = 0,     // 打包盒      0 已下架 1 未下架*/
            // 订单属性： order_property 堂食1 外卖2 打包3 商城配送4
            // 已点餐包
            var alr_eat_num = 0; // 已点的堂食餐包数量
            for (var i in allMenuData) {
                if (allMenuData[i].special_type == 1) {
                    alr_eat_num = Util.accAdd(alr_eat_num, allMenuData[i].count);
                }
            }
            var alr_takeout_num = 0; // 已点的外卖餐包数量
            for (var i in allMenuData) {
                if (allMenuData[i].special_type == 2) {
                    alr_takeout_num = Util.accAdd(alr_takeout_num, allMenuData[i].count);
                }
            }

            // 判断需要是否自动补齐 并且 没有选中 自备餐具
            if (order_property == 1 && is_eat == 1 && is_chopsticks_t == 0) {
                // 自动补齐处理
                autocomplete(1, alr_eat_num);
            }
            if ((order_property == 2 || order_property == 3) && is_takeout == 1 && is_chopsticks_t == 0) {
                // 自动补齐处理
                autocomplete(2, alr_takeout_num);
            }
            // 首单才需要送餐费
            if (is_first_single == 1 && order_property == 2 && is_takeout_room == 1) {
                // 自动补齐处理
                autocomplete(3);
            }
            // 首单才需要送餐费
            if (is_first_single == 1 && order_property == 4 && is_shopping_room == 1) {
                // 自动补齐处理
                autocomplete(4);
            }
            if ((order_property == 2 || order_property == 3 || order_property == 4) && is_packing_box == 1) {
                // 自动补齐处理
                autocomplete(5);
            }


            var ary = {}, // 点菜菜品信息数组
                dishesTotalClass = 0, // 点菜菜品种类
                canjuCount = 0, // 餐具
                discountMoney = 0; // 折扣金额
            var sum_menu_num = 0; // 菜品个数 

            for (var i in allMenuData) {
                // 点菜份数大于0
                if (allMenuData[i].count > 0) {

                    sum_menu_num++;
                    if (!ary[allMenuData[i].type]) {
                        ary[allMenuData[i].type] = {};
                    }

                    if (!ary[allMenuData[i].type][allMenuData[i].id]) {
                        ary[allMenuData[i].type][allMenuData[i].id] = {};
                    }

                    var menuId = ary[allMenuData[i].type][allMenuData[i].id];

                    if (allMenuData[i].flavorObj && allMenuData[i].flavor) {

                        if (allMenuData[i].count > 0) {
                            dishesTotalClass++;
                            discountMoney += allMenuData[i].count * discount;
                            menuId.base = {
                                'menu_id': allMenuData[i].id,
                                'menu_num': parseFloat(allMenuData[i].count).toFixed(1),
                                'menu_name': allMenuData[i].name,
                                'menu_price': allMenuData[i].price,
                                'menu_flavor': allMenuData[i].flavorObj,
                                'menu_note': allMenuData[i].noteObj,
                                'special_type': allMenuData[i].special_type,
                                'pack_id': allMenuData[i].pack_id,
                                'is_set_menu': allMenuData[i].is_set_menu.toString(),
                                'set_menu': allMenuData[i].set_menu_info
                            };
                        }
                    } else {
                        dishesTotalClass++;
                        discountMoney += allMenuData[i].count * discount;
                        menuId.base = {
                            'menu_id': allMenuData[i].id,
                            'menu_num': parseFloat(allMenuData[i].count).toFixed(1),
                            'menu_name': allMenuData[i].name,
                            'menu_price': allMenuData[i].price,
                            'menu_flavor': '',
                            'menu_note': '',
                            'special_type': allMenuData[i].special_type,
                            'pack_id': allMenuData[i].pack_id,
                            'is_set_menu': allMenuData[i].is_set_menu.toString(),
                            'set_menu': allMenuData[i].set_menu_info
                        };
                    }
                }
            }
            //Cache.set('11111',ary);
            //var menu = menuParsing(ary);


            // 增加判断，如果是外卖、自提、商城，也不需要传tableid
            // 订单属性： order_property 堂食1 外卖2 打包3 商城配送4
            if (order_property != 1) {
                saveOrder(dishesTotalClass, discountMoney, ary, 2);
            } else {
                //shop_type_info 0 桌台模式  1叫号 2台卡 如果是叫号就不用传tableid
                if (shop_type_info == 2) {
                    saveOrder(dishesTotalClass, discountMoney, ary, 1);
                } else if (scanCodeType != undefined && scanCodeType == 0 && tableId != '' && shop_type_info == 1) {
                    // 如果从URL传过来的type不是undefined并且是0并且获取到的tableId不是空，说明他是扫描二维码过来的并且tableId获取到了值
                    saveOrder(dishesTotalClass, discountMoney, ary, 1);
                } else { // 否则弹出框让用户输入桌台id
                    // 显示桌台弹出框
                    $('#edit-shop-dialog').removeClass('hide');
                    shop_name = decodeURIComponent(Util.getQueryString('shop_name'));

                    if (shop_name == 'undefined') {
                        $('#shop_name').addClass('hide');
                    } else {
                        $('#shop_name').removeClass('hide');
                        // 显示店铺名称
                        $('#shop_name').text('店铺：' + shop_name);
                    }
                    var promptName = '';
                    if (shop_type_info == 2) {
                        $('#j-edit-tab-number').attr('placeholder', '请手动输入台卡号');
                        promptName = '台卡号不能为空，请重新输入';
                    } else {
                        $('#j-edit-tab-number').attr('placeholder', '请手动输入桌台名称');
                        promptName = '桌台名称不能为空，请重新输入';
                    }

                    $.dialog = Dialog({
                        type: 3,
                        close: false, // 是否点击弹出框以外的区域可以关闭弹出框
                        dom: '#edit-shop-dialog',
                        success: function() {
                            // 手动提交订单
                            $('#j-edit-shop-btn').unbind('click').bind('click', function() {
                                tableName = $('#j-edit-tab-number').val();

                                if (shop_type_info == 2) {
                                    // 输入台卡号的时候限制只能是数字并且限制五位数
                                    var reg = /^[0-9]*$/;
                                    if (!reg.test(tableName) || tableName.length > 5) {
                                        Message.show('#msg', '必须输入五位数以内的数字！', 3000);
                                        return;
                                    } else {
                                        tableId = tableName;
                                    }
                                }
                                if (tableName != '') {
                                    $.dialog.close($.dialog.id);
                                    $('#edit-shop-dialog').addClass('hide');
                                    saveOrder(dishesTotalClass, discountMoney, ary);
                                } else {
                                    Message.show('#msg', promptName, 3000);
                                }
                            });

                            // 点击扫描桌台
                            $('#j-edit-scan-table').unbind('click').bind('click', function() {
                                // 如果不是微信，就客户端调用扫描二维码
                                if (!isWeixin && !isAli) {
                                    Mobile.scanner('将二维码放入框内', 1, function(result) {
                                        // 扫描得到的二维码处理
                                        qrcodeHandle(result, dishesTotalClass, discountMoney, ary);
                                    });
                                } else if (isAli == true) {
                                    if ((Ali.alipayVersion).slice(0, 3) >= 8.1) {
                                        Ali.scan({
                                            type: 'qr' //qr(二维码) / bar(条形码) / card(银行卡号)
                                        }, function(result) {
                                            if (result.errorCode) {
                                                //没有扫码的情况
                                                //errorCode=10，用户取消
                                                //errorCode=11，操作失败
                                            } else {
                                                //成功扫码的情况
                                                //result.barCode    string  扫描所得条码数据
                                                qrcodeHandle(result.qrCode, dishesTotalClass, discountMoney, ary);
                                                //result.qrCode string  扫描所得二维码数据
                                                //result.cardNumber string  扫描所得银行卡号
                                            }
                                        });
                                    } else {
                                        Ali.alert({
                                            title: '亲',
                                            message: '请升级您的钱包到最新版',
                                            button: '确定'
                                        });
                                    }
                                } else { // 是微信，调用微信扫描二维码
                                    wx.scanQRCode({
                                        needResult: 1, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果
                                        //scanType:["qrCode","barCode"],// 可以指定扫二维码还是一维码，默认二者都有
                                        //desc: 'scanQRCode desc',// 二维码描述
                                        success: function(res) {
                                            //Message.show('#msg', JSON.stringify(res), 3000);
                                            var result = res.resultStr;
                                            // 扫描得到的二维码处理
                                            qrcodeHandle(result, dishesTotalClass, discountMoney, ary);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        }

        // 自动补齐处理 special_type 1 堂食餐包 2 外卖餐包 3 外卖送餐费 4 商城送餐费 5 打包盒
        // alr_eat_num 堂食餐包已点数量 alr_takeout_num 外卖餐包已点数量
        function autocomplete(special_type, eat_takeout_num) {

            // 根据菜品id循环得到特殊商品数据
            var menu_date = dishesLoopJudgeId('', special_type);

            // 堂食餐包、外卖餐包处理
            if (special_type == 1 || special_type == 2) {
                var type_1_num = user_num - eat_takeout_num;
                if (eat_takeout_num == 0) {
                    // 初始化构建
                    initialize_build(user_num, menu_date);
                } else {
                    // 赋值数量
                    allMenuData[menu_date.menu_id].count = user_num;
                    classTotal[menu_date.menu_type_id].count += type_1_num;
                }
            }
            // 外卖送餐费、商城送餐费处理
            if (special_type == 3 || special_type == 4) {
                // 初始化构建
                initialize_build(1, menu_date);
            }
            // 打包盒处理
            if (special_type == 5) {
                // 加上点的所有菜对应的打包盒
                for (var i in allMenuData) {
                    // 判断必须是设置了打包盒的菜
                    if (allMenuData[i].pack_id != '' && allMenuData[i].pack_id != null) {
                        for (var j in menuInfo) {
                            if (j == 'user_collect' || menuInfo[j].menu_list == undefined) {
                                continue;
                            }
                            for (var k in menuInfo[j].menu_list) {
                                if (menuInfo[j].menu_list[k].menu_id == allMenuData[i].pack_id) {
                                    var num_ber = allMenuData[i].input == 1 ? 1 : allMenuData[i].count;
                                    num_ber = parseFloat(parseFloat(num_ber).toFixed(2));
                                    initialize_build(num_ber, menuInfo[j].menu_list[k]);
                                }
                            }
                        }
                    }
                }
            }
        }

        // 初始化构建
        function initialize_build(num, menu_date) {
            // 构建新的 我以前绝对是蠢到家了，才会写这样的代码！！！
            var dishes = allMenuData[menu_date.menu_id];
            var dishesClass = classTotal[menu_date.menu_type_id];
            if (!dishes) {
                dishes = {};
                dishes.id = menu_date.menu_id; // 菜品id
                dishes.name = menu_date.menu_name; // 菜品名称
                dishes.menu_type_id = menu_date.menu_type_id;
                dishes.type = menu_date.menu_type_id;
                dishes.info = menu_date.menu_info;
                dishes.half = menu_date.is_half;
                dishes.number = menu_date.number; // 限量
                dishes.sales = menu_date.sales; // 销量
                dishes.is_off = menu_date.is_off;
                dishes.collect = menu_date.is_collect;
                dishes.dishesPrice = menuInfo.is_member_price == 0 ? Number(menu_date.menu_price) : Number(menu_date.member_price); // member_price(会员价)menu_price(原价)
                dishes.unit = menu_date.menu_unit; // 菜品单位
                dishes.special_type = menu_date.special_type; // 特定商品
                dishes.pack_id = menu_date.pack_id; // 打包盒id
                dishes.input = menu_date.is_input; // 是否输入数量
                dishes.count = num; // 当前菜品总数量
                dishes.price = 0;
                dishes.flavorObj = {};
                dishes.noteObj = {};
                dishes.is_set_menu = menu_date.is_set_menu; // 是否套餐 1是 0否
                dishes.flavor = menu_date.menu_flavor; // 菜品口味
                dishes.note = menu_date.menu_note; // 菜品备注
                if (dishes.is_set_menu == 0) {
                    dishes.set_menu_info = menu_date.set_menu; // 套餐菜品内包含菜品
                } else {
                    dishes.set_menu_info = {};
                    dishes.set_menu_info['0'] = dishesStackHandle(menu_date.set_menu, dishes.set_menu_info['0']);

                    // 判断如果每个菜的口味没有选中的，就默认选中第一个
                    for (var i in dishes.set_menu_info) {
                        for (var j in dishes.set_menu_info[i]) {
                            for (var k in dishes.set_menu_info[i][j]) {
                                if (dishes.set_menu_info[i][j][k].menu_flavor != '') {
                                    var num_text = 0;

                                    var is_flavor_ch = 0; // 是否有选中的口味，1是 0否
                                    for (var g in dishes.set_menu_info[i][j][k].menu_flavor) {
                                        if (dishes.set_menu_info[i][j][k].menu_flavor[g].is_choose == 1) {
                                            is_flavor_ch = 1;
                                        }
                                    }

                                    if (is_flavor_ch == 0) {
                                        for (var p in dishes.set_menu_info[i][j][k].menu_flavor) {
                                            if (num_text == 0) {
                                                dishes.set_menu_info[i][j][k].menu_flavor[p].is_choose = '1';
                                            }
                                            num_text++;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 循环storageDataPck 删除点击减号删除的// 设置初始化数组中套餐数量标号
                    var num = 0;
                    var borrowReplaceOne = {};
                    borrowReplaceOne = dishesStackHandle(dishes.set_menu_info, borrowReplaceOne);
                    dishes.set_menu_info = {};
                    // 设置初始化数组中套餐数量标号
                    for (var i in borrowReplaceOne) {
                        dishes.set_menu_info[num] = {};
                        dishes.set_menu_info[num] = dishesStackHandle(borrowReplaceOne[i], dishes.set_menu_info[num]);
                        num++;
                    }
                }
            } else {
                dishes.menu_num += num;
                if (dishes.is_set_menu == 1) {

                    var num_t = 0;
                    for (var i in dishes.set_menu_info) {
                        num_t++;
                    }

                    if (num_t == 0) {
                        num_t = 0;
                    } else {
                        num_t = num_t - 1;
                    }
                    dishes.set_menu_info[num_t] = dishesStackHandle(menu_date.set_menu, dishes.set_menu_info[num_t]);

                    // 判断如果每个菜的口味没有选中的，就默认选中第一个
                    for (var i in dishes.set_menu_info) {
                        for (var j in dishes.set_menu_info[i]) {
                            for (var k in dishes.set_menu_info[i][j]) {
                                if (dishes.set_menu_info[i][j][k].menu_flavor != '') {
                                    var num_text = 0;

                                    var is_flavor_ch = 0; // 是否有选中的口味，1是 0否
                                    for (var g in dishes.set_menu_info[i][j][k].menu_flavor) {
                                        if (dishes.set_menu_info[i][j][k].menu_flavor[g].is_choose == 1) {
                                            is_flavor_ch = 1;
                                        }
                                    }

                                    if (is_flavor_ch == 0) {
                                        for (var p in dishes.set_menu_info[i][j][k].menu_flavor) {
                                            if (num_text == 0) {
                                                dishes.set_menu_info[i][j][k].menu_flavor[p].is_choose = '1';
                                            }
                                            num_text++;
                                        }
                                    }
                                }
                            }
                        }
                    }



                    // 循环storageDataPck 删除点击减号删除的// 设置初始化数组中套餐数量标号
                    var num = 0;
                    var borrowReplaceOne = {};
                    borrowReplaceOne = dishesStackHandle(dishes.set_menu_info, borrowReplaceOne);
                    dishes.set_menu_info = {};
                    // 设置初始化数组中套餐数量标号
                    for (var i in borrowReplaceOne) {
                        dishes.set_menu_info[num] = {};
                        dishes.set_menu_info[num] = dishesStackHandle(borrowReplaceOne[i], dishes.set_menu_info[num]);
                        num++;
                    }
                }
            }
            if (!dishesClass) {
                dishesClass = {};
                dishesClass.count = num;
                dishesClass.price = Util.accMul(num, dishes.dishesPrice);
            } else {
                dishesClass.count = Util.accAdd(dishesClass.count, num);

                dishesClass.price = Util.accAdd(dishesClass.price, Util.accMul(num, dishes.dishesPrice));
            }

            // 点菜总数量和金额
            dishesTotalCount = Util.accAdd(dishesTotalCount, num);
            dishesTotalPrice = Util.accAdd(dishesTotalPrice, Util.accMul(num, dishes.dishesPrice));

            allMenuData[menu_date.menu_id] = dishes;

            allMenuData[menu_date.menu_id].count = num;
            allMenuData[menu_date.menu_id].price = parseFloat(Util.accMul(num, dishes.dishesPrice)).toFixed(2);

            classTotal[menu_date.menu_type_id] = dishesClass;
        }

        // 扫描出来的二维码处理
        function qrcodeHandle(result, dishesTotalClass, discountMoney, ary) {
            //alert(result);
            // 将返回的二十一位存到缓存中，如果未登录的情况下进行了扫描，就可以在登录后把二十一位从缓存中取出来再进行该做的事情
            //alert(result);
            var scanCode = Util.analysisScanning(result);
            //alert(scanCode+'--1');
            if (scanCode == false) {
                Message.show('#msg', '二维码有误', 3000);
                return;
            }
            //alert(scanCode);
            var scanType = scanCode.scanType, // 二维码类型
                cardId = scanCode.cardId, // 商户id
                otherId = scanCode.otherId; // 根据二维码类型对应的其他id
            // 跳转的连接里面type=0代表是扫描，scanType=2代表的是扫描类型
            if (scanType == 2) {
                tableId = otherId;
                //alert('ddd');
                // 关闭弹出层
                $.dialog.close($.dialog.id);
                saveOrder(dishesTotalClass, discountMoney, ary);
            } else {
                Message.show('#msg', '二维码有误', 3000);
                return;
            }
        }

        // 保存订单
        function saveOrder(dishesTotalClass, discountMoney, menu, is_type) {
            // 存储选择的就餐人数
            Cache.set('user_num_t', user_num);
            // 存储是否选择了自备餐具
            Cache.set('is_chopsticks_t', is_chopsticks_t);
            // 存储选择的就餐时间
            Cache.set('dinner_time', dinner_time);


            //alert(parseFloat(dishesTotalPrice).toFixed(2));
            shop_name = decodeURIComponent(Util.getQueryString('shop_name'));
            // 解析菜品得到想要的东西
            menu = menuParsing(menu);
            /*APP1
            微信2
            点菜宝3
            收银台4*/
            var trade_type = Util.isWhat()


            //alert();
            //alert(JSON.stringify(menu));
            var result;
            result = {
                'card_id': card_id, // 会员卡id
                'shop_id': shop_id, // 门店id
                'table_id': tableId, // 桌台id  21fczgbkoyy1fg0nad8nk   st1fg0nad8nk
                'table_name': tableName,
                'consume': parseFloat(menu.total).toFixed(2), // 订单消费金额
                'money': parseFloat(dishesTotalPrice).toFixed(2),
                'sum_menu_num': dishesTotalClass, // 菜品个数，不是份数
                'menu': menu.menu, // 菜品
                'order_note': null, // 订单备注信息，可以为空
                'cid': Cache.get('getCID')
            };
            // 存储到缓存中下一个页面所需要的数据
            Cache.set('disOrder', result);

            // 扫描二维码过来的多穿两个参数，用于支付页面判断是桌台模式，
            var scanCodeName = '';
            if (scanCodeType != undefined && scanCodeType == 0 && shop_type_info == 1) {
                scanCodeName = '&type=0&scanType=2';
            }
            // 订单属性： order_property 堂食1 外卖2 打包3 商城配送4
            var jump_t = 'payorder&card_id=' + card_id + '&shop_id=' + shop_id + '&table_id=' + tableId + '&table_name=' + tableName + '&shop_name=' + shop_name + '&page=dishes' + scanCodeName + '&order_property=' + order_property;

            // 未登录先登录(未登录 并且 不是在微信里面 才登陆)
            if (!$.cookie("user_mobile") && !isWeixin && !isAli) {
                Click.isLogin(true, 'payorder&card_id=' + card_id + '&shop_id=' + shop_id + '&table_id=' + tableId + '&table_name=' + tableName + '&order_property=' + order_property + '&shop_name=' + shop_name + '&backPage=' + page + '&page=');
            } else {
                if (is_type == 2) { // 外卖自提
                    Page.open(jump_t + '&pay_id=' + pay_id);
                } else {
                    // (如果缓存中是空或者没有这个缓存）并且 已登陆，就说明没有领卡，就执行领卡接口
                    if ((yesNoCard == '' || yesNoCard == undefined) && $.cookie("user_mobile")) {
                        lingka();
                    } else {
                        if (!$.cookie("user_mobile") && (isWeixin || isAli)) {
                            if (is_type == 1) { //追单过来的 is_jump_choice == 1就不跳转选择非会员选择的界面
                                if (is_jump_choice == 1) {
                                    Page.open(jump_t + '&pay_id=' + pay_id);
                                } else {
                                    // 从选择是否会员页面点击左上角，返回的页面存入缓存
                                    Cache.set('is_member_dishes', location.href.split('?')[1]);
                                    // 跳转页面，选择是会员还是不是会员
                                    Cache.set('loginReturn', jump_t + '&pay_id=' + pay_id);
                                    Page.open('nomemberlogin&is_member=1');
                                }
                            } else {
                                // 扫描桌台二维码处理
                                Util.scanTableCode(card_id, tableId, isWeixin, trade_type, 1, jump_t, tableName, shop_id);
                            }
                        } else {
                            if (is_type == 1) {
                                Page.open(jump_t + '&pay_id=' + pay_id);
                            } else {
                                // 扫描桌台二维码处理
                                Util.scanTableCode(card_id, tableId, isWeixin, trade_type, 1, jump_t, tableName, shop_id);
                            }
                        }
                    }
                }
            }

            // 执行领卡接口
            function lingka() {
                //领取会员卡
                Data.setAjax('companyCard', {
                    'card_id': card_id, // 会员卡id
                    'shop_id': shop_id,
                    'cid': cid
                }, '#layer', '#msg', { 20: '', 200215: '' }, function(respnoseText) {
                    // 如果返回20说明用户已经领过卡了，但是可能用户之前有清除过缓存，所以重新记录缓存
                    if (respnoseText.code == 20) {
                        // 已领卡存入缓存
                        Cache.set(card_id + 'yesNoCard', card_id);
                    }
                    // 如果返回200215说明用户没有领过卡，这次就领卡了，提示领取会员卡成功，并记录缓存
                    if (respnoseText.code == 200215) {
                        Message.show('#msg', '领取会员卡成功', 3000);
                        // 已领卡存入缓存
                        Cache.set(card_id + 'yesNoCard', card_id);
                    }
                    if (respnoseText.code == 20 || respnoseText.code == 200215) {
                        if (is_type == 1) {
                            // 跳转支付页面
                            Page.open(jump_t + '&pay_id=' + pay_id);
                        } else {
                            // 扫描桌台二维码处理
                            Util.scanTableCode(card_id, tableId, isWeixin, trade_type, 1, jump_t, tableName, shop_id);
                        }
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            }
            // 校验数据
            function dataCheck() {
                if (Pattern.dataTest('#user-name', '#msg', { 'empty': '不能为空', 'mobileNumber': '必须为手机号' }) &&
                    Pattern.dataTest('#login-password', '#msg', { 'empty': '不能为空', 'pass': '应为数字字母6-16位' })
                ) {
                    return true;
                }

                return false;
            }
        }

        // 解析菜品数据得到想要的数据
        function menuParsing(menu) {
            // 循环得到菜品数组
            var menuPar = new Array();
            // 循环得到菜品原价总金额
            var originalTotalPrice = 0;

            var num = 0;
            for (var i in menu) {
                for (var j in menu[i]) {
                    for (var k in menu[i][j]) {
                        //alert(menu[i][j][k].menu_num);
                        if (menu[i][j][k].menu_num == 0) {
                            continue;
                        } else {
                            menuPar[num] = menu[i][j][k];

                            var menuFlavor = {};
                            var flavorArray = new Array();
                            var flavor = {};
                            var num2 = 0;
                            for (var t in menu[i][j][k].menu_flavor) {
                                // 如果当前口味数量是0就继续下一个循环
                                if (menu[i][j][k].menu_flavor[t].flavor_count == 0) {
                                    continue;
                                } else {
                                    menuFlavor = {};
                                    menuFlavor['flavor_name'] = menu[i][j][k].menu_flavor[t].flavor_name;
                                    menuFlavor['flavor_count'] = parseFloat(menu[i][j][k].menu_flavor[t].flavor_count).toFixed(1);
                                    flavorArray[num2] = menuFlavor;
                                    //console.log(JSON.stringify(menuFlavor));
                                    //flavor[menu[i][j][k].menu_flavor[t].flavor_id] = JSON.stringify(flavorArray[0]);
                                    num2++;
                                }
                            }
                            //console.log(JSON.stringify(flavorArray));
                            menuPar[num].menu_flavor = flavorArray;

                            var menuNote = {};
                            var num1 = 0;
                            for (var r in menu[i][j][k].menu_note) {
                                // 如果当前备注是0（没有选中）就继续下一个循环
                                if (menu[i][j][k].menu_note[r].is_checked == 0) {
                                    continue;
                                } else {
                                    menuNote[num1] = menu[i][j][k].menu_note[r].note_name;
                                    //alert('tt');
                                    num1++;
                                }
                            }
                            //console.log(JSON.stringify(menuNote));
                            menuPar[num].menu_note = menuNote;

                            // 得到套餐数据
                            var num11 = 0;
                            var set_menu_info = {};
                            for (var o in menu[i][j][k].set_menu) {
                                set_menu_info[num11] = {};
                                for (var q in menu[i][j][k].set_menu[o]) {
                                    for (var e in menu[i][j][k].set_menu[o][q]) {
                                        if (menu[i][j][k].set_menu[o][q][e].is_choose == '1') {
                                            set_menu_info[num11][q] = {};
                                            set_menu_info[num11][q] = dishesStackHandle(menu[i][j][k].set_menu[o][q][e], set_menu_info[num11][q]);
                                            // 判断口味，删除不需要的东西
                                            var num16 = 0;
                                            set_menu_info[num11][q].menu_flavor = {};
                                            for (var c in menu[i][j][k].set_menu[o][q][e].menu_flavor) {
                                                if (menu[i][j][k].set_menu[o][q][e].menu_flavor[c].is_choose == '1') {
                                                    set_menu_info[num11][q].menu_flavor[num16] = {};
                                                    set_menu_info[num11][q].menu_flavor[num16].flavor_count = menu[i][j][k].set_menu[o][q][e].menu_num;
                                                    set_menu_info[num11][q].menu_flavor[num16].flavor_name = menu[i][j][k].set_menu[o][q][e].menu_flavor[c].flavor_name;
                                                    num16++;
                                                }
                                            }
                                            // 判断备注，删掉不需要的东西
                                            var num15 = 0;
                                            set_menu_info[num11][q].menu_note = {};
                                            for (var m in menu[i][j][k].set_menu[o][q][e].menu_note) {
                                                if (menu[i][j][k].set_menu[o][q][e].menu_note[m].is_choose == '1') {
                                                    set_menu_info[num11][q].menu_note[num15] = menu[i][j][k].set_menu[o][q][e].menu_note[m].note_name;
                                                    num15++;
                                                }
                                            }
                                        }
                                    }
                                }
                                num11++;
                            }

                            menuPar[num].set_menu = set_menu_info;
                            num++;
                        }

                        var num5 = 0; // 0，否，1：是
                        // 循环得到菜品原价总金额
                        for (var x in menuInfo) {
                            for (var b in menuInfo[x].menu_list) {
                                if (menuInfo[x].menu_list[b].menu_id == menu[i][j][k].menu_id) {
                                    originalTotalPrice += parseFloat(menuInfo[x].menu_list[b].menu_price) * parseFloat(menu[i][j][k].menu_num);
                                    num5 = 1;
                                    break;
                                }
                            }
                            if (num5 == 1) {
                                break;
                            }
                        }
                        //alert(originalTotalPrice);
                    }
                }
            }
            //console.log(menuPar);
            //alert(JSON.stringify(menuPar));
            //alert(originalTotalPrice);

            return {
                'menu': menuPar,
                'total': originalTotalPrice
            };
        }

        // 解决两个对象 堆栈 出现的父对象和子对象相关联的问题
        function dishesStackHandle(p, c) {
            var c = c || {};
            for (var i in p) {
                if (typeof p[i] === 'object') {
                    if (i == 'null' || i == null || p[i] == null) {
                        c[i] = {};
                    } else {
                        c[i] = (p[i].constructor === Array) ? [] : {};
                    }
                    dishesStackHandle(p[i], c[i]);
                } else {
                    c[i] = p[i];
                }
            }
            return c;
        }

        // 计算点菜总数和菜品价格
        function calDishes(count, price) {

            if (count > 0) {
                ndFooter.show();
                //$("#dishesListDialog").css("margin","-35.875rem 0 0 1%");
                ndDishesTotalCount.text(count);
                ndDishesTotalPrice.text('￥' + parseFloat(price).toFixed(2));
            } else {
                //alert('ddd');
                ndFooter.hide();
                //$("#dishesListDialog").css("margin","-35.875rem 0 0 1%");
                // 隐藏购物车图标
                $('#cart-btn').addClass('dishes-footer-round').removeClass('dishes-footer-round-upcart');
                $('#dishes-total-price').addClass('dishes-footer-big').removeClass('dishes-footer-big-right');

            }

            // 设置内容高度
            if (ndFooter.is(':hidden')) {
                ndDishesContent.height($.app.body_height - 50 + 'px');
            } else {
                ndDishesContent.height($.app.body_height - 95 + 'px');
            }
            //alert('ddd');
            dishesScroll.refresh();
            totalScroll.refresh();
        }

        // 计算分类菜品数量
        function calClassDishes(dom, count) {
            dom.find('span').remove();
            if (count > 0) {
                dom.append('<span>' + count + '</span>');
            }
        }
    };

    Dishes.prototype.bindPageEvents = function() {
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

    Dishes.prototype.unload = function() {
        /*if (orderId) {
            Update.clearMenuData('allmenu');
            Cache.del('edit_order_return_page');
            Cache.del(['order_id', 'order_type', 'shop_no', 'tab_id', 'person', 'location']);
        }*/
    };

    return Dishes;

});