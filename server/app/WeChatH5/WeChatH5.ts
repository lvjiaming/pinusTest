import * as crypto from "crypto";
import * as fs from "fs";
import { HttpClient } from "../web/httpClient";
import { WXID, WXSECRET } from '../../config/config';
import * as ffmpeg from "fluent-ffmpeg";
import * as request from "request";

interface ISignPackage {
    appId: string;
    nonceStr: string;
    timestamp: string;
    url: string;
    signature: string;
    rawString: string;
}

export class WeChatH5 {

    private tokenPath: string = 'access_token.json';
    private ticketPath: string = 'jsapi_ticket.json';

    private static _instance: WeChatH5 = null;

    public static get instance() {
        if (this._instance == null) {
            this._instance = new WeChatH5();
        }
        return this._instance;
    }

    async getSignPackage(url: string): Promise<ISignPackage> {
        let jsapiTicket = await this.getJsApiTicket();
        if (!jsapiTicket) return null;

        let nonceStr = this.createNonceStr();
        let timestamp = this.getTime() + '';
        let str = 'jsapi_ticket=' + jsapiTicket;
        str += '&noncestr=' + nonceStr;
        str += '&timestamp=' + timestamp;
        str += '&url=' + url;

        let signature = crypto.createHash('sha1').update(str).digest('hex');
        return {
            appId: WXID,
            nonceStr: nonceStr,
            timestamp: timestamp,
            url: url,
            signature: signature,
            rawString: str
        }
    }

    createNonceStr(length = 16): string {
        let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let str = '';
        for (let i = 0; i < length; i++) {
            str += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return str;
    }

    public async getWeChatVoice(id: string): Promise<string> {
        let url = 'https://api.weixin.qq.com/cgi-bin/media/get?&access_token=' + await this.getAccessToken();
        url += '&media_id=' + id;
        return new Promise<string>(((resolve, reject) => {
            ffmpeg(request.get(url)).on('end', function () {
                let data = fs.readFileSync(id + '.m4a');
                let base64 = Buffer.from(data).toString('base64');
                fs.unlinkSync(id + '.m4a');
                resolve(base64);
            }).on('error', function (err) {
                console.log('error happened: ' + err.message);
                resolve('');
            }).save(id + '.m4a');
        }))
    }

    public async getAccessToken() {
        let data = null;
        console.log(this.getTime());
        if (fs.existsSync(this.tokenPath)) {
            data = JSON.parse(fs.readFileSync(this.tokenPath).toString());
        }
        if (!data || data.expire_time < this.getTime()) {
            let url = 'https://api.weixin.qq.com/cgi-bin/token';
            let res = await HttpClient.get(url, {
                grant_type: 'client_credential',
                appid: WXID,
                secret: WXSECRET
            });
            let info = res.data;
            if (info && info.access_token) {
                data = {
                    expire_time: this.getTime() + 7000,
                    access_token: info.access_token
                };
                fs.writeFileSync(this.tokenPath, JSON.stringify(data));
            } else {
                console.log(info);
                return null;
            }
        }
        return data ? data.access_token : null;
    }

    private async getJsApiTicket() {
        let data = null;
        if (fs.existsSync(this.ticketPath)) {
            data = JSON.parse(fs.readFileSync(this.ticketPath).toString());
        }
        if (!data || data.expire_time < this.getTime()) {
            let accessToken = await this.getAccessToken();
            if (!accessToken) return null;
            let url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket';
            let res = await HttpClient.get(url, {
                access_token: accessToken,
                type: 'jsapi'
            });
            let info = res.data;
            if (info && info.ticket) {
                data = {
                    expire_time: this.getTime() + 7000,
                    jsapi_ticket: info.ticket
                };
                fs.writeFileSync(this.ticketPath, JSON.stringify(data))
            } else {
                return null;
            }
        }
        return data ? data.jsapi_ticket : null;
    }

    private getTime() {
        return Math.floor(Date.now() / 1000);
    }
}