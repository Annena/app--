define('page/selectVouchers', [
	'base/page',
	'base/dialog',
	'base/cache',
	'base/data',
	'base/pattern',
	'base/util',
	'base/scrollbar',
	'base/pattern',
	'base/message'
], function (Page, Dialog, Cache, Data, Pattern, Util, Bar, Pattern, Message) {

	var SelectVouchers = function () {
		this.back = '';
	}
	// 选中抵用劵支付页面
	SelectVouchers.prototype = Page('selectVouchers');

	SelectVouchers.prototype.bindPageEvents = function () {
		var Vouchers = {
			scroll: null,
			Vouchersid : Util.getQueryString('id'),
 
			init: function (){
				this.scroll = Bar($('VouchersMain')[0]);
				// 获取数据
				this.getVouchers(this.Vouchersid);
				// 绑定点击事件
				this.VouchersBind();
				// 滚动刷新
				this.scroll.refresh();
			},

			// 获取数据
			getVouchers: function (id) {
				var content = '';

				for (var i in date) {
					content += '<li>西北</li><li></li><li>老家肉饼</li>';
				}

				// 添加到页面中
				$('#shopListMain').html(content);
				// 刷新滚动
				this.listScroll.refresh();
			},

			// 绑定点击事件
			VouchersBind: function () {
				// 抵用劵选择点击事件
				$('#payorder-discount-list li').unbind('tap').bind('tap', function() {
					// 样式的改变之类的代码
				});

				// 确定选择抵用劵
				$('#payorder-discount-list').unbind('click').bind('click', function () {
					// 获取到选择的抵用劵的金额，跳转并传给订单支付页面
					Page.open('');

				});
			}
		}

		Vouchers.init();
	}

	return SelectVouchers;
});