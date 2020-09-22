interface Date {
    fmt: (format: string) => string;
    addSecond: (second: number) => Date
}

//日期格式化
Date.prototype.fmt = function (format) {
    var d = this;
    var o: any = {
        "M+": d.getMonth() + 1,  //month
        "d+": d.getDate(),       //day
        "h+": d.getHours(),      //hour
        "m+": d.getMinutes(),    //minute
        "s+": d.getSeconds(),    //second
        "q+": Math.floor((d.getMonth() + 3) / 3),  //quarter
        "S": d.getMilliseconds() //millisecond
    };
    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (d.getFullYear() + "").substr(4 - RegExp.$1.length));
    }

    for (var k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        }
    }

    if (format.indexOf('NaN') > -1)
        return '';
    return format;
}

//增加N秒
Date.prototype.addSecond = function (second: number) {
    let now = this.getTime();
    now += (second * 1000);
    return new Date(now);
}
