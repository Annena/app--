define('base/barcodescanner', function () {

    var BarcodeScanner = function() {};

    // 读取二维码

    BarcodeScanner.prototype.scan = function(success, fail, bar, action, jsonAry) {

        if (typeof(cordova) == 'undefined') {
            //alert('跳出');
            return;
        }

        if (typeof(cordova.exec) == 'undefined') {
            //alert('跳出2');
            return;
        }
        
        return cordova.exec(success, fail, bar, action, [jsonAry]);
    };
    
    return BarcodeScanner;

});
