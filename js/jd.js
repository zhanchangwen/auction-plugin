//全局变量
var jd_globe = {
	origin_price:0,
	max_price:0,
	bid_increment:1,
	time_remain:1425,
	bid_loop:false,
	mail_free:99,
	my_price:0,
	paimaiId:0,
	sku:0,
	final_price:0,
	current_price:1,
	end_time_mili:-1,
	manual_bid:false
};

//设置DOM元素
var code = "<div id='qp_div'>"
	+ "商品6折价：<input type='text' id='qp_price_limit' readonly />&nbsp;&nbsp;&nbsp;&nbsp;"
	+ "最高出价<input type='text' id='qp_max_price' />&nbsp;&nbsp;&nbsp;&nbsp;"
	+ "加价幅度<input type='text' id='qp_bid_increment' style='width:20px' value='1'/>&nbsp;&nbsp;&nbsp;&nbsp;"
	+ "<input type='button' value='出价' id='qp_btn_start' class='qp_btn'/>&nbsp;&nbsp;&nbsp;&nbsp;"
	+ "<input type='button' value='定时开抢' id='qp_btn_shedule' class='qp_btn' />&nbsp;&nbsp;&nbsp;&nbsp;"
	+ "<span id='qp_query'>按 N 键可显示当前价格和时间</span> <span id='qp_info'></span>&nbsp;&nbsp;&nbsp;&nbsp;"
//	+"<input type='text' id='qp_bid_price' style='width:20px' value='1'/>"
//	+ "<input type='button' value='定时出价' id='qp_btn_bid' class='qp_btn' />&nbsp;&nbsp;&nbsp;&nbsp;"
	+"<input type='checkbox' id='diamond_checkbox' style='width:15px' value='1'/>钻石用户</div>";
$('body').prepend(code);


//按钮监听器
//变更最高出价价格
$('#qp_max_price').change(changeMaxPrice);
//变更加价幅度
$('#qp_bid_increment').change(changeIncrement);
//直接对当前价增加加价幅度出价
$('#qp_btn_start').on('click', function(){startBid()});
//开启定时器
$('#qp_btn_shedule').on('click', function(){sheduleBid()});
//修改定时出价价格
//$('#qp_bid_price').change(changeFinalPrice);
//开启定时出价
//$('#qp_btn_bid').on('click', function(){bidPrice()});
//钻石用户复选框，确定包邮价格
	$("#diamond_checkbox").change(checkboxChange);


//按键监听器
	function handleKeyDown(event){
		//显示当前按下按键的keyCode
		console.log("当前键值："+event.keyCode);
		//按下T
		if(event.keyCode == 84){
			//bidWithPrice(16);
			//bidWithPrice(19);
			loopQuery();
		}
		//按下+ 增加最后出价时间
		if(event.keyCode == 187){
			jd_globe.time_remain += 10;
			printInfo("保留时间改为："+jd_globe.time_remain);

		}
		//按下- 减小更改最后出价时间
		if(event.keyCode == 189) {
			jd_globe.time_remain -= 10;
			printInfo("保留时间改为："+jd_globe.time_remain);
		}
		//按下N 查询显示当前价格
		if(event.keyCode == 78) queryPrice(showTime);
		//按下M 在倒数几秒前生效购买
		if(event.keyCode == 77){
			startBid();

		}
	}
	function bidBeforeEnd(){
		if(jd_globe.end_time_mili == -1){
			queryPrice(setEndTimeMili);
			return;
		}
		var nowTime = new Date().getTime();
		if(nowTime + jd_globe.time_remain > jd_globe.end_time_mili && !jd_globe.manual_bid){
			queryAndBid();
			jd_globe.manual_bid = true;
		}else{
			queryPrice(showTime);
		}
	}
	function setEndTimeMili(data){
		var remainTime = data.remainTime;
		var nowTime = new Date().getTime();
		jd_globe.end_time_mili = nowTime + remainTime;
	}

//程序入口
	init();
	document.onkeydown = handleKeyDown;

//初始化
	function init(){
		jd_globe.paimaiId = $("#paimaiId").val();
		jd_globe.sku = $("#productId").val();
		loadJdPrice();
	}

//获得原价
	function loadJdPrice(){
		var url="http://dbditem.jd.com/json/current/queryJdPrice?sku="+jd_globe.sku+"&paimaiId="+jd_globe.paimaiId;
		jQuery.getJSON(url,function (response) {
			var jdPrice = response.jdPrice;
			var access = response.access;
			if (jdPrice > 1) {
				jd_globe.max_price = parseInt(jdPrice*0.6);
				$('#qp_price_limit').val(jd_globe.max_price);
				$('#qp_max_price').val(jd_globe.max_price);
			}
		});
	}
//定时出价
	function bidPrice(){
		queryPrice(waitToBidPrice);
	}
//定时出价回调函数
	function waitToBidPrice(data){
		$("#qp_btn_bid").val("已开启定时出价");
		$("#qp_btn_bid").attr("disabled",true);
		var remainTime = data.remainTime;
		setTimeout("bidWithPrice(jd_globe.final_Price)",remainTime-1300);
	}
//立即开始抢购
	function startBid(){
		jd_globe.bid_loop = true;
		//tick();
		queryAndBid();
	}
//每60秒重新查询一次，直到距离结束小于60秒时，倒计时自动抢购
	function timerBid(data){
		var remainTime = data.remainTime;
		printQuery(data);
		if(remainTime < 10000){
			setTimeout("startBid()",remainTime - jd_globe.time_remain);
		}else if(remainTime > 130000){
			var waitTime = remainTime % 120000;
			console.log("等待 "+waitTime+"ms调用loopQuery");
			setTimeout("loopQuery()",120000);
		}else if(remainTime > 70000){
			var waitTime = remainTime % 60000;
			console.log("等待 "+waitTime+"ms调用loopQuery");
			setTimeout("loopQuery()",60000);
		}else if(remainTime > 40000){
			var waitTime = remainTime % 30000;
			console.log("等待 "+waitTime+"ms调用loopQuery");
			setTimeout("loopQuery()",3000);
		}else if(remainTime > 20000){
			var waitTime = remainTime % 10000;
			console.log("等待 "+waitTime+"ms调用loopQuery");
			setTimeout("loopQuery()",10000);
		}else if(remainTime > 10000){
			var waitTime = remainTime % 10000;
			console.log("等待 "+waitTime+"ms调用loopQuery");
			setTimeout("loopQuery()",waitTime);
		}
	}
	function printQuery(data){
		printInfo("剩余时间："+data.remainTime+" 当前价格："+data.currentPrice);
	}
	function loopQuery(){
		console.log("调用loopQuery");
		queryPrice(timerBid);
	}

//定时开始抢购
	function sheduleBid(){
		$("#qp_btn_shedule").val("已开启定时");
		$("#qp_btn_shedule").attr("disabled",true);
		//多次倒计时
		loopQuery();
		//
		//queryPrice(setTimerWithData);
		//setTimer(remainTime-jd_globe.time_remain);
	}
//根据请求设定倒计时
	function setTimerWithData(data){
		var remainTime = data.remainTime;
		jd_globe.server_start_remainTime = remainTime;
		printInfo("设定倒计时，倒计时 "+(remainTime-jd_globe.time_remain)+"ms");
		setTimer(remainTime-jd_globe.time_remain);
	}
//设定倒计时
	function setTimer(time){
		printInfo("等待时长："+time);
		setTimeout("queryAndBid()",time);
	}
//查询当前价格并加一定数额出价
	function queryAndBid(){
		queryPrice(bidWithData);
	}
//回调函数，根据查询价格取得的数据出价
	function bidWithData(data){
		printInfo("距离结束还有"+data.remainTime+" ms");
		jd_globe.shedule_cur_price = data.currentPrice;
		//setTimeout("finalBid()",data.remainTime - 1200);
		bidWithCurrentPrice(parseInt(data.currentPrice));
	}
	function finalBid(){
		bidWithCurrentPrice(parseInt(jd_globe.shedule_cur_price));
	}
//根据当前价格出价
	function bidWithCurrentPrice(price){
		//如果当前价格是自己的价格，则直接不出
		if(price == jd_globe.my_price){
			printInfo("当前价格为您的出价，无需出价");
			return;
		}
		if(price >= jd_globe.max_price){
			printInfo("超出限定价格");
			return;
		}
		//给当前价增加一定增幅
		var bid_price = price + jd_globe.bid_increment;
		if(bid_price > jd_globe.max_price){
			bid_price = jd_globe.max_price;
		}
		//根据包邮价进行设定
		if(bid_price >= jd_globe.mail_free-6 && bid_price < jd_globe.mail_free) bid_price = jd_globe.mail_free;
		bidWithPrice(bid_price);
	}

//根据给定价格出价
	function bidWithPrice(price){
		var url = "/services/bid.action";
		var data = {paimaiId:jd_globe.paimaiId,price:price,proxyFlag:0,bidSource:5};
		var start = new Date().getTime();
		jQuery.getJSON(url,data,function(jqXHR){
			printInfo("出价："+price);
			var end = new Date().getTime();
			printInfo("出价用时" + (end - start));
			if(jqXHR!=undefined){
				if(jqXHR.result=='200'){
					printInfo("出价成功，时间为："+new Date().getTime());
					printInfo("恭喜您，出价成功,价格为："+price);
					printInfo("出价时间：" + new Date(new Date().getTime()+91000).toLocaleTimeString());
					jd_globe.my_price = price;

				}else if(jqXHR.result=='517'){
					//当前价格
					jd_globe.my_price = price;
					printInfo(jqXHR.message+"；错误代码:"+jqXHR.result);


				}else if(jqXHR.result=='514'){
					//小于当前价格
					printInfo(jqXHR.message+"；错误代码:"+jqXHR.result);
					//如果当前价是最高价，则不再出价
					requestAnimationFrame(queryAndBid);
					//continueBid(price);
				}else if(jqXHR.result=='515'){
					printInfo(jqXHR.message+"；错误代码:"+jqXHR.result);
				}else if(jqXHR.result=='516'){
					//拍卖已经结束
					printInfo(jqXHR.message+"；错误代码:"+jqXHR.result);
				}else if(jqXHR.result=='525'){
					//同一用户连续出价
					printInfo(jqXHR.message+"；错误代码:"+jqXHR.result);
					jd_globe.my_price = jd_globe.current_price;
					//继续查询并出价
					//requestAnimationFrame(queryAndBid);
					//queryAndBid();
				}else if(jqXHR.result=='561'){
					//所出价格低于当前价
					printInfo(jqXHR.message+"；错误代码:"+jqXHR.result);
					//如果当前价是最高价，则不再出价
					requestAnimationFrame(queryAndBid);
					//continueBid(price);
				}else{
					printInfo("未捕捉错误："+jqXHR.message+"；错误代码:"+jqXHR.result);


				}
			}
		});
	}
//价格低于当前价，加价再出，追加出价
	function continueBid(price){
		queryAndBid();
		return;
		//如果当前价是最高价，则不再出价
		if(price == jd_globe.max_price){
			printInfo("当前价格已经高于您的最高价");
			return;
		}
		var next_price = price+jd_globe.bid_increment;
		if(next_price > jd_globe.max_price) next_price = jd_globe.max_price;
		bidWithPrice(next_price);
	}

//设定N查询 回调函数
	function showTime(data){
		printInfo("当前价格: " + data.currentPrice + " 出价人："+data.currentUser+" 还有 " + (data.remainTime/1000).toFixed(1) + "秒")
	}
//查询价格并调用函数callback(jqXHR)
	function queryPrice(callback){
		var queryIt = "http://dbditem.jd.com/json/current/englishquery?paimaiId="+jd_globe.paimaiId+"&skuId=0&start=0&end=0";
		jQuery.getJSON(queryIt,function(jqXHR){
			console.log("服务器用时"+(jd_globe.server_start_remainTime-jqXHR.remainTime)+",还有"+jqXHR.remainTime+"ms结束，当前价格为："+jqXHR.currentPrice);
			jd_globe.current_price = jqXHR.currentPrice;
			callback(jqXHR);
		});
	}
//抢购循环
	function tick(){
		if(jd_globe.bid_loop) requestAnimationFrame(tick);
		queryAndBid();
	}
//更改包邮价
	function checkboxChange(){
		if($('#diamond_checkbox').is(':checked')) {
			jd_globe.mail_free = 79;
		}else{
			jd_globe.mail_free = 99;
		}
		printInfo("包邮价改为："+ jd_globe.mail_free);
	}
//更改加价幅度
	function changeIncrement(){
		jd_globe.bid_increment = parseInt($('#qp_bid_increment').val());
		if(jd_globe.bid_increment < 1) jd_globe.bid_increment = 1;
		printInfo("加价幅度" + jd_globe.bid_increment);
	}
//更改最高价
	function changeMaxPrice(){
		jd_globe.max_price = $('#qp_max_price').val();
		printInfo("最高出价：" + jd_globe.max_price);
	}
//更改定时出价的价格
	function changeFinalPrice(){
		jd_globe.final_Price = parseInt($('#qp_bid_price').val());
		printInfo("定时出价的价格改为"+jd_globe.final_Price);
	}
//信息提示
	function printInfo(str){
		$("#qp_info").html(str);
		console.log(str);
	}