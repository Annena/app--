define('page/vouchersOverdue', [
	'base/page',
	'base/scrollbar',
	'base/data',
	'base/load',
	'base/util',
	'base/cache'
], function (Page, Bar, Data, Load, Util, Cache) {

	var VouchersOverdue = function () {
		this.back = '';
	};
	// 已过期抵用劵列表页面
	VouchersOverdue.prototype = new Page('vouchersOverdue');

	VouchersOverdue.prototype.util = function () {

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/

		var scroll = null,
			content = '#vouchersOverdueList';

		function VouchersOverdueObj (content) {
			var Vouchers = function() {};

	        Vouchers.prototype = new Load(content, {
				url: 'voucherList',
				data: {
					'card_id': 'cc1fczgbkoyy',	// 会员卡id
					'is_del': 1,				// 已使用过期抵用劵
					'cid': Cache.get('getCID')
				}
			});
	        //获取到所有抵用劵并展示出来
	        Vouchers.prototype.eachData = function(data) {

	            var content = '';
	                //所有抵用劵类型的图片
	                /*voucher = {         
	                    '1300004': 'voucher10'          
	                };*/
	            //定义变量，抵用劵前四位
	            //var voucherFour;

						/*'voucher_id'
						'start_time'	
						'end_time'	
						'voucher_name'	
						'voucher_money'		
						'low_consume'*/

	            for (var i in data) {

	                //console.log(data[i].vou_id);


	                if(!data[i].data){
	                    content += '<div class="vouchers-content-gq" data-id="'+data[i].voucher_id+'">'+
					                    '<div class="vouchers-left">'+
					                        '<div class="vorchers-explain-title">'+data[i].voucher_name+'</div>'+
					                        '<div class="vorchers-explain-futitle">满100使用'+
					                        	'</br>仅限北京地区门店'+
					                        '</div>'+
					                    '</div>'+
					                    '<div class="vouchers-right">'+
					                        '<div class="vorchers-right-title">'+
					                        	'<span>￥</span>'+parseInt(data[i].voucher_money)+
					                        '</div>'+
					                        '<div class="vorchers-right-futitle">'+Util.getLocalDate(data[i].start_time)+
					                        	'<p>-</p>'+
					                        	'<p>'+Util.getLocalDate(data[i].end_time)+'</p>'+
					                        '</div>'+
					                    '</div>'+
					                '</div>';
	                }
	                
	            }

	            return content;
	        };

	        Vouchers.prototype.viewContent = function(dom) {
	        	// 点击已使用抵用劵跳转订单详情
	            $(this.content).delegate('li[data-type="1"]', 'click', function() {
	                Cache.del('order_location');
	                Page.open('order&order_id=' + $(this).attr('data-id') + '&page=userAccount&type=3');
	            });
	        };

	        return new Vouchers();
		}

		scroll = Bar($('#vouchersOverdueScroll')[0]);
		VouchersOverdueObj(content).getlistData();
		scroll.refresh();
	};

	VouchersOverdue.prototype.bindPageEvents = function () {
		this.util();
	};

	return VouchersOverdue;

});