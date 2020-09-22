import {httpPort} from '../../config/config';
import {WeChatH5} from '../WeChatH5/WeChatH5';
import {HttpClient} from './httpClient';
import * as express from "express";

export function httpInit() {
    var app = express();
    app.all("*", function (req: any, res: any, next: any) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
        res.header("X-Powered-By", ' 3.2.1');
        res.header("Content-Type", "application/json;charset=utf-8");
        next();
    });

    app.listen(httpPort, function () {
        console.log('HTTP 启动成功, 端口: ' + httpPort);
    });

    app.get('/image', async function (req: any, res: any) {
        var url = req.query.url;
        if (!url) {
            console.log('invalid url');
            return;
        }

        var ret = await HttpClient.get(url, null, 'binary');
        if (ret.err || !ret.data) {
            console.log('invalid result');
            return;
        }
        res.writeHead(200, {"Content-Type": ret.type});
        res.write(ret.data, 'binary');
        res.end();
    });

    app.get('/signPackage', async (req: any, res: any) => {
        let url = req.query.url;
        url = decodeURI(url);
        let data = JSON.stringify(await WeChatH5.instance.getSignPackage(url));
        res.writeHead(200, {"Content-Type": 'application/json'});
        res.write(data);
        res.end();
    });
} 