define('base/util',[
    'base/data',
    'base/cache',
    'base/config',
    'base/message'
], function (Data, Cache, Config, Message) {
    var trade_type = '';
    
    // 获取cid
    function cidList() {
        //alert('dddddddddddddd');
        Data.setAjax('userCid', '', '#layer', '#msg', {20: ''}, function (respnoseText) {
            // 获取到的cid放到缓存中
            Cache.set('getCID', respnoseText.data);
        }, 1);
    }

    // 获取拼接成的请求openid的链接
    function obtain_openid(type, card_id, trade_type) {
        var getCID = Cache.get('getCID');
        var url = Config.api('orderGetOpenid')+'?openid_type='+type+'&card_id='+card_id+'&trade_type='+trade_type+'&cid='+getCID;

        return url;
    }

    // openid构建方法
    function openid_structure(type) {
        var openid_type = getQueryString('openid_type');
        if (openid_type && openid_type != '' && type != 1) {
            // 跳转回来存储数据
            openid_establish(openid_type);
            return;
        }

        // 没有card_id，不掉用
        var card_id = getQueryString('card_id');
        if (card_id == undefined || card_id == '' || card_id == 'undefined') {
            return false;
        }

        // 没有card_id的页面，不调用
        var PageNo = ['searchBusiness','homeCard','login','forgetPwd','register','userinfo','cardList','honorarymember','systemSet','feedback','affiliate','cooperative','personal'];
        var is_card_id = 0;// 是否没有card_id的页面
        for (var i in PageNo) {
            if (location.href.indexOf('?'+PageNo[i]) != -1) {
                is_card_id = 1;
            }
        }
        if (is_card_id == 1) {
            return false;
        }

        // 是否登录，通过php在登录之后存储的user_id判断
        var is_sign = $.cookie("user_id") ? 1 : 0;
        // 是否微信
        var is_wx = isWeixin();

        // 不在微信里面 就退出
        if (!is_wx) {
            return false;
        }
        // 未登录 并且 不是支付页面 就退出
        /*if (is_sign == 0 && location.href.indexOf('?payorder') == -1) {
            return false;
        }*/

        // 读取本地缓存的openid
        var openid_cid = Cache.get('openid');
        var openid_card_id = Cache.get('openid_'+card_id);
        // 获取当前时间的时间戳
        var this_time = dateTotTime(getLocalDateMin());

        // 判断不是当天就过期
        var main_time = getReturnTime(this_time);
        var main_time1 = openid_cid != undefined ? getReturnTime(openid_cid['time']) : 0;
        var main_time2 = openid_card_id != undefined ? getReturnTime(openid_card_id['time']) : 0;
        if (main_time1 != 0 && main_time1.date != main_time.date) {
            Cache.del('openid');openid_cid = undefined;
        }
        if (main_time1 != 0 && main_time1.date != main_time.date) {
            Cache.del('openid_'+card_id);openid_card_id = undefined;
        }

        var one_hour = 3600,// 一小时
            one_minute = 60,// 一分钟
            is_hour = 0,    // 是否一小时之内
            is_minute = 0;  // 是否一分钟之内
        // 判断是否一小时、是否一分钟之内
        var time_cid = this_time - (openid_cid != undefined ? parseFloat(openid_cid['time']) : 0);
        if (time_cid > one_hour) {is_hour = 1;}
        if (time_cid > one_minute) {is_minute = 1;}

        $('#iframe_openid_cid').attr('src', '');
        if (openid_cid == undefined || (openid_cid['openid'] == 'NO' && is_hour == 0) || (openid_cid['openid'] == 'ERROR' && is_minute == 0)) {
            //$.cookie('html_url_1', phpJump + 'html/openid.html?type=1&card_id=' + card_id+'&url='+encodeURI(location.href.split('?')[1]), { path: '/', domain: '.lekabao.net' });

            $.cookie('html_url_1', phpJump + 'html/index.html?' + location.href.split('?')[1] + '&e_type='+type+'&openid_type=1', { path: '/', domain: '.lekabao.net' });
            // 请求获取openid接口
            get_openid_ajax(card_id, 1);
            // window.location = obtain_openid(1, card_id, 'JSAPI');
            // 在隐藏域调用get_openid
            // $('#iframe_openid_cid').attr('src', obtain_openid(1, card_id, 'JSAPI'));//phpJump + 'html/openid.html?is_iframe=1&card_id=' + card_id
        } else {
            is_hour = 0,is_minute = 0;
            // 判断是否一小时、是否一分钟之内
            var time_card_id = this_time - (openid_card_id != undefined ? parseFloat(openid_card_id['time']) : 0);
            if (time_card_id > one_hour) {is_hour = 1;}
            if (time_card_id > one_minute) {is_minute = 1;}

            $('#iframe_openid_card_id').attr('src', '');
            if (openid_card_id == undefined || (openid_card_id['openid'] == 'NO' && is_hour == 0) || (openid_card_id['openid'] == 'ERROR' && is_minute == 0)) {
                //$.cookie('html_url_2', phpJump + 'html/openid.html?type=2&card_id=' + card_id+'&url='+encodeURI(location.href.split('?')[1]), { path: '/', domain: '.lekabao.net' });
                $.cookie('html_url_2', phpJump + 'html/index.html?' + location.href.split('?')[1] + '&e_type='+type+'&openid_type=2', { path: '/', domain: '.lekabao.net' });
                // 请求获取openid接口
                get_openid_ajax(card_id, 2);
                // window.location = obtain_openid(2, card_id, 'JSAPI');
                // 在隐藏域调用get_openid
                // $('#iframe_openid_card_id').attr('src', obtain_openid(2, card_id, 'JSAPI'));//phpJump + 'html/openid.html?is_iframe=2&card_id=' + card_id
            }
        }
    }

    // 构建方法
    function openid_establish(openid_type) {
        // 获取当前时间的时间戳
        var this_time = dateTotTime(getLocalDateMin());
        // 获取url上的openid 有三种情况：NO、ERROR、其他非空值
        var openid = getQueryString('openid');
        // 获取url上的card_id
        var card_id = getQueryString('card_id');

        var openid_array = {
            'openid': openid,
            'time': this_time
        }
        if (openid_type == 1) {
            Cache.set('openid', openid_array);
        } else if (openid_type == 2) {
            Cache.set('openid_'+card_id, openid_array);
        }
    }

    // 请求获取openid接口
    function get_openid_ajax(card_id, openid_type) {
        Data.setAjax('orderGetOpenid', {
            'card_id': card_id, // 会员卡id
            'openid_type': openid_type,
            'trade_type': 'JSAPI',
            'cid': Cache.get('getCID')
        }, '#layer', '#msg', { 20: '', 200215: '' }, function(respnoseText) {
            if (respnoseText.code == 200212) {
                window.location = respnoseText.data;
            } else if (respnoseText.code == 20) {
                var this_time = dateTotTime(getLocalDateMin());
                var openid_array = {
                    'openid': respnoseText.data.split('openid=')[1],
                    'time': this_time
                };
                if (openid_type == 1) {
                    Cache.set('openid', openid_array);
                } else if (openid_type == 2) {
                    Cache.set('openid_'+card_id, openid_array);
                }
            } else {
                Message.show('#msg', respnoseText.message, 2000);
            }
        }, 2, true, 'GET');
    }

    // 扫描桌台二维码处理
    function scanTableCode (cardId, otherId, isWeixin, trade_type, is_type, jump_t, tableName, shop_id, is_pay) {
        var isAli = isAlipay();
        var url = 'orderScanTable', table_id = otherId, pay_id = '';
        // is_pay == 1 说明是扫描预结结账过来的
        if (is_pay == 1) {
            url = 'guestScanPay';
            pay_id = otherId;
            table_id = '';
        }
        // 订单属性： order_property 堂食1 外卖2 打包3 商城配送4
        var order_property = 1;
        var order_text = '';

        // 请求接口判断桌台是否有订单并做相应跳转处理
        Data.setAjax(url, {
            'trade_type': trade_type,
            'card_id': cardId,  // 会员卡id
            'shop_id': shop_id,
            'table_id': table_id,
            'table_name': tableName,
            'pay_id': pay_id,
            'cid': Cache.get('getCID')
        }, '#layer', '#msg', {20: ''}, function(respnoseText) {
            if (respnoseText.code == 20) {
                var page = location.href.split('?')[1].split('&')[0];
                var data = respnoseText.data;

                // 赋值扫描的预结单的订单类型、属性
                if (is_pay == 1) {
                    order_property = data.order_property;
                }
                order_text = '&order_property='+order_property;
                if (jump_t != undefined && jump_t.indexOf('order_property') == -1) {
                    jump_t = jump_t+order_text;
                }
                
                require(['base/page'], function (Page) {
                    if (data.type == 1) {
                        if (is_pay == 1) {
                            Message.show('#msg', '订单不存在，绑定失败！', 2000);
                        } else {
                            if (is_type == 1) {
                                if (!$.cookie("user_mobile") && (isWeixin || isAli)) {
                                    // 从选择是否会员页面点击左上角，返回的页面存入缓存
                                    Cache.set('is_member_dishes', location.href.split('?')[1]);
                                    // 跳转页面，选择是会员还是不是会员
                                    Cache.set('loginReturn', jump_t);
                                    Page.open('nomemberlogin&is_member=1'+order_text);
                                } else {
                                    Page.open(jump_t);
                                }
                            } else {
                                // 1 无订单，跳转点餐页面
                                Page.open('dishes&card_id='+cardId+'&table_id='+otherId+'&page='+page+'&type=0&scanType=2'+order_text);
                            }
                        }
                    } else if (data.type == 2 || data.type == 12 || data.type == 13) {
                        if (is_type == 1) {// 点餐追单过来请求pay_submit
                            Cache.set('loginReturn', jump_t+'&pay_id='+data.pay_id+'&scan_bidn=1');
                        } else {
                            // 2 有订单、 无用户 、 未登录 ，跳转登陆页面
                            Cache.set('loginReturn', 'payorder&card_id='+cardId+'&pay_id='+data.pay_id+'&page='+page+'&type=0&scanType=4'+order_text);// 请求绑定支付接口
                        }
                        if (isWeixin == true || isAli == true) {
                            // 从选择是否会员页面点击左上角，返回的页面存入缓存
                            Cache.set('is_member_dishes', location.href.split('?')[1]);
                            if (is_type == 1) {
                                Page.open('nomemberlogin&is_member=1');
                            } else {
                                Page.open('nomemberlogin');
                            }
                        } else {
                            Page.open('login');
                        }
                    } else if (data.type == 3) {
                        if (is_type == 1) {// 点餐追单过来请求pay_submit
                            Cache.set('loginReturn', jump_t+'&pay_id='+data.pay_id+'&scan_bidn=1');
                        } else {
                            // 3 有订单、无用户、未登录、商家不支付微信支付，跳转登陆页面
                            Cache.set('loginReturn', 'payorder&card_id='+cardId+'&pay_id='+data.pay_id+'&page='+page+'&type=0&scanType=4'+order_text);// 请求绑定支付接口
                        }
                        Page.open('login');
                    } else if (data.type == 4) {
                        if (is_type == 1) {
                            Page.open(jump_t+'&pay_id='+data.pay_id+'&scan_bidn=1');
                        } else {
                            // 4 有订单、无用户、 已登录 ，跳转订单支付页面
                            Page.open('payorder&card_id='+cardId+'&pay_id='+data.pay_id+'&page='+page+'&type=0&scanType=4'+order_text);// 请求绑定支付接口
                        }
                    } else if (data.type == 5) {
                        if (is_type == 1) {// 点餐追单过来请求pay_submit
                            Cache.set('loginReturn', jump_t+'&pay_id='+data.pay_id);
                        } else {
                            // 5 有订单、 有用户 、未登录，跳转登陆页面 请求pay
                            Cache.set('loginReturn', 'payorder&card_id='+cardId+'&pay_id='+data.pay_id+'&page='+page+'&type=0&scanType=4&is_scan=1'+order_text);
                        }
                        if ((isWeixin == true || isAli == true) && is_pay == 1) {
                            // 从选择是否会员页面点击左上角，返回的页面存入缓存
                            Cache.set('is_member_dishes', location.href.split('?')[1]);
                            if (is_type == 1) {
                                Page.open('nomemberlogin&is_member=1');
                            } else {
                                Page.open('nomemberlogin');
                            }
                        } else {
                            Page.open('login&is_state=5');
                        }
                    } else if (data.type == 6) {
                        if (is_type == 1) {// 点餐追单过来请求pay_submit
                            Page.open(jump_t+'&pay_id='+data.pay_id);
                        } else {
                            // 6 有订单、有用户、已登录、是同一个用户，跳转订单支付页面 请求pay
                            Page.open('payorder&card_id='+cardId+'&pay_id='+data.pay_id+'&page='+page+'&type=0&scanType=4&is_scan=1'+order_text);
                        }
                    } else if (data.type == 7) {
                        if (is_pay != 1) {
                            // 7 有订单、有用户、已登录、不是同一个用户，报错跳转
                            if (location.href.split('?')[1].split('&')[0] == 'merchantHome' || location.href.split('?')[1].split('&')[0] == 'merchantHome=') {
                                Message.show('#msg', '订单属于其他会员，绑定失败！', 2000);
                            } else {
                                Page.open("merchantHome&card_id="+cardId+"&pay_id=="+data.pay_id+"&page=merchantHome&type=0&scanType=2"+order_text);
                            }
                        } else {
                            // 不是同一个用户，可以扫描支付
                            if (is_type == 1) {// 点餐追单过来请求pay_submit
                                Page.open(jump_t+'&pay_id='+data.pay_id);
                            } else {
                                // 6 有订单、有用户、已登录、是同一个用户，跳转订单支付页面 请求pay
                                Page.open('payorder&card_id='+cardId+'&pay_id='+data.pay_id+'&page='+page+'&type=0&scanType=4&is_scan=1'+order_text);
                            }
                        }
                    } else if (data.type == 8) {
                        if (is_type == 1) {// 这里应该不能追单，追单就会报桌台被占用
                            Cache.set('loginReturn', jump_t+'&pay_id='+data.pay_id);
                        } else {
                            // 8 有订单、 无用户 、 已结账 、 未登录 ，跳转登陆页面
                            Cache.set('loginReturn', 'orderDetails&card_id='+cardId+'&pay_id='+data.pay_id+'&page='+page+'&order_list_type=1&is_member=2'+order_text);// 请求绑定支付接口
                        }
                        if (isWeixin == true || isAli == true) {
                            // 从选择是否会员页面点击左上角，返回的页面存入缓存
                            Cache.set('is_member_dishes', location.href.split('?')[1]);
                            if (is_type == 1) {
                                Page.open('nomemberlogin&is_login=0&is_type='+is_type);
                            } else {
                                Page.open('nomemberlogin&is_member=2');
                            }
                        } else {
                            Page.open('login&is_login=0&is_type='+is_type+'&pay_id='+data.pay_id);
                        }
                    } else if (data.type == 9) {
                        if (is_type == 1) {// 这里应该不能追单，追单就会报桌台被占用
                            Page.open(jump_t+'&pay_id='+data.pay_id);
                        } else {
                            // 9 有订单、无用户、 已结账 、 已登录 ，跳转订单支付页面
                            Page.open('orderDetails&card_id='+cardId+'&pay_id='+data.pay_id+'&page='+page+'&order_list_type=1&is_member=2'+order_text);// 请求绑定支付接口
                        }
                    } else if (data.type == 10) {
                        if (is_type == 1) {// 点餐追单过来请求pay_submit
                            Cache.set('loginReturn', jump_t+'&pay_id='+data.pay_id);
                        } else {
                            // 10 有订单、 有用户 、已支付、未登录，跳转登陆页面
                            Cache.set('loginReturn', 'orderDetails&card_id='+cardId+'&pay_id='+data.pay_id+'&page='+page+'&order_list_type=1'+order_text);
                        }
                        Page.open('login&is_login=0&is_type='+is_type+'&pay_id='+data.pay_id);
                    } else if (data.type == 11) {
                        if (is_type == 1) {// 点餐追单过来请求pay_submit
                            Page.open(jump_t+'&pay_id='+data.pay_id+'&scan_bidn=1');
                        } else {
                            // 11 有订单、有用户、已支付、已登录、是同一个用户，跳转订单详情页面
                            Page.open('orderDetails&card_id='+cardId+'&pay_id='+data.pay_id+'&page='+page+'&order_list_type=1'+order_text);
                        }
                    }
                });
            } else {
                Message.show('#msg', respnoseText.message, 2000);
            }
        }, 2);
    }

    // 生成二十一位扫描码
    function generateScanning (scan_type, card_id, other_id) {
        var scanCode = '';
        // 将商户id和其他id拼接成二十一位扫描码
        scanCode = scan_type + card_id.substring(2,13) + other_id.substring(2,13);

        return scanCode;
    }

    // 解析二十一位扫描码
    function analysisScanning (urlscan_type) {
        //alert(urlscan_type);
        if (urlscan_type.indexOf('?') == -1) {
            if (urlscan_type.length != 21) {
                return false;
            }
        }
        // 客户端会返回一个URL，在URL后面会带一个？，问号后面带着21位扫描码，所以要截取出来
        var scan_type = urlscan_type;
        if (urlscan_type.length != 21) {
            scan_type = urlscan_type.split('?')[1];
        }

        //var scan_type = urlscan_type;
        //alert(scan_type);
        // 如果问号后面不是二十一位,就return false;
        if (scan_type.length != 21) {
            return false;
        }

        // 提取到第一个字符
        var scanType = scan_type.substring(0,1);
        //alert(scanType);
        // 如果第一个字符不是符合条件的数字,就return false;
        if (scanType != 1 && scanType != 2 && scanType != 3 && scanType != 4 && scanType != 5 && scanType != 6 && scanType != 7) {
            return false;
        }
        //alert(scanType);
        // 提取到第二个字符到第十一个字符,商户id前面加cc
        var cardId = 'cc' + scan_type.substring(1,11);
        // 提取到第十一个字符到最后一个字符
        var otherId = scan_type.substring(11,21);

        switch (scanType) {
            case '1': otherId = 'ss' + otherId; break; // 商户二维码   shop_id
            case '2': otherId = 'st' + otherId; break; // 桌台二维码   table_id
            case '3': otherId = 'ur' + otherId; break; // 储值二维码   record_id
            case '4': otherId = 'pp' + otherId; break; // 结账单二维码 pay_id
            case '5': otherId = 'mo' + otherId; break; // 快捷支付订单二维码   order_id
            case '6': otherId = 'ur' + otherId; break; // 授权会员二维码       record_id
            case '7': otherId = 'au' + otherId; break; // 扫描推荐在线售储值卡员工 a_user_id
        }
        //alert(otherId);
        return {
            scanType: scanType,
            cardId: cardId,
            otherId: otherId
        };
    }

    // 处理图片版本号问题
    function handle_version () {
        var versionNumber = Cache.get('versionNumber');
        if (versionNumber == undefined || versionNumber == '') {
            versionNumber = Math.random();
        }
        return versionNumber;
    }

    // 请求扫描授权会员二维码接口
    function scanningAuthority(otherId, cardId) {
        Data.setAjax('accountMemberAuthority', {
            'card_id': cardId,  // 会员卡id
            'record_id': otherId,
            'cid': Cache.get('getCID')
        }, '#layer', '#msg', {20: ''}, function(respnoseText) {
            return {
                'dd': respnoseText.code,
                'message': respnoseText.message
            };
        }, 2);
    }

    /*// 字符串首字母转换为大写
    String.prototype.capitalize = function () {
        var i, words, w, result = '';

        words = this.split(' ');

        for (i = 0; i < words.length; i += 1) {
            w = words[i];
            result += w.substr(0,1).toUpperCase() + w.substr(1);
            if (i < words.length - 1) {
                result += ' ';
            }
        }

        return result;
    };*/

    // 倒计时
    function countdown(time, dom) {
        setTimeout(function() {
            if (time >= 0) {
                $(dom).hide().next('div.get-sms').text(time+'秒后重发').show();
                //$(dom).hide().next('div.get-sms').text(time+'秒后重发').removeClass('hide');
                time--;
                setTimeout(arguments.callee, 1000);
                //countdown(time,'#get-sms');
            } else {
                $(dom).show().next('div.get-sms').hide();
            }
        }, 1000);
    }


    // 根据时间戳获取年月日时分秒
    function getYMDHMS(time) {
        var year = time.getFullYear(),
            month = time.getMonth() + 1,
            date = time.getDate(),
            hours = time.getHours(),
            minute = time.getMinutes(),
            second = time.getSeconds();

        if (month < 10) { month = '0' + month; }
        if (date < 10) { date = '0' + date; }
        if (hours < 10) { hours = '0' + hours; }
        if (minute < 10) { minute = '0' + minute; }
        if (second < 10) { second = '0' + second; }

        return {
            year: year,
            month: month,
            date: date,
            hours: hours,
            minute: minute,
            second: second
        }
    }

    // 时间戳转换年月日时分秒
    function getLocalTime(time) {
        var tims = getYMDHMS(time);

        return tims.year + "-" + tims.month + "-" + tims.date + " " + tims.hours + ":" + tims.minute + ":" + tims.second;
    }

    // 时间戳转换年月日时分
    function getLocalTimeDate(time) {
        var timett = time * 1000;
        
        var tims = getYMDHMS(new Date(timett));

        return tims.year + "-" + tims.month + "-" + tims.date + " " + tims.hours + ":" + tims.minute;
    }

    // 时间戳转换年月日
    function getLocalDate(time) {
        var timett = time * 1000;

        var tims = getYMDHMS(new Date(timett));

        return tims.year + "-" + tims.month + "-" + tims.date;
    }

    // 获取当前日期
    function getDate() {
        var times = getYMDHMS(new Date());
        return times.year + "-" + times.month + "-" + times.date + " " + times.hours + ":" + times.minute;
    }

    // 获取当前年月日
    function getCurrentDate() {
        var times = getYMDHMS(new Date());
        return times.year + "-" + times.month + "-" + times.date;
    }

    // 时间戳转换当前时间的时间段
    function getDateStep(time, step) {

        var prevTime = time * 1000;
        var nextTime = (time * 1000) + step * 1000 * 60;

        var prev = getYMDHMS(new Date(prevTime));
        var next = getYMDHMS(new Date(nextTime));

        return prev.year + "-" + prev.month + "-" + prev.date + " " +
                prev.hours + ":" + prev.minute + "~" + next.hours + ":" + next.minute;
    }

    // 时间戳转换当前时间（团体）
    function getDateGroupStep(time) {

        var prevTime = time * 1000;

        var prev = getYMDHMS(new Date(prevTime));

        return prev.year + "-" + prev.month + "-" + prev.date + " " +
                prev.hours + ":" + prev.minute;
    }

    // 获取当前日期的前后指定天数
    function getDateStr(AddDayCount) {
        var dd = new Date();
        dd.setDate(dd.getDate() + AddDayCount);
        var year = dd.getFullYear();
        var month = dd.getMonth() + 1;
        var date = dd.getDate();
        if (month < 10) { month = '0' + month; }
        if (date < 10) { date = '0' + date; }
        return year + "-" + month + "-" + date;
    }

    // 时间转化时间戳
    function dateTotTime(str){
        var new_str = str.replace(/:/g,'-');
        new_str = new_str.replace(/ /g,'-');
        var arr = new_str.split("-");
        var datum = new Date(Date.UTC(arr[0],arr[1]-1,arr[2],arr[3]-8,arr[4],arr[5]));
        return strtotime = datum.getTime() / 1000;
    }

    // 截取url指定参数值
    function getQueryString(paras) {
        var url = location.href;
        var paraString = url.substring(url.indexOf("?") + 1, url.length).split("&");
        var paraObj = {}
        for (i = 0; j = paraString[i]; i++) {
            paraObj[j.substring(0, j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=") + 1, j.length);
        }
        var returnValue = paraObj[paras.toLowerCase()];
        if (typeof returnValue == undefined) {
            return "";
        } else {
            return returnValue;
        }
    }

    // 判断元素是不是指定元素的子元素
    function isParent(obj, parentObj) {
        while (obj != undefined && obj != null && obj.tagName && obj.tagName.toUpperCase() != 'BODY') {
            if (obj == parentObj) {
                return true;
            }
            obj = obj.parentNode;
        }
        return false;
    }

    // 判断是不是微信访问
    function isWeixin() {
        var ua = navigator.userAgent.toLowerCase();
        if (ua.match(/MicroMessenger/i) == "micromessenger" || ua.match(/MicroMessenger/i) == "qq") {
            return true;
        } else {
            return false;
        }
    }
    // 判断是不是支付宝访问
    function isAlipay(){  
        var ua = window.navigator.userAgent.toLowerCase(); 
            if(ua.match(/AlipayClient/i) =='alipayclient'){ 
                return true; 
            }else{ 
                return false; 
            } 
    }  
    function isWhat() {
        var weixin = isWeixin();
        var alipay = isAlipay();
        if (weixin) {
            trade_type = 'JSAPI';
        }else if(alipay){
            trade_type = 'ALI';
        }else{
            trade_type = 'APP';
        }
        return trade_type;
    }
    var browser = {
        versions: function() {
            var u = navigator.userAgent;
            return {
                ios: !!u.match(/Mac OS X/), //ios终端
                android: u.indexOf('Android') > -1 //android终端
            };
        }(),
    };

    // 是否打印
    var isprint = true;

    // 打印log
    function log() {
        if (isprint) {
            console.log(Array.prototype.join.apply(arguments, [' ']));
            // console.log(Array.prototype.join.call(arguments, ' '));
        }
    }

    // 打印对象
    function info(arg) {
        if (isprint) {
            console.info(arg);
        }
    }

    /**
    * 判断浏览器是否支持某一个CSS3属性
    * @param {String} 属性名称
    * @return {Boolean} true/false
    */
    function supportCss3(style) {
        var prefix = ['webkit', 'Moz', 'ms', 'o'],
            i,
            humpString = [],
            htmlStyle = document.documentElement.style,
            _toHumb = function (string) {
                return string.replace(/-(\w)/g, function ($0, $1) {
                    return $1.toUpperCase();
                });
            };

        for (i in prefix) {
            humpString.push(_toHumb(prefix[i] + '-' + style));
        }

        humpString.push(_toHumb(style));

        // console.log(humpString);
        // console.log(htmlStyle);

        for (i in humpString) {
            if (humpString[i] in htmlStyle) {
                return true;
            }
        }

        return false;
    }

    // 判断浏览器内核
    function getVendor() {
        var dummyStyle = document.createElement('div').style,
            vendor = (function () {
                var vendors = 'webkitT,MozT,msT,OT,t'.split(','),
                    t,
                    i = 0,
                    l = vendors.length;

                for ( ; i < l; i++ ) {
                    t = vendors[i] + 'ransform';
                    if ( t in dummyStyle ) {
                        return vendors[i].substr(0, vendors[i].length - 1);
                    }
                }

                return false;
            })();

        return vendor;
    }

    // 匹配样式
    function prefixStyle(style) {
        var vendor = getVendor();
        // console.log(vendor);

        if ( vendor === '' ) {
            return style;
        }

        style = style.charAt(0).toUpperCase() + style.substr(1);
        return vendor + style;
    }


    /*
    ** randomWord 产生任意长度随机字母数字组合
    ** randomFlag-是否任意长度 min-任意长度最小位[固定位数] max-任意长度最大位
    ** xuanfeng 2014-08-28
    */
    //例如下面
    //生成3-32位随机串：randomWord(true, 3, 32)
    //生成43位随机串：randomWord(false, 43)
    function randomWord(randomFlag, min, max){
        var str = "",
            range = min,
            arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
     
        // 随机产生
        if(randomFlag){
            range = Math.round(Math.random() * (max-min)) + min;
        }
        for(var i=0; i<range; i++){
            pos = Math.round(Math.random() * (arr.length-1));
            str += arr[pos];
        }
        return str;
    }

    // 除法函数
    function accDiv(arg1,arg2){
        var t1=0,t2=0,r1,r2;
        try{t1=arg1.toString().split(".")[1].length}catch(e){};
        try{t2=arg2.toString().split(".")[1].length}catch(e){};
        with(Math){
            r1=Number(arg1.toString().replace(".",""));
            r2=Number(arg2.toString().replace(".",""));
            return (r1/r2)*pow(10,t2-t1);
        }
    }
    // 乘法函数
    function accMul(arg1,arg2){
        var m=0,s1=arg1.toString(),s2=arg2.toString();
        try{m+=s1.split(".")[1].length;}catch(e){};
        try{m+=s2.split(".")[1].length;}catch(e){};
        return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m);
    }
    // 加法函数
    function accAdd(arg1,arg2){
        var r1,r2,m;
        try{r1=arg1.toString().split(".")[1].length}catch(e){r1=0};
        try{r2=arg2.toString().split(".")[1].length}catch(e){r2=0};
        m=Math.pow(10,Math.max(r1,r2));
        //return (arg1*m+arg2*m)/m
        m = m == 0 ? 1 : m;
        return accDiv((accMul(arg1,m)+accMul(arg2,m)),m);
    }
    // 减法函数
    function accSubtr(arg1,arg2){
        var r1,r2,m,n;
        try{r1=arg1.toString().split(".")[1].length}catch(e){r1=0};
        try{r2=arg2.toString().split(".")[1].length}catch(e){r2=0};
        m=Math.pow(10,Math.max(r1,r2));
        //动态控制精度长度
        n=(r1>=r2)?r1:r2;
        return ((arg1*m-arg2*m)/m).toFixed(n);//.toFixed(n)
    }

    // WGS-84 to GCJ-02 经纬度转换
    var PI = 3.14159265358979324;
    var x_pi = 3.14159265358979324 * 3000.0 / 180.0;
    function delta(lat, lon) {
        // Krasovsky 1940
        // a = 6378245.0, 1/f = 298.3
        // b = a * (1 - f)
        // ee = (a^2 - b^2) / a^2;
        var a = 6378245.0; //  a: 卫星椭球坐标投影到平面地图坐标系的投影因子。
        var ee = 0.00669342162296594323; //  ee: 椭球的偏心率。
        var dLat = transformLat(lon - 105.0, lat - 35.0);
        var dLon = transformLon(lon - 105.0, lat - 35.0);
        var radLat = lat / 180.0 * PI;
        var magic = Math.sin(radLat);
        magic = 1 - ee * magic * magic;
        var sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
        dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);

        return {'lat': dLat, 'lon': dLon};
    }
    function transformLat(x, y) {
        var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }
    function gcj_encrypt(wgsLat, wgsLon) {
        if (outOfChina(wgsLat, wgsLon))
            return {'lat': wgsLat, 'lon': wgsLon};
 
        var d = delta(wgsLat, wgsLon);
        return {'lat' : wgsLat + d.lat,'lon' : wgsLon + d.lon};
    }
    function transformLon(x, y) {
        var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
        return ret;
    }
    function outOfChina(lat, lon) {
        if (lon < 72.004 || lon > 137.8347)
            return true;
        if (lat < 0.8293 || lat > 55.8271)
            return true;
        return false;
    }

    // 根据选中的时间生成日期
    function getLocalDateGenerate(day, hour, minite) {
        var times = getYMDHMS(new Date());

        if (day != '今天') {
            times.month = day.split('月')[0];
            times.date = day.split('月')[1].split('日')[0];
        }
        times.hours = hour.split('点')[0];
        times.minute = minite.split('分')[0];

        var day_time = day == '今天' ? '今天' : times.month + "-" + times.date;

        return {
            'list_display': day_time + " " + times.hours + ":" + times.minute,
            'list_date': times.year + "-" + times.month + "-" + times.date + " " + times.hours + ":" + times.minute + ":" + times.second
        }
    }

    // 获取当前年月日时分秒
    function getLocalDateMin() {
        var times = getYMDHMS(new Date());
        return times.year + "-" + times.month + "-" + times.date + " " + times.hours + ":" + times.minute + ":" + times.second;
    }

    // 用来判断是否是今天，然后显示
    function judge_date(date, dinner_time_type, times_t) {
        var times = getYMDHMS(new Date());
        var day_time = (date == times.date && dinner_time_type == 1) ? '今天' : times_t.month + "-" + times_t.date;
        return day_time + " " + times_t.hours + ":" + times_t.minute;
    }

    // 时间戳转换年月日时分秒
    function getReturnTime(time, dinner_time_type) {
        var timett = time * 1000;
        var times = getYMDHMS(new Date(timett));

        var date = judge_date(times.date, dinner_time_type, times);

        return {
            'year': parseFloat(times.year),
            'month': parseFloat(times.month),
            'date': parseFloat(times.date),
            'hours': parseFloat(times.hours),
            'minute': parseFloat(times.minute),
            'second': parseFloat(times.second),
            'main_time': times.year + "-" + times.month + "-" + times.date + " " + times.hours + ":" + times.minute + ':' + times.second,
            'main_list': date
        };
    }

    var scroll_load = null;

    // 就餐时间
    function loaded(dinner_time_type, dinner_time_offset, dinner_time, open_time, close_time) {
        scroll_load = new iScroll($('#day')[0], {
                scrollY: true,
                momentum: false,
                snap: 'li',
                vScrollbar: false,
                onScrollEnd: function() {
                    var ed_date = getContent("#day");
                    var ed_hour = getContent("#hour");
                    var ed_minite = getContent("#min");

                    calculation_time(dinner_time_type, dinner_time_offset, dinner_time, open_time, close_time, 1, ed_date, ed_hour, ed_minite);
                }
        });
        scroll_load = new iScroll($('#hour')[0], {
                scrollY: true,
                momentum: false,
                snap: 'li',
                vScrollbar: false,
                onScrollEnd: function() {
                    var ed_date = getContent("#day");
                    var ed_hour = getContent("#hour");
                    var ed_minite = getContent("#min");

                    calculation_time(dinner_time_type, dinner_time_offset, dinner_time, open_time, close_time, 2, ed_date, ed_hour, ed_minite);
                }
        });
        scroll_load = new iScroll($('#min')[0], {
                scrollY: true,
                momentum: false,
                snap: 'li',
                vScrollbar: false,
                onScrollEnd: function() {
                    var ed_date = getContent("#day");
                    var ed_hour = getContent("#hour");
                    var ed_minite = getContent("#min");

                    //calculation_time(dinner_time_type, dinner_time_offset, dinner_time, open_time, close_time, 3, ed_date, ed_hour, ed_minite);
                }
        });
    }
    //下单日期插件
    function getContent(ele){
        var $content = $(ele).find('div');
        var _height=$(ele).find('li').height();
        var tran = $content.css('transform');
        var topArray=[];
        topArray=tran.split(',');
        var top=Math.floor(parseFloat(topArray[5]));
        var num=top/_height-1;
        $(ele+" li").eq(-num).addClass('current').siblings('li').removeClass();
        return $(ele+" li").eq(-num).text();
    }

    /* 根据就餐时间类型计算就餐时间偏移量、门店营业时间
        dinner_time_type    TINYINT 1   就餐时间类型：1只支持时间 2支持日期时间
        dinner_time_offset  INT 10      就餐时间偏移量：当前时间延迟多少分钟
        dinner_time 就餐时间
        open_time   门店营业开始时间
        close_time  门店营业结束时间
        type        0加载过来的 1滑动日期过来的 2滑动小时过来的 3滑动分钟过来的
        ed_date     滑动传过来的日期
        ed_hour     滑动传过来的小时
        ed_minite   滑动传过来的分钟

        下面的代码是初始化默认显示的

        当滑动日期、滑动小时的时候
        进行相应变更

        如果变更日期，小时和分钟都要重新加载
        如果变更小时，分钟要重新加载
    */
    function calculation_time (dinner_time_type, dinner_time_offset, dinner_time, open_time, close_time, type, ed_date, ed_hour, ed_minite) {

        dinner_time_offset = dinner_time_offset == 0 ? 1 : dinner_time_offset;

        dinner_time_offset = parseFloat(dinner_time_offset);

        // 当前时间的time时间戳
        var main_time = dateTotTime(getLocalDateMin());

        // 转换日期时间
        main_time = getReturnTime(main_time);


        // 截取门店营业开始时间，小时和分钟
        var open_hour = parseFloat(open_time.split(':')[0]);
        var open_minute = parseFloat(open_time.split(':')[1].split(':')[0]);
        // 截取门店营业结束时间，小时和分钟
        var close_hour = parseFloat(close_time.split(':')[0]);
        var close_minute = parseFloat(close_time.split(':')[1].split(':')[0]);

        // 开始小时，结束小时，开始分钟，结束分钟。初始化
        var min_hour = 0,max_hour = 0,min_minute = 0,max_minute = 0;

        /*ed_date     滑动传过来的日期
        ed_hour     滑动传过来的小时
        ed_minite   滑动传过来的分钟*/
        // 日期分解
        var select_date_1 = 0;
        var select_date_2 = 0;

        var select_date_3 = 0;
        if ((dinner_time_type == 2 && type == 1) || (dinner_time_type == 2 && type == 2)) {
            select_date_1 = ed_date.split('月')[0];
            select_date_2 = ed_date.split('月')[1].split('日')[0];
        }
        if (type == 1 || type == 2) {
            select_date_3 = ed_hour.split('点')[0];
        }
        // type 0加载过来的 1滑动日期过来的 2滑动小时过来的 3滑动分钟过来的
        if (type == 0 || 
            (type == 1 && select_date_1 == main_time.month && select_date_2 == main_time.date) || 
            (type == 2 && select_date_3 == main_time.hours)
            ) {
            // 当前分钟加上延迟分钟
            main_time.minute = main_time.minute + dinner_time_offset;
            // 如果这时候 > 60，则小时+1，分钟初始化成0
            if (main_time.minute >= 60) {
                main_time.hours = main_time.hours + parseInt(main_time.minute/60);
                if(main_time.hours == 24){
                    main_time.hours = 0
                }
                min_minute = main_time.minute - 60;
            } else {
                // 判断当前分钟 > 开始分钟，就使用当前分钟是开始
                if (main_time.minute > open_minute || main_time.hours >= open_hour) {
                    min_minute = main_time.minute;
                } else {
                    // 如果当前分钟 <= 开始分钟，就使用开始分钟是开始
                    min_minute = open_minute;
                }
            }
            max_minute = 60;
            // 如果当前小时 = 结束小时，结束分钟 = 门店营业结束分钟
            if (main_time.hours == close_hour) {
                max_minute = close_minute;
            }

            // 判断当前小时 > 开始小时 && 当前小时 <= 结束小时，就使用当前小时是开始
            if (main_time.hours > open_hour && main_time.hours <= close_hour) {
                min_hour = main_time.hours;
            } else {
                // 如果当前小时 <= 开始小时，就使用开始小时是开始
                min_hour = open_hour;
            }

            // 如果当前小时 > 结束小时，就使用结束小时
            if (main_time.hours > close_hour) {
                cur = 1
                max_hour = close_hour;
            } else {
                // 判断当前小时 < 结束小时，就使用结束小时是结束
                max_hour = close_hour;
            }
        } else if (type == 1){
            // 当前分钟加上延迟分钟
            min_minute = 0;
            max_minute = 60;
            min_hour = open_hour;
            max_hour = close_hour;
            // 如果滑动日期的时候，小时 == 营业结束小时，分钟就 == 营业结束分钟
            if (select_date_3 == close_hour) {
                max_minute = close_minute;
            }
        } else if (type == 2) {
            // 当前分钟加上延迟分钟
            min_minute = 0;
            max_minute = 60;
            if(select_date_3 == min_minute.hours){
                min_minute = min_minute
                max_minute = 60;
            }else{
                min_minute = 0;
                max_minute = 60;
            }
            // 如果小时的时候，小时 == 营业结束小时，分钟就 == 营业结束分钟
            if (select_date_3 == close_hour) {
                max_minute = close_minute;
            }
        }

        if(dinner_time_type == 1){
            if(main_time.hours < open_hour || (main_time.hours == open_hour && main_time.minute < open_minute) || main_time.hours > close_hour || (main_time.hours == close_hour && (main_time.minute + dinner_time_offset > close_minute))){
                $('.time-box').html('门店当前未营业')
                $('.time-box').addClass('time-boxCurr')
                $('#number_of_determine').attr('id','number_of_determineCurr')
                mealTimeNotClick = 1  //送餐时间不可点
            }else{
                mealTimeNotClick = 0
                loop_time_html();
            }
        }else{
                loop_time_html();
        }

        // 日期、小时、分钟展示到页面
        function loop_time_html() {
            var number_1 = 0;// 显示默认选中样式

            // type  0加载过来的 1滑动日期过来的 2滑动小时过来的 3滑动分钟过来的
            if (type == 0) {
                var num1 = '<li></li>';
                // 日期转换时间戳
                var date = dateTotTime(main_time.main_time);
                if (dinner_time_type == 1) {
                    num1 += '<li class="current">今天</li>';
                } else {
                    // 循环日期
                    for (var i=0;i<30;i++) {
                        // 时间戳转换时间
                        var main = getReturnTime(date);

                        num1 += '<li class="'+(number_1 == 0 ? 'current' : '')+'">'+main.month+'月'+main.date+'日</li>';
                        number_1++;
                        date = parseFloat(date) + 24 * 3600;
                    }
                }
                num1 += '<li></li>';
                $('#num1').html(num1);
            }
            if (type == 0 || type == 1) {
                var date = dateTotTime(main_time.main_time);
                var num2 = '<li></li>';
                number_1 = 0;
                if (dinner_time_type == 1) {
                    for (var i=min_hour;i<=max_hour;i++) {
                        num2 += '<li class="'+(number_1 == 0 ? 'current' : '')+'">'+i+'点</li>';
                        number_1++;
                    }                
                }else{
                     var main = getReturnTime(date);
                    for (var i=main.hours;i<=23;i++) {
                        num2 += '<li class="'+(number_1 == 0 ? 'current' : '')+'">'+i+'点</li>';
                        number_1++;
                    }                
                }
                // 循环小时
                num2 += '<li></li>';
                $('#num2').html(num2);
            }

            if (type == 0 || type == 1 || type == 2) {
                var num3 = '<li></li>';
                number_1 = 0;
                // 循环分钟
                if (dinner_time_type == 1) {
                    for (var i=min_minute;i<max_minute;) {
                        num3 += '<li class="'+(number_1 == 0 ? 'current' : '')+'">'+i+'分</li>';
                        i = i + 1;
                        number_1++;
                    }
                }else{
                    for (var i=min_minute;i<max_minute;) {
                        num3 += '<li class="'+(number_1 == 0 ? 'current' : '')+'">'+i+'分</li>';
                        i = i + 1;
                        number_1++;
                    }
                }
                num3 += '<li></li>';
                $('#num3').html(num3);
            }
            if (type == 1 || type == 2) {
                scroll_load.refresh();
            }
        }
    }


    // 校验数字  num 0:整数，1：非整数
    function checkNum(name, num) {
        var num1 = $(name).val();
        //正则表达式验证必须为数字
        var numPro = /^\d*\.{0,1}\d{0,2}$/;
        if (num == 0) {
            numPro = /^\d*$/;
        } else {
            numPro = /^\d*\.{0,1}\d{0,2}$/;
        }
        //查找输入字符第一个为0 
        var resultle = num1.substr(0,1);
        var result2 = num1.substr(1,1);
        if(numPro.test(num1)){
            if(resultle == 0 && num1.length > 1 && result2 != '.'){
                //替换0为空
                //若以0开头，把0替换掉
                $(name).val(num1.replace(/0/,""));
                if(num1.substr(0,1) == '.'){
                    $(name).val(0);
                }
            }
            if (num1 == '') {
                $(name).val(0);
            }
        }else{
            $(name).val(0);
        }
    }



    return {
        accDiv: accDiv,
        accMul: accMul,
        accAdd: accAdd,
        accSubtr: accSubtr,
        countdown: countdown,
        getYMDHMS: getYMDHMS,
        getLocalTime: getLocalTime,
        getLocalTimeDate: getLocalTimeDate,
        getLocalDate: getLocalDate,
        dateTotTime: dateTotTime,
        getDateStr: getDateStr,
        getDateStep: getDateStep,
        getDateGroupStep: getDateGroupStep,
        getQueryString: getQueryString,
        isParent: isParent,
        browser: browser,
        log: log,
        info: info,
        isWeixin: isWeixin,
        supportCss3: supportCss3,
        prefixStyle: prefixStyle,
        getVendor: getVendor,
        randomWord: randomWord,
        cidList: cidList,
        getDate: getDate,
        generateScanning: generateScanning,
        analysisScanning: analysisScanning,
        getCurrentDate: getCurrentDate,
        scanningAuthority: scanningAuthority,
        delta: delta,
        transformLat: transformLat,
        gcj_encrypt: gcj_encrypt,
        transformLon: transformLon,
        outOfChina: outOfChina,
        scanTableCode: scanTableCode,
        handle_version: handle_version,
        loaded: loaded,
        getContent: getContent,
        getReturnTime: getReturnTime,
        getLocalDateMin: getLocalDateMin,
        calculation_time: calculation_time,
        getLocalDateGenerate: getLocalDateGenerate,
        isAlipay: isAlipay,
        isWhat:isWhat,
        obtain_openid: obtain_openid,
        openid_structure: openid_structure,
        openid_establish: openid_establish,
        checkNum:checkNum
    };

});



