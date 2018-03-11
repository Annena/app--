define('base/config', function() {

    var apiLink = location.href.split('//')[1].split('/')[0];
    //http://www.lekabao.net/ interface.lekabao.net
    var index = wxConfig;
    //var index = 'http://api.'+apiLink+'/vxtest/';
    //var index = 'http://'+apiLink+'/html/api/';
    //var index = '/';
    var map = {
        userCid: index +                'user/cid.php',             // 获取cid

        login: index +                  'user/login.php',           // 登陆
        register: index +               'user/register.php',        // 注册
        logout: index +                 'user/logout.php',          // 退出登录

        userChange: index +             'user/change.php',          // 修改密码

        userSoft: index +               'user/soft.php',            // 软件版本

        orderGetOpenid: index +         'order/get_openid.php',     // 获取openid

        userIndex: index +              'user/index.php',           // 文件版本

        feedbackPost: index +           'feedback/post.php',        // 意见反馈发表反馈
        feedbackList: index +           'feedback/list.php',        // 反馈列表
        feedbackDel: index +            'feedback/del.php',         // 删除反馈

        feedback_add: index +           'feedback/add.php',         // 加盟反馈

        sms: index +                    'user/sms.php',             // 获取短信验证码

        cardList: index +               'card/list.php',            // 用户会员卡列表

        searchCard: index +             'search/card.php',          // 搜索商户
        searchHot: index +              'search/hot.php',           // 热门搜索关键词读取

        companyCard: index +            'company/card.php',         // 领取会员卡接口

        companyInfo: index +            'company/info.php',         // 商户个人页读取
        companyShop: index +            'company/shop_order.php',   // 堂食门店列表接口
        companyShop_takeout: index +    'company/shop_takeout.php', // 外卖自提门店列表接口
        companySop_list: index +        'company/shop_list.php',    // 店铺列表接口
        companyNewsList: index +        'company/news_list.php',    // 商户消息读取
        companyNews: index +            'company/news.php',         // 商户消息详情
        companyWriteNum: index +        'company/write_num.php',    // 商户消息访问量

        companyBrandShop: index +       'company/brand_shop.php',   // 新品牌门店列表接口

        companyMenu: index +            'company/menu.php',         // 门店菜品信息读取

        orderList: index +              'order/list.php',           // 用户订单列表

        orderPayInfo: index +           'order/info_submit.php',    // 支付页-读取账户及优惠信息
        orderSubmit: index +            'order/pay_submit.php',     // 支付页-提交订单
        orderInfo: index +              'order/info.php',           // 读取单个订单信息

        commentPost: index +            'comment/post.php',         // 发表订单点评
        commentList: index +            'comment/list.php',         // 读取订单点评
        commentDel: index +             'comment/del.php',          // 删除订单点评

        accountInfo: index +            'account/info.php',         // 储值-读取用户账户余额
        accountRecharge: index +        'account/recharge.php',     // 进行账户储值
        accountStored: index +          'account/stored.php',       // 储值卡立即购买接口

        voucherList: index +            'voucher/list.php',         // 用户有效抵用劵读取接口

        companyTable: index +           'company/table.php',        // 扫描桌台二维码获取桌台详情接口
        orderQuickOrder: index +        'order/quick_order.php',    // 扫描快捷支付订单获取快捷支付订单详情接口
        orderScanOrder: index +         'order/info_scan.php',      // 用户扫描结账单绑定订单接口

        orderQuickPay: index +          'order/quick_pay.php',      // 快捷支付订单支付接口
        orderScanPay: index +           'order/pay.php',            // 结账单支付接口
        orderOrderPay: index +          'order/pay.php',            // app快捷支付未支付订单支付接口

        accountMemberAuthority: index + 'account/member_authority.php', // 扫描授权会员二维码

        orderCancelOrder: index +       'order/cancel_order.php',   // 取消订单接口

        wxpayScanOrder: index +         'order/info_scan.php',      // 非会员登陆获取订单详情
        wxpayScanPay: index +           'order/pay.php',            // 非会员登陆微信下单
        wxpayResetWxpay: index +        'order/reset_epay.php',     // 非会员取消微信支付接口

        guestPayInfo: index +           'order/info_submit.php',    // 未登录显示详情接口
        guestSubmit: index +            'order/submit.php',         // 未登录下单接口
        guestList: index +              'order/list.php',           // 未登录cid订单列表
        guestInfo: index +              'order/info.php',           // 未登录订单详情信息

        commentLiked: index +           'comment/liked.php',        // 点赞接口

        companyMenuCollect: index +     'company/menu_collect.php', // 收藏接口
        electronic_invoice: index +     'electronic_invoice/submit.php', //发票接口
        companyShare: index +           'company/share.php',        // 分享请求接口得到签名

        orderScanTable: index +         'guest/scan_table.php',     // 用户扫描桌台号接口得到桌台上订单状态
        guestScanPay: index +           'guest/scan_pay.php',       // 用户扫描预结结账单接口得到桌台上订单状态

        pay_scan: index +               'order/pay.php',            //未登录支付接口

        address_list: index +           'address/list.php',         //外卖用户地址列表查询
        save_addr: index +              'address/save_addr.php',    //外卖用户地址新增
        info_addr: index +              'address/info.php',         //外卖用户地址详情
        delete_addr: index +            'address/delete_addr.php',  //外卖地址删除
        update_addr: index +            'address/update_addr.php',  //用户地址修改
        default_addr: index +           'address/set_default_addr.php', //外卖地址用户设置为默认,

        userInfo: index +               'user/info.php',            // 查询用户信息接口
        userUpdateInfo: index +         'user/update_info.php',      //  修改用户个人信息

        accountIntegral: index +        'account/integral.php',     //获取积分中心积分数据

        accountIntegralRule: index +    'account/get_integral_rule.php', //获取积分规则接口

        accountIntegralExchange: index +'account/integral_exchange.php ',//  积分兑换

        accountUserRecord: index +      'account/user_record.php',  // 获取积分中心列表数据



    };

    return {
        api: function(key) {
            return map[key] ? map[key] : undefined;
        }
    };

});