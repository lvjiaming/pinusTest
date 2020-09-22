const mysql = require('mysql');
import { options } from '../../config/config';

export class Database {
    public pool: any;

    constructor() {
        this.pool = mysql.createPool(options);
    }

    public async query(sql: string, params: any[]): Promise<any> {
        let res: any;
        try {
            res = await this._query(sql, params);
        } catch (err) {
            console.log('SQL QUERY ERR ! sql: ' + sql + 'params: ' + JSON.stringify(params));
            console.log(err);
        }
        return res;
    }

    private async _query(sql: string, params: any[]): Promise<any> {
        return new Promise<any>((resolve: any, reject: any) => {
            this.pool.getConnection((err: any, connection: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                connection.query(sql, params, (err: any, rows: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                    connection.release();
                });
            })
        });
    }

    public filterOKPacket(res: any) {
        var result: any[] = [];
        for (var i in res) {
            if (Array.isArray(res[i])) {
                result.push(res[i]);
            }
        }
        if (result.length == 1) {   //单结果集
            return result[0];
        } else {                    //多结果集
            return result;
        }
    }
}
