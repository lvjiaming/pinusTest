"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeChatH5 = void 0;
const crypto = require("crypto");
const fs = require("fs");
const httpClient_1 = require("../web/httpClient");
const config_1 = require("../../config/config");
const ffmpeg = require("fluent-ffmpeg");
const request = require("request");
class WeChatH5 {
    constructor() {
        this.tokenPath = 'access_token.json';
        this.ticketPath = 'jsapi_ticket.json';
    }
    static get instance() {
        if (this._instance == null) {
            this._instance = new WeChatH5();
        }
        return this._instance;
    }
    async getSignPackage(url) {
        let jsapiTicket = await this.getJsApiTicket();
        if (!jsapiTicket)
            return null;
        let nonceStr = this.createNonceStr();
        let timestamp = this.getTime() + '';
        let str = 'jsapi_ticket=' + jsapiTicket;
        str += '&noncestr=' + nonceStr;
        str += '&timestamp=' + timestamp;
        str += '&url=' + url;
        let signature = crypto.createHash('sha1').update(str).digest('hex');
        return {
            appId: config_1.WXID,
            nonceStr: nonceStr,
            timestamp: timestamp,
            url: url,
            signature: signature,
            rawString: str
        };
    }
    createNonceStr(length = 16) {
        let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let str = '';
        for (let i = 0; i < length; i++) {
            str += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return str;
    }
    async getWeChatVoice(id) {
        let url = 'https://api.weixin.qq.com/cgi-bin/media/get?&access_token=' + await this.getAccessToken();
        url += '&media_id=' + id;
        return new Promise(((resolve, reject) => {
            ffmpeg(request.get(url)).on('end', function () {
                let data = fs.readFileSync(id + '.m4a');
                let base64 = Buffer.from(data).toString('base64');
                fs.unlinkSync(id + '.m4a');
                resolve(base64);
            }).on('error', function (err) {
                console.log('error happened: ' + err.message);
                resolve('');
            }).save(id + '.m4a');
        }));
    }
    async getAccessToken() {
        let data = null;
        console.log(this.getTime());
        if (fs.existsSync(this.tokenPath)) {
            data = JSON.parse(fs.readFileSync(this.tokenPath).toString());
        }
        if (!data || data.expire_time < this.getTime()) {
            let url = 'https://api.weixin.qq.com/cgi-bin/token';
            let res = await httpClient_1.HttpClient.get(url, {
                grant_type: 'client_credential',
                appid: config_1.WXID,
                secret: config_1.WXSECRET
            });
            let info = res.data;
            if (info && info.access_token) {
                data = {
                    expire_time: this.getTime() + 7000,
                    access_token: info.access_token
                };
                fs.writeFileSync(this.tokenPath, JSON.stringify(data));
            }
            else {
                console.log(info);
                return null;
            }
        }
        return data ? data.access_token : null;
    }
    async getJsApiTicket() {
        let data = null;
        if (fs.existsSync(this.ticketPath)) {
            data = JSON.parse(fs.readFileSync(this.ticketPath).toString());
        }
        if (!data || data.expire_time < this.getTime()) {
            let accessToken = await this.getAccessToken();
            if (!accessToken)
                return null;
            let url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket';
            let res = await httpClient_1.HttpClient.get(url, {
                access_token: accessToken,
                type: 'jsapi'
            });
            let info = res.data;
            if (info && info.ticket) {
                data = {
                    expire_time: this.getTime() + 7000,
                    jsapi_ticket: info.ticket
                };
                fs.writeFileSync(this.ticketPath, JSON.stringify(data));
            }
            else {
                return null;
            }
        }
        return data ? data.jsapi_ticket : null;
    }
    getTime() {
        return Math.floor(Date.now() / 1000);
    }
}
exports.WeChatH5 = WeChatH5;
WeChatH5._instance = null;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2VDaGF0SDUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9hcHAvV2VDaGF0SDUvV2VDaGF0SDUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUNBQWlDO0FBQ2pDLHlCQUF5QjtBQUN6QixrREFBK0M7QUFDL0MsZ0RBQXFEO0FBQ3JELHdDQUF3QztBQUN4QyxtQ0FBbUM7QUFXbkMsTUFBYSxRQUFRO0lBQXJCO1FBRVksY0FBUyxHQUFXLG1CQUFtQixDQUFDO1FBQ3hDLGVBQVUsR0FBVyxtQkFBbUIsQ0FBQztJQW9IckQsQ0FBQztJQWhIVSxNQUFNLEtBQUssUUFBUTtRQUN0QixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxFQUFFO1lBQ3hCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQztTQUNuQztRQUNELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUMxQixDQUFDO0lBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFXO1FBQzVCLElBQUksV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzlDLElBQUksQ0FBQyxXQUFXO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFFOUIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3JDLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDcEMsSUFBSSxHQUFHLEdBQUcsZUFBZSxHQUFHLFdBQVcsQ0FBQztRQUN4QyxHQUFHLElBQUksWUFBWSxHQUFHLFFBQVEsQ0FBQztRQUMvQixHQUFHLElBQUksYUFBYSxHQUFHLFNBQVMsQ0FBQztRQUNqQyxHQUFHLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQztRQUVyQixJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxN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