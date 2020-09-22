export default class Http {

    _send(url: string, type: string): Promise<object> {
        return new Promise((resolve, reject) => {
            let xhr = cc.loader.getXMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status == 200) {
                    let response = xhr.responseText;
                    try {
                        let rsp = JSON.parse(response);
                        resolve(rsp);
                    } catch (e) {
                        console.log(e, response);
                        resolve(null);
                    }
                } else if (xhr.readyState === 4 && xhr.status == 401) {
                    resolve({status: 401, msg: '访问被拒绝'});
                }
            };
            xhr.open(type, url, true);
            xhr.timeout = 8000;// 8 seconds for timeout
            xhr.send();
        });
    }

    // 如果url是http开头则访问的是自定义地址, 否则访问的是服务器http服务
    _process(url: string, params?: object) {
        if (url.indexOf('http') != 0) {
            url = `http://${SERVER_IP}:${HTTP_PORT}${url}`;
        }
        if (params) {
            if (url.slice(-1) != '?') url += '?';
            for (let key in params) {
                url += '&' + key + '=' + params[key];
            }
        }
        return url;
    }


    async get(url: string, params?: object): Promise<object> {
        return await this._send(this._process(url, params), 'GET');
    }

    async post(url: string, params?: object): Promise<object> {
        return await this._send(this._process(url, params), 'POST');
    }
}

