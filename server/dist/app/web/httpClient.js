"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const http = require("http");
const https = require("https");
const qs = require("querystring");
class HttpClient {
    static async get(url, data, encoding) {
        return new Promise((resolve, reject) => {
            var content = qs.stringify(data);
            url += '?' + content;
            var proto;
            var safe = url.search('https://') == 0;
            if (safe) {
                proto = https;
            }
            else {
                proto = http;
            }
            if (!encoding) {
                encoding = 'utf8';
            }
            var ret = {
                err: null,
                data: null,
            };
            var body = '';
            var req = proto.get(url, function (res) {
                res.setEncoding(encoding);
                ret.type = res.headers["content-type"];
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.on('end', () => {
                    if (encoding != 'binary') {
                        try {
                            var data = JSON.parse(body);
                            ret.data = data;
                            resolve(ret);
                        }
                        catch (e) {
                            console.log('JSON parse error: ' + e + ', url: ' + url);
                            ret.err = e;
                            reject(ret);
                        }
                    }
                    else {
                        ret.data = body;
                        resolve(ret);
                    }
                });
            });
            req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
                ret.err = e;
                reject(ret);
            });
            req.end();
        });
    }
    ;
}
exports.HttpClient = HttpClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cENsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2FwcC93ZWIvaHR0cENsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2QkFBNkI7QUFDN0IsK0JBQStCO0FBQy9CLGtDQUFrQztBQUVsQyxNQUFhLFVBQVU7SUFFWixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFXLEVBQUUsSUFBWSxFQUFFLFFBQWlCO1FBQ2hFLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDbkMsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQyxHQUFHLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQztZQUNyQixJQUFJLEtBQVUsQ0FBQztZQUNmLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLElBQUksSUFBSSxFQUFFO2dCQUNOLEtBQUssR0FBRyxLQUFLLENBQUM7YUFDakI7aUJBQU07Z0JBQ0gsS0FBSyxHQUFHLElBQUksQ0FBQzthQUNoQjtZQUNELElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ1gsUUFBUSxHQUFHLE1BQU0sQ0FBQzthQUNyQjtZQUNELElBQUksR0FBRyxHQUFRO2dCQUNYLEdBQUcsRUFBRSxJQUFJO2dCQUNULElBQUksRUFBRSxJQUFJO2FBQ2IsQ0FBQztZQUNGLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNkLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFVBQVUsR0FBUTtnQkFDdkMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDMUIsR0FBRyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUN2QyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFVLEtBQWE7b0JBQ2xDLElBQUksSUFBSSxLQUFLLENBQUM7Z0JBQ2xCLENBQUMsQ0FBQyxDQUFDO2dCQUNILEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtvQkFDZixJQUFJLFFBQVEsSUFBSSxRQUFRLEVBQUU7d0JBQ3RCLElBQUk7NEJBQ0EsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDNUIsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7NEJBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzt5QkFDaEI7d0JBQUMsT0FBTyxDQUFDLEVBQUU7NEJBQ1IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsR0FBRyxDQUFDLEdBQUcsU0FBUyxHQUFHLEdBQUcsQ0FBQyxDQUFDOzRCQUN4RCxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQzs0QkFDWixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7eUJBQ2Q7cUJBQ0o7eUJBQU07d0JBQ0gsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7d0JBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztxQkFDaEI7Z0JBQ0wsQ0FBQyxDQUFDLENBQUE7WUFDTixDQUFDLENBQUMsQ0FBQztZQUVILEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBTTtnQkFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xELEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO2dCQUNaLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoQixDQUFDLENBQUMsQ0FBQztZQUVILEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNkLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUFBLENBQUM7Q0FFTDtBQXZERCxnQ0F1REMifQ==