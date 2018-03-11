cordova.define("cordova-plugin-whitelist.whitelist", function(require, exports, module) { 


if (!document.querySelector('meta[http-equiv=Content-Security-Policy]')) {
    var msg = '没有内容安全策略的元标记发现。请添加一个使用白名单cordova插件。';
    console.error(msg);
    setInterval(function() {
        console.warn(msg);
    }, 10000);
}

});
