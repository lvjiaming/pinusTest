"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpInit = void 0;
const config_1 = require("../../config/config");
const WeChatH5_1 = require("../WeChatH5/WeChatH5");
const httpClient_1 = require("./httpClient");
const express = require("express");
function httpInit() {
    var app = express();
    app.all("*", function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
        res.header("X-Powered-By", ' 3.2.1');
        res.header("Content-Type", "application/json;charset=utf-8");
        next();
    });
    app.listen(config_1.httpPort, function () {
        console.log('HTTP 启动成功, 端口: ' + config_1.httpPort);
    });
    app.get('/image', async function (req, res) {
        var url = req.query.url;
        if (!url) {
            console.log('invalid url');
            return;
        }
        var ret = await httpClient_1.HttpClient.get(url, null, 'binary');
        if (ret.err || !ret.data) {
            console.log('invalid result');
            return;
        }
        res.writeHead(200, { "Content-Type": ret.type });
        res.write(ret.data, 'binary');
        res.end();
    });
    app.get('/signPackage', async (req, res) => {
        let url = req.query.url;
        url = decodeURI(url);
        let data = JSON.stringify(await WeChatH5_1.WeChatH5.instance.getSignPackage(url));
        res.writeHead(200, { "Content-Type": 'application/json' });
        res.write(data);
        res.end();
    });
}
exports.httpInit = httpInit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cFNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2FwcC93ZWIvaHR0cFNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxnREFBNkM7QUFDN0MsbURBQThDO0FBQzlDLDZDQUF3QztBQUN4QyxtQ0FBbUM7QUFFbkMsU0FBZ0IsUUFBUTtJQUNwQixJQUFJLEdBQUcsR0FBRyxPQUFPLEVBQUUsQ0FBQztJQUNwQixHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxVQUFVLEdBQVEsRUFBRSxHQUFRLEVBQUUsSUFBUztRQUNoRCxHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQy9DLEdBQUcsQ0FBQyxNQUFNLENBQUMsOEJBQThCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUMvRCxHQUFHLENBQUMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLDZCQUE2QixDQUFDLENBQUM7UUFDMUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDckMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztRQUM3RCxJQUFJLEVBQUUsQ0FBQztJQUNYLENBQUMsQ0FBQyxDQUFDO0lBRUgsR0FBRyxDQUFDLE1BQU0sQ0FBQyxpQkFBUSxFQUFFO1FBQ2pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEdBQUcsaUJBQVEsQ0FBQyxDQUFDO0lBQzlDLENBQUMsQ0FBQyxDQUFDO0lBRUgsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxXQUFXLEdBQVEsRUFBRSxHQUFRO1FBQ2hELElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDTixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzNCLE9BQU87U0FDVjtRQUVELElBQUksR0FBRyxHQUFHLE1BQU0sdUJBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwRCxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFO1lBQ3RCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUM5QixPQUFPO1NBQ1Y7UUFDRCxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxFQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUMvQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDOUIsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ2QsQ0FBQyxDQUFDLENBQUM7SUFFSCxHQUFHLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxLQUFLLEVBQUUsR0FBUSxFQUFFLEdBQVEsRUFBRSxFQUFFO1FBQ2pELElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQ3hCLEdBQUcsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLG1CQUFRLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3ZFLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEVBQUMsY0FBYyxFQUFFLGtCQUFrQixFQUFDLENBQUMsQ0FBQztRQUN6RCxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hCLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNkLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQXhDRCw0QkF3Q0MifQ==