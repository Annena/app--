define('base/scrollbar', function() {

    return function(dom,vScrollbar) {
        //是否显示垂直滚动条
        var vscroll = vScrollbar == false ? false : true ;
        var node = (typeof dom == 'string') ? $(dom)[0] : dom;
        return new iScroll(node, {
            scrollbarClass: 'myScrollbar',
            bounce: false,
            hideScrollbar: true,
            vScrollbar: vscroll,
            onBeforeScrollStart: function (e) {
                var target = e.target;
                while (target.nodeType != 1) target = target.parentNode;
                if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA')
                    //禁止滚动
                e.preventDefault();
            }
        });
    };

});