define('page/orderDetails', [
	'base/page',
	'base/data',
	'base/scrollbar',
	'base/util',
	'base/dialog',
	'base/cache',
	'base/message',
	'base/config',
	'base/mobile'
], function (Page, Data, Bar, Util, Dialog, Cache, Message, Config, Mobile) {


	var card_id,
		orderListType,
		mengorder_id;
	
    var cardId = Util.getQueryString('card_id');
    var thisCardId = Util.getQueryString('thisCard_id');
    var PayId = '';
    var page = '';
	var OrderDetails = function () {
		this.back = page+'&card_id='+card_id+'&order_list_type='+orderListType;
	}
	var trade_type = Util.isWhat()
	// 订单完成订单详情页面
	OrderDetails.prototype = new Page('orderDetails');
	//order_step  订单状态：1下单  3确认出单 9已结账 0门店取消订单
	OrderDetails.prototype.bindPageEvents = function () {
		var _self = this;

		$('title').text('订单详情');
		// 如果缓冲中没有cid，就调用方法请求接口获取cid
		/*if (!Cache.get('getCID')) {
		 //alert('dd');
		 // 通过请求PHP获取到cid
		 Util.cidList();
		 }*/		 
		var otherName = 'pay_id';
		var add_time = Util.getQueryString('add_time');

		var is_member = Util.getQueryString('is_member'); // 有值说明是从已结账过来的选择

        var OrderId = Util.getQueryString('pay_id');

        var is_comm = Util.getQueryString('is_comm');// is_comm = 1 需要跳到发表点评位置
		/*if (otherName == 'pay_id') {
			OrderId = 
		} else if (otherName == 'table_id') {
			OrderId = Util.getQueryString('table_id');
		} else if (otherName == 'order_id') {
			OrderId = Util.getQueryString('order_id');
		}*/

		card_id = Util.getQueryString('card_id');
		cardId = card_id;
		orderListType = Util.getQueryString('order_list_type') == undefined ? 1 : Util.getQueryString('order_list_type');
		var page = Util.getQueryString('page');
    	thisCardId = Util.getQueryString('thisCard_id');
    	if(thisCardId){
    		this.back = (page ? page : 'orderlist')+'&card_id='+thisCardId+'&order_list_type='+orderListType;
    	} else {
			this.back = (page ? page : 'orderlist')+'&card_id='+card_id+'&order_list_type='+orderListType;
		}

		// 获取是否使用了微信支付跳转过来的，如果是就同步调整到微信
		var wxJump = Util.getQueryString('wxpayjump');
		var wxCache = Cache.get('wxpayjump');
		var mySwiper = $('.swiper-container').swiper({
			mode: 'horizontal',
			pagination: '.swiper-pagination',
			observer: true,//修改swiper自己或子元素时，自动初始化swiper
			observeParents: true,//修改swiper的父元素时，自动初始化swiper
		});
		var orderData;// 数据
		var table_idPro = '';	// 添加菜品用的

        // shop_type_info 0 桌台模式  1叫号 2台卡
        var shop_type_info = 1;

        var is_comment = 0; // 是否显示点评 0否 1是
        var shop_id = ''
		// 获取是从点餐、外卖、自提、商城过来的吗
        // 订单属性： order_property 堂食1 外卖2 打包3 商城配送4
        var order_property = Util.getQueryString('order_property');
        if (order_property == undefined) {
            order_property = Cache.get('order_property_temporary');
        } else {
            Cache.set('order_property_temporary', order_property);
        }

        // 缓存从这里点击加菜追单到点菜页面，需要的是否必点条件商品，必点锅底，必点小料
        var is_bottom_pot = 0;    // 是否有必点锅底
        var is_small_material = 0;  // 是否有必点小料
        var is_cond_commodity = 0;// 是否有必点条件商品
        var invoiceSp_url = ''

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
        var imgDateNUm = 0;   // 图片数据key
        //图片方向角 added by lzk  
        var Orientation = null;

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay()

		var Details = {

			scroll: null,

			init: function () {

				// 判断微信访问
				this.weixinVisit();

				// 清除缓存
				Cache.del('url_comment');

				//滑动图片
				// 得到屏幕宽度，因为页面设了padding有内边距，所以宽度不能是屏幕宽度
				var wid = $.app.body_width - $.app.body_width / 100 * 5 * 2;

				// 获取到屏幕宽度，赋值给页面
				$('#detailsScroll').width(wid);

				//this.scroll = Bar('#detailsScroll');
			    var total_height = $(window).height();	// 屏幕高度
	            this.scroll = new iScroll($('#detailsScroll')[0], {
		            scrollbarClass: 'myScrollbar',
		            bounce: false,
		            hideScrollbar: true,
		            vScrollbar: false,
		            onBeforeScrollStart: function (e) {
		                var target = e.target;
		                while (target.nodeType != 1) target = target.parentNode;
		                if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA')
		                    //禁止滚动
		                e.preventDefault();
		            },
	                onScrollMove: function() {
		            	var jump_top = $('#menuDispaly').offset().top;// 跳转的位置距离顶部高度
		        		var orderInfoListH = $('#orderInfoList').offset().top;
		                var menuListH = $('#menuList').offset().top;
		                var commentscontentH = $('#comments-content').offset().top;
		                // 有点评内容的时候才切换，否则就是默认选中菜品信息
		                if (is_comment == 1) {
		                	var order_d = 100;
		                	if (isWeixin) {
		                		order_d = 130;
		                	}
			            	if(commentscontentH <= 172){
			            		$('#headerMeng').removeClass('hide')
								$('.comments-content').addClass('current').parent('span').siblings().children('i').removeClass('current');
			            	}else if (orderInfoListH <= order_d){
			            		$('#headerMeng').removeClass('hide')
								$('.orderInfoList').addClass('current').parent('span').siblings().children('i').removeClass('current');
			            	}else if(jump_top <= 8){
			            		$('#headerMeng').removeClass('hide')
								$('.menuList').addClass('current').parent('span').siblings().children('i').removeClass('current');
			            	}else{
			            		$('#headerMeng').addClass('hide')
							}
						}
		            },
	                onScrollEnd: function() {
		            	var jump_top = $('#menuDispaly').offset().top;// 跳转的位置距离顶部高度
		        		var orderInfoListH = $('#orderInfoList').offset().top;
		                var menuListH = $('#menuList').offset().top;
		                var commentscontentH = $('#comments-content').offset().top;
		                // 有点评内容的时候才切换，否则就是默认选中菜品信息
		                if (is_comment == 1) {
		                	var order_d = 100;
		                	if (isWeixin) {
		                		order_d = 130;
		                	}
			            	if(commentscontentH <= 172){
			            		$('#headerMeng').removeClass('hide')
								$('.comments-content').addClass('current').parent('span').siblings().children('i').removeClass('current');
			            	}else if (orderInfoListH <= order_d){
			            		$('#headerMeng').removeClass('hide')
								$('.orderInfoList').addClass('current').parent('span').siblings().children('i').removeClass('current');
			            	}else if(jump_top <= 8){
			            		$('#headerMeng').removeClass('hide')
			            		$('.menuList').addClass('current').parent('span').siblings().children('i').removeClass('current');
			            	}else{
			            		$('#headerMeng').addClass('hide')
			            	}
			            }
	                },
	                onRefresh: function() {

	                }
	            });
				// 获取订单详情基本信息
				this.getOrderDetails(OrderId,card_id);

				if (wxJump == 1 && wxCache != undefined) {
					// 同步跳转到微信
					this.wxpayjump(wxCache);
					// 删除微信支付缓存
					Cache.del('wxpayjump');
				}
				this.scroll.refresh();

				//如果是订单列表点击评论进来的话就跳到页面下方评论位置
				var processComment = Util.getQueryString('processComment');
		        if(processComment == 1){
					var comments_content = $('#comments-content').offset().top
		        	this.scroll.scrollTo(0,comments_content-180, 100, true);	
					$('#headerMeng').removeClass('hide')
				    $('.comments-content').addClass('current').parent('span').siblings().children('i').removeClass('current');

		        }
			},

	        // 判断微信访问
	        weixinVisit: function () {
	        	var _self = this;
	            if (isWeixin || isAli) {
	                $('#download').removeClass('hide');
	                $('header').addClass('hide');

	                //document.getElementById('detailsScroll').style.cssText = 'top:94px !important';
	                //document.getElementById('orderDetails-header').style.cssText = 'top:35px !important';

	                $('#orderDetails-header').addClass('top35')
                    // $('#detailsScroll').addClass('top84')
                    $('#detailsScroll').addClass('top45')
                    
	                $('#download').unbind('click').bind('click', function () {
	                    window.location=phpDownload;
	                });
	            } else {
	                $('#download').addClass('hide');
	                $('header').removeClass('hide');
	            }
	        },

			// 获取订单详情基本信息
			getOrderDetails: function (orderId,cardId) {
				var self = this;

		        var data = {
					'card_id': cardId,	// 会员卡id
					//otherName: orderId,	// 可能是pay_id、table_id、order_id
					'cid': Cache.get('getCID')
		        };
		        var dataAjax;
		        var page;
		        
		        /*APP1
		        微信2
		        点菜宝3
		        收银台4*/
				if (otherName == 'table_id') {
			        page = {
			            'trade_type': trade_type,
			            'start_time': Util.getLocalTimeDate(add_time),
			            'table_id': orderId
			        };
				} else if (otherName == 'pay_id') {
			        page = {
			            'trade_type': trade_type,
			            'pay_id': orderId
					};
		    	} else {
			        page = {
			            'trade_type': trade_type,
			            'order_id': orderId
					};
		    	}
				dataAjax = $.extend({}, page, data);

				var url = '';
				// 未登录并且是在微信请求未登录详情数据接口
				if (!$.cookie("user_mobile") && isWeixin) {
					url = 'guestInfo';
				} else {
					url = 'orderInfo';
				}

				if (is_member == 2) {
					Data.setAjax('orderScanOrder', {
						'trade_type': trade_type,
						'card_id': cardId,
						'pay_id': OrderId,
						'cid': Cache.get('getCID')
					}, '#layer', '#msg', {20: '',200216: '',430209: ''}, function (respnoseText) {
						orderData = respnoseText.data;
						//alert(respnoseText.code);
						if (respnoseText.code == 20) {
							Message.show('#msg', respnoseText.message, 2000, function () {
								// 基本赋值
								self.basicReplication(orderData);
								// 绑定点击事件
								self.bindEvents();
							});
						} else {//如果扫描的结账单返回200216订单绑定成功
							Message.show('#msg', respnoseText.message, 2000, function () {
								// 跳转到订单列表
								Page.open('orderlist&card_id='+cardId+'&page=merchantHome&order_list_type=1');
							});
						}
					}, 2);
				} else {
					Data.setAjax(url, dataAjax, '#layer', '#msg', {20: ''}, function (respnoseText) {
						orderData = respnoseText.data;
						if (respnoseText.code == 20) {
							// 基本赋值
							self.basicReplication(orderData);
							// 绑定点击事件
							self.bindEvents();
						} else {
							Message.show('#msg', respnoseText.message, 2000);
						}
					}, 2);
				}
			},

			// 基本赋值
			basicReplication: function (data) {
				// 把各个订单信息填充到页面
				var idPro = '';
				for (var i in data.order) {
					idPro = i;
					break;
				}
				Cache.set('shop_type_info', data.order[idPro].order_type_info);
				shop_type_info = data.order[idPro].order_type_info;

				// 商户页logo
				$('#orderDetailsLogin').attr('src','../../img/business/'+card_id+'/logo.jpg');

				table_idPro = data.table_id;

				// 平台类型 1百度 2饿了么 3美团 默认0
				var platform_type = {
					0: '',
					1: '百度',
					2: '饿了么',
					3: '美团',
					undefined: ''
				}

				// shop_type_info 0 桌台模式  1叫号 2台卡
				// 桌台类型 桌台名称
				var table_type = '',
					table_name = '',
					table_number = '';
				if (data.table_type == undefined) {
					table_type = '';
				} else {
					table_type = data.table_type+' ';
				}
				shop_id = data.shop_id
				//$('#tableNumber').addClass('table-i-left').removeClass('float-left');
				//$('#tableTypeName').addClass('table-i-right');

				// shop_type_info 0 桌台模式  1叫号 2台卡
				if (shop_type_info == 1) {
					table_number = '桌台号';
					table_name = data.table_name;
					//$('#tableNumber').removeClass('table-i-left').addClass('float-left');
					//$('#tableTypeName').removeClass('table-i-right');
				} else if (shop_type_info == 2) {
					table_number = '取餐号';
					table_name = data.table_name;
					table_type = '';
					// 如果返回生成中，就把这几个字大小修改成跟桌台号一样
					if (table_name == '生成中') {
						//$('#tableNumber').removeClass('table-i-left').addClass('float-left');
						//$('#tableTypeName').removeClass('table-i-right').addClass('table-i-red');
					}
				} else {
					table_number = '台卡号';
					table_name = data.table_name;
					table_type = '';
				}
				if (data.table_id == 999999999) {
					table_name = '未确认';
					table_type = '';
				}
				if(data.table_type == '无桌台'){
					$('#tableNumber').text('单号');
					if (table_name == '生成中') {
						table_name = '未下单';
					}
					$('#tableTypeName').text(platform_type[data.pay_info.platform_type]+table_name);
				}else{
					$('#tableNumber').text(table_number+'：');
					$('#tableTypeName').text(platform_type[data.pay_info.platform_type]+table_type+table_name);
				}

				// 订单下单更改显示为分店名称

				if(data.pay_info.f_shop_name != null){
					$('#addTime').text(data.pay_info.f_shop_name);
				}else{
					$('#addTime').text(data.pay_info.shop_name);
				}
				// 商户名称
				$('#shopName').text(data.card_name);

				//   cancel_code   取消状态：1门店桌台被占用   2服务员取消订单 3退单
				var cancelCode = {
					0: '',
					1: '(桌台被占用)',
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
				// 订单状态 暂时隐藏，菜品列表使用显示多个订单状态
				//$('#orderStatus').html(payName[data.order_step]+'<b style="color:#FF79A9; font-size:12px;" >'+cancelCode[data.cancel_code]+'</b>');

				// 消费金额
				$('#consume').text(data.consumes);
				// 会员优惠
				if(data.pay_info.sub_user != 0.00){
					$('#memberDiscount').parent().parent().removeClass('hide')
					$('#memberDiscount').text(parseFloat(data.pay_info.sub_user).toFixed(2));
				}else{
					$('#memberDiscount').parent().parent().addClass('hide')
				}
				// 折扣
				if ($.cookie("user_mobile")){
					if (data.user_account == undefined || data.user_account.discount_rate == 100 || data.pay_info.sub_user_discount == 0.00) {
						$('#discountDisplay').addClass('hide');
					} else {
						$('#discountDisplay').removeClass('hide');
						// 如果折扣是0就显示0，否则显示除以10之后的
						if (data.user_account.discount_rate == 0) {
							$('#discountRate').text(data.pay.discount_rate+'折');
						} else {
							$('#discountRate').text(data.user_account.discount_rate/10+'折');
						}
					}
				}else{
					$('#discountDisplay').addClass('hide')
				}

				// 如果抵用劵金额是0就不显示，否则就显示
				if ($.cookie("user_mobile")){
					if (data.pay_info.voucher == '0.00') {
						$('#voucherDisplay').addClass('hide');
					} else {
						$('#voucherDisplay').removeClass('hide');
						// 抵用劵
						$('#voucher').text(parseFloat(data.pay_info.voucher).toFixed(2));
					}
				}else{
					$('#voucherDisplay').addClass('hide')
				}
				// 抵用券有可能退了  有可能没退，如果应收金额是0    显示   退抵用券 
				// consumes - sub_user - sub_money - small_change  = 应收
				var small_change = data.pay_info.small_change == undefined ? 0 : data.pay_info.small_change;
				var cashier_money = parseFloat(Util.accSubtr(Util.accSubtr(Util.accSubtr(data.pay_info.consumes, data.pay_info.sub_user), data.pay_info.sub_money), small_change));
				// 抵用劵已退金额显示
				if (data.pay_info.re_voucher == 0 || cashier_money != 0) {
					$('#stored_retired').addClass('hide');
				} else {
					$('#stored_retired').removeClass('hide');
					$('#stored_retired').text('(已退'+data.pay_info.re_voucher+')');
				}


				// 如果乐币金额是0就不显示，否则就显示
				if (data.pay_info.stored == '0.00') {
					$('#UseLe').addClass('hide');
				} else {
					$('#UseLe').removeClass('hide');
					// 乐币显示
					$('#stored').text(parseFloat(data.pay_info.stored).toFixed(2));

					
					// 判断是否是已结账
					if(data.pay_info.stored_list != '' && data.pay_info.stored_list != null){
						$('#lebipay').removeClass('hide');
						var content = '';
						//乐币详情模块显示
						for(var key in data.pay_info.stored_list){							
							content += '<li>'+
											'<b class="currency_left">'+ data.pay_info.stored_list[key].card_name + '</b>'+
											'<b class="currency_right">'+ data.pay_info.stored_list[key].stored + '</b>'+
										'</li>';
						}
						$('#lebipay_con').html(content);
					}else{
                        $('#lebipay').addClass('hide');
                    }
				}
				// 乐币已退金额显示
				if (data.pay_info.re_stored == 0) {
					$('#stored_retired').addClass('hide');
				} else {
					$('#stored_retired').removeClass('hide');
					$('#stored_retired').text('(已退'+data.pay_info.re_stored+')');
				}

				//如果微信金额是0就不显示，
				if(data.pay_info.wxpay == '0'){
					$('#wxpayDisplay').addClass('hide');
				}else{
					$('#wxpayDisplay').removeClass('hide');
					$('#wxpay').text(parseFloat(data.pay_info.wxpay).toFixed(2));
				}
				//$('#wxpay_retired').addClass('hide');
				// 微信已退金额显示
				if (data.pay_info.re_wxpay == 0) {
					$('#wxpay_retired').addClass('hide');
				} else {
					$('#wxpay_retired').removeClass('hide');
					$('#wxpay_retired').text('(已退'+data.pay_info.re_wxpay+')');
				}

				//如果支付宝金额是0就不显示，
				if(data.pay_info.alipay == '0'){
					$('#alipayDisplay').addClass('hide');
				}else{
					$('#alipayDisplay').removeClass('hide');
					$('#alipay').text(parseFloat(data.pay_info.alipay).toFixed(2));
				}
				//$('#alipay_retired').addClass('hide');
				// 支付宝已退金额显示
				if (data.pay_info.re_alipay == 0) {
					$('#alipay_retired').addClass('hide');
				} else {
					$('#alipay_retired').removeClass('hide');
					$('#alipay_retired').text('(已退'+data.pay_info.re_alipay+')');
				}

				// 如果收银台支付金额是0就不显示，否则就显示
				// 银台支付金额 = 现金 + 银行卡 + 自定义支付方式金额
				var cashier = parseFloat(Util.accAdd(Util.accAdd(data.pay_info.card, data.pay_info.cash), data.pay_info.other)).toFixed(2);
				if (cashier == 0) {
					$('#cashierDisplay').addClass('hide');
				} else {
					$('#cashierDisplay').removeClass('hide');
					// 收银台支付金额
					$('#cashier').text(cashier);
				}

				// 如果订单备注是空就不显示，否则就显示
				if (data.order_note == '') {
					$('#noteDisplay').addClass('hide');
				} else {
					$('#noteDisplay').removeClass('hide');
					// 订单备注信息
					$('#orderNote').text(data.order_note);
				}

				//会员折扣优惠
				if(data.pay_info.sub_user_discount == 0){
					$('#subUserDiscount').parent().parent('p').addClass('hide');
				}else{
					$('#subUserDiscount').parent().parent('p').removeClass('hide');
					$('#subUserDiscount').text(parseFloat(data.pay_info.sub_user_discount).toFixed(2));
				}

				//银台折扣优惠		
				if(data.pay_info.sub_money == 0 && data.pay_info.promo_id == ''){
					$('#sub_money').parent().parent('p').addClass('hide');
				}else{
					$('#sub_money').parent().parent('p').removeClass('hide');
					$('#sub_money').text(parseFloat(data.pay_info.sub_money).toFixed(2));
					//银台优惠名称
					$('#sub_moneyu').text('（'+data.pay_info.promo.promo_name+'）');
				}

				// }else{
				// 	var money_b = 0;
				// 	var money_c = data.pay_info.pay_moneys;
				// 	if (data.pay_info.promo.pay_type['ct0000000003'] == 3 && data.pay_info.stored != 0) {
				// 		money_b = money_c - data.pay_info.stored;
				// 	}
				// 	if (data.pay_info.promo.pay_type['ct0000000004'] == 3 && data.pay_info.voucher != 0) {
				// 		money_b = money_c - data.pay_info.voucher;
				// 	}
				// 	if (data.pay_info.promo.pay_type['ct0000000005'] == 3 && data.pay_info.wxpay != 0) {
				// 		money_b = money_c - data.pay_info.wxpay;
				// 	}
				// 	if (data.pay_info.promo.pay_type['ct0000000006'] == 3 && data.pay_info.alipay != 0) {
				// 		money_b = money_c - data.pay_info.alipay;
				// 	}

				// 	// 支付的金额不满足优惠方案的最低消费，不显示优惠方案
				// 	if (money_b > data.pay_info.promo.low_consumption) {
				// 		$('#sub_money').parent().parent('p').removeClass('hide');
				// 		$('#sub_money').text(parseFloat(data.pay_info.sub_money).toFixed(2));
				// 		//银台优惠名称
				// 		$('#sub_moneyu').text('（'+data.pay_info.promo.promo_name+'）');
				// 	} else {
				// 		$('#sub_money').parent().parent('p').addClass('hide');
				// 	}
				// }

				// 已付金额旁边显示已退多少钱
				var retired_money = parseFloat(Util.accAdd(Util.accAdd(Util.accAdd(data.pay_info.re_stored, data.pay_info.re_wxpay), data.pay_info.re_alipay) , (cashier_money == 0 ? data.pay_info.re_voucher : 0))).toFixed(2);
				/*var retired_text = '';
				if (retired_money != 0) {
					retired_text = '<b class="retired_text">已退'+retired_money+'</b>'
				}*/
				
				// 已付金额 = 乐币 + 抵用劵 + 微信支付 + 现金 + 银行卡 + 自定义支付方式金额 - 已退的金额
				var pay_order_data = Util.accSubtr(Util.accAdd(Util.accAdd(Util.accAdd(Util.accAdd(Util.accAdd(Util.accAdd(data.pay_info.stored, data.pay_info.voucher), data.pay_info.wxpay), data.pay_info.alipay), data.pay_info.card), data.pay_info.cash), data.pay_info.other), retired_money);
				$('#pay_order_data').html(parseFloat(pay_order_data).toFixed(2));

				// 如果微信金额是0就不显示，否则就显示
				if (data.pay_info.wxpay == 0 && data.pay_info.wxpay_temp == 0) {
					$('#wxpayDisplay').addClass('hide');
					$('#nowxpayDisplay').addClass('hide');
				} else {
					// 根据微信状态判断显示内容 
					// 微信支付状态1 微信未支付 2微信已支付不可信 9微信已支付可信
					// epay_type  0用户取消支付 1创建订单 2用户支付完成 9微信确认支付 order_step 0取消订单
					if (data.pay_info.wxpay_temp != 0 && ($.app.isClient == false || isWeixin == true)) {// && $.app.isClient == true
						$('#nowxpayDisplay').removeClass('hide');
						$('#wxpayDisplay').addClass('hide');
						$('#nowxpay').text(parseFloat(data.pay_info.wxpay_temp).toFixed(2));
						// shop_type_info 0 桌台模式  1叫号 2台卡
						// 是0 显示取消支付按钮，不是0 隐藏取消支付按钮
						if (shop_type_info == 1) {
							$('#cancelOrder').addClass('hide');
						} else {
							$('#cancelOrder').removeClass('hide');
						}
					} else {
						$('#wxpayDisplay').removeClass('hide');
						$('#nowxpayDisplay').addClass('hide');
						$('#wxpay').text(parseFloat(data.pay_info.wxpay).toFixed(2));
					}
				}
				// 如果支付宝金额是0就不显示，否则就显示
				if (data.pay_info.alipay == 0 && data.pay_info.alipay_temp == 0) {
					$('#alipayDisplay').addClass('hide');
					$('#noalipayDisplay').addClass('hide');
				} else {
					// 根据微信状态判断显示内容 
					// 微信支付状态1 微信未支付 2微信已支付不可信 9微信已支付可信
					// epay_type  0用户取消支付 1创建订单 2用户支付完成 9微信确认支付 order_step 0取消订单
					if (data.pay_info.alipay_temp != 0 && ($.app.isClient == false || isAli == true)) {// && $.app.isClient == true
						$('#noalipayDisplay').removeClass('hide');
						$('#alipayDisplay').addClass('hide');
						$('#noalipay').text(parseFloat(data.pay_info.alipay_temp).toFixed(2));
						// shop_type_info 0 桌台模式  1叫号 2台卡
						// 是0 显示取消支付按钮，不是0 隐藏取消支付按钮
						if (shop_type_info == 1) {
							$('#cancelOrder').addClass('hide');
						} else {
							$('#cancelOrder').removeClass('hide');
						}
					} else {
						$('#alipayDisplay').removeClass('hide');
						$('#noalipayDisplay').addClass('hide');
						$('#alipay').text(parseFloat(data.pay_info.alipay).toFixed(2));
					}
				}

				// 如果是已结账状态或者已确认才显示订单点评，否则隐藏
				if (data.pay_info.is_pay == 1 || data.pay_info.is_comment == 1) {
					$('#comments-content').removeClass('hide');
					$('#orderInfoList').removeClass('hide');
					// 订单点评信息填充到页面(获取订单点评信息	)
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

				//如果已结账状态的时候，不显示订单已下
				if (data.pay_info.is_pay == 1){
					$('#quickNone .payments').removeClass('current')
				}
				// 订单菜品填充到页面
				this.getMenuList(data.order, data);

				order_property = data.pay_info.order_property;


		        // 如果是桌台过来的，隐藏地址等信息，否则显示
		        if (order_property == 1 ) {
		        	$('#no_order_property_1').addClass('hide');
		        } else {
		        	$('#no_order_property_1').removeClass('hide');
					if(data.pay_info.addr_info.name == ''){
						$('#user_name').remove()
					}else{
						$('#user_name').text(data.pay_info.addr_info.name);
					}
						$('#user_tel').text(data.pay_info.addr_info.tel);
					if(order_property == 3) {
						$('#user_addr').text('');
					} else {
						$('#user_addr').text(data.pay_info.addr_info.addr);
					}
				}
				// 就餐人数
				$('#number_of_num').text(data.pay_info.user_num+'人');

				if (data.pay_info.order_property == 2 || data.pay_info.order_property == 3) {
					$('#dinner_time_list').removeClass('hide');
					// 就餐时间
					$('#dinner_time').text(Util.getReturnTime(data.pay_info.dinner_time, data.shop_info.dinner_time_type).main_list);
					if (data.pay_info.order_property == 2) {
						$('#dinner_time_text').text('送餐时间：');
					} else {
						$('#dinner_time_text').text('自取时间：');
					}
				} else {
					$('#dinner_time_list').addClass('hide');
				}
				if (data.pay_info.order_property == 4) {
					$('#number_of_diners1').addClass('hide');
				} else {
					$('#number_of_diners1').removeClass('hide');
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
	           	$('#order_type_img').attr('src', '../../img/base/order_'+order_type_img+'.png');
				
				if (data.pay_info.invoice == '') {
					$('#invoice_dispaly1').addClass('hide');
					$('#taxpayer_dispaly').addClass('hide');
				} else {
					$('#invoice_dispaly1').removeClass('hide');
					$('#taxpayer_dispaly').removeClass('hide');
					// 发票抬头
			        $('#invoice_text').text(data.pay_info.invoice);
			        $('#taxpayer_id').text(data.pay_info.taxpayer_id);
		    	}

				// 如果是外卖模式，并且不全额支付，银台支付改名“货到付款”
				if (order_property == 2 && data.shop_info.is_pay_app == 0) {
					$('#cashier_pay_up').text('货到付款');
				} else {
					$('#cashier_pay_up').text('银台支付');
				}

				//是否显示开发票按钮
				if(data.shop_info.is_electronic_invoice == 1 && data.pay_info.is_pay == 1){
					$('#orderDetails_invoice').removeClass('hide');
					if(data.pay_info.gived_invoice == 1 && data.pay_info.sp_url != ''){
						$('#look-invoice').removeClass('hide');
						invoiceSp_url = data.pay_info.sp_url;
					}else if(data.pay_info.gived_invoice == 0 && data.pay_info.sp_url == ''){
						$('#invoice-div').removeClass('hide');
						if (data.pay_info.platform_type != 0) {
							$('#again').remove();
							$('#invoice-btn').css('width', '100%');
						}
					}
				}else{
					$('#orderDetails_invoice').addClass('hide');
				}
				Cache.set('invoiceData', data);
			},

			// 显示菜品
			getMenuList: function (order, data) {
				var contentMain = '';	// 全部订单
				var content = '';		// 单个订单
				var contentRe = '';		// 套餐菜

				var menu_unit = '';
				//cancel_code 取消状态：1门店桌台被占用 2服务员取消订单 3退单
				var cancelCode = {
					0: '',
					1: '(桌台被占用)',
					2: '(服务员取消订单)',
					3: '(银台退单)',
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

				// 订单状态，只要其中一单订单状态是3或9就显示点评
				var order_step = 0;
				//结未结账  0未结账 1结账
				var whether_checkout = 1;
				//是否有pay_id  0有 1没有
				var anotherOne = 0;

				//是否都是取消订单
				var allClose = 0;

				var quxiao = 1; //1是已取消，

				var exit_step_money = 0;// 取消订单金额
				var ex_order_menu_consume = 0;// 订单金额

				var ex_re_order = 0;	// 是否全部退单或桌台被占用 0 是 1 否

				for (var i in order) {
					if (order[i].order_step != 0) {
						quxiao = 0;
					}
					if (order[i].order_step == 0) {
						exit_step_money = exit_step_money + parseFloat(order[i].consume);
					}
					ex_order_menu_consume = ex_order_menu_consume + parseFloat(data.order[i].consume);

					if (order[i].order_step != 0 || order[i].cancel_code == 0 || order[i].cancel_code == 2) {
						ex_re_order = 1;
					}
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

				//如果是已结账状态 或者 所有订单都是退单或桌台被占用，隐藏加菜按钮
				if (data.pay_info.is_pay == 1 || data.order_step == 9 || ex_re_order == 0){
					$('#orderDetails-footer').addClass('hide');
					$('#detailsScroll').css('bottom', '0px');
				} else {
					$('#orderDetails-footer').removeClass('hide');
					$('#detailsScroll').css('bottom', '51px');
				}

				if (data.pay_info.is_pay == 1) {
					$('#pay_order_data').css('color','#333333')
					$('#orderStatus').attr('src','../img/base/pg-payorderpayYJZ.png')
				} else if(quxiao == 1 || data.cancel_code == 1 || data.cancel_code == 3 || data.cancel_code == 5){
					$('#pay_order_data').css('color','#333333')
					$('#orderStatus').attr('src','../img/base/pg-payorderpayYQX.png')
				} else if (data.pay_info.is_pay_all == 1) {
					$('#orderStatus').attr('src','../img/base/pg-payorderpayYZF.png')
				}

				for(var i in order){
					//判断有pid并且订单未结账,已取消算未结账
					if(otherName == 'pay_id' && order[i].order_step != 9){
						whether_checkout = 0;
					}			
					//判断是否都是取消订单
					if(order[i].order_step != 0){
						allClose = 1;
					}
				}
				if(otherName != 'pay_id'){
					anotherOne = 1;
				}else{
					anotherOne = 0;
				}
				//已取消订单CLASS样式
				var yiquxiao = ''
				var yiquxiaoul = ''
				for (var i in data.order) {
					if (data.order[i].order_step == 3 || data.order[i].order_step == 9) {
						order_step = data.order[i].order_step;
					}
					if(data.order[i].order_step == 0){
						yiquxiao = 'quxiao'
						yiquxiaoul = 'quxiaoul'
					}else{
						yiquxiao = 'hide'
						yiquxiaoul = ''
					}
					contentMain = contentMain + '<ul class="mengul clearfix '+yiquxiaoul+'" style="" id="">'+
													'<li class="'+yiquxiao+'"><img src="../img/base/yiquxiao.png" alt="" /></li>'+
                  									'<li style="border-bottom:1px dashed #dcdcdc" class="state">'+
														'<p>'+
															'<u>'+Util.getLocalTimeDate(order[i].add_time)+'</u>'+
															'<u>'+(data.order[i].order_step == 0 ? '' : payName[data.order[i].order_step])+
																'<b style="color:#fb5555; font-size:12px;" >'+cancelCode[order[i].cancel_code]+'</b>'+
															'</u>'+
														'</p>'+	
														'<p>'+
															'<u>'+data.order[i].order_id+'</u>'+
															'<u><i></i><i>'+data.order[i].consume+'</i></u>'+
														'</p>'
													'</li>';
					// 单个订单，套餐菜清空
					content = '';contentRe = '';

					for (var f in data.menu[i]) {
						var flavorContent = '';
						for (var j in data.menu[i][f].menu_flavor) {
							flavorContent += ' — '+data.menu[i][f].menu_flavor[j].flavor_name+' x '+parseFloat(data.menu[i][f].menu_flavor[j].flavor_count)+'<br>';
						}
						var noteContent = '';
						for (var k in data.menu[i][f].menu_note) {
							noteContent += data.menu[i][f].menu_note[k]+' ';
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
						var svgImage = '';	// svg 点赞图标
						// 订单状态是3确认出单 或者 9已结账 并且菜品数量大于0（说明退、赠、转 没有把菜全部退、赠、转完） 满足条件的显示点赞按钮
						if ((order[i].order_step == 3 || order[i].order_step == 9) && data.menu[i][f].menu_num > 0) {
							// 判断菜品是否已经点赞 显示不同图标
							if (data.menu[i][f].is_liked == 1) {
								likedClass = 'pricespan';
								likedClick = '';
								svgImage = '<img  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABBCAYAAACZ1VmMAAAACXBIWXMAABcSAAAXEgFnn9JSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAmtJREFUeNrsnM1twkAQhdcWuVMCJZAOSAdw4BxSQaACQgWQCiBnLqSCmApCB3EH8T2X7IRBQvzOQxFes+9JDhGxIf40bz07O3biStZPt9v0L0O/tfWtzG9Lv03u5vPCBaSkZFAN//Lpt/qBPwuokQc2CQVWWvL3D4+Acvr+2AOdEtZaDcM+vVCAlQ0rN+4nwPqxw1oilvXA6tHC8oP3DIguAdWLObJET8C+j1HD8tEleZU1PWjGHlmiEZCbtaKGpZl65gJXGtD/khOWXQVh2dUkrP+d+sRbddipPnwZLwZJ7JHVrsK4Fgosa2a+ihqWJpnWwX0ZLSytIiC1qizmyJoiV0GdR5amWkkR1VRQSG61KHvIqJVgO6m7X1L1fI8Glg7kkO1Ci6zkSqBeNKIu1cKPV52bh6UrMz1XPRUazbJ2me/BOlNYyzcHRQBqF1pHrsSJnpSc0NgdX/DcSJbUB0ZQff3MW5AAu080mj6AA03A/Od+G+BXSTNJSp/Bg/paJTh35bslUH+T/RSY8W+r4eJTnjrKqjfCAnK9GhmYtJK0iZFltKD8ICxgXkpYRgsSFmBBwgIsSFiABQkLsCBhARYkrNPKdut3hGW0IGEBFiSsE6AO3WRFWId1cI2SsIwWJCzAgoQFWJCwAAsSFmBBwgIsSFiABQkLsCBhARYkLMCChAVYkLAAC25gFWRl61dN3WWNrfkNgZpZn3kjsEZgdGXn2iW1ub8KQAsH3J+d6ok/GCNMIFi7hgcVgDVC+mT3upW1sX9z58P277KGBllWe1WnAdsPeabEVVq7W27ditkOBJJE0uslj5r6FWAA8Ce+FKK+F0UAAAAASUVORK5CYII="/>';
							} else {
								likedClass = 'pricespan';
								likedClick = '';
								svgImage = '<img data-type="liked" order_id="'+order[i].order_id+'" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABBCAYAAACZ1VmMAAAACXBIWXMAABcSAAAXEgFnn9JSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA19JREFUeNrsnN1x2kAQx08MeQ7pACqI3AGuIPKDnw0VGCogVACuAHj2A6QC5ApMB1YH0Xsekl28N97R6ONWnkFHbnfm5oATQvfT/vc+UWQ6tj/39zFkC0gJfZRCeoG0/vL8nBuPLOoY1BCyV0iDkmIEtQRga19g9Tr+/QWBQm8aQfoGaUrv8fMVAN2oZ7171hGyMaRb8KC0UDZDWPR2C+XT0D0ro/xHsYDkZwFNCF7QsF4YjEEJsC1kcyvZsmOCgUUwMopPi4pj1iyGTUL2LMOkNgPPSSqO2VH+EDQsCuxr1jqW2YHyOHTPQltaGNT3KgLNbWMA5eOgYREM23UYNrScwXsWhzE2nppPsHLjufkEK2YDaYXVYMOG8oHC+ph9GLKuRKXn1ZQH41lJnQRpzqvzuOYLLNsz/9UQz05Bw6JOZkxes6047Hth4B0eLJpFsJN7TzXTyIkPLWXXnrWhwJ6x8WGb4H8R63fkUTGBsvK7c/CqQ9cho9+B7HBmYcZaN5xSPn0i+P9/MqRA/spAYTC/qQNFEoyD8iyo9E/zMVeF8WnqGH8mFpQPa4j9C4DasEqjN81bVDyB8/ztYGCP3oxrl+cZkahEKpVTKPZLLUFNac69bUPQ5WwINkBpRBeFFVo5DFZxSX3uWFG+7icG5UlnecVa7JuIPjyyeJJVjPhjCTA472/63tynJfgWrfeR6r5FWHvqy9Su+pL32d72qE6S7AagdEfmio1CAbbieY91+pZ1XyIZ2WZ+6Phbmbl+s4rKegyGS8VyE549Ur7rGTXj2ilWWA39O8pPqDyFVW92XLrzYYrmaiSosAQSVFgCCSosgQQVlkCCCksgQYUlkKDCqpdgWhwCKixHCSosgQQVVrUESxdIFFa5BEvXKBWWowQVlkCCCksgQYUlkKDCEkhQYQkkqLCMbKeOepajBBWWQILBw5JuluupBN0kqLCE+1URVs5cUiXYAMseuK8DRltvxvQ2c7wmn2+A3T61dd22GVU8DyZlr/EvIF/N+3bH86NQ4OS3DnfujWB58bSPwrXZXYnnHX2u2z8j5jX8SUNVhhDvXO4EPXZgb++eYRtZPQGFJtqVGJWcjG+J5K9xDe0gvLAJc3ffTOzx0QXuJMa5RwevvZShdz+12ef6T4ABAGYQXQUiETnhAAAAAElFTkSuQmCC"/>';
							}
						} else {
							likedClass = 'pricespan';
							likedClick = '';
							svgImage = '';
						}

						// is_set_menu 是否套餐，1是 0否
						if (data.menu[i][f].is_set_menu == 0) {
							content += '<li style="color:#666;" class="clearfix" menu-id="'+data.menu[i][f].menu_id+'">'+
											'<span class="mengspan">'+data.menu[i][f].menu_name+'</span>'+
										    '<span class="mengspan">'+
												'<b class="'+likedClass+'" '+likedClick+'>'+parseFloat((data.pay_info.is_pay == 1 ? data.menu[i][f].menu_pay_price : data.menu[i][f].menu_price)).toFixed(2)+
												'</b>'+
												'<u class="twou"><i></i><i>'+(parseFloat(data.menu[i][f].menu_num)+parseFloat(data.menu[i][f].give_menu_num)+parseFloat(data.menu[i][f].cancel_menu_num)+parseFloat((data.menu[i][f].rotate_menu_num == undefined ? 0 : data.menu[i][f].rotate_menu_num)))+menu_unit+'</i></u>'+
												'<u class="oneu">'+svgImage+'</u>'+
												'<i></i>'+
											'</span>'+
											(data.menu[i][f].menu_flavor == undefined || data.menu[i][f].menu_flavor == '' ? '' :
											'<p class="order-infokouwei">'+flavorContent+'</p>')+
											(data.menu[i][f].menu_note == undefined || data.menu[i][f].menu_note == '' ? '' :
											'<p>备注：'+noteContent+'</p>')+
										'</li>';
						} else {
							var g = data.menu[i][f].menu_id;
							var dishesOne = '';
							for(var p in data.set_menu[i][g]) {
								if (p == data.menu[i][f].menu_no) {
									dishesOne = '';
									for(var h in data.set_menu[i][g][p]) {
										var num11 = 0;
										var flavorOne = '<p class="order-infokouwei" style="padding-left:10%">';
										for (var e in data.set_menu[i][g][p][h].menu_flavor) {
											flavorOne += ' — '+data.set_menu[i][g][p][h].menu_flavor[e].flavor_name+' x '+parseFloat(data.set_menu[i][g][p][h].menu_flavor[e].flavor_count)+'份<br/>';
											num11++;
										}
										flavorOne += '</p>';
										if (num11 == 0) {
											flavorOne = '';
										}

										num11 = 0;
										var noteOne = '<p class="martom10">备注：';
										for (var r in data.set_menu[i][g][p][h].menu_note) {
											noteOne += data.set_menu[i][g][p][h].menu_note[r]+' ';
											num11++;
										}
										noteOne += '</p>';
										if (num11 == 0) {
											noteOne = '';
										}

										var menu_unitOne = '';
										if (data.set_menu[i][g][p][h].menu_unit == undefined || data.set_menu[i][g][p][h].menu_unit == '') {
											menu_unitOne = '';
										} else {
											menu_unitOne = data.set_menu[i][g][p][h].menu_unit;
										}		

										dishesOne += '<p class="dishName" style="color: #999;font-size: 12px;width: 94%;padding-left: 1em;">'+data.set_menu[i][g][p][h].menu_name+
								                       '<i>'+parseFloat(data.set_menu[i][g][p][h].menu_num)+'份</i>'+
								                  '</p>'+flavorOne+noteOne;
								    }
									content += '<li class="clearfix" menu-id="'+data.menu[i][f].menu_id+'">'+
													'<span class="mengspan">'+data.menu[i][f].menu_name+'</span>'+
													'<span class="mengspan"><b class="pricespan">'+parseFloat((data.pay_info.is_pay == 1 ? data.menu[i][f].menu_pay_price : data.menu[i][f].menu_price)).toFixed(2)+'</b><u class="twou"><i></i><i>'+parseFloat(data.menu[i][f].menu_num)+'份</i></u><u class="oneu">'+svgImage+'</u></span>'+
								                    '<i></i>'+
								                    dishesOne+
								                '</li>';
								}
							}
						}

						// 如果增菜个数大于0，就在页面上显示着一条记录
						if (data.menu[i][f].give_menu_num > 0) {
							contentRe += '<li class="clearfix">'+
								data.menu[i][f].menu_name+'x'+parseFloat(data.menu[i][f].give_menu_num)+
								'<div class="tuizeng">赠</div>'+
									'<span>0/'+menu_unit+'</span>'+
								'</li>';
						}
						// 如果退菜个数大于0或者转菜个数大于0，就在页面上显示着一条记录
						if (data.menu[i][f].cancel_menu_num > 0 || data.menu[i][f].rotate_menu_num > 0) {
							contentRe += '<li class="clearfix">'+
								data.menu[i][f].menu_name+'x'+(parseFloat(data.menu[i][f].cancel_menu_num)+parseFloat((data.menu[i][f].rotate_menu_num == undefined ? 0 : data.menu[i][f].rotate_menu_num)))+
								'<div class="tuizeng">退</div>'+
									'<span>'+(data.pay_info.is_pay == 1 ? data.menu[i][f].menu_pay_price : data.menu[i][f].menu_price)+'/'+menu_unit+'</span>'+
								'</li>';
						}
					}
					
					content = content + contentRe+(order[i].order_note == '' ? '' : '<li style="border:0;" class="clearfix">'+
														'备&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;注：'+
														'<input class="orderNote" type="text" readonly="readonly" id="orderNote" placeholder="选填，添加备注" data-description="选填，添加备注" value="'+order[i].order_note+'">'+
													'</li>')+
													(data.pay_info.is_pay == 0 && data.order[i].order_step == 0 && data.pay_info.platform_type == 0 ? '<p class="anotherOneP"><span class="anotherOne" shop-id="'+data.shop_id+'" shop-name="'+data.pay_info.shop_name+'" ordertypeinfo="'+data.order[i].order_type_info+'" mengorder_id="'+data.menu[i][f].order_id+'" data-type="buy" id="" class="anotherOne">再来一单</span></p>' : '')+
													'</ul>';
					contentMain = contentMain + content;				
				}
				
				$('#menuList').html(contentMain)
				if(allClose == 0){
					//$('#menuDispaly').children('span').attr('type','')
					//$('#menuDispaly span').children('i').removeClass()
					$('#headerMeng').remove()
					if (data.pay_info.is_pay != 1) {
						$('.memberDiscount').hide()
						$('#quickNone').hide()
					}
				}

				this.scroll.refresh();
			},
			//再来一单
			clickAnother:function(shopname,ordertypeinfo,shopId){
				// 获取到的菜品数据，转格式为点餐缓存可以接受的格式
				var menu = orderData.menu;
				var set_menu = orderData.set_menu;
				var orderId = $(this).attr('mengorder_id')
				Cache.set('shop_type_info', ordertypeinfo);
				var allMenuData = {};
					for (var i in menu[orderId]) {
						if(menu[orderId][i].order_id == mengorder_id){
						var dishes = orderData.menu[orderId][i].menu_id
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
				                dishes.is_set_menu = menuIsSetMenu;   // 是否套餐 1是 0否
				                dishes.flavorObj = {};
				                dishes.noteObj = {};
				                dishes.set_menu_info = {};  // 套餐菜品内包含菜品
				            }

				            for (var n in menu[orderId][i].menu_flavor) {
				            	var flavor = menu[orderId][i].menu_flavor[n].flavor_name;
				            	var flavorId = n;
				                if (flavor && !dishes.flavorObj[flavor]) {
				                    dishes.flavorObj[flavor] = {};
				                    dishes.flavorObj[flavor].id = dishes.id;
				                    dishes.flavorObj[flavor].flavor_id = flavorId.substr(flavorId.length-1,1);
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
				                    dishes.noteObj[note].is_checked = 1;//0：不选中，1：选中
				                }
			            	}

			            	var num1 = 0;
			            	// 套餐菜品缓存处理
							var g = data.menu[i][f].menu_id;
							var dishesOne = '';
							for(var p in data.set_menu[i][g]) {
								dishes.set_menu_info[num1] = {};
								if (p == data.menu[i][f].menu_no) {
									for(var h in data.set_menu[i][g][p]) {
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
	        	
	        	Cache.set(cardId+'-allmenu', allMenuData);
				Page.open('dishes&card_id='+cardId+'&shop_id='+shopId+'&shop_name='+shopname+'&page=orderlist&again=1');

			},
			// 对返回的点评数据进行判断校验
			getOrderComment: function (data) {
				//alert(comment.list.length);
				if (data) {
					if (!(data.star_1 == '0' && data.star_2 == '0' && data.list.length == 0)) {

						if (!(data.star_1 == '0' && data.star_2 == '0')) {
							$('#comments-caption').removeClass('hide');
						}

						if (data.star_1 > '0') {
							$('#j-service').attr('src', '../img/base/star_'+ data.star_1 +'.png').parent('p').removeClass('hide');
						}

						if (data.star_2 > '0') {
							$('#j-quality').attr('src', '../img/base/star_'+ data.star_2 +'.png').parent('p').removeClass('hide');
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
					this.scroll.refresh();
				}

			},

			// 处理点评数据
			processCommentData: function (data) {
				var content = '';
				var hideOrShow = 'hide'
				for (var i in data) {
					var nickname = data[i].nickname;
					// is_reply 0 用户点评  1 回复用户
					if (data[i].is_reply == 1) {
						nickname = data[i].nickname+'回复';
						hideOrShow = ''
					}else{
						hideOrShow = 'hide'
					}
					var smallpic = '';
					var num = 0;
					var imgNum = -1
					for (var p in data[i].pic.small){
						imgNum ++
						num ++;
						if(num > 3){
							break;
						}
						smallpic +=
							'<div class="pica">' +
								'<img imgNum="'+imgNum+'" comment_id="'+data[i].comment_id+'" src="../img/business/'+card_id+'/comment'+data[i].pic.small[p]+'" />'+
								(num == 3 ?
									'<span class="circle_wrap">'+data[i].pic.small.length+'</span>' : '')+
							'</div>'
					}
					content += '<li class="commentli clearfix" comment-id="'+data[i].comment_id+'">'+
									'<div class="comment-border '+hideOrShow+'">'+
										'<div class="comment-who">'+nickname+'</div>'+
									'</div>'+
									'<div class="comment-txt">'+data[i].content+'</div>'+
										(data[i].is_reply == 0 ?
										'<div class="photo_list clearfix">'+
													smallpic +
										'</div>':'')+
										'<div class="comment-title">'+Util.getLocalTimeDate(data[i].add_time)+
											'<span class="myping" >'+'<div class="comment-del" data-type="delete"></div>'+'</span>'+
										'</div>'+
								'</li>';
				}
				return content;
			},

			// 绑定页面点击事件
			bindEvents: function () {
				var _self = this;

				// 点击菜品信息、订单点评、发表点评切换选中样式
				$('#menuDispalyTop span, #menuDispaly span').on('click','i',function(e){
					var type = $(this).parent().attr('type');
					if (is_comment == 1 || (type == 'menuList' && $('#menuList').html() != '')) {
						$("."+type).addClass('current').parent('span').siblings().children('i').removeClass('current');
					}
				});
				//点击开具发票
		        $('#invoice-btn').unbind('click').bind('click', function () {
		        	PayId = Util.getQueryString('pay_id');
		            Page.open('invoice&card_id='+cardId+'&pay_id='+PayId+'&shop_id='+shop_id+'&otherName=pay_id&add_time='+add_time+'&page=orderlist&order_list_type='+orderListType+'&order_property='+order_property)
		        })
		        //点击查看或下载发票
		        $('#look-invoice').unbind('click').bind('click', function () {
		        	Cache.set('invoiceSp_url', invoiceSp_url);
                    Page.open('invoicedetails&card_id='+cardId+'&pay_id='+PayId+'&otherName=pay_id&add_time='+add_time+'&page=orderlist&order_list_type='+orderListType+'&order_property='+order_property)
		        })
				// 点击1、菜品信息 2、订单点评 3、发表点评滑动到相应位置
				$('#headerMeng, #menuDispaly').on('click','span',function(e){
					var type = $(this).attr('type');

					// 如果这三个下面都没有内容，不可点击// is_comment 是否显示点评
					if ((type == 'menuList' && $('#menuList').html() == '')) {
						return;
					} else if ((type == 'orderInfoList' || type == 'comments-content') && is_comment == 0) {
						return;
					}

					var total_height = $(window).height();	// 屏幕高度
					var jump_top = $('#'+type).offset().top;// 跳转的位置距离顶部高度
					var jump_height = $('#'+type).height();// 跳转的内容高度

					var menuList = $('#menuList').offset().top
					var orderInfoList = $('#orderInfoList').offset().top
					var comments_content = $('#comments-content').offset().top

					if (type == 'menuList') {
						//_self.scroll.scrollTo(0,menuList-100, 100, true);
						// 这个地方的算法修改
						// 如果 跳转的位置距离顶部高度 > 屏幕高度，滑动的高度 = 距顶高度 - 100
						// 否则 跳转的位置距离顶部高度 <= 屏幕高度，滑动的高度 = 跳转的内容高度 - （屏幕高度 - 距顶高度）
						if (menuList > total_height || menuList < 0) {
							_self.scroll.scrollTo(0,menuList-120, 100, true);
						} else {
							menuList = jump_height - (total_height - jump_top);
							if (menuList > 0) {
								_self.scroll.scrollTo(0,menuList+50, 100, true);
							}
						}
					} else if (type == 'orderInfoList') {
						if (isWeixin) {
							_self.scroll.scrollTo(0,orderInfoList-130, 100, true);
						} else {
							_self.scroll.scrollTo(0,orderInfoList-100,100, true);
						}
					} else if (type == 'comments-content') {
						if (isWeixin) {
							_self.scroll.scrollTo(0,comments_content-130, 100, true);
						} else {
							_self.scroll.scrollTo(0,comments_content-100, 100, true);
						}
					}
					//alert($('#orderInfoList').offset().top);
					//_self.scroll.scrollTo(0, $('#menuList').height(), 100, true);
			    });
				
				// 判断如果是订单支付成功、微信支付成功callback后，到详情指定位置发表点评的位置
				if (is_comm == 1) {
					$('#menuDispaly span[type="comments-content"]').click();
				} else if (is_comm == 2) {
					$('#menuDispaly span[type="orderInfoList"]').click();
				}

				// 添加菜品点击事件
				$('#addMenuClick').unbind('click').bind('click', function() {
        			var storage_point = {
        				'is_bottom_pot': is_bottom_pot,
        				'is_small_material': is_small_material,
        				'is_cond_commodity': is_cond_commodity
        			}
        			Cache.set('storage_point', storage_point);



					// 存储就餐时间、起送金额需要的参数
					var business_time = {
						'open_time': orderData.shop_info.open_time,
						'close_time': orderData.shop_info.close_time,
						'dinner_time_type': orderData.shop_info.dinner_time_type,
						'dinner_time_offset': orderData.shop_info.dinner_time_offset,
						'minimum_pack': orderData.shop_info.minimum_pack,
						'minimum_store': orderData.shop_info.minimum_store,
						'minimum_takeout': orderData.shop_info.minimum_takeout
					}
					Cache.set('business_time', business_time);


        			var shop_id_t = orderData.shop_id;
        			if (orderData.f_shop_id != null && orderData.f_shop_id != '') {
        				shop_id_t = orderData.f_shop_id;
        			}

        			// 如果门店支持全额支付直接结账,且当前订单已经is_pay_all，点追单的时候，不要传pay_id也不要传桌台号（堂食的传桌台号，别的桌台 不传），视同于新下单
        			if (orderData.shop_info.is_pay_checkout == 1 && orderData.pay_info.is_pay_all == 1) {
        				var table_content = '';
        				if (order_property == 1) {
        					table_content = '&table_id='+table_idPro;
        				}
        				Page.open('dishes&card_id='+card_id+table_content+'&page=merchantHome&type=0&scanType=2&is_jump_choice=0&order_property='+order_property+'&shop_id='+shop_id_t);
        			} else {
						// 跳转点菜页面修改菜品
						Page.open('dishes&card_id='+card_id+'&table_id='+table_idPro+'&page=merchantHome&type=0&scanType=2&pay_id='+OrderId+'&is_jump_choice=1&order_property='+order_property+'&shop_id='+shop_id_t);
					}
				});

				// 点击发表评论按钮
				$('#published').unbind('click').bind('click', function () {
					// 存储url缓存
					Cache.set('url_comment', location.href.split('?')[1]);
					// 跳转到发表评论页面
					Page.open('comments&card_id='+card_id+'&pay_id='+OrderId+'&page=orderDetails');
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
									'card_id': card_id,	// 会员卡id
									'comment_id': commentId,
									'cid': Cache.get('getCID'),
									'trade_type':trade_type
								}, '#layer', '#msg', {200205: ''}, function(respnoseText) {
									if (respnoseText.code == 200205) {
										$(self).remove();
										//如果删除评论以后，没有评论了，就把“点评信息”这个条去掉
										if($('#j-comments-list').find('li').size() == 0){
											// 星级隐藏起来
											$('#comments-caption').addClass('hide');
											// 暂无点评显示起来
											$('#zanwu').removeClass('hide');
										}
									} else {
										Message.show('#msg', respnoseText.message, 2000);
									}
									_self.scroll.refresh();
								}, 2);
							}
						});
					}
				});

				// 取消订单按钮点击事件
				$('#cancelOrder').unbind('click').bind('click', function (){
					Data.setAjax('orderCancelOrder', {
						'pay_id': OrderId,
						'order_id': orderData.order_id,
						'card_id': card_id,	// 会员卡id
						'cid': Cache.get('getCID'),
						'trade_type':trade_type
					}, '#layer', '#msg', {20: ''}, function (respnoseText) {
						if (respnoseText.code == 20) {
							Message.show('#msg', respnoseText.message, 2000, function () {
								window.location.reload();
							});
						} else {
							Message.show('#msg', respnoseText.message, 2000, function () {
								window.location.reload();
							});
						}
					}, 2);
				});

				//点击放图片
				$('.pica img').on('click',function(){
					var html = ''
					var cid = $(this).attr('comment_id')
					var imgNum = $(this).attr('imgNum')
					$('.none').removeClass('none')
					$('.zhu').addClass('swiper-container')
					$('.swiper-container').height($(window).height())
					for(var i in orderData.order_comment.list){
						if(orderData.order_comment.list[i].comment_id == cid){
							for(var p in orderData.order_comment.list[i].pic.big){
								html +=
									'<div class="pica">' +
									'<img  src="../img/business/'+card_id+'/comment'+orderData.order_comment.list[i].pic.big[p]+'" />'+
									'</div>'
							}
							$('.swiper-wrapper').html(html)
							$('.swiper-wrapper').children('div').removeClass().addClass('swiper-slide')
						}
					}
					mySwiper.slideTo(imgNum, 0, false);//切换默认slide，速度为0秒
				})
				$(document).ready(function () {
					$("body").on("click", ".swiper-wrapper div", function () {
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
							'card_id': card_id,		// 会员id
							'order_id': order_id,	// 订单id
							'menu_id': menuId,		// 菜品id
							'cid': Cache.get('getCID'),
							'pay_id':OrderId,
							'trade_type':trade_type
						}, '#layer', '#msg', {200207: ''}, function (respnoseText) {
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
				$('.anotherOne').unbind('click').bind('click', function (){
					var ttype = $(this).attr('data-type');
					var shopname = $(this).attr('shop-name');
					var ordertypeinfo = $(this).attr('ordertypeinfo');
					var shopId = $(this).attr('shop-id');			
					if(ttype == 'buy'){
						mengorder_id = $(this).attr('mengorder_id')
						_self.clickAnother(shopname,ordertypeinfo,shopId)
					}
				})
				//点击总的再来一单
				$('#again').unbind('click').bind('click', function (){
					Cache.set('shop_type_info', orderData.order_type_info);

					var allMenuData = {};
					for (var i in orderData.order) {
						for (var j in orderData.menu) {
							if (orderData.order[i].order_id == j) {
								for (var a in orderData.menu[j]) {


							        var dishes = allMenuData[orderData.menu[j][a].menu_id];
							        if (!dishes) {
							            dishes = {};
							            dishes.id = orderData.menu[j][a].menu_id;
							            dishes.menu_type_id = orderData.menu[j][a].menu_type_id;
							            dishes.type = orderData.menu[j][a].menu_type_id;
							            dishes.info = orderData.menu[j][a].menu_info;
							            dishes.name = orderData.menu[j][a].menu_name;
							            dishes.unit = orderData.menu[j][a].menu_unit;
							            dishes.number = orderData.menu[j][a].number;// 限量
							            dishes.sales = orderData.menu[j][a].sales;  // 销量
						                dishes.special_type = orderData.menu[j][a].special_type;    // 特定商品
						                dishes.pack_id = orderData.menu[j][a].pack_id;              // 打包盒id
							            dishes.count = parseFloat(orderData.menu[j][a].menu_num);
							            dishes.price = parseFloat(orderData.menu[j][a].menu_price * orderData.menu[j][a].menu_num);
							            dishes.is_off = orderData.menu[j][a].is_off;
							            dishes.flavor = '';
							            dishes.note = '';
							            dishes.dishesPrice = Number(orderData.menu[j][a].menu_price);
							            dishes.half = orderData.menu[j][a].is_half;
							            dishes.menu_price = orderData.menu[j][a].menu_price;// 计算起送金额用的销售价
							            dishes.input = orderData.menu[j][a].is_input;
							            dishes.collect = orderData.menu[j][a].is_collect;
							            dishes.is_set_menu = orderData.menu[j][a].is_set_menu;   // 是否套餐 1是 0否
							            dishes.flavorObj = {};
							            dishes.noteObj = {};
							            dishes.set_menu_info = {};  // 套餐菜品内包含菜品
							        }

									// is_set_menu是否套餐 0 否 1 是
									if (orderData.menu[j][a].is_set_menu == 0) {
								        for (var n in orderData.menu[j][a].menu_flavor) {
								        	var flavor = orderData.menu[j][a].menu_flavor[n].flavor_name;
								        	var flavorId = n;
								            if (flavor && !dishes.flavorObj[flavor]) {
								                dishes.flavorObj[flavor] = {};
								                dishes.flavorObj[flavor].id = dishes.id;
								                dishes.flavorObj[flavor].flavor_id = flavorId.substr(flavorId.length-1,1);
								                dishes.flavorObj[flavor].flavor = flavor;
								                dishes.flavorObj[flavor].flavor_name = flavor;
								                dishes.flavorObj[flavor].flavor_count = parseFloat(orderData.menu[j][a].menu_flavor[n].flavor_count);
								                dishes.flavorObj[flavor].flavor_price = 0;
								            }
								    	}

								    	for (var k in orderData.menu[j][a].menu_note) {
								    		var note = orderData.menu[j][a].menu_note[k];
								            if (note && !dishes.noteObj[note]) {
								                dishes.noteObj[note] = {};
								                dishes.noteObj[note].note = note;
								                dishes.noteObj[note].note_name = note;
								                dishes.noteObj[note].is_checked = 1;//0：不选中，1：选中
								            }
								    	}
					            	} else {
					            		var g = orderData.menu[j][a].menu_id;
					            		var num1 = 0;
										// 循环每份套餐
					            		for (var k in orderData.set_menu[j][g]) {
					            			if (k == orderData.menu[j][a].menu_no) {

					            				dishes.set_menu_info[num1] = {};
						                    	// 循环套餐里面的菜
						                    	for (var q in orderData.set_menu[j][g][k]) {
						                    		var l = orderData.set_menu[j][g][k][q].menu_id;
						                    		dishes.set_menu_info[num1][q] = {};
						                    		dishes.set_menu_info[num1][q][l] = {};
						                    		dishes.set_menu_info[num1][q][l].menu_id = l;
						                    		dishes.set_menu_info[num1][q][l].menu_num = orderData.set_menu[j][g][k][q].menu_num;
									    			dishes.set_menu_info[num1][q][l].is_choose = '1';
									    			dishes.set_menu_info[num1][q][l].menu_name = orderData.set_menu[j][g][k][q].menu_name;
									    			dishes.set_menu_info[num1][q][l].menu_price = orderData.set_menu[j][g][k][q].menu_price;
									    			dishes.set_menu_info[num1][q][l].menu_sort = orderData.set_menu[j][g][k][q].menu_sort;
									    			
									    			// 口味备注
									    			dishes.set_menu_info[num1][q][l].menu_flavor = {};
									    			for (var e in orderData.set_menu[j][g][k][q].menu_flavor) {
									    				dishes.set_menu_info[num1][q][l].menu_flavor[e] = {};
									    				dishes.set_menu_info[num1][q][l].menu_flavor[e].flavor_name = orderData.set_menu[j][g][k][q].menu_flavor[e].flavor_name;
									    				dishes.set_menu_info[num1][q][l].menu_flavor[e].is_choose = '1';
									    			}
									    			dishes.set_menu_info[num1][q][l].menu_note = {};
									    			for (var t in orderData.set_menu[j][g][k][q].menu_note) {
									    				dishes.set_menu_info[num1][q][l].menu_note[t] = {};
									    				dishes.set_menu_info[num1][q][l].menu_note[t].note_name = orderData.set_menu[j][g][k][q].menu_note[t];
									    				dishes.set_menu_info[num1][q][l].menu_note[t].is_choose = '1';
									    			}
						                    	}
							                }
								    		num1++;
					                	}
					            	}

					            	allMenuData[orderData.menu[j][a].menu_id] = dishes;
								}
							}
						}
					}

					// 存储就餐时间、起送金额需要的参数
					var business_time = {
						'open_time': orderData.shop_info.open_time,
						'close_time': orderData.shop_info.close_time,
						'dinner_time_type': orderData.shop_info.dinner_time_type,
						'dinner_time_offset': orderData.shop_info.dinner_time_offset,
						'minimum_pack': orderData.shop_info.minimum_pack,
						'minimum_store': orderData.shop_info.minimum_store,
						'minimum_takeout': orderData.shop_info.minimum_takeout
					}
					Cache.set('business_time', business_time);
		            Cache.set('allMenuData_'+ orderData.order_property, allMenuData);
					Page.open('dishes&card_id='+cardId+'&shop_id='+orderData.shop_id+'&shop_name='+orderData.shop_name+'&page=orderlist&again=1&order_property='+orderData.order_property);
				})
				//点击刷新按钮
				$('#newLoad').unbind('click').bind('click', function (){
					window.location.reload();
				});
			},

			// 跳转微信支付
			wxpayjump: function (wxpayData) {
				if (isWeixin) {
					/*wx.chooseWXPay({
					    timestamp: wxpayData.timestamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
					    nonceStr: wxpayData.noncestr, // 支付签名随机串，不长于 32 位
					    package: 'prepay_id='+wxpayData.prepayid, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
					    signType: 'MD5', // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
					    paySign: wxpayData.sign, // 支付签名
					    success: function (res) {
					        // 支付成功后的回调函数
					        alert(res);
					    }
					});*/
					function onBridgeReady(){
						//alert(JSON.stringify(wxpayData));
					    WeixinJSBridge.invoke(
					        'getBrandWCPayRequest', {
					            "appId":wxpayData.appId,     //公众号名称，由商户传入
					            "timeStamp":wxpayData.timeStamp,         //时间戳，自1970年以来的秒数
					            "nonceStr" : wxpayData.nonceStr, //随机串
					            "package" : wxpayData.package,
					            "signType" : wxpayData.signType,       //微信签名方式：
					            "paySign" : wxpayData.paySign//微信签名
					        },
					        function(res){

                                //WeixinJSBridge.log(res.err_msg);
                                //alert(res.err_code+res.err_desc+res.err_msg);

					        	//alert(res.err_msg);
					        	//alert(JSON.stringify(res));
					            if(res.err_msg == "get_brand_wcpay_request:ok" ) {
					            	//window.location.reload();
									var data = {
										'cid': Cache.get('getCID'),
										'card_id': card_id,
										//'order_id': orderData.order_id,
										'prepayid': wxpayData.package.split('=')[1],
										'noncestr': wxpayData.nonceStr,
										'timestamp': wxpayData.timeStamp,
										'sign': wxpayData.paySign
									};

									Data.setCallback(wxConfig+'wxpay/callback_order_jsapi.php', data, '#layer', '#msg', {20: ''}, function(respnoseText) {
										window.location.reload();
									}, 1);
					            } else {
					            	window.location.reload();
					            }
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
					Mobile.weixinPay(wxpayData.appid, wxpayData.partnerid,wxpayData.prepayid, wxpayData.package, wxpayData.noncestr, wxpayData.timestamp, wxpayData.sign, function(result) {
						//alert(result);
						//微信回调值（0：成功，-1：错误，-2：取消）
						if (result == '0') {//orderData.callback_url

							var data = {
								'cid': Cache.get('getCID'),
								'card_id': card_id,
								//'order_id': wxpayData.order_id,
								'prepayid': wxpayData.prepayid,
								'noncestr': wxpayData.noncestr,
								'timestamp': wxpayData.timestamp,
								'sign': wxpayData.sign
							};

							Data.setCallback(wxConfig+'wxpay/callback_order.php', data, '#layer', '#msg', {20: ''}, function(respnoseText) {
								window.location.reload();
							}, 1);
						} else if (result == '-1') {
							window.location.reload();
						} else if (result == '-2') {
							window.location.reload();
						}
					});
				}
			}

		}

		// 发表点评
        var Comment = {

            inin: function() {
                // 设置新增按钮高度
                $('#img-list').find('li').css({
                    //width: liWidth,
                    height: liWidth+10
                });
                // 设置新增按钮高度
                $('#img-list').find('li img').css({
                    width: liWidth+10,
                    height: liWidth+10
                });
                var width = liWidth+10;
                $('#img-list').find('li').css('line-height', width+'px');

                var imageStyle = 'style="width:'+width+'px;height:'+width+'px;'+'background:url(/img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                $('#add-client-img').html('<div data-type="img" '+imageStyle+'><input type="file" id="release-img" class="" accept="image/*"/></div>');
                $('#add-mobile-img').html('<div data-type="img" '+imageStyle+'></div>');

                // 获取到屏幕宽度，赋值给页面
                //$('#comments-content').width($.app.body_width);
                this.addStarSelect('service', '服务质量');
                this.addStarSelect('quality', '餐品质量');
                this.addComment();

                // 判断是不是客户端
                if ($.app.isClient && $.app.isAndroid) {// && $.app.isAndroid
                    $('#add-mobile-img').removeClass('hide');
                    //$('#add-client-img').addClass('hide');
                    $('#add-client-img').remove();
                } else {
                    $('#add-mobile-img').remove();
                    //$('#add-mobile-img').addClass('hide');
                    $('#add-client-img').removeClass('hide');
                }

                this.bindEvents();

                Details.scroll.refresh();
                //this.load();
            },

            // 添加星星选择
            addStarSelect: function(type, label) {
                $('#'+type+'-select').mobiscroll().image({
                    theme: 'android-holo light',
                    accent: ' ',
                    lang: 'zh',
                    display: 'bottom',
                    mode: 'scroller',
                    labels: ['选择' + label],
                    height: 50,
                    fixedWidth: 200
                });

                $('#'+type+'-select').val(3);

                $('#'+type+'').unbind('tap').bind('tap', function() {
                    $('#comment-info').blur();
                    $('#'+type+'-select').mobiscroll('show');
                    return false;
                });

                $('#'+type+'-select_dummy').hide();

                $('#'+type+'-select').change(function() {
                    var val = $('#'+type+'-select_dummy').val();
                    $('#'+type+'').attr('class', 'star star' + val);
                });
            },

            // 添加点评
            addComment: function() {
            	PayId = Util.getQueryString('pay_id');
                $('#comments-btn').unbind('tap').bind('tap', function() {

                    var service = $('#service-select_dummy').val() || 0,// 点评1
                        quality = $('#quality-select_dummy').val() || 0,// 点评2
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
                        'card_id': cardId,
                        'star_1': service,  // 评价1
                        'star_2': quality,  // 评价2
                        'pay_id': PayId,
                        'content': commentInfo,
                        'cid': Cache.get('getCID'),
                        'uarticle_images': (JSON.stringify(imgData) == '{}') ? '' : imgData,
                        'trade_type':trade_type
                    }, '#layer', '#msg', {200206: ''}, function(respnoseText) {

                        //Cache.set('is_refresh_orderlist', true);
                        if (respnoseText.code == 200206) {
                            Message.show('#msg', respnoseText.message, 2000, function () {
                            	/*window.location.reload();*/
                            	var apiLink = location.href.split('?')[1];
                            	if (is_comm == 1) {
                            		apiLink = location.href.split('?')[1].split('&is_comm=1')[0];
                            	}
                            	window.location.href=phpJump+'html/index.html?'+apiLink+'&is_comm=2';
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

                    var style = 'style="width:'+liWidth+'px;height:'+liWidth+'px;"';
                    /*var imageStyle = 'style="width:'+liWidth+
                                            'px;height:'+liWidth+
                                            'px;'+
                                            'background:url(../img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                    $('#add-mobile-img').before('<li id="release_img_'+index+'"'+style+' data-type="user"><div data-type="img" '+imageStyle+'></div><div class="image_layer hide"></div><div class="image_layer_span hide">x</div></li>');*/
                    var imageStyle = 'style="height:'+liWidth+'px;'+
                                            'background:url(../img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                    $('#add-mobile-img').before('<li id="release_img_'+index+'"'+style+' data-type="user" class="img_add"><div data-type="img" '+imageStyle+'></div></li>');


                    //alert(navigator.camera);

                    Comment.selectMode(navigator.camera.PictureSourceType.SAVEDPHOTOALBUM);
                });
            },

            // 选择模式
            selectMode: function(mode) {
                navigator.camera.getPicture(function(imageData) {
                    var num = 0; // 是否有相同图片 0 否 1 是
                    // 判断是否有相同图片
                    for(var i in imgDateList) {
                        if (imgDateList[i] == imageData) {
                            Message.show('#msg', '请选择不同图片上传！', 2000);
                            num = 1;
                            break;
                        }
                    }

                    if (num == 0) {
                        imgDateList[imgDateNUm] = imageData;
                        imgDateNUm++;
                        Comment.drawImage('data:image/jpeg;base64,'+imageData);
                    } else {
                        $('#release_img_' +index).remove();
                    }
                }, function(message) {
                    $('#release_img_' +index).remove();
                }, {
                    quality: 50,
                    destinationType: navigator.camera.DestinationType.DATA_URL,     // 返回数据类型
                    sourceType: mode,                   // 选择类型
                    correctOrientation: true            // 设置图片显示为正确的方向（不会出现ios手机或android手机图片旋转）
                });
                Details.scroll.refresh();
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
                               // alert(EXIF.pretty(this));
                                EXIF.getAllTags(this);
                                //alert(EXIF.getTag(this, 'Orientation'));
                                self.Orientation = EXIF.getTag(this, 'Orientation');
                                //return;
                            });


                            var fileReader = new FileReader();

                            //console.log(fileReader);

                            fileReader.readAsDataURL(files);

                            fileReader.onload = function () {
                                //console.log('---');
                                
                                var num = 0; // 是否有相同图片 0 否 1 是
                                // 判断是否有相同图片
                                for(var i in imgDateList) {
                                    if (imgDateList[i] == this.result) {
                                        Message.show('#msg', '请选择不同图片上传！', 2000);
                                        num = 1;
                                        break;
                                    }
                                }

                                if (num == 0) {
                                    imgDateList[imgDateNUm] = this.result;
                                    imgDateNUm++;
                                    var style = 'style="height:'+liWidth+'px;"';
                                    var imageStyle = 'style="width:'+liWidth+
                                                            'px;height:'+liWidth+
                                                            'px;'+
                                                            'background:url(/img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                                    $('#add-client-img').before('<li id="release_img_'+index+'"'+style+' data-type="user" class="img_add"><div data-type="img" '+imageStyle+'></div></li>');
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
                    Details.scroll.refresh();
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
                                            newHeight = parseInt( (height - cha) / scale);
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

                    },1);
                };
                Details.scroll.refresh();
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
                    //console.log('iphone');
                    //alert('==='+self.Orientation);
                    //如果方向角不为1，都需要进行旋转 added by lzk
                    if(self.Orientation != "" && self.Orientation != 1 && self.Orientation != null && numstt == 1){
                        //alert('苹果旋转处理');
                        switch(self.Orientation){
                            case 6://需要顺时针（向右）90度旋转
                                //alert('需要顺时针（向右）90度旋转');
                                self.rotateImg(img,'left',canvas, width, height);
                                break;
                            case 8://需要逆时针（向左）90度旋转
                                //alert('需要逆时针（向左）90度旋转');
                                self.rotateImg(img,'right',canvas, width, height);
                                break;
                            case 3://需要180度旋转
                                //alert('需要180度旋转');
                                self.rotateImg(img,'right',canvas, width, height);//转两次
                                self.rotateImg(img,'right',canvas, width, height);
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
                }else if (navigator.userAgent.match(/Android/i)) {// 修复android
                    var encoder = new JPEGEncoder();
                    big = encoder.encode(context.getImageData(0, 0, width, height), 80);
                }else{
                    //alert('---'+self.Orientation);
                    if(self.Orientation != "" && self.Orientation != 1 && self.Orientation != null && numstt == 1){
                        //alert('电脑旋转处理');
                        switch(self.Orientation){
                            case 6://需要顺时针（向右）90度旋转
                                //alert('需要顺时针（向右）90度旋转');
                                self.rotateImg(img,'left',canvas, width, height);
                                break;
                            case 8://需要逆时针（向左）90度旋转
                                //alert('需要逆时针（向左）90度旋转');
                                self.rotateImg(img,'right',canvas, width, height);
                                break;
                            case 3://需要180度旋转
                                //alert('需要180度旋转');
                                self.rotateImg(img,'right',canvas, width, height);//转两次
                                self.rotateImg(img,'right',canvas, width, height);
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
                Details.scroll.refresh();
            },

            //对图片旋转处理 added by lzk  
            rotateImg: function(img, direction,canvas, width, height) {
                //alert(img);
                //最小与最大旋转方向，图片旋转4次后回到原方向
                var min_step = 0;
                var max_step = 3;
                //var img = document.getElementById(pid);
                if (img == null)return;
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
                    $('#release_img_'+index, '#img-list').css({
                        //width: liWidth + 2,
                        height: liWidth + 10,
                        border: 'none'
                    }).find('div[data-type="img"]').css({
                        width: liWidth + 10,
                        height: liWidth + 10,
                        background: 'url('+small+') ' + left + 'px ' + top + 'px',
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
                    Details.scroll.refresh();
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
                if ( navigator.userAgent.match(/Android/i) ) {
                    var encoder = new JPEGEncoder();
                    small = encoder.encode(t_ctx.getImageData(0, 0, 100, 100), 80 );
                }

                $('#img2').attr('src', small);
                Details.scroll.refresh();
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
                                var imageStyle = 'style="background:url(data:image/jpeg;base64,'+imgData[i].big+') no-repeat"';
                                $('#exit-upper').append('<div id="exit_img_'+i+'" class="swiper-slide" '+imageStyle+' data-type="exit-img"></div>');
                                $('#exit-lower').append('<div id="exit_img_'+i+'" class="swiper-slide" '+imageStyle+' data-type="exit-img"><div class="del_bnt" data-type="exit-del" data-id="exit_img_'+i+'" data-num="'+index_num+'"></div></div>');
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
                            galleryTop.slideTo(index, 0, false);//切换默认slide，速度为0秒
                            galleryThumbs.slideTo(index, 0, false);//切换默认slide，速度为0秒

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
                                $('#exit-lower #'+exit_id+', #exit-upper #'+exit_id).remove();
                                // 移除当前
                                galleryTop.removeSlide(-1);
                                galleryThumbs.removeSlide(-1);
                            });


                            // 点击保存
                            $('#exit-Preser').unbind('click').bind('click', function () {
                                for (var i in imgData) {
                                    for (var j in imgDatatwo) {
                                        if (i == j) {
                                            delete imgDateList[i];// 删除图片存储数据
                                            delete imgData[i];
                                        }
                                    }
                                }
                                // 删除评论页面里面的
                                for (var k in imgDatatwo) {
                                    $('#img-list #release_img_'+k).remove();
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
                            $('#exit-cacel').unbind('click').bind('click', function () {
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
                    if ( Pattern.dataTest('#release-content', '#msg', { 'empty': '不能为空'}) ) {
                        Data.setAjax('addUserArticle', {
                            'uarticle_content': $('#release-content').val(),
                            'trade_type':trade_type,
                            'uarticle_images': (JSON.stringify(imgData) == '{}') ? '' : JSON.stringify(imgData)
                        }, '#layer', '#msg', {200: ''}, function(respnoseText) {
                            Cache.set('is_refresh_articlelist', true);
                            Page.open('articlelist&type=user');
                        }, 0);
                    }
                });
            }


        };

        var self = this;
        // 微信打开
        if (Util.isWeixin()) {
            // 如果缓冲中没有cid，就调用方法请求接口获取cid
            if (!Cache.get('getCID')) {
                Data.setAjax('userCid', '', '#layer', '#msg', {20: ''}, function (respnoseText) {
                    // 获取到的cid放到缓存中
                    Cache.set('getCID', respnoseText.data);
                    Details.init();
                    Comment.inin();
                }, 1);
            } else {
                Details.init();
                Comment.inin();
            }
        } else {
            Details.init();
            Comment.inin();
        }
		
	};

	return OrderDetails;

});