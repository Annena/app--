define('page/nomemberpay', [
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
], function (Page, Dialog, Message, Cache, Data, Pattern, Config, Mobile, Update, Util, Bar, Edit, Pattern) {
	
	var card_id,
		shop_id,
		shop_name,
		table_id,
		table_name,
		page,
		promo_id,
		promo,
		pay_moneys,
		pay_sub_moneys,
		sub_moneys,
		consumes,
		wxpay_temp;

	var PayOrder = function () {
		this.back = 'orderlist&card_id='+card_id+'&order_list_type=1'
	}
	// 支付页面
	PayOrder.prototype = new Page('nomemberpay');

	PayOrder.prototype.bindPageEvents = function () {
		var selfThis = this;
		page = Util.getQueryString('page');
		card_id = Util.getQueryString('card_id');
		shop_id = Util.getQueryString('shop_id');
		table_id = Util.getQueryString('table_id');
		pay_id = Util.getQueryString('pay_id');
		table_name = decodeURIComponent(Util.getQueryString('table_name'));
		shop_name = decodeURIComponent(Util.getQueryString('shop_name'));
		var add_time = Util.getQueryString('add_time');

		var scanCodeType = Util.getQueryString('type'),// 扫描二维码传过来的
			scanCodePayId = Util.getQueryString('pay_id'),// 扫描结账单二维码传过来的
			scanCodeOrderId = Util.getQueryString('order_id'),// 扫描快捷支付订单二维码传过来的
			scanType = Util.getQueryString('scanType');// 扫描二维码的类型

		this.back = 'orderlist&card_id='+card_id+'&order_list_type=1'
		//order_step  订单状态：1下单  3确认出单 9已结账 0门店取消订单

		var wxpay = 0,					// 微信支付金额
			alipay = 0,
			dishesConsume = 0,			// 消费金额
			wxPayMoney = 0,				// 微信支付金额
			aliPayMoney = 0,
			paidMoney = 0,				// 已付金额
			discount_rate = 0,			//折扣
			stored = 0,					//乐币
			voucher = 0,				//优惠
			is_member_price = 0,		//会员价

			scroll = Bar('#payorderScroll'),// 页面滚动条

			payorderDate,				// 基础数据
			dishesMenu = '';			// 菜品数据

		$('title').text('订单支付');

		var epay_id_order = {};

	    // 获取到点菜页传过来的数据
	    var disOrder = Cache.get('disOrder');

        // 获取到是否领卡的缓存，在点击选好了的时候判断是否领卡，如果没有领卡就请求领卡接口，提示领卡成功。
        var yesNoCard = Cache.get(card_id+'yesNoCard');

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay()

        var openid = $.cookie('openid');
        /*APP1
        微信2
        点菜宝3
        收银台4*/
        var trade_type = Util.isWhat()

        // shop_type_info 0 桌台模式  1叫号 2台卡
        var shop_type_info = 1;
        // 说明是扫描桌台二维码到点餐页面然后到这个支付页面的 或者 是扫描预结结账单过来的
        if (scanCodeType == 0 && (scanType == 2 || scanType == 4)) {
			shop_type_info = 1;
			Cache.set('shop_type_info', shop_type_info);
        } else {
			shop_type_info = Cache.get('shop_type_info');
        }

		var pay = {

			init: function () {
                // 判断微信访问
                this.weixinVisit();

				//alert($.app.body_height);
				//alert($('#payorder-footer').height());
				// 得到屏幕宽度，因为页面设了padding有内边距，所以宽度不能是屏幕宽度
				var wid = $.app.body_width - $.app.body_width / 100 * 5 * 2;
				// 获取到屏幕宽度，赋值给页面
				$('#payorderScroll').width(wid);


				// 判断并调用相应方法
				this.orderJudge();

				// 绑定页面事件
				this.bindEvents();
				// 滚动
				scroll.refresh();

			},

            // 判断微信访问
            weixinVisit: function () {
                var self = this;
                if (isWeixin || isAli) {
                    $('#download').removeClass('hide');

                    //document.getElementById('payorderScroll').style.cssText = 'top:84px !important';
                    //document.getElementById('payorder-header').style.cssText = 'top:35px !important';

                    $('#payorder-header').addClass('top35')
                    $('#payorderScroll').addClass('top84')

                    $('#download').unbind('click').bind('click', function () {
                        window.location=phpDownload;
                    });

                } else {
                    $('#download').addClass('hide');
                }
            },

			// 判断并调用相应方法
			orderJudge: function () {
				// 是扫描过来的，并且是扫描的结账单二维码
				this.orderScanOrder(card_id, scanCodePayId);
			},

			// 获取订单详情
			orderScanOrder: function (cardId, payId) {
				var self = this;
				var isOpenId = Util.getQueryString('isopenid');
				var is_scan_repeat = '';
				if (isOpenId == 1) {
					is_scan_repeat = 1;
				}
				//alert('bbbb');http://vxtest140.lekabao.net/html/index.html?nomemberpay&card_id=cc1fczgbkoyy&pay_id=ppqxsj0y71ss&page=merchantHome&type=0&scanType=4
				Data.setAjax('wxpayScanOrder', {
					'card_id': cardId,
					'pay_id': payId,
					'cid': Cache.get('getCID'),
					'trade_type':trade_type,
					'is_scan_repeat': is_scan_repeat
				}, '#layer', '#msg', {20: '',200216: '',436142: ''}, function (respnoseText) {
					var data = respnoseText.data;
					//alert(respnoseText.code+'---'+respnoseText.message);
					if (respnoseText.code == 20) {
						// 扫描预结单说明桌台模式是0
						shop_type_info = 1;
						Cache.set('shop_type_info', shop_type_info);
						// 详情基本赋值
						self.basicReplication(data);
					} else if (respnoseText.code == 436142){
						// payid总单里面有用户属性，必须登陆才可以支付，跳转登陆页面
						Message.show('#msg', respnoseText.message, 2000, function () {
							Page.open('nomemberlogin');
						});
					} else if (respnoseText.code == 200221){
						// 扫描订单，如果订单已经有用户，且与扫描用户不一致，返回 200221  和PAY_ID  前端直接跳转到订单详情页。
						Message.show('#msg', respnoseText.message, 2000, function () {
							Page.open('orderDetails&card_id='+cardId+'&pay_id='+respnoseText.data+'&otherName=pay_id&page=orderlist&order_list_type=1');
						});
					} else {
						Message.show('#msg', respnoseText.message, 2000);
					}
				}, 2);
			},

			// 基本赋值
			basicReplication: function (data) {
				payorderDate = data;

		        // 得到微信公众号需要的openid
		        if (isWeixin) {
					var isOpenId = Util.getQueryString('isopenid');
					if (isOpenId != 1) {
						$('#ta').unbind('click').bind('click', function () {
							var apiLink = location.href.split('//')[1].split('/')[0];
							var apiLink1 = location.href.split('?')[1];
							$.cookie('html_url', phpJump+'?'+apiLink1+'&isopenid=1', {path:'/',domain:'.lekabao.net'});
							//$.cookie('html_url', 'http://'+apiLink+'/?'+apiLink1+'&isopenid=1', {path:'/',domain:'.lekabao.net'});
							window.location = wxConfig+"order/get_openid.php?card_id="+card_id+"&trade_type=JSAPI";
							//window.location="http://api."+apiLink+"/guest/get_openid.php?card_id="+card_id;
						});
						$('#ta').click();
					}
				}


				if(isWeixin){
					$('#alipayDisplay').addClass('hide')
					alipay = 0.00
				}if(isAli){
					$('#wxpayDisplay').addClass('hide')
					wxpay = 0.00
				}

				// 将以下属性添加到页面
				$('#payorderScroll').removeClass('hide');
				shop_name = data.pay_info.shop_name;
				selfThis.back = 'orderlist&card_id='+card_id+'&order_list_type=1';


				// 判断如果支付过就不显示 会员可优惠 那一行
				if (data.pay_info.wxpay != 0 || data.pay_info.wxpay_temp != 0) {
					$('#sub_user_display').addClass('hide');
				} else {
					$('#sub_user_display').removeClass('hide');
				}

				// 判断如果支付过就不显示 会员可优惠 那一行
				if (data.pay_info.alipay != 0 || data.pay_info.alipay_temp != 0) {
					$('#sub_user_display').addClass('hide');
				} else {
					$('#sub_user_display').removeClass('hide');
				}



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
						table_type = data.table_type+' ';
					}
					// shop_type_info 0 桌台模式  1叫号 2台卡
					if (shop_type_info == 1) {
						table_number = '桌台号';
						table_name = data.table_name;
					} else if (shop_type_info == 2) {
						table_number = '台卡号';
						table_name = data.table_name;
					}
					$('#tableNumber').text(table_number+'：');
					$('#tableTypeName').text(table_type+table_name);
				}

				var epay_type = 0;
				var order_step = 0;
				var trade_type = 0;
				// order_pay_status 1未结账未完成支付 2未结账已完成支付 3已结账
				// nopay_order_data 未支付数据 pay_order_data 已支付数据
				wxPayMoney = data.pay_info.wxpay_temp   //未支
				aliPayMoney = data.pay_info.alipay_temp
				paidMoney = data.pay_info.wxpay         //已付
				paidMoney = data.pay_info.alipay        
				// 创建了微信订单的epay_id数组赋值
				epay_id_order = data.pay_info.epay_ids;
				// 商户页logo
				$('#merchantLogin').attr('src','../../img/business/'+card_id+'/logo.jpg');

				if (parseFloat(wxPayMoney) == 0) {
					$('#wxpayDisplay').addClass('hide');
					$('#nowxpayDisplay').addClass('hide');
				}else if(parseFloat(aliPayMoney) == 0){
					$('#alipayDisplay').addClass('hide');
					$('#nowxpayDisplay').addClass('hide');
				} else {
					// 根据微信状态判断显示内容
					// 微信支付状态1 微信未支付 2微信已支付不可信 9微信已支付可信
					// epay_type  0用户取消支付 1创建订单 2用户支付完成 9微信确认支付 order_step 0取消订单
					// 有 nopay_epay_id 说明有创建了微信订单但是没有支付的，就显示取消按钮
					if (data.pay_info.epay_ids != '' && isWeixin == true){
						$('#nowxpayDisplay').removeClass('hide');
						$('#wxpayDisplay').addClass('hide');
						$('#nowxpay').text(parseFloat(wxPayMoney).toFixed(2));
					} else {
						$('#wxpayDisplay').removeClass('hide');
						$('#nowxpayDisplay').addClass('hide');
						$('#wxpay').text(parseFloat(wxPayMoney).toFixed(2));
					}
					if (data.pay_info.epay_ids != '' && isAli == true){
						$('#nowxpayDisplay').removeClass('hide');
						$('#alipayDisplay').addClass('hide');
						$('#nowxpay').text(parseFloat(aliPayMoney).toFixed(2));
					} else {
						$('#alipayDisplay').removeClass('hide');
						$('#nowxpayDisplay').addClass('hide');
						$('#alipay').text(parseFloat(aliPayMoney).toFixed(2));
					}
				}

				// 微信支付、已支付、已取消三个按钮的显示隐藏
				/*var isexit = Cache.get('isexit');
				if ((isexit == 1 || trade_type != 0) && epay_type == 0) {
					$('#payorder-footer').addClass('hide');
					$('#define-pay').addClass('hide');
					$('#quickPay').addClass('hide');
					$('#exitPay').removeClass('hide');
					Cache.del('isexit');
				}*/
				//优惠方案
				promo_id = data.pay_info.promo_id
				promo = data.pay_info.promo

				if (data.pay_info.is_pay_all == 1) {
					$('#payorder-footer').addClass('hide');
					$('#define-pay').addClass('hide');
					$('#quickPay').removeClass('hide');
					$('#exitPay').addClass('hide');
				} else {
					$('#define-pay').removeClass('hide');
					$('#quickPay').addClass('hide');
					$('#exitPay').addClass('hide');
				}

				// 商家名称名称
				$('#shopName').text(data.card_name);

				// 店铺名称
				$('#addTime').text(data.pay_info.shop_name);

				//银台优惠
				sub_moneys = parseFloat(data.pay_info.sub_user) + parseFloat(data.pay_info.sub_money)

					$('#sub_money').text(data.pay_info.sub_money)
					$('#sub_money').parent().removeClass('hide')
				
				if (data.pay_info.promo.promo_name != undefined) {
					//银台优惠名称
					$('#sub_moneyu').text('（'+data.pay_info.promo.promo_name+'）');
				}
				//显示取消支付
				if(data.pay_info.wxpay_temp != 0){
					$('#cancelPay').removeClass('hide')
				}else{
					$('#cancelPay').addClass('hide')
				}
				shop_id = data.shop_id
				stored = data.pay_info.stored,					//乐币
				voucher = data.pay_info.voucher,				//优惠
				is_member_price = data.pay_info.is_member_price,		//会员价
				// 菜品数据
				dishesMenu = data.menu;
				// 消费金额
				consumes = data.consumes
				//
				dishesConsume = consumes - sub_moneys - paidMoney
				//折扣
				discount_rate = data.pay_info.discount_rate;
				//table id
				table_id = data.table_id
				//APP支付时的优惠金额
				pay_sub_moneys = sub_moneys
				//实收金额
				pay_moneys = data.consumes - pay_sub_moneys

				// 已付金额
				if (parseFloat(paidMoney) == 0) {
					$('#paidMoneyId').addClass('hide');
				} else {
					$('#paidMoneyId').removeClass('hide');
					$('#paidMoney').text(parseFloat(paidMoney).toFixed(2));
				}

				// 消费金额
				$('#consume').text(parseFloat(consumes).toFixed(2));
				//显示微信支付金额
				$('#wxPay').val(parseFloat(dishesConsume).toFixed(2))
				$('#aliPay').val(parseFloat(dishesConsume).toFixed(2))

				// 实付金额
				$('#realPay').text(parseFloat(dishesConsume).toFixed(2));
				//应付金额
				$('.payments #yingfuH2').text(parseFloat(dishesConsume).toFixed(2))
				// 已付 = 乐币 + 抵用劵 + 微信
				var one_money = data.pay_info.wxpay;
				// 已付金额显示
				if (one_money != 0) {
					$('#pay_order_data').removeClass('hide');
					$('#pay_order_data_money').text(parseFloat(one_money).toFixed(2));
				} else {
					$('#pay_order_data').addClass('hide');
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
					this.menuList(data,data.menu);
				}
			},

			// 显示菜品数据
			menuList: function (data,menu) {
				var contentMain = '';	// 全部订单
				var content = '';		// 单个订单
				var contentRe = '';		// 套餐菜				
				//for (var i = 0;i<menu.length;i++) {可以用for循环写
				var menu_unit = '';

				// 是否是扫描结账单 0，否，1，是
				var isScan = 0;
				// 菜品数量
				var mneuNum = 0;
				var menu_unit = '';
				//cancel_code 取消状态：1门店桌台被占用 2服务员取消订单 3退单
				var cancelCode = {
					0: '',
					1: '(门店桌台被占用)',
					2: '(服务员取消订单)',
					3: '(退单)',
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
				//结未结账  0未结账 1结账
				var whether_checkout = 1;

				for (var i in data.order) {
					if (data.order[i].order_step != 0) {
						quxiao = 0
					}
				}

				if (data.pay_info.is_pay == 1) {
					$('#pay_order_data').css('color','#333333')
					$('#orderStatus').attr('src','../img/base/pg-payorderpayYJZ.png')
				}else if (data.pay_info.is_pay_all == 1) {
					$('#orderStatus').attr('src','../img/base/pg-payorderpayYZF.png')
				}else if(quxiao == 1){
					$('#pay_order_data').css('color','#333333')
					$('#orderStatus').attr('src','../img/base/pg-payorderpayYQX.png')
				}

				// 判断是扫描过来的，并且是扫描的结账单二维码
				if (scanCodeType == 0 && scanType == 4) {
					isScan = 1;
				} else {
					isScan = 0;
				}
				for (var i in data.order) {
					if (data.order[i].order_step == 3 || data.order[i].order_step == 9) {
						order_step = data.order[i].order_step;
					}

					contentMain = contentMain + '<ul class="mengul clearfix" style="" id="">'+
                  									'<li style="border-bottom:1px dashed #dcdcdc" class="state">'+
														'<p>'+
															'<u>'+Util.getLocalTimeDate(data.order[i].add_time)+'</u>'+
															'<u>'+payName[data.order[i].order_step]+
																'<b style="color:#fb5555; font-size:12px;" >'+cancelCode[data.order[i].cancel_code]+'</b>'+
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
							flavorContent += ' — '+data.menu[i][f].menu_flavor[j].flavor_name+' x '+data.menu[i][f].menu_flavor[j].flavor_count+'<br>';
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
						// 订单状态是3确认出单 或者 9已结账 并且菜品数量大于0（说明退、赠、转 没有把菜全部退、赠、转完） 满足条件的显示点赞按钮
						// is_set_menu 是否套餐，1是 0否
						if (data.menu[i][f].is_set_menu == 0) {
							content += '<li style="color:#666;" class="clearfix" menu-id="'+data.menu[i][f].menu_id+'">'+
											'<span class="mengspan">'+data.menu[i][f].menu_name+'</span>'+
										    '<span class="mengspan">'+
												'<b>'+
													data.menu[i][f].menu_pay_price+
												'</b>'+
												'<u class="twou"><i></i><i>'+(parseFloat(data.menu[i][f].menu_num)+parseFloat(data.menu[i][f].give_menu_num)+parseFloat(data.menu[i][f].cancel_menu_num)+parseFloat((data.menu[i][f].rotate_menu_num == undefined ? 0 : data.menu[i][f].rotate_menu_num))).toFixed(1)+menu_unit+'</i></u>'+
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
									for(var h in data.set_menu[i][g][p]) {
										var num11 = 0;
										var flavorOne = '<p class="order-infokouwei" style="padding-left:10%">';
										for (var e in data.set_menu[i][g][p][h].menu_flavor) {
											flavorOne += ' — '+data.set_menu[i][g][p][h].menu_flavor[e].flavor_name+' x '+data.set_menu[i][g][p][h].menu_flavor[e].flavor_count+'<br/>';
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

										dishesOne += '<p class="dishName" style="color: #a8a8a8;font-size: 12px;width: 94%;padding-left: 1em;">'+data.set_menu[i][g][p][h].menu_name+
								                        '<i>'+data.set_menu[i][g][p][h].menu_num+'份</i>'+
								                  '</p>'+flavorOne+noteOne;
								    }
									content += '<li class="clearfix" menu-id="'+data.menu[i][f].menu_id+'">'+
													'<span class="mengspan">'+data.menu[i][f].menu_name+'</span>'+
													'<span class="mengspan"><b class="pricespan">'+data.menu[i][f].member_price+'</b><u class="oneu"></u><u class="twou"><i></i><i></i></u></span>'+
								                    '<i></i>'+
								                    dishesOne+
								                '</li>';
								}
							}
						}

						// 如果增菜个数大于0，就在页面上显示着一条记录
						if (data.menu[i][f].give_menu_num > 0) {
							contentRe += '<li class="clearfix">'+
								data.menu[i][f].menu_name+'x'+parseFloat(data.menu[i][f].give_menu_num).toFixed(1)+
								'<div class="tuizeng">赠</div>'+
									'<span>0/'+menu_unit+'</span>'+
								'</li>';
						}
						// 如果退菜个数大于0或者转菜个数大于0，就在页面上显示着一条记录
						if (data.menu[i][f].cancel_menu_num > 0 || data.menu[i][f].rotate_menu_num > 0) {
							contentRe += '<li class="clearfix">'+
								data.menu[i][f].menu_name+'x'+(parseFloat(data.menu[i][f].cancel_menu_num)+parseFloat((data.menu[i][f].rotate_menu_num == undefined ? 0 : data.menu[i][f].rotate_menu_num))).toFixed(1)+
								'<div class="tuizeng">退</div>'+
									'<span>'+data.menu[i][f].menu_pay_price+'/'+menu_unit+'</span>'+
								'</li>';
						}
					}
					
					content = content + contentRe+(data.order[i].order_note == '' ? '' : '<li style="border:0;" class="clearfix">'+
														'备&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;注：'+
														'<input class="orderNote" type="text" readonly="readonly" id="" placeholder="选填，添加备注" data-description="选填，添加备注">'+
													'</li>')+
													'</ul>';
					contentMain = contentMain + content;
				}
				
				$('#menuDispalyT').html(contentMain);
				scroll.refresh();
			},

			// 绑定页面事件
			bindEvents: function () {
				var self = this;

				// 取消微信支付按钮点击事件
				$('#wxcancelPay').unbind('click').bind('click', function (){
					/*var epay_id_orderarray = new Array();
					var num = 0;
					for (var i in epay_id_order) {
						epay_id_orderarray[num] = epay_id_order[i];
						num++;
					}*/
					Data.setAjax('wxpayResetWxpay', {
						'card_id': card_id,	// 会员卡id
						'cid': Cache.get('getCID'),
						'trade_type':trade_type,
						'pay_id': scanCodePayId
					}, '#layer', '#msg', {20: ''}, function (respnoseText) {
						if (respnoseText.code == 20) {
							Message.show('#msg', respnoseText.message, 2000, function () {
								// 存储用来判断是否显示已取消按钮的
								Cache.set('isexit', 1);
								window.location.reload();
							});
						} else {
							Message.show('#msg', respnoseText.message, 2000, function () {
								window.location.reload();
							});
						}
					}, 2); 
				});
				// 取消支付宝支付按钮点击事件
				$('#alicancelPay').unbind('click').bind('click', function (){
					/*var epay_id_orderarray = new Array();
					var num = 0;
					for (var i in epay_id_order) {
						epay_id_orderarray[num] = epay_id_order[i];
						num++;
					}*/
					Data.setAjax('wxpayResetWxpay', {
						'card_id': card_id,	// 会员卡id
						'cid': Cache.get('getCID'),
						'trade_type':trade_type,
						'pay_id': scanCodePayId
					}, '#layer', '#msg', {20: ''}, function (respnoseText) {
						if (respnoseText.code == 20) {
							Message.show('#msg', respnoseText.message, 2000, function () {
								// 存储用来判断是否显示已取消按钮的
								Cache.set('isexit', 1);
								window.location.reload();
							});
						} else {
							Message.show('#msg', respnoseText.message, 2000, function () {
								window.location.reload();
							});
						}
					}, 2); 
				});

				// 确认支付点击事件
				$('#define-pay').unbind('click').bind('click', function () {
					var subWxPay = $('#wxPay').val()
					var subAliPay = $('#alipay').val()
					//判断微信输入的是否是数字
					if(isNaN(subWxPay)){
						Message.show('#msg', '请输入正确的微信支付金额', 2000, function () {});
						return
					}else if(subWxPay == ''){
						subWxPay = 0
					}
					if(isNaN(subAliPay)){
						Message.show('#msg', '请输入正确的支付宝支付金额', 2000, function () {});
						return
					}else if(subAliPay == ''){
						subAliPay = 0
					}
					Data.setAjax('pay_scan', {
						'wxpay': parseFloat(subWxPay).toFixed(2),
						'alipay':parseFloat(subAliPay).toFixed(2),			// 支付宝支付金额
						'openid': openid,
						'card_id': card_id,
						'pay_id': scanCodePayId,
						'cid': Cache.get('getCID'),
						'trade_type':trade_type,
						'stored':parseFloat(stored).toFixed(2),
						'voucher':parseFloat(voucher).toFixed(2),
						'is_member_price':is_member_price,
						'discount_rate':discount_rate,
						'consume':parseFloat(dishesConsume).toFixed(2),
						'consumes':parseFloat(consumes).toFixed(2),
						'promo_id':promo_id,
						'promo':promo,
						'pay_sub_moneys':parseFloat(pay_sub_moneys).toFixed(2),
						'pay_moneys':parseFloat(pay_moneys).toFixed(2),	
					}, '#layer', '#msg', {20: '',200216: '',430209: ''}, function (respnoseText) {
						var data = respnoseText.data;
						//alert(respnoseText.code+'---'+respnoseText.message);
						if (respnoseText.code == 200218) {
							// 扫描预结单说明桌台模式是0
							shop_type_info = 1;
							Cache.set('shop_type_info', shop_type_info);
							// 跳转微信支付
							self.wxpayjump(data, subWxPay);
						} else if(respnoseText.code == 200228){
							self.alipayOrder(respnoseText.data);
						} else if (respnoseText.code == 200221){
							// 扫描订单，如果订单已经有用户，且与扫描用户不一致，返回 200221  和PAY_ID  前端直接跳转到订单详情页。
							Message.show('#msg', respnoseText.message, 2000, function () {
								Page.open('orderDetails&card_id='+card_id+'&pay_id='+respnoseText.data+'&otherName=pay_id&page=orderlist&order_list_type=1&is_comm=1');
							});
						} else {
							Message.show('#msg', respnoseText.message, 2000);
						}
					}, 2);
				});
				//点击会员支付跳回非会员支付登录界面
				$('#backNomelogin').unbind('click').bind('click', function () {
					// location.href.split('//')[1].split('/')[0]
					var jump_no = location.href.split('?nomemberpay')[1].split('&isopenid=1')[0];
					Page.open('nomemberlogin'+jump_no);
				});
				
				//监控微信输入价格得到银台支付金额
				
				$('#wxPay').bind('input propertychange', function() { 
					var yingfujine = $('#yingfuH2').text()           //获取应付金额
					var wxVal = $(this).val()						//获取输入金额
					var yanzheng = wxVal - yingfujine				//判断如果输入金额大于应付金额则输入金额等于应付金额
					if(yanzheng > 0){
						$(this).val(yingfujine)
					}	
					var yintaiH =  parseFloat(yingfujine) - parseFloat(wxVal)
					if(isNaN(yintaiH) || yintaiH < 0){
						$('#yintaiH').parent().parent('li').addClass('hide')
						$('#yintaiH').text(0.00)
					}else{
						$('#yintaiH').parent().parent('li').removeClass('hide')
						$('#yintaiH').text(yintaiH)
					}

				});  
				$('#aliPay').bind('input propertychange', function() { 
					var yingfujine = $('#yingfuH2').text()           //获取应付金额
					var aliVal = $(this).val()						//获取输入金额
					var yanzheng = aliVal - yingfujine				//判断如果输入金额大于应付金额则输入金额等于应付金额
					if(yanzheng > 0){
						$(this).val(yingfujine)
					}	
					var yintaiH =  parseFloat(yingfujine) - parseFloat(aliVal)
					if(isNaN(yintaiH) || yintaiH < 0){
						$('#yintaiH').parent().parent('li').addClass('hide')
						$('#yintaiH').text(0.00)
					}else{
						$('#yintaiH').parent().parent('li').removeClass('hide')
						$('#yintaiH').text(yintaiH)
					}

				});  

				//点击修改菜品
				$('#addorder').unbind('click').bind('click', function(){
					if(wxPayMoney == 0 && paidMoney == 0 && !$.cookie("user_mobile")){
						Data.setAjax('pay_scan', {
							'wxpay': '0.00',
							'alipay':'0.00',
							'openid': openid,
							'card_id': card_id,
							'pay_id': scanCodePayId,
							'cid': Cache.get('getCID'),
							'trade_type':trade_type,
							'stored':parseFloat(stored).toFixed(2),
							'voucher':parseFloat(voucher).toFixed(2),
							'is_member_price':is_member_price,
							'discount_rate':discount_rate,
							'consume':parseFloat(dishesConsume).toFixed(2),
							'consumes':parseFloat(consumes).toFixed(2),
							'promo_id':promo_id,
							'promo':promo,
							'pay_sub_moneys':parseFloat(pay_sub_moneys).toFixed(2),
							'pay_moneys':parseFloat(pay_moneys).toFixed(2),	
						}, '#layer', '#msg', {20: '',200216: '',430209: ''}, function (respnoseText) {
							var data = respnoseText.data;
							//alert(respnoseText.code+'---'+respnoseText.message);
							if (respnoseText.code == 200210) {
								Page.open('dishes&pay_id='+scanCodePayId+'&card_id='+card_id+'&table_id='+table_id+'&page=merchantHome&type=0&scanType=2&is_jump_choice=1');			
							} else {
								Message.show('#msg', respnoseText.message, 2000);
							}
						}, 2);					
					}else{
						Page.open('dishes&pay_id='+scanCodePayId+'&card_id='+card_id+'&table_id='+table_id+'&page=merchantHome&type=0&scanType=2&is_jump_choice=1');
					}
				})
				//点击刷新按钮
				$('#newLoad').unbind('click').bind('click', function (){
					window.location.reload();
				});
			},

			// 跳转微信支付
			wxpayjump: function (wxpayData, subWxPay) {

				if (isWeixin) {
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
					        	//alert(JSON.stringify(wxpayData)+'--'+card_id+'--'+scanCodePayId);
					            if(res.err_msg == "get_brand_wcpay_request:ok" ) {
					            	//window.location.reload();
									var data = {
										'cid': Cache.get('getCID'),
										'card_id': card_id,
										//'pay_id': scanCodePayId,
										'prepayid': wxpayData.package.split('=')[1],
										'noncestr': wxpayData.nonceStr,
										'timestamp': wxpayData.timeStamp,
										'sign': wxpayData.paySign
									};
									var apiLinks = location.href.split('//')[1].split('/')[0];
									Data.setCallback(wxConfig+'wxpay/callback_order_jsapi.php', data, '#layer', '#msg', {20: ''}, function(respnoseText) {
										//Message.show('#msg', respnoseText.message, 2000);
										//alert(respnoseText.code+'-'+respnoseText.message);
										//window.location.reload();
										// 没有全额支付完只能在当前页面，否则跳转到详情页面显示数据
										dishesConsume = parseFloat(dishesConsume).toFixed(2)
										subWxPay = parseFloat(subWxPay).toFixed(2)
										if (dishesConsume != subWxPay) {
											window.location.reload();
										}else {
											Page.open('orderDetails&card_id='+card_id+'&pay_id='+wxpayData.pay_id+'&otherName=pay_id&page=orderlist&order_list_type=1&is_comm=1');
										}
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
					Message.show('#msg', '请在微信中支付！', 2000);
				}
			}
		}
        // 微信打开
        if (Util.isWeixin()) {
            // 如果缓冲中没有cid，就调用方法请求接口获取cid
            if (!Cache.get('getCID')) {
                Data.setAjax('userCid', '', '#layer', '#msg', {20: ''}, function (respnoseText) {
                    // 获取到的cid放到缓存中
                    Cache.set('getCID', respnoseText.data);
                    pay.init();
                }, 1);
            } else {
                pay.init();
            }
        } else {
            pay.init();
        }
	}

	return PayOrder;

});