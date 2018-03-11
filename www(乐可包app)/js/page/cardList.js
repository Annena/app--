define('page/cardList', [
	'base/page',
	'base/scrollbar',
    'base/cache',
    'base/data',
    'base/load',
    'base/mobile',
    'base/util',
    'base/message'
], function (Page, Bar, Cache, Data, Load, Mobile, Util, Message) {

	var CardList = function () {
		this.back = 'userinfo';
	}
	// 我的卡包页面
	CardList.prototype = new Page('cardList');

	CardList.prototype.util = function () {

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/
		// 判断微信访问
	    var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        $('title').text('我的卡包');
		if (isWeixin || isAli) {
			$('header').addClass('hide');
			$('#homeCardScroll').addClass('top0');
		} else {
			$('header').removeClass('hide');
		}


		var content = '#cardContent';
		
		function CardListObj (content) {

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
				// 0:自定义，1：模板1,2： 模板2,3：模板3,背景的不同样式
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
					
				if (data) {
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

						// content += '<li class="'+logoClass[data[i].card_background]+'" style="'+(data[i].card_background == 0 ? 'background: #FFFFFF url(../../img/base/'+data[i].card_background+'.png?'+Util.handle_version()+') repeat-x 0px -1px;' : '')+'" card-id="'+data[i].card_id+'" data-type="cardClick">'+
						content += '<li class="'+logoClass[data[i].card_background]+'" style="'+(data[i].card_background == 0 ? 'background: #FFFFFF url(../../img/business/'+data[i].card_id+'/card_background.jpg?'+Util.handle_version()+') repeat-x 0px -1px;' : '')+'" card-id="'+data[i].card_id+'" data-type="cardClick">'+

					                    '<div>'+
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
						                    '<p class="'+(parseInt(data[i].stored_balance) == 0 ? 'hide' : '')+'" id="yue">储值：<span>'+parseInt(data[i].stored_balance)+'</span></p>'+ 
											'<p class="'+(data[i].discount_rate == 100 ? 'hide' : '')+'" id="zhekou">折扣：<span>'+data[i].discount_rate / 10+'折</span></p>'+
						                    '<p class="'+(data[i].voucher_num == 0 ? 'hide' : '')+'" id="diyognquan">抵用券：<span>'+data[i].voucher_num+'</span></p>'+
						                    '<p class="'+(parseInt(data[i].integral_balance) == 0 ? 'hide' : '')+'" id="jifen">积分：<span>'+parseInt(data[i].integral_balance)+'</span></p>'+
					                    '</div>'+
									'</li>';
					}
				} else {
					// 没有卡的话就跳转到搜索页面
					//Page.open('searchBusiness');
					// 提示没有卡，放搜索页链接
					content = '<div id="selectCard">没有卡请到搜索页面</div>';
				}
				return content;
			}

			listObj.prototype.viewContent = function () {
				var that = this;//div[data-type="cardClick"]
                $(that.content).delegate('li', 'click', function() {
					var cardID = $(this).attr('card-id');
					
					Page.open('merchantHome&card_id='+cardID+'&page=cardList');


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

                // 点击“没有卡请到搜索页面”跳转到搜索页面
                $('#selectCard').unbind('click').bind('click', function () {
                	Page.open('searchBusiness');
                });
			}

			return new listObj();
		}

		// 点击二维码进行搜索
		/*$('#scanning').unbind('click').bind('click', function () {
			scanningDate();
		});		
		function scanningDate() {
			Mobile.scanner('将二维码放入框内', 1, function(result) {

			扫描分发处理：
			扫描商户二维码：执行领卡操作，跳转到商户页。
			扫描桌台二维码：记录门店、桌台信息，跳转到点菜界面。
			扫描储值二维码：执行储值，跳转到储值界面，弹出处置成功
			扫描订单二维码：未支付跳转到支付页，已支付执行返券、积分后跳转到订单详情页并提示。
						除线上用户订单外，快捷支付、门店扫描订单、门店离线状况 需要重点考虑。

			首页的扫描接口，扫描后，JS根据扫描的变量scan_type来判断应该属于哪种扫描。
			然后将变量放入容器，跳到对应的页面。
			对应的页面打开时，判断一下容器是否有变量，有变量就视同已经扫描了。将容器销毁后，直接提交数据给PHP
				
			});
		}*/

		CardListObj(content).getlistData();
	}

	CardList.prototype.bindPageEvents = function () {
		this.util();
	}

	CardList.prototype.bindPageRefreshEvents = function () {
	}

	CardList.prototype.unload = function () {
		Cache.del('is_refresh_orderlist');
	}

	return CardList;

});
