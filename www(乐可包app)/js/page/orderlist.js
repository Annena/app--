define('page/orderlist', [
    'base/page',
    'base/data',
    'base/cache',
    'base/cacheUpdate',
    'base/message',
    'base/util',
    'base/load',
    'base/scrollbar',
    'base/mobile'
], function (Page, Data, Cache, Update, Message, Util, Load, Bar, Mobile) {

	var Orderlist = function () {
		this.back = 'merchantHome&card_id=' + Util.getQueryString('card_id');
	};
	//   cancel_code   1门店桌台被占用   2服务员取消订单
	//   前端在订单列表、订单详情页可以以此字段来显示一下订单的取消原因
	//is_pay改成order_step  订单状态：1下单 2到店  3确认出单 9已结账 0门店取消订单
	//订单列表输出is_comment：0点评订单  1已点评
	// 我的订单，订单列表页面
	Orderlist.prototype = new Page('orderlist');

	Orderlist.prototype.util = function () {

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/

		// 获取到URL里面page的值，那是上一个页面的名称，之后赋值给返回，即可返回到上一页面
        var page = Util.getQueryString('page');
        var cardId = Util.getQueryString('card_id');
        var orderListType = Util.getQueryString('order_list_type');

        if (cardId == undefined) {
			this.back = page;

			cardId = Cache.get('card_id');
        } else {
			if (page != undefined) {
				this.back = page +'&card_id='+ cardId;
			}
        }

        // 是否未支付，0 未支付 1 已支付
        var is_pay = 0;

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        /*APP1
        微信2
        点菜宝3
        收银台4*/
		var trade_type = Util.isWhat()

		// 判断微信访问
        weixinVisit();
		// 获取是否使用了微信支付跳转过来的，如果是就同步调整到微信
		var wxJump = Util.getQueryString('wxpayjump');
		var wxCache = Cache.get('wxpayjump');

		if (wxJump == 1 && wxCache != undefined) {
			// 同步跳转到微信
			wxpayjump(wxCache);
			// 删除微信支付缓存
			Cache.del('wxpayjump');
		}

        // 获取到屏幕宽度，赋值给页面
        $('#orderlistScroll').width($.app.body_width);

        // 判断微信访问
        function weixinVisit () {
            var self = this;
            if (isWeixin || isAli) {
                $('#downloadt').removeClass('hide');
			    $('header').addClass('hide');
                $('#downloadt').attr('class', 'fixed_down');

                //document.getElementById('orderlistScroll').style.cssText = 'top:112px !important';//130
                //document.getElementById('').style.cssText = 'top:35px !important';//63
                $('#orderlist-header').addClass('top35')
                $('#orderlistScroll').addClass('top102')
				$('.orderlist-nav').addClass('top45')
                $('#downloadt').unbind('click').bind('click', function () {
                    window.location=phpDownload;
                });
            } else {
                $('#downloadt').addClass('hide');
				$('header').removeClass('hide');
            }
        }

		var content = '#orderlistContent';

		var orderlist_url = '';
		// 未登录并且是在微信请求未登录订单列表接口
		if (!$.cookie("user_mobile") && isWeixin) {
			orderlist_url = 'guestList';
		} else {
			orderlist_url = 'orderList';
		}

		function orderListObj (content) {

			var listObj = function () {};

			listObj.prototype = new Load(content, {
				url: orderlist_url,
				data: {
					'card_id': cardId,
					'trade_type': trade_type,
					'order_list_type': orderListType,
					'cid': Cache.get('getCID'),
					'order_list_type':'1'
				}
			});

			// 读取商铺名称缓存
			$('#orderlist-shopname').text('订单/点评');
			$('title').text('订单/点评');

			listObj.prototype.eachData = function (data) {
				var content = '';
				//   cancel_code   1门店桌台被占用   2服务员取消订单 3退单
				var cancelCode = {
					0: '',
					1: '桌台被占用',
					2: '服务员取消',
					3: '银台退单',
					5: '外卖退单',
					7: '微信支付超时',
					8: '门店当前未营业',
					9: '用户取消订单'
				}
				//order_step  订单状态：1下单 2到店  3确认出单 9已结账 0门店取消订单
				var payName = {
					1: '未确认',//已下单
					2: '未确认',//已到店
					3: '已确认',//确认出单
					9: '已结账',
					0: '已取消'
				}

				// 平台类型 1百度 2饿了么 3美团 默认0
				var platform_type = {
					0: '',
					1: '百度',
					2: '饿了么',
					3: '美团',
					undefined: ''
				}

				// 是否点评过(修改不是0就是已点评)
				var isComment = {
					0: '(未点评)',
					1: '(已点评)'
				}
				/*is_comment					是否允许评论（可点评）
				is_comment_post					是否发表过点评（已点评）
				is_comment_new					是否有未读点评（新回复）*/

				var reason = '';// 点评状态-订单状态后面括号的里面显示，已点评（不用红色标识）、可点评、新回复
				var order_step = '';// 订单状态显示的内容（已结账、已支付、未支付）
				var lay_order_step = '';// 最近订单状态，已确认、未确认、取消原因（已取消）order_step  cancel_code
				// 如果已结账不显示最近订单状态
				var is_list_red = '';// 是否红色字体显示
				

				// 循环所有订单
				for (var i in data) {
					if (data[i].is_pay == 1) {
						order_step = '已结账';
					} else if (data[i].cancel_code == 1 || data[i].cancel_code == 3 || data[i].cancel_code == 5) {
						order_step = '已取消';
					} else if (data[i].is_pay_all == 1) {
						order_step = '已支付';
					} else {
						order_step = '未支付';
					}

					if (data[i].is_comment_new == 1) {
						reason = '(新回复)';
						is_list_red = 'list_red';
					} else if (data[i].is_comment_post == 1) {
						reason = '(已点评)';
						is_list_red = '';
					} else if (data[i].is_comment == 1) {
						reason = '(未点评)';
						is_list_red = 'list_red';
					} else {
						reason = '';
						is_list_red = '';
					}

					if (data[i].order_step == 0) {
						lay_order_step = cancelCode[data[i].cancel_code];
					} else if (data[i].order_step == 3) {
						lay_order_step = '已确认';
					} else {
						lay_order_step = '未确认';
					}

					var table_type = '',
						table_name = '';
					table_name = data[i].table_name;
                    // if (data[i].table_type == 1) {
                    //     table_type = '';
                    //     table_name = '桌号'+data[i].table_name;
                    // } else if (data[i].table_type == 2) {
                    //     table_type = '';
                    //     table_name = '包间'+data[i].table_name;
                    // } else {
                    //     table_name = '单号'+data[i].table_name;
                    // }


					// order_property 堂食1 外卖2 打包3 商城配送4
					var order_type_text = '';
		           	if (data[i].order_property == 1) {
		           		order_type_text = '桌台名称';
		           	} else if (data[i].order_property == 2) {
		           		order_type_text = '外卖单号';
		           	} else if (data[i].order_property == 3) {
		           		order_type_text = '自取单号';
		           	} else if (data[i].order_property == 4) {
		           		order_type_text = '商城配送';
		           	}


					// 判断传什么参数跳转订单详情，pay_id第一，table_id第二，order_id第三
					var otherId = '';	// id
					var otherName = '';	// id的名称
					if (data[i].pay_id != '' && data[i].pay_id != undefined) {
						otherId = data[i].pay_id;
						otherName = 'pay_id';
					} else if (data[i].table_id != '' && data[i].table_id != undefined) {
						otherId = data[i].table_id;
						otherName = 'table_id';
					} else if (data[i].order_id != '' && data[i].order_id != undefined) {
						otherId = data[i].order_id;
						otherName = 'order_id';
					}

					content += '<li class="orderlist-list" is_pay_all="'+data[i].is_pay_all+'" add_time="'+data[i].add_time+'" data-type="order" shop-id="'+data[i].shop_id+'" ordertypeinfo="'+data[i].ordertypeinfo+'" otherId="'+otherId+'" otherName="'+otherName+'" cancel_code="'+data[i].cancel_code+'" order_step="'+data[i].order_step+'" order_property="'+data[i].order_property+'">'+
				                    '<div class="orderlist-pitch">'+
				                        '<div class="orderlist-list">'+
				                            '<div class="orderlist-border">'+
				                            	'<div class="orderlist-list-title">'+((data[i].f_shop_name != '' && data[i].f_shop_name != null)? data[i].f_shop_name : data[i].shop_name)+
				                            		// '<b class="list_table_name">('+table_type+table_name+')</b>'+
				                            		'<p class="title-order-state">'+ data[i].order_state +'</p>'+
				                            	'</div>'+
				                            	'<div class="clearfix s-eff">'+
					                                '<div class="orderlist-left">'+
							                            (data[i].order_state == '已结账' ? '<p></p>' :
						                            	'<p class="list_float_left">最近下单：'+
						                            		'<b class="list_font_normal list_red">'+lay_order_step+'</b>'+
						                            	'</p>')+
						                            	// '<p>'+order_type_text+'：'+ table_type+table_name + '</p>' +
						                            	'<p>'+order_type_text+'：'+platform_type[data[i].platform_type]+table_name + '</p>' +
					                                    // '<div class="orderlist-list-futitle">'+Util.getLocalTimeDate(data[i].add_time)+
					                                    // '</div>'+
					                                '</div>'+
					                                '<div class="orderlist-right">'+
					                                	'<span>￥</span>'+parseFloat(data[i].consumes)+
					                                '</div>'+
					                            '</div>'+
				                            '</div>'+

				                            '<div class="orderlist-list-futitle orderlist-list-futitle-box clearfix">' +
				                            	// (data[i].order_state == '已结账' ? '<p></p>' :
				                            	// '<p class="list_float_left">最近下单：'+
				                            	// 	'<b class="list_font_normal list_red">'+lay_order_step+'</b>'+
				                            	// '</p>')+
				                            	// '<p>'+order_type_text+'：'+ data[i].order_state + '</p>' +
				                            	'<div class="orderlist-list-futitle orderlist-list-time">'+Util.getLocalTimeDate(data[i].add_time)+
					                            '</div>'+
				                            	'<div class="orderlist-status">' +
				                            	    	(data[i].order_state == '已结账' && data[i].order_step != 0 && data[i].platform_type == 0 ?// 已结账
				                            	        '<div class="orderlist-status-reviews" data-type="buy">再来一单</div>': '')+
				                            	        (data[i].order_step == 0 && data[i].order_state == '已结账' && data[i].platform_type == 0 ?// 已取消
				                            	        '<div class="orderlist-status-reviews" data-type="reOrder">重新下单</div>': '')+
				                            	        (data[i].is_comment == 1?'<div class="orderlist-status-reviews" data-type="comments">点评订单</div>': '')+
				                            	        '<div class="orderlist-status-reviews hide">订单支付</div>'+
				                            	    '</div>'+
				                            	'</div>'+
				                            '</div>'+
				                        '</div>'+
				                    '</div>'+
				                    '<span class="hide" order_state="'+data[i].order_state+'"></span>'+
				                '</li>';
				}

				return content;
			}

			listObj.prototype.viewContent = function () {
				var that = this;//div[data-type="order"]
                $(that.content).delegate('li', 'click', function() {
					var otherId = $(this).attr('otherId');		// id
					var otherName = $(this).attr('otherName');	// id的名称
					var add_time = $(this).attr('add_time');
					var shopId = $(this).attr('shop-id');
					var eveType = $(event.target).attr('data-type');
					var ordertypeinfo = $(this).attr('ordertypeinfo');
					//var is_pay_all = $(this).attr('is_pay_all');
					// is_pay是否未支付，0 未支付 1 已结账
					var order_state = $(this).find('span[class="hide"]').attr('order_state');
					// 如果订单状态 不是 9已结账 并且不是 0已取消 都跳到支付页面，否则跳到详情页面
					// order_step  订单状态：1下单 2到店  3确认出单 9已结账 0门店取消订单
					var order_step = $(this).attr('order_step');
					var cancel_code = $(this).attr('cancel_code');

					var order_property = $(this).attr('order_property');


					// 再来一单或者重新下单
					if (eveType == 'buy' || eveType == 'reOrder') {

				        var data = {
							'card_id': cardId,	// 会员卡id
							//otherName: orderId,	// 可能是pay_id、table_id、order_id
							'cid': Cache.get('getCID')
				        };
				        var dataAjax;
				        var page;
        				var trade_type = Util.isWhat()
						if (otherName == 'table_id') {
					        page = {
					            'trade_type': trade_type,
					            'start_time': add_time,
					            'table_id': otherId
					        };
						} else if (otherName == 'pay_id') {
					        page = {
					            'trade_type': trade_type,
					            'pay_id': otherId
							};
				    	} else {
					        page = {
					            'trade_type': trade_type,
					            'order_id': otherId
							};
				    	}
						dataAjax = $.extend({}, page, data);

						// 获取订单详情得到菜品数据
						Data.setAjax('orderInfo', dataAjax, '#layer', '#msg', {20: ''}, function (respnoseText) {
							var orderData = respnoseText.data;
							if (respnoseText.code == 20) {
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
					            Cache.set('allMenuData_'+ order_property, allMenuData);
								Page.open('dishes&card_id='+cardId+'&shop_id='+shopId+'&shop_name='+orderData.shop_name+'&page=orderlist&again=1&order_property='+order_property);
							} else {
								Message.show('#msg', respnoseText.message, 2000);
							}
						}, 2);
					} else if (eveType == 'comments') {
						Cache.set('url_comment', 'orderDetails&card_id='+cardId+'&'+otherName+'='+otherId+'&otherName='+otherName+'&add_time='+add_time+'&page=orderlist&order_list_type='+orderListType+'&order_property='+order_property);
						// 点评订单
						Page.open('orderDetails&card_id='+cardId+'&'+otherName+'='+otherId+'&otherName='+otherName+'&add_time='+add_time+'&page=orderlist&order_list_type='+orderListType+'&processComment='+1+'&order_property='+order_property);
					} else {
						// 判断传什么参数跳转订单详情，pay_id第一，table_id第二，order_id第三
						
						// 查看订单
						if (order_state == '已结账' || order_state == '已支付' || (order_step == 0 && cancel_code != 2)) {
							Page.open('orderDetails&card_id='+cardId+'&'+otherName+'='+otherId+'&otherName='+otherName+'&add_time='+add_time+'&page=orderlist&order_list_type='+orderListType+'&order_property='+order_property);
						} else {
							Page.open('payorder&card_id='+cardId+'&pay_id='+otherId+'&page=orderlist&type=1'+'&order_property='+order_property);
						}
					}
                });
			}
			return new listObj();
		}
		orderListObj(content).getlistData();

		// 跳转微信支付
		function wxpayjump (wxpayData) {
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
									//'order_id': wxpayData.order_id,
									'prepayid': wxpayData.package.split('=')[1],
									'noncestr': wxpayData.nonceStr,
									'timestamp': wxpayData.timeStamp,
									'sign': wxpayData.paySign
								};

								Data.setCallback(wxConfig+'wxpay/callback_order_jsapi.php', data, '#layer', '#msg', {20: ''}, function(respnoseText) {
									//window.location.reload();
								}, 1);
				            } else {
				            	//window.location.reload();
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
		            //微信回调值（0：成功，-1：错误，-2：取消）
		            if (result == '0') {//orderData.callback_url

						var data = {
							'cid': Cache.get('getCID'),
							'card_id': cardId,
							//'order_id': wxpayData.order_id,
							'prepayid': wxpayData.prepayid,
							'noncestr': wxpayData.noncestr,
							'timestamp': wxpayData.timestamp,
							'sign': wxpayData.sign
						};

		                Data.setCallback(wxConfig+'wxpay/callback_order.php', data, '#layer', '#msg', {20: ''}, function(respnoseText) {
		                    //window.location.reload();
		                }, 2);
		            } else if (result == '-1') {
		                //window.location.reload();
		            } else if (result == '-2') {
		                //window.location.reload();
		            }
				});
			}
		}
	};

	Orderlist.prototype.bindPageEvents = function () {
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

	Orderlist.prototype.bindPageRefreshEvents = function () {
	};

	Orderlist.prototype.unload = function () {
		Cache.del('is_refresh_orderlist');
	};

	return Orderlist;
});