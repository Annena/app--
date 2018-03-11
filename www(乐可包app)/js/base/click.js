define('base/click', ['base/page', 'base/cache'], function (Page, Cache) {

	return {
		isLogin: function(isLogin, url, state, type) {
			if ((!$.cookie("user_mobile") && isLogin == true) || state == 400101) {
				Cache.set('loginReturn', url);
				// 判断是扫描预结单到支付页面，再到这里的
				if (type == 1) {
					Page.open('nomemberlogin');
				} else {
					Page.open('login');
				}
		    } else {
	    		Page.open(url);
		    }
		}
	}

});