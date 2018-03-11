define('page/homeCard', [
	'base/page',
	'base/scrollbar',
    'base/cache',
    'base/data',
    'base/load',
    'base/mobile',
    'base/util',
    'base/click',
    'base/message',
	'base/dialog',
], function (Page, Bar, Cache, Data, Load, Mobile, Util, Click, Message, Dialog) {

	var HomeCard = function () {
		this.back = '';
	}
	// 首页卡包页面
	HomeCard.prototype = new Page('homeCard');

	HomeCard.prototype.util = function () {
		//alert(Mobile.checkConnection());

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/
        // 通过下面这个判断用户登录之后跳转到这个页面0，和用户点击下面卡包按钮跳转到这个页面1
		var YesNologin = Util.getQueryString('YesNologin');

		var content = '#cardContent';
		
		function HomeCardObj (content) {

			var listObj = function () {};

			listObj.prototype = new Load(content, {
				url: 'cardList',
				data: {
					'cid': Cache.get('getCID')
				}
			});

			listObj.prototype.eachData = function (data) {
				var content = '';

				// 根据PHP返回的标识,会员卡使用的是模板还是自定义的图片
				// 0:自定义，1：模板1, 2：模板2, 3：模板3,背景的不同样式
				var logoClass = {
					0: 'field-none',
					1: 'field-content',
					2: 'field-content-two',
					3: 'field-content-three'
				}
				// vip授权会员样式
				var class1 = '',
					class2 = '',
					class3 = '';

				//if (data) {
					for (var i in data) {
						// 是否会员 0：否，1：是
						/*var is_authority = 0;
						if (data[i].member_price_used == '') {
							is_authority = 0;
						} else {
							// 循环会员价适用范围
							for (var v in data[i].member_price_used) {
								if (data[i].member_price_used[v] == 1 || (data[i].member_price_used[v] == 2 && data[i].principal_amount == 0) || (data[i].member_price_used[v] == 3 && data[i].discount_rate != 100) || (data[i].member_price_used[v] == 4 && data[i].is_authority == 1)) {
									is_authority = 1;
								}
							}
						}*/

						// 是否授权 0：否，1：是
						if (data[i].is_authority == 0) {
							class3 = 'hide';
							class2 = 'icon-logo';
							if (data[i].is_logo == 0) {
								class1 = 'homecard-none-logo';
							} else {
								class1 = 'homecard-logo';
							}
						} else if (data[i].is_authority == 1) {
							class3 = '';
							class2 = 'icon-logo-v';
							if (data[i].is_logo == 0) {
								class1 = 'homecard-none-logo-v';
							} else {
								class1 = 'homecard-logo-v';
							}
						}

						content += '<li class="'+logoClass[data[i].card_background]+'" style="'+(data[i].card_background == 0 ? 'background: #FFFFFF url(../../img/business/'+data[i].card_id+'/card_background.jpg?'+Util.handle_version()+') repeat-x 0px -1px;' : '')+'" card-id="'+data[i].card_id+'" data-type="cardClick">'+

					                    '<div class="'+(data[i].is_logo == 0 ? 'icon-logoborder' : '')+'" id="logoborder" >'+
					                    	'<div class="'+class1+'">'+
												// 未读消息new
												(data[i].new_sum > 0 ?
												'<div class="new_tip"></div>': '')+
					                    		'<i class="'+class3+'"><img src="../../img/base/v.png"></i>'+
					                            '<img src="'+(data[i].is_logo == 0 ? '' : '../../img/business/'+data[i].card_id+'/logo.jpg?'+Util.handle_version())+'" class="'+class2+'">'+ 
											'</div>'+
					                    '</div>'+
					                    '<div class="icon-title">'+
					                    	data[i].card_name+
										'</div>'+
					                    '<div class="icon-futitle">'+
					                    	'<div class="icon-futitle-txt">'+data[i].card_scope+'</div>'+
						                    '<i class="'+(parseInt(data[i].stored_balance) == 0 ? 'hide' : '')+'" id="yue">储值：<span>'+parseInt(data[i].stored_balance)+'</span></i>'+ 
											'<i class="'+(data[i].discount_rate == 100 ? 'hide' : '')+'" id="zhekou">折扣：<span>'+data[i].discount_rate / 10+'折</span></i>'+
						                    '<i class="'+(data[i].voucher_num == 0 ? 'hide' : '')+'" id="diyognquan">抵用券：<span>'+data[i].voucher_num+'</span></i>'+
						                    '<i class="'+(data[i].integral_balance == 0 ? 'hide' : '')+'" id="jifen">积分：<span>'+parseInt(data[i].integral_balance)+'</span></i>'+
					                    '</div>'+
									'</li>';
					}
				/*} else {
					// 没有卡的话就跳转到搜索页面
					//Page.open('searchBusiness');
					if (YesNologin == 0) {
						Page.open('searchBusiness');
					} else if (YesNologin == 1) {
						// 提示没有卡，放搜索页链接
						//content = '<div id="selectCard" rel="searchBusiness">没有卡请到搜索页面</div>';
					}
				}*/
				
				return content;
			}

			listObj.prototype.viewContent = function () {
				var that = this;//div[data-type="cardClick"]
                $(that.content).delegate('li', 'click', function() {
					var cardID = $(this).attr('card-id');
					
					Page.open('merchantHome&card_id='+cardID+'&page=homeCard');

					/*// 判断用户点击是消息详情，还是商家个人页面还是门店列表
					if (eve == 'message') {//消息
						Page.open('shopList&message='+'消息id'+'&page=searchBusiness');

					} else if (eve == 'business') {//商家
						Page.open('shopList&businessid='+'商家id'+'&page=searchBusiness');

					} else if (eve == 'shop') {//门店列表
						// 下面这个是跳转门店列表页面，需要传递给门店列表页面商家id
						Page.open('shopList&shop='+'门店id'+'&page=searchBusiness');

					}*/
                });
			}

			return new listObj();
		}

		HomeCardObj(content).getlistData();
	}

	HomeCard.prototype.bindPageEvents = function () {
		var self = this;

		
		var MemberAuthority = Util.getQueryString('MemberAuthority');
		var card_id0 = Util.getQueryString('card_id');
		var otherId0 = Util.getQueryString('otherId');
        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        $('title').text('卡包');
		// 判断微信访问
		if (isWeixin || isAli) {
			// 如果是微信和支付宝不显示下面的切换条
			$('header,#foot').addClass('hide');
			$('#homeCardScroll').addClass('top0');
		}else{
			$('header,#foot').removeClass('hide');
		}

        /*APP1
        微信2
        点菜宝3
        收银台4*/
        var trade_type = Util.isWhat();

		
        //请求客户端，已经加载完
        this.getload();

		// 点击二维码进行搜索
		$('#scanning').unbind('click').bind('click', function () {
			//alert('dd');
			scanningDate();
		});

        // 分享首页
        $('#homeCard-share').unbind('click').bind('click', function () {
            $.dialog = Dialog({
                type: 3,
                dom: '#share-dialog',//#homeCard-dialog
                success: function() {
                    // 分享到微信好友
                    $('#j-share-to-wx').unbind('click').bind('click', function() {
						//alert('ddd');
                        $.dialog.close($.dialog.id);
                        //$.getJSON('customer.php?r=Counter/Write&page_type=share_article_weixin&page_id=red&UUID='+uuid);
                        //Data.getShareIntegral('index');
                        Mobile.homeCardShare('0', '0', 'wx48c0ba158b071fb7');
                    });

                    // 分享到微信朋友圈
                    $('#j-share-to-wx-circle').unbind('click').bind('click', function() {
                        $.dialog.close($.dialog.id);
                        //$.getJSON('customer.php?r=Counter/Write&page_type=share_article_weixin&page_id=red&UUID='+uuid);
                        //Data.getShareIntegral('index');
                        Mobile.homeCardShare('0', '1', 'wx48c0ba158b071fb7');
                    });

                    // 分享给qq好友
                    $('#share-to-qq').unbind('click').bind('click', function() {
                        $.dialog.close($.dialog.id);
                        //$.getJSON('customer.php?r=Counter/Write&page_type=share_article_weixin&page_id=red&UUID='+uuid);
                        //Data.getShareIntegral('index');
                        Mobile.homeCardShare('1', '0', '');
                    });
                }
            });
        });


		function scanningDate() {
			
			//alert('tt');
			Mobile.scanner('将二维码放入框内', 1, function(result) {
				 //alert(result);
				// 将返回的二十一位存到缓存中，如果未登录的情况下进行了扫描，就可以在登录后把二十一位从缓存中取出来再进行该做的事情
				// alert(result);
				var scanCode = Util.analysisScanning(result);

				if (scanCode == false) {
					//alert('rrrrrr');
					Message.show('#msg', '二维码有误', 3000);
					return;
				} else {
					var scanType = scanCode.scanType,	// 二维码类型
						cardId = scanCode.cardId,		// 商户id
						otherId = scanCode.otherId;		// 根据二维码类型对应的其他id
						// 跳转的连接里面type=0代表是扫描，scanType=2代表的是扫描类型
					if (scanType == 1) {
						// 商户二维码	shop_id 跳转商户页面
						Click.isLogin(true,'merchantHome&card_id='+cardId+'&shop_id='+otherId+'&page=homeCard&type=0&scanType=1');
					} else if (scanType == 2) {
						// 桌台二维码   table_id 跳转点菜页面
						//Page.open('dishes&card_id='+cardId+'&table_id='+otherId+'&page=homeCard&type=0&scanType=2');
						// 扫描桌台二维码处理
						Util.scanTableCode(cardId, otherId, isWeixin, trade_type);
					} else if (scanType == 3) {
						// 储值二维码   record_id 跳转储值页面
						Click.isLogin(true,'storedValue&card_id='+cardId+'&record_id='+otherId+'&page=homeCard&type=0&scanType=3');
					} else if (scanType == 4) {
						// 扫描预结结账二维码处理
						Util.scanTableCode(cardId, otherId, isWeixin, trade_type, '', '', '', '', 1);
						//alert('ddd');
						// 结账单二维码  pay_id  http://www.lekabao.net/html/index.html?payorder&card_id=cc1fczgbkoyy&pay_id=so544dd64bd3&page=payQuick&type=0&scanType=4
						/*Click.isLogin(true, 'payorder&card_id='+cardId+'&pay_id='+otherId+'&page=homeCard&type=0&scanType=4');*/
					} else if (scanType == 5) {
						// 快捷支付订单二维码   order_id
						Click.isLogin(true, 'payorder&card_id='+cardId+'&order_id='+otherId+'&page=homeCard&type=0&scanType=5');
					} else if (scanType == 6) {
						var yesNoCard = Cache.get(cardId+'yesNoCard');
						if (Cache.get('isLogin') == false || !$.cookie("user_mobile")) {
							Cache.set('loginReturn', 'homeCard&MemberAuthority=0&card_id='+cardId+'&otherId='+otherId);
							Page.open('login');
						} else {
							if (yesNoCard == '' || yesNoCard == undefined) {
								membershipCard(cardId, otherId);
							} else {
								authority(cardId, otherId);
							}
						}
					} else if (scanType == 7) {
						// 扫描推荐在线售储值卡员工 a_user_id
						Page.open('storedValue&card_id='+cardId+'&a_user_id='+otherId+'&page=homeCard&type=0&scanType=7');
					}
				}
			});
		}
		//alert(MemberAuthority);
		// 未登录的时候会跳转到登陆url附带参数MemberAuthority，之后登陆成功跳转回这个页面，请求授权二维码请求接口
		if (MemberAuthority == 0) {
			var yesNoCard = Cache.get(card_id0+'yesNoCard');
			//alert(card_id0+'-'+otherId0);
			if (yesNoCard == '' || yesNoCard == undefined) {
				//alert('---');
				membershipCard(card_id0, otherId0);
			} else {
				//alert('tt');
				authority(card_id0, otherId0);
			}
		} else {
			membersData();
		}

		// 扫描授权二维码请求接口
		function authority (cardId, otherId) {
			//alert('2');
			Data.setAjax('accountMemberAuthority', {
				'card_id': cardId,  // 会员卡id
				'record_id': otherId,
				'cid': Cache.get('getCID')
			}, '#layer', '#msg', {20: ''}, function(respnoseText) {
				if (respnoseText.code == 20) {
					//alert('1');
					Message.show('#msg', respnoseText.message, 2000, function () {
						window.location.reload();
					});
				} else {
					membersData();
					//alert('2');
					Message.show('#msg', respnoseText.message, 2000);
				}
			}, 2);
		}
		// 领取会员卡
		function membershipCard (cardId, otherId) {
			//alert('3');
            Data.setAjax('companyCard', {
                'card_id': cardId,   // 会员卡id
                'shop_id': 'ssssssssssss',
                'cid': Cache.get('getCID')
            }, '#layer', '#msg', {20: '',200215: ''}, function (respnoseText) {
                // 如果返回20说明用户已经领过卡了，但是可能用户之前有清除过缓存，所以重新记录缓存
                if (respnoseText.code == 20) {
                    // 已领卡存入缓存
                    Cache.set(cardId+'yesNoCard', cardId);
                    authority(cardId, otherId);
                }
                // 如果返回200215说明用户没有领过卡，这次就领卡了，提示领取会员卡成功，并记录缓存
                if (respnoseText.code == 200215) {
                    Message.show('#msg', '领取会员卡成功', 3000, function () {
                        authority(cardId, otherId);
                    });
                    // 已领卡存入缓存
                    Cache.set(cardId+'yesNoCard', cardId);
                }
                            
                if (respnoseText.code != 20 && respnoseText.code != 200215) {
                    Message.show('#msg', respnoseText.message, 2000);
                    
                }
            }, 2);
		}

		function membersData () {
			// 通过下面这个判断用户未登录跳转到搜索页面，和用户点击下面卡包按钮跳转到这个页面
			var noLogin = Util.getQueryString('noLogin');
			//setTimeout(function(){
			//alert(Cache.get('isLogin')+'- ');
			// 如果用户未登录跳转至搜索页面
			if (Cache.get('isLogin') == false || !$.cookie("user_mobile")) {
				//alert('1');
				if (noLogin != 0) {
					//alert('ddd');
					Page.open('searchBusiness');
				} else {
					//alert('ttt');
					var content = '<div class="icon"><img src=".././img/base/no-login.png" alt="" class="icon-login"><p>您还没有登录~~</p></div><div class="login-button" id="selectLogin">登录</div><p class="login_register">没有账户？<span id="login_register">注册<span></p>'
					$('#cardContent').html(content);
					$('#selectLogin').unbind('click').bind('click', function () {
						Page.open('login&page=homeCard');
					});
				}
			} else {
				self.util();
			}
			//},1000);
		}
		//跳转注册页面
		$('#login_register').unbind("click").bind('click',function() {
			Page.open('register&page=homeCard')
		})
	}

	HomeCard.prototype.getload = function(){
        var that = this;

        //请求客户端首页已经加载完毕
        setTimeout(function(){
        	//alert('bbb');
            Mobile.getload(function(result, error){
                
            });
        },2000);
            //alert(t);
        //alert('dd'+t);
    };

	HomeCard.prototype.bindPageRefreshEvents = function () {
        //请求客户端，已经加载完
        this.getload();
	}

	HomeCard.prototype.unload = function () {
		Cache.del('is_refresh_orderlist');
	}

	return HomeCard;

});
