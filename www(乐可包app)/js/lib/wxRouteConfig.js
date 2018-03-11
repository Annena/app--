
// 微信路径配置
var apiLink = location.href.split('//')[1].split('/')[0];

// 前端请求php接口的地址
// var wxConfig = 'http://api.'+apiLink+'/';
var wxConfig = 'http://interface.lekabao.net/';

// php跳回页面地址
// var phpJump = 'http://'+apiLink+'/';
var phpJump = 'http://www.lekabao.net/';


// 请求php下载的接口地址
// var phpDownload = 'http://api.'+apiLink+'/app.php';
var phpDownload = 'http://interface.lekabao.net/app.php';

// 在微信中点餐页面，是否需要扫描二维码，1 需要 0 不需要（不需要的时候显示输入桌台号）
var is_wx_scan = 1;


