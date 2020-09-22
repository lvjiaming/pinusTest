import * as http from 'http';
import * as https from 'https';
import * as qs from 'querystring';

export class HttpClient {

    public static async get(url: string, data: object, encoding?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            var content = qs.stringify(data);
            url += '?' + content;
            var proto: any;
            var safe = url.search('https://') == 0;
            if (safe) {
                proto = https;
            } else {
                proto = http;
            }
            if (!encoding) {
                encoding = 'utf8';
            }
            var ret: any = {
                err: null,
                data: null,
            };
            var body = '';
            var req = proto.get(url, function (res: any) {
                res.setEncoding(encoding);
                ret.type = res.headers["content-type"];
                res.on('data', function (chunk: string) {
                    body += chunk;
                });
                res.on('end', () => {
                    if (encoding != 'binary') {
                        try {
                            var data = JSON.parse(body);
                            ret.data = data;
                            resolve(ret);
                        } catch (e) {
                            console.log('JSON parse error: ' + e + ', url: ' + url);
                            ret.err = e;
                            reject(ret)
                        }
                    } else {
                        ret.data = body;
                        resolve(ret);
                    }
                })
            });

            req.on('error', function (e: any) {
                console.log('problem with request: ' + e.message);
                ret.err = e;
                reject(ret);
            });

            req.end();
        });
    };

}