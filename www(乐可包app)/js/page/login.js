define('page/login', [
    'base/page',
    'base/data',
    'base/pattern',
    'base/cache',
    'base/message',
    'base/util'
], function (Page, Data, Pattern, Cache, Message, Util){

	var LoginPage = function () {
		if (Util.isWeixin()) {
			this.back = Cache.get('loginReturn');
		} else {
			this.back = 'searchBusiness';
		}
	};

	// 登录页面
	LoginPage.prototype = new Page('login');

	LoginPage.prototype.util = function () {
		$('title').text('登录');

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
		var ua = navigator.userAgent.toLowerCase(); 
		var loginUser = $.cookie('loginUser');
        if(ua.match(/iPad/i)=="ipad") {
            if (localStorage["keptUser"] != '' && localStorage["keptUser"] != undefined) {
                $('#username').val(localStorage["keptUser"]);
            }
        } else { 
            if(loginUser != '' && loginUser != undefined){
                $('#username').val(loginUser);
            }
        }		// 判断微信访问
		weixinVisit();

        // 判断微信访问
        function weixinVisit () {
			var _self = this;
            if (isWeixin || isAli) {
                $('#download').removeClass('hide');
                $('header').addClass('hide');
                //document.getElementById('login-header').style.cssText = 'top:45px !important';
                $('#login-header').addClass('top35');
			  	$('#register-nav').addClass('top10');
				$('#download').unbind('click').bind('click', function () {
                    window.location=phpDownload;
                });
            } else {
                $('#download').addClass('hide');
				$('header').removeClass('hide');
            }
        }
 
		//document.domain = 'lekabao.net';
        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/
		// 获取到URL里面page的值，那是上一个页面的名称，之后赋值给返回，即可返回到上一页面
        var page = Util.getQueryString('page');
		var cardId = Util.getQueryString('card_id');
		var payId = Util.getQueryString('pay_id');

		//有订单、 有用户 、已支付、未登录跳转过来的
		var is_type = Util.getQueryString('is_type');
		var is_login = Util.getQueryString('is_login');

		// 5 有订单、 有用户 、未登录
		var is_state =  Util.getQueryString('is_login');


        //需要登录内容才可见的页面
        var PageNo = {
			login : ['userinfo','homeCard','shopChoice','payQuick','storedValue','vouchersList','orderlist']
        };

        var backPage = '';
        // 判断
        if (cardId != undefined) {
			// 判断 不是追单 并且 是扫描状态10过来的
			if (is_type != 1 && is_login == 0) {
				Cache.set('loginReturn', 'orderDetails'+location.href.split("login")[1]);
			} else {
				Cache.set('loginReturn', 'payorder'+location.href.split("login")[1]);
			}
        }
        var loginReturn = Cache.get('loginReturn');
        //alert(loginReturn);
        if (loginReturn != null && loginReturn.indexOf('backPage=') != -1) {
			backPage = loginReturn.split('backPage=')[1].split('&')[0];
		} else {
			backPage = undefined;
		}

		if (backPage == undefined && loginReturn != undefined && loginReturn.split('&')[0] == 'payorder') {
			this.back = loginReturn;
		} else {
	        if (loginReturn) {
				//loginReturn是否是，需要登录内容才可见的页面
				if ( $.inArray(loginReturn, PageNo.login) > -1 ) {
					this.back = 'homeCard';
				}else{
					//alert(loginReturn);
					// 判断是否有page=主要是商户页没有登录跳转到这里进行解析
					if (loginReturn.indexOf('page=')) {
						if (backPage == undefined) {
							this.back = loginReturn.split('page=')[1]+'&card_id='+loginReturn.split('card_id=')[1].split('&')[0];
						} else {
							this.back = 'dishes&card_id='+loginReturn.split('card_id=')[1].split('&')[0]+'&shop_id='+loginReturn.split('shop_id=')[1].split('&')[0]+'&page='+backPage+'&type=0&scanType=2';
						}
					} else {
						this.back = loginReturn;
					}
					
				}
	        } else {
				this.back = 'homeCard';
	        }
		}
        // 点击注册
        $('[data-rr="register"]').unbind('click').bind('click', function () {
			//alert('ddd');
			if (page) {
				Page.open('register&page='+page);
			} else {
				Page.open('register');
			}
        });
        var num = 0;// 来回登陆点击回车键会请求多次
        // 点击键盘上回车键
        $(window).keydown(function (event) {
            if (event.keyCode == 13) {
				$('#login-password').blur();
				if (num == 0) {
					loginOperation();
				}
            }
        });

        // 点击登录
        $('#login-btn').unbind('click').bind('click', function () {
			loginOperation();
        });

        // 长按或单击样式
		/*$("#login-btn").mousedown(function(){
			$(this).css("background","#AE2020");
		});
		// 长按松开或单击松开样式
		$("#login-btn").mouseup(function(){
			$(this).css("background","#FB5555");
		});*/

		// jquery mobile  vmousedown vmouseout
		$('#login-btn').bind('vmousedown', function () {
			$(this).css("background","#DD3737");
		}).bind('vmouseout', function () {
			$(this).css("background","#FB5555");
		});




		/*// 鼠标悬浮样式
		$("#login-btn").mouseover(function(){
			$(this).css("background-color","#AE2020");
		});
		// 鼠标移开样式
		$("#login-btn").mouseout(function(){
			$(this).css("background-color","#FB5555");
		});*/

	
		// 登陆操作
		function loginOperation () {
			//获取到账户密码
			var ndUsername = $('#user-name').val(),
				ndloginPassword = $('#login-password').val();

			//手机号密码验证
			if (dataCheck()) {
				//alert(Cache.get('getCID'));
				//请求登录接口
				Data.setAjax('login', {
					'user_mobile': ndUsername,
					'user_pass': ndloginPassword,
					'cid': Cache.get('getCID')
				}, '#layer', '#msg', {200102: '',430102: '',42: ''}, function (respnoseText) {
					if (respnoseText.code == '200102') {
                        if(ua.match(/iPad/i)=="ipad") {
                          localStorage["keptUser"] = ndUsername.val();
                        }
						$.cookie('loginUser', ndUsername)
						num == 1;
						// 判断未登录的情况
						Cache.set('isLogin',true);
						Message.show('#msg', respnoseText.message, 2000, function () {
							// 判断 不是追单 并且 是扫描状态10过来的就请求一下扫描接口看是不是同一个用户
							if (is_login == 0 || is_state == 5) {
					            /*APP1
					            微信2
					            点菜宝3
					            收银台4*/
							    var trade_type = Util.isWhat()

								// 扫描桌台二维码处理
								Util.scanTableCode(cardId, payId, isWeixin, trade_type, is_type, '', '', '', 1);
							} else {
								if (page == 'homeCard') {
									Page.open(page+'&YesNologin=0');
								} else {
									//alert(loginReturn);
									if (loginReturn) {
										if (backPage == undefined) {
											Page.open(loginReturn);
										} else {
											Page.open(loginReturn+'dishes');
										}
										Cache.del('loginReturn');
									} else {
										Page.open('userinfo');
									}
								}
							}
						});
					} else {
                        //alert('dd');
                        Message.show('#msg', respnoseText.message, 2000);
                    }
				}, 2);

			}
		}

        // 点击跳转到注册页面
        /*$('#register').unbind('click').bind('click', function () {
			Page.open('register');
        });*/

        // 校验数据
        function dataCheck() {
            if ( Pattern.dataTest('#user-name', '#msg', { 'empty': '手机号不能为空', 'mobileNumber': '请输入正确的手机号'})
				&& Pattern.dataTest('#login-password', '#msg', { 'empty': '不能为空' , 'pass': '应为数字字母6-16位'})
            ) {
                return true;
            }

            return false;
        }

	};

	LoginPage.prototype.bindPageEvents = function () {
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

	return LoginPage;

});

