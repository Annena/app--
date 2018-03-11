define('page/vouchersList', [
	'base/page',
	'base/scrollbar',
	'base/data',
	'base/load',
	'base/util',
	'base/cache',
	'base/message'
], function (Page, Bar, Data, Load, Util, Cache, Message) {

	var cardId;

	var VouchersList = function () {
		this.back = 'merchantHome&card_id='+ cardId;
	};
	// 抵用劵列表页面
	VouchersList.prototype = new Page('vouchersList');

	VouchersList.prototype.util = function () {

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/
		// 获取到URL里面page的值，那是上一个页面的名称，之后赋值给返回，即可返回到上一页面
        var page = Util.getQueryString('page');
        cardId = Util.getQueryString('card_id');
        if (cardId == undefined) {
			this.back = page;
        } else {
			this.back = page+'&card_id='+ cardId;
        }
        $('title').text('抵用券');

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay()

		// 判断微信访问
        weixinVisit();

        // 判断微信访问
        function weixinVisit () {
            var self = this;
            if (isWeixin || isAli) {
                $('#download').removeClass('hide');
				$('header').addClass('hide');
                //document.getElementById('vouchersListScroll').style.cssText = 'top:92px !important';
                //document.getElementById('vouchers-header').style.cssText = 'top:45px !important';

                $('#vouchers-header').addClass('top35')
                $('#vouchersListScroll').addClass('top82')
				$('.vouchers-nav').addClass('top45')
                $('#download').unbind('click').bind('click', function () {
                    window.location=phpDownload;
                });
            } else {
                $('#download').addClass('hide');
				$('header').removeClass('hide');
            }
        }

		var content = '#vouchersList';

		function VouchersListObj (content, data) {
			var Vouchers = function() {};

	        Vouchers.prototype = new Load(content, {
				url: 'voucherList',
				data: data
			});

			//alert(Vouchers.prototype.option.data.is_del);
	        //获取到所有抵用劵并展示出来
	        Vouchers.prototype.eachData = function(data) {

	            var content = '';

	            for (var i in data) {

	                // 已领卡样式
	                var classContent = 'vouchers-content',
	                	classLeftTitle = 'vorchers-explain-title',
	                	classLeftFutitle = 'vorchers-explain-futitle',
	                	classRightTitle = 'vorchers-right-title',
	                	classRightFutitle = 'vorchers-right-futitle';
	                // 判断是否领卡，如果未领卡
	                /*if () {
	                	classContent = 'vouchers-content-grey';
	                	classLeftTitle = 'vorcher-grey-explain-title';
	                	classLeftFutitle = 'vorcher-grey-explain-futitle';
	                	classRightTitle = 'vorcher-grey-right-title';
	                	classRightFutitle = 'vorcher-grey-right-futitle';
	                }*/
	                // 已使用和已过期的盖章样式，默认已使用
	                var className = 'overdued-site';

	                // is_del = 0  正常  1 使用   2过期
	                if (data[i].is_del == 0) {
	                	classContent = 'vouchers-content';
	                } else if (data[i].is_del == 1) {
	                	classContent = 'vouchers-content-gq';
	                	className = 'overdued-site';
	                } else if (data[i].is_del == 2) {
	                	classContent = 'vouchers-content-gq';
	                	className = 'overdata-site';
	                }


	                if(!data[i].data){
						content += '<li class="'+classContent+'" data-id="'+data[i].voucher_id+'">'+
				                        '<div class="vouchers-left">'+
				                            '<div class="'+classLeftTitle+'">'+data[i].voucher_name+'</div>'+
				                            '<div class="'+classLeftFutitle+'">'+(data[i].low_consume == 0 ? '任意金额使用':'满'+data[i].low_consume+'使用')+
				                            '</br>'+data[i].shop_info+'</div>'+
				                        '</div>'+
				                        '<div class="vouchers-right">'+
				                            '<div class="'+classRightTitle+'">'+
				                            	'<span>￥</span>'+parseInt(data[i].voucher_money)+
											'</div>'+
				                            '<div class="'+classRightFutitle+'">'+Util.getLocalDate(data[i].start_time)+
					                            '<p>-</p>'+
					                            '<p>'+Util.getLocalDate(data[i].end_time)+'</p>'+
				                            '</div>'+
											/*'<div class="caipin_name">千叶豆腐千叶豆腐千叶豆腐</div>'+
											'<div class="vorchers-right-title  caipin_num">'+
											  	'<span>'+parseInt(data[i].voucher_money)+'</span>'+
											   	'<i>个</i>'+
											'</div>'+
											'<div class="vorchers-right-futitle">'+
												'<p>'+Util.getLocalDate(data[i].start_time)+'至</p>'+
												'<p>至</p>'+
												'<p>'+Util.getLocalDate(data[i].end_time)+'</p>'+
											'</div>'+*/
				                        '</div>'+
				                        (data[i].is_del == 0 ? '' :
				                        '<div class="'+className+'"></div>')+
				                    '</li>';
	                }
	            }

	            return content;
	        };

	        Vouchers.prototype.viewContent = function(dom) {
	            
	        };

	        return new Vouchers();
		}

		// 点击查看已使用和过期抵用劵
		/*$('#beOverdue').unbind('click').bind('click', function () {
			var data = {
				'card_id': cardId,	// 会员卡id
				'is_del': 1,
				'cid': Cache.get('getCID')
			}
			$('#overDisplay').addClass('hide');
			VouchersListObj(content, data).getlistData();
		});*/

		var data = {
			'card_id': cardId,	// 会员卡id
			'cid': Cache.get('getCID')
		}

		VouchersListObj(content, data).getlistData();
	};

	VouchersList.prototype.bindPageEvents = function () {
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

	return VouchersList;
});