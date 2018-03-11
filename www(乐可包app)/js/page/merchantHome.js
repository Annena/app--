define('page/merchantHome', [
    'base/page',
    'base/data',
    'base/scrollbar',
    'base/util',
    'base/cache',
    'base/click',
    'base/mobile',
    'base/message'
], function(Page, Data, Bar, Util, Cache, Click, Mobile, Message) {
    var MerchantHome = function() {
        this.back = '';
    }
    // 商家个人页面
    MerchantHome.prototype = new Page('merchantHome');

    MerchantHome.prototype.util = function() {
        // 如果缓存中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
         //alert('dd');
         // 通过请求PHP获取到cid
         Util.cidList();
         }*/
        // 是否领卡 ''空 未领卡，有cardid领卡，用于点菜页判断是否领卡
        var yesNoCard = '';
        var self = this;
        var newChoice = $.session.get('newChoice');
        var cardId = Util.getQueryString('card_id');
        var brand_id = $.session.get('brand_id');
        // 返回的商户数据
        var merData = '';

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli = Util.isAlipay();

        // 判断如果url链接里面有cid就从url里面取，否则就是用缓存里面的
        var cid = Cache.get('getCID');
        Cache.set('is_wx_flush', 2);
        if (Util.getQueryString('cid') != undefined) {
            cid = Util.getQueryString('cid');
            Cache.set('getCID', cid);
        }


        /*APP1
        微信2
        点菜宝3
        收银台4*/
        var trade_type = Util.isWhat();

        //alert(Util.getQueryString('type'));

        var MerchantHP = {
            // 获取到上一页面传递过来的参数 page返回地址，card_id搜索页面跳转过来的id ,listScroll列表滚动
            page: Util.getQueryString('page'),
            card_id: Util.getQueryString('card_id'),
            scanCodeType: Util.getQueryString('type'), // 扫描二维码传过来的
            scanCodeShopId: Util.getQueryString('shop_id'), // 扫描二维码传过来的
            is_new_t: Util.getQueryString('is_new'), // is_new=1从品牌店铺列表过来的
            scanRecordId: Util.getQueryString('record_id'), // 微信扫描授权会员二维码
            scanTableId: Util.getQueryString('table_id'), // 扫描桌台二维码返回6用户不同
            scanPayId: Util.getQueryString('pay_id'), // 扫描桌台二维码返回6用户不同
            scroll: null,

            init: function() {
                //alert(this.scanRecordId);
                //alert($.app.body_width);
                // 判断微信访问
                this.weixinVisit();

                //.css({'height':$('#orderingBox').height()+107});
                //alert(this.card_id);
                if (this.page != undefined) {
                    // 页面返回地址
                    self.back = this.page;
                }
                if (newChoice == 'newChoice') {
                    self.back = 'shopChoiceNew&card_id=' + this.card_id + '&brand_id=' + brand_id;
                } else {
                    self.back = 'searchBusiness';
                }


                // 扫描桌台二维码处理
                //Util.scanTableCode(this.card_id, 'st1nk515xakb', isWeixin, trade_type, '', '', '', '', '');

                // 不是微信 并且 不是客户端 并且 url 里面有桌台id，说明是浏览器
                if (!isWeixin && !$.app.isClient && this.scanTableId != undefined && this.scanTableId != '') {
                    // 扫描桌台二维码处理
                    Util.scanTableCode(this.card_id, this.scanTableId, isWeixin, trade_type);
                }

                // 判断微信扫描授权会员二维码过来
                if (isWeixin && this.scanRecordId != undefined && this.scanRecordId != '') {
                    var yesNoCard = Cache.get(this.card_id + 'yesNoCard');
                    if ((yesNoCard == '' || yesNoCard == undefined) && $.cookie("user_mobile")) {
                        // 请求领卡接口
                        this.membershipCard('ssssssssssss', 1);
                    } else {
                        // 请求授权二维码接口
                        this.authority(this.card_id, this.scanRecordId, 1);
                    }
                } else {
                    // 显示基本信息
                    this.displayList(this.card_id);
                }

                // 领取会员卡
                //this.membershipCard();

                // 绑定点击事件   在基本信息和消息都加载完了再绑定点击事件
                this.merchantBindClick();
                // 添加滑动
                this.scroll = Bar('#merchantHomeScroll');
                //this.scroll.scrollTop(0,0,100);
            },

            // 显示基本信息
            displayList: function(data) {
                var self = this;
                merData = '';
                Data.setAjax('companyInfo', {
                    'card_id': data,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                    merData = respnoseText.data;
                    if (respnoseText.code == 20) {
                        // 显示基本信息
                        self.MerchantList(merData);
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            },

            // 显示基本信息
            MerchantList: function(data) {
                var self = this;
                Cache.set('card_id', data.card_id);

                // 判断微信扫描桌台二维码通过app.php跳转过来，得到table_id或pay_id有值说明用户不同报错
                if (isWeixin && ((this.scanTableId != undefined && this.scanTableId != '') || (this.scanPayId != undefined && this.scanPayId != ''))) {
                    Message.show('#msg', '订单属于其他会员，绑定失败！', 2000);
                }
                //如果是微信或者是支付宝，隐藏返回按钮，显示我的按钮
                if (isWeixin || isAli) {
                    $('#merchantHome-back').addClass('hide')
                        //如果未登录，不显示我的按钮
                    if (data.stored_balance == undefined && data.integral_balance == undefined && data.discount_rate == undefined && data.voucher_num == undefined) {

                    } else {
                        $('#myBtnDiv').removeClass('hide')
                    }

                }
                // 判断商户背景
                if (data.company_background == 0) {
                    $('#userBac').addClass('shop-header-none');
                    $('#userBac').css({ 'background': '#ffffff url(../../img/business/' + data.card_id + '/company_background.jpg?' + Util.handle_version() + ') repeat-x 0px -1px', 'background-size': '106%' });
                };
                if (data.company_background == 1) {
                    $('#userBac').addClass('shop-header');
                };

                if (data.company_background == 2) {
                    $('#userBac').addClass('shop-header-two');
                };

                if (data.company_background == 3) {
                    $('#userBac').addClass('shop-header-three');
                };


                // 是否会员 0：否，1：是
                if (data.is_authority == 0 || data.is_authority == undefined) {
                    $('#merchantLogo i').addClass('hide');
                    $('#shop-logo-img').removeClass('shop-logo-img-v');
                    $('#shop-logo-img').addClass('shop-logo-img');

                    if (data.is_logo == 0) {
                        $('#merchantLogo').removeClass('shop-toplogo-v');
                        $('#merchantLogo').addClass('shop-toplogo');
                    } else {
                        $('#merchantLogo').removeClass('shop-logo-v');
                        $('#merchantLogo').addClass('shop-logo');
                        // 商户页logo
                        $('#shop-logo-img').attr('src', '../../img/business/' + this.card_id + '/logo.jpg?' + Util.handle_version());
                    }
                } else if (data.is_authority == 1) {
                    $('#merchantLogo i').removeClass('hide');
                    $('#shop-logo-img').addClass('shop-logo-img-v');
                    $('#shop-logo-img').removeClass('shop-logo-img');

                    if (data.is_logo == 0) {
                        $('#merchantLogo').removeClass('shop-toplogo');
                        $('#merchantLogo').addClass('shop-toplogo-v');
                    } else {
                        $('#merchantLogo').removeClass('shop-logo');
                        $('#merchantLogo').addClass('shop-logo-v');
                        // 商户页logo
                        $('#shop-logo-img').attr('src', '../../img/business/' + this.card_id + '/logo.jpg?' + Util.handle_version());
                    }
                }

                $('title').text('商户首页');
                // 商户名称
                $('#merchantName').text(data.card_name);
                // 写入商铺名称
                //写入商户名称缓存
                Cache.set('shop-cardname', data.card_name);
                // 判断用户是否登录，如果未登录的话只返回基本信息
                if (!$.cookie("user_mobile")) {
                    $('#headerbackground').height('15.8rem');
                        // 是微信的话，最终从登陆只能返回到商户页面，不能返回到卡包首页
                    if (isWeixin || isAli) {
                        $('#moneyDisplay').html('<div class="zhucecard" rel="merchantHome&card_id=' + this.card_id + '&page=merchantHome,true">登录</div><p class="login_register">没有账户？<span data-login>注册<span></p>');
                    } else {
                        // 隐藏会员卡余额等信息
                        //$('#moneyDisplay').addClass('hide');
                        $('#moneyDisplay').html('<div class="zhucecard" rel="merchantHome&card_id=' + this.card_id + '&page=searchBusiness,true">登录</div><p class="login_register">没有账户？<span data-login>注册<span></p>');
                    }
                    //点击注册跳转
                    $('.login_register span[data-login]').unbind('click').bind('click', function() {
                        Page.open('register&page=merchantHome');
                    });
                } else {
                    // 如果储值余额，积分余额，折扣，抵用劵都没有返回，说明未领卡
                    if (data.stored_balance == undefined && data.integral_balance == undefined && data.discount_rate == undefined && data.voucher_num == undefined) {
                        // 存储未领卡缓存
                        Cache.set(self.card_id + 'yesNoCard', '');
                        // 如果从URL传过来的type不是undefined并且是0，说明他是扫描二维码过来的
                        if (self.scanCodeType != undefined && self.scanCodeType == 0) {
                            // 领卡
                            self.membershipCard(self.scanCodeShopId);
                        } else {
                            //$('#moneyDisplay').html('<div class="zhucecard" id="ledCard">领卡</div>');
                            // 账户信息隐藏
                            $('#noledCard').addClass('hide');
                            // 领卡按钮显示出来
                            $('#ledCard').removeClass('hide');
                            // 领卡的点击事件
                            $('#ledCard').unbind('click').bind('click', function() {
                                //alert('t');
                                self.membershipCard('ssssssssssss');
                            });
                            yesNoCard = '';
                        }
                    } else {
                        // 存储领卡缓存
                        Cache.set(self.card_id + 'yesNoCard', self.card_id);
                        yesNoCard = self.card_id;
                        if (data.is_del == 1) { // is_del 0：未冻结，1：已冻结
                            // 账户信息隐藏
                            $('#noledCard').addClass('hide');
                            // 账户冻结信息显示出来
                            $('#frozen').removeClass('hide');
                        } else {
                            // 显示会员卡余额等信息
                            $('#moneyDisplay').removeClass('hide');
                            //alert(data.stored_balance);
                            // 储值余额
                            var storedbalance = parseFloat(data.stored_balance);
                            var discountrate = parseInt(data.discount_rate);
                            var vouchernum = parseInt(data.voucher_num);
                            var integralbalance = parseInt(data.integral_balance);

                            if (storedbalance == 0) {
                                $('#recharge').addClass('hide');
                            }

                            if (discountrate == 100) {
                                $('#discountPro').addClass('hide');
                            }

                            if (vouchernum == 0) {
                                $('#vouchers').addClass('hide');
                            }

                            if (integralbalance == 0) {
                                $('#integraltxt').addClass('hide');
                            }

                            $('#surplusMoney').text(storedbalance);
                            // 折扣
                            $('#discount').text(discountrate / 10 + '折');
                            // 抵用劵
                            $('#coupons').text(vouchernum);
                            // 积分
                            $('#integral').text(integralbalance);
                        }
                    }
                }


                /*is_shop_order     是否支持餐厅堂食：1是 0否
                is_shop_takeout     是否支持外卖送餐：1是 0否
                is_shop_pack        是否支持门店自取：1是 0否
                is_store_order      是否支持商城现取：1是 0否
                is_store_takeout    是否支持商城配送：1是 0否
                is_store_pack       是否支持商城打包：1是 0否*/

                var company_config = {
                        'is_shop_order': data.is_shop_order,
                        'is_shop_takeout': data.is_shop_takeout,
                        'is_shop_pack': data.is_shop_pack,
                        'is_store_order': data.is_store_order,
                        'is_store_takeout': data.is_store_takeout,
                        'is_store_pack': data.is_store_pack
                    }
                    // 存储商户配置缓存，外卖自提、商城要用
                Cache.set('company_config', company_config);

                // is_menu是否设置过菜品，0没有，1有，没有设置过按钮变灰色，设置过就不是灰色
                if (data.is_menu == 0 || data.is_del == 1 || data.is_shop_order == 0) {
                    $('#isMenu').addClass('h_meal-icon');
                } else {
                    $('#isMenu').removeClass('h_meal-icon');
                }
                // is_stored是否设置过储值卡，0没有，1有，没有设置过按钮变灰色，设置过就不是灰色
                if (data.is_stored == 0 || data.is_del == 1) {
                    $('#isStored').addClass('h_storedvalue-icon');
                } else {
                    $('#isStored').removeClass('h_storedvalue-icon');
                    // 储值有未读消息就显示小红点
                    if (data.u_user > 0) {
                        $('#isStored').html('<div class="new_tip_circle"></div>');
                    } else {
                        $('#isStored').html('');
                    }
                }
                // is_voucher是否设置过抵用劵，0没有，1有，没有设置过按钮变灰色，设置过就不是灰色
                if (data.is_voucher == 0 || data.is_del == 1) {
                    $('#isVoucher').addClass('h_collar-icon');
                } else {
                    $('#isVoucher').removeClass('h_collar-icon');
                    // 抵用劵有未读消息就显示小红点
                    if (data.u_voucher > 0) {
                        $('#isVoucher').html('<div class="new_tip_circle"></div>');
                    } else {
                        $('#isVoucher').html('');
                    }
                }
                if (data.is_integral == 0) {
                    $('.integral-icon').addClass('h_order-icon');
                } else {
                    $('.integral-icon').removeClass('h_order-icon');
                }

                // 如果用户被冻结，支付就灰色
                if (data.is_del == 1) {
                    $('#isPay').addClass('h_pay-icon');
                    $('#isReviews').addClass('h_reviews-icon');
                } else {
                    $('#isPay').removeClass('h_pay-icon');
                    $('#isReviews').removeClass('h_reviews-icon');
                    // 订单/点评有未读消息就显示小红点
                    if (data.u_comment > 0) {
                        $('#isReviews').html('<div class="new_tip_circle"></div>');
                    } else {
                        $('#isReviews').html('');
                    }
                }

                // 如果商城不可用添加样式 h_order-icon
                // 没有设置过按钮变灰色，设置过就不是灰色
                if (data.store_shop == undefined || data.store_shop.shop_id == undefined || data.store_shop.shop_id == '' || data.is_del == 1) {
                    $('#isTiaoyong').addClass('h_order-icon');
                } else {
                    $('#isTiaoyong').removeClass('h_order-icon');
                }
                // 如果外卖自提不可用添加样式 h_take-icon
                // 没有设置过按钮变灰色，设置过就不是灰色
                if ((data.is_shop_takeout == 0 && data.is_shop_pack == 0) || data.is_del == 1) {
                    $('#isTake').addClass('h_meal-icon');
                } else {
                    $('#isTake').removeClass('h_meal-icon');
                }
                // 如果打赏不可用添加样式 h_reward-icon

                // 商户页消息的显示
                this.newslistPage(data.news);
            },

            // 最新消息的显示
            newslistPage: function(data) {
                var content = '';
                // 获取到时间戳转换的年月日
                var post_time = null;
                // 是否有未读最新消息 0 否 1 是
                var new_tips = 0;
                // 未读消息红点
                var is_new = '';
                //alert(card_id);
                for (var i in data) {
                    // 0 未读 1 已读 并且已登陆
                    if ((data[i].is_new == 0 || data[i].is_new == undefined) && $.cookie("user_mobile")) {
                        is_new = '<div class="new_tip_circle"></div>';
                        new_tips = 1;
                    } else {
                        is_new = '';
                    }
                    post_time = Util.getLocalDate(data[i].post_time);
                    content += '<div class="news-list-lie" data-type="newsid" news_id="' + data[i].news_id + '">' +
                        '<div class="list-avatar">' +
                        is_new +
                        (data[i].is_image == 0 ? '<img src="../../img/base/no-pic.png" data-src-retina="../../img/base/card-full.png" class="j-poi-pic avatar-img">' :
                            '<img src="../../img/business/' + this.card_id + '/news/' + data[i].news_id + '.jpg" data-src-retina="../../img/base/card-full.png" class="j-poi-pic avatar-img">'
                        ) +
                        '</div>' +
                        '<div class="content">' +
                        '<div class="news-list-topic">' + data[i].news_title + '</div>' +
                        '<div class="news-list-time">' + post_time + '</div>' +
                        '</div>' +
                        '</div>';
                }

                // 添加到页面中
                $('#merchantNews').html(content);
                // 如果有未读消息 并且已登陆，显示未读消息文字
                if (new_tips == 1 && $.cookie("user_mobile")) {
                    $('#new_tips').removeClass('hide');
                } else {
                    $('#new_tips').addClass('hide');
                }


                // 刷新滚动
                this.scroll.refresh();
                // 绑定点击事件   在基本信息和消息都加载完了再绑定点击事件
                //this.merchantBindClick();
            },

            // 领取会员卡
            membershipCard: function(shopId, is_scan) {
                var _self = this;
                Data.setAjax('companyCard', {
                    'card_id': _self.card_id, // 会员卡id
                    'shop_id': shopId,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', { 20: '', 200215: '' }, function(respnoseText) {
                    // 如果返回20说明用户已经领过卡了，但是可能用户之前有清除过缓存，所以重新记录缓存
                    if (respnoseText.code == 20) {
                        // 已领卡存入缓存
                        Cache.set(_self.card_id + 'yesNoCard', _self.card_id);
                        //window.location.reload();
                    }
                    // 如果返回200215说明用户没有领过卡，这次就领卡了，提示领取会员卡成功，并记录缓存
                    if (respnoseText.code == 200215) {
                        Message.show('#msg', '领取会员卡成功', 3000);
                        Cache.set(_self.card_id + 'yesNoCard', _self.card_id);
                        //window.location.reload();
                    }

                    // 是否授权会员二维码过来的
                    if (is_scan != 1) {
                        if (respnoseText.code == 20 || respnoseText.code == 200215) {
                            window.location.search = 'merchantHome&card_id=' + _self.card_id;
                        } else {
                            Message.show('#msg', respnoseText.message, 2000);
                        }
                    } else {
                        if (respnoseText.code != 20 && respnoseText.code != 200215) {
                            Message.show('#msg', respnoseText.message, 2000);
                        }
                        // 请求授权二维码接口
                        _self.authority(_self.card_id, _self.scanRecordId, 1);
                    }
                }, 2);
            },

            // 绑定点击事件
            merchantBindClick: function() {
                var _self = this;
                // 消息的点击事件
                $('#merchantNews').delegate('div[data-type="newsid"]', 'click', function() {
                    var newsId = $(this).attr('news_id');
                    //alert('tt');
                    Page.open('messageDetails&card_id=' + _self.card_id + '&news_id=' + newsId + '&page=merchantHome');
                });

                // 可以用以下的点击事件，也可以在页面中用rel
                // 点餐的点击事件
                $('#dishes').unbind('click').bind('click', function() {
                    if (merData.is_menu == 0 || merData.is_del == 1 || merData.is_shop_order == 0) { // is_menu是否设置过菜品，0没有，1有
                        return;
                    } else {
                        // 把是否领卡存储到缓存，到菜品页面取出来
                        Cache.set(_self.card_id + 'yesNoCard', yesNoCard);
                        // 如果从URL传过来的type不是undefined并且是0，说明他是扫描二维码过来的
                        if ((_self.scanCodeType != undefined && _self.scanCodeType == 0) || _self.is_new_t == 1) {
                            // 直接跳转到点餐
                            Page.open('dishes&card_id=' + _self.card_id + '&shop_id=' + _self.scanCodeShopId + '&page=merchantHome');
                        } else if (newChoice == 'newChoice') {
                            var card_id = $.session.get('card_id');
                            var scanCodeShopId = $.session.get('shop_id');
                            Page.open('dishes&card_id=' + card_id + '&shop_id=' + scanCodeShopId + '&page=merchantHome');
                        } else {
                            // 跳转到选店
                            //Click.isLogin(true, 'shopChoice&card_id='+_self.card_id+'&page=merchantHome');
                            Page.open('shopChoice&card_id=' + _self.card_id + '&page=merchantHome');
                        }
                    }
                });
                $('#myBtnDiv').unbind('click').bind('click', function() {
                    Page.open('userinfo&page=merchantHome&card_id='+_self.card_id);
                });
                // 外卖自提的点击事件
                $('#takeaway').unbind('click').bind('click', function() {
                    if ((merData.is_shop_takeout == 0 && merData.is_shop_pack == 0) || merData.is_del == 1) { // is_del是否冻结，0未冻结，1已冻结
                        return;
                    } else {
                        Page.open('takeaway&card_id=' + _self.card_id + '&page=merchantHome');
                    }
                });

                // 商城的点击事件
                $('#tiaoyong').unbind('click').bind('click', function() {
                    if (merData.store_shop == undefined || merData.store_shop.shop_id == undefined || merData.store_shop.shop_id == '' || merData.is_del == 1) { // is_del是否冻结，0未冻结，1已冻结
                        return;
                    } else {
                        // 存储就餐时间、起送金额需要的参数
                        var business_time = {
                            'open_time': merData.store_shop.open_time,
                            'close_time': merData.store_shop.close_time,
                            'dinner_time_type': merData.store_shop.dinner_time_type,
                            'dinner_time_offset': merData.store_shop.dinner_time_offset,
                            'minimum_pack': merData.store_shop.minimum_pack,
                            'minimum_store': merData.store_shop.minimum_store,
                            'minimum_takeout': merData.store_shop.minimum_takeout
                        }
                        Cache.set('business_time', business_time);
                        // 跳转点菜页面
                        Page.open('dishes&card_id=' + _self.card_id + '&shop_id=' + merData.store_shop.shop_id + '&shop_name=&page=merchantHome&order_property=4');
                    }
                });

                // 支付的点击事件
                $('#payQuick').unbind('click').bind('click', function() {
                    if (merData.is_del == 1) {
                        return;
                    } else {
                        // 未登录并且是在微信可以直接显示订单列表
                        if (!$.cookie("user_mobile") && (isWeixin || isAli)) {
                            Page.open('payQuick&card_id=' + _self.card_id + '&page=merchantHome');
                        } else {
                            Click.isLogin(true, 'payQuick&card_id=' + _self.card_id + '&page=merchantHome');
                        }
                    }
                });

                // 储值的点击事件
                $('#storedValue').unbind('click').bind('click', function() {
                    if (merData.is_stored == 0 || merData.is_del == 1) { // is_stored是否设置过储值卡，0没有，1有
                        return;
                    } else {
                        // 未登录直接可以进去储值看有哪些储值卡
                        if (!$.cookie("user_mobile")) {
                            Page.open('storedValue&card_id=' + _self.card_id + '&page=merchantHome');
                        } else {
                            Click.isLogin(true, 'storedValue&card_id=' + _self.card_id + '&page=merchantHome');
                        }
                    }
                });

                // 抵用劵的点击事件
                $('#merchantVouchers').unbind('click').bind('click', function() {
                    if (merData.is_voucher == 0 || merData.is_del == 1) { // is_voucher是否设置过抵用劵，0没有，1有
                        return;
                    } else {
                        Click.isLogin(true, 'vouchersList&card_id=' + _self.card_id + '&page=merchantHome');
                    }
                });

                // 积分的点击事件
                $('#integralCenter').unbind('click').bind('click', function() {
                    //判断用户是否设置了积分获取规则，没有则不可点击
                    if (merData.is_integral == 0) {
                        $('.integral-icon').addClass('h_order-icon'); //按钮变灰
                        return;
                    } else {
                        // if(this.attr('data-id') == 'noClick'){

                        // }
                        Page.open('IntegralCenterlist&card_id=' + _self.card_id + '&page=merchantHome');

                    }
                });

                // 点评的点击事件
                /*$('#comment').unbind('click').bind('click', function () {
                 Click.isLogin(true, 'orderlist&card_id='+_self.card_id+'&page=merchantHome&order_list_type=2');
                 });*/

                // 订单的点击事件
                $('#orderlist').unbind('click').bind('click', function() {
                    if (merData.is_del == 1) {
                        return;
                    } else {
                        // 未登录并且是在微信可以直接显示订单列表
                        if (!$.cookie("user_mobile") && (isWeixin || isAli)) {
                            Page.open('orderlist&card_id=' + _self.card_id + '&page=merchantHome&order_list_type=1');
                        } else {
                            Click.isLogin(true, 'orderlist&card_id=' + _self.card_id + '&page=merchantHome&order_list_type=1');
                        }
                    }
                });

                // 店铺列表的点击事件
                $('#shopList').unbind('click').bind('click', function() {
                    Page.open('shopList&card_id=' + _self.card_id + '&page=merchantHome');
                });

                // 点击二维码扫描
                $('#scanning').unbind('click').bind('click', function(e) {
                    /*var scanType = 1,
                     cardId = 'cc1fczgbkoyy',
                     otherId = 'ss1fj2570hd2';

                     window.location.search='merchantHome&card_id='+cardId+'&shop_id='+otherId+'&page=merchantHome&type=0&scanType=1';*/
                    //Page.open('merchantHome&card_id='+cardId+'&shop_id='+otherId+'&page=merchantHome&type=0&scanType=1');

                    // 不是微信就请求客户端
                    if (!isWeixin && !isAli) {
                        Mobile.scanner('将二维码放入框内', 1, function(result) {
                            // 扫描得到的二维码处理
                            _self.qrcodeHandle(result);
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
                                    _self.qrcodeHandle(result.qrCode);
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
                    } else {
                        wx.scanQRCode({
                            needResult: 1, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果
                            //scanType:["qrCode","barCode"],// 可以指定扫二维码还是一维码，默认二者都有
                            //desc: 'scanQRCode desc',// 二维码描述
                            success: function(res) {
                                //Message.show('#msg', JSON.stringify(res), 3000);
                                var result = res.resultStr;
                                // 扫描得到的二维码处理
                                _self.qrcodeHandle(result);
                            }
                        });
                    }
                });
            },

            // 扫描得到的二维码处理
            qrcodeHandle: function(result) {
                var selfq = this;
                // 将返回的二十一位存到缓存中，如果未登录的情况下进行了扫描，就可以在登录后把二十一位从缓存中取出来再进行该做的事情
                //alert(result);
                var scanCode = Util.analysisScanning(result);

                if (scanCode == false) {
                    Message.show('#msg', '二维码有误', 3000);
                    return;
                } else {
                    var scanType = scanCode.scanType, // 二维码类型
                        cardId = scanCode.cardId, // 商户id
                        otherId = scanCode.otherId; // 根据二维码类型对应的其他id
                    //alert(scanType+'---'+cardId+'----'+otherId);
                    // 跳转的连接里面type=0代表是扫描，scanType=2代表的是扫描类型

                    if (scanType == 1) {
                        // 商户二维码    shop_id 跳转商户页面  window.location.search刷新当前页面但是只改变当前页面后面带的参数，无法跳转页面
                        window.location.search = 'merchantHome&card_id=' + cardId + '&shop_id=' + otherId + '&page=merchantHome&type=0&scanType=1';
                    } else if (scanType == 2) {
                        // 桌台二维码   table_id 跳转点菜页面
                        //Page.open('dishes&card_id='+cardId+'&table_id='+otherId+'&page=merchantHome&type=0&scanType=2');
                        // 扫描桌台二维码处理
                        Util.scanTableCode(cardId, otherId, isWeixin, trade_type);
                    } else if (scanType == 3) {
                        // 储值二维码   record_id 跳转储值页面
                        Click.isLogin(true, 'storedValue&card_id=' + cardId + '&record_id=' + otherId + '&page=merchantHome&type=0&scanType=3');
                    } else if (scanType == 4) {

                        // 扫描预结结账二维码处理
                        Util.scanTableCode(cardId, otherId, isWeixin, trade_type, '', '', '', '', 1);

                        // 结账单二维码  pay_id
                        // 是微信 并且 未登录 跳转到 非会员在线支付页面
                        /*if (isWeixin && !$.cookie("user_mobile")) {
                            Cache.set('loginReturn', 'payorder&card_id='+cardId+'&pay_id='+otherId+'&page=merchantHome&type=0&scanType=4');
                            Page.open('nomemberlogin');
                        } else {
                            Click.isLogin(true,'payorder&card_id='+cardId+'&pay_id='+otherId+'&page=merchantHome&type=0&scanType=4');
                        }*/
                    } else if (scanType == 5) {
                        // 快捷支付订单二维码   order_id
                        Click.isLogin(true, 'payorder&card_id=' + cardId + '&order_id=' + otherId + '&page=merchantHome&type=0&scanType=5');
                    } else if (scanType == 6) {
                        // 扫描授权二维码请求接口
                        selfq.authority(cardId, otherId);
                    } else if (scanType == 7) {
                        // 扫描推荐在线售储值卡员工 a_user_id
                        Page.open('storedValue&card_id=' + cardId + '&a_user_id=' + otherId + '&page=merchantHome&type=0&scanType=7');
                    }
                }
            },

            // 扫描授权二维码请求接口
            authority: function(cardId, otherId, is_scan) {
                var selfa = this;
                Data.setAjax('accountMemberAuthority', {
                    'card_id': cardId, // 会员卡id
                    'record_id': otherId,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                    // 是否授权会员二维码过来的
                    if (is_scan != 1) {
                        if (respnoseText.code == 20) {
                            Message.show('#msg', respnoseText.message, 2000, function() {
                                window.location.reload();
                            });
                        } else {
                            Message.show('#msg', respnoseText.message, 2000);
                        }
                    } else {
                        Message.show('#msg', respnoseText.message, 2000, function() {
                            // 显示基本信息
                            selfa.displayList(cardId);
                        });
                    }
                }, 2);
            },

            // 判断微信访问
            weixinVisit: function() {
                var self = this;
                if (isWeixin || isAli) {
                    $('#download').removeClass('hide');

                    // 左上角箭头按钮隐藏
                    $('#merchantHome-back').addClass('hide');

                    $('#download').unbind('click').bind('click', function() {
                        window.location = phpDownload;
                    });

                    // 得到签名数据
                    Data.setAjax('companyShare', {
                        'card_id': self.card_id,
                        'url': location.href,
                        'cid': cid
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
                    $('#download').addClass('hide');
                    $('#merchantHome-back').removeClass('hide');
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
                });
                wx.error(function(res) { // 通过error接口处理失败验证
                    //alert(res.errMsg+"??????????");
                });
            }
        }
        MerchantHP.init();
    }

    MerchantHome.prototype.bindPageEvents = function() {
        // 获取到屏幕宽度，赋值给页面
        //$('#merchantHomeScroll').attr('style','width:'+$.app.body_width+';')
        $('#merchantHomeScroll').width($.app.body_width);
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

    return MerchantHome;

});