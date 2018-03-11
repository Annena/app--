define('page/modifyInfo', [
    'base/page',
    'base/data',
    'base/pattern',
    'base/cache',
    'base/message',
    'base/util'
], function (Page, Data, Pattern, Cache, Message, Util) {

    var ModifyInfo = function () {
        this.back = 'userinfo';
    };
    // 修改资料（用户信息）页面
    ModifyInfo.prototype = new Page('modifyInfo');

    ModifyInfo.prototype.bindPageEvents = function () {

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/

        writeUserInfo();

        // 写入用户信息
        function writeUserInfo() {
            $('#user-name').val(decodeURIComponent($.cookie("user_name")));
            if ($.cookie("nick_name") == undefined) {
                $('#nick-name').val('');
            } else {
                $('#nick-name').val(decodeURIComponent($.cookie("nick_name")));
            }
        }

        // 保存资料
        $('#saveInfo-btn').unbind('click').bind('click', function() {
                Data.setAjax('modifyInfo', {
                    'nick_name': $('#nick-name').val().trim(),
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {200: '资料修改成功'}, function(respnoseText) {
                    Page.open('userinfo');
                }, 0);
            
        });
    };

    return ModifyInfo;

});