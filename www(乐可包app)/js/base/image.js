define('base/image', function() {

    function SImage(url, id, callback) {
        var img = new Image();
            img.src = url;

        var appname = navigator.appName.toLowerCase();
        if (appname.indexOf("netscape") == -1) {
            // ie
            img.onreadystatechange = function () {
                if (img.readyState == "complete") {
                    id[0].src = img.src;
                }
            };
        } else {
            // firefox
            img.onload = function () {
                if (img.complete == true) {
                    setTimeout(function() {
                        id[0].src = img.src;
                        if (typeof callback == 'function') {
                            callback();
                        }
                    }, 300);
                }
            }
        }

        // 如果因为网络或图片的原因发生异常，则显示该图片
        img.onerror = function() {
            console.log('图片加载失败');
        };

    }

    return SImage;

});