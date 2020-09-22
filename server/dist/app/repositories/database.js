"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const mysql = require('mysql');
const config_1 = require("../../config/config");
class Database {
    constructor() {
        this.pool = mysql.createPool(config_1.options);
    }
    async query(sql, params) {
        let res;
        try {
            res = await this._query(sql, params);
        }
        catch (err) {
            console.log('SQL QUERY ERR ! sql: ' + sql + 'params: ' + JSON.stringify(params));
            console.log(err);
        }
        return res;
    }
    async _query(sql, params) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                    return;
                }
                connection.query(sql, params, (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(rows);
                    }
                    connection.release();
                });
            });
        });
    }
    filterOKPacket(res) {
        var result = [];
        for (var i in res) {
            if (Array.isArray(res[i])) {
                result.push(res[i]);
            }
        }
        if (result.length == 1) { //单结果集
            return result[0];
        }
        else { //多结果集
            return result;
        }
    }
}
exports.Database = Database;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9hcHAvcmVwb3NpdG9yaWVzL2RhdGFiYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMvQixnREFBOEM7QUFFOUMsTUFBYSxRQUFRO0lBR2pCO1FBQ0ksSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLGdCQUFPLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFXLEVBQUUsTUFBYTtRQUN6QyxJQUFJLEdBQVEsQ0FBQztRQUNiLElBQUk7WUFDQSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUN4QztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsR0FBRyxHQUFHLEdBQUcsVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNqRixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3BCO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDO0lBRU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFXLEVBQUUsTUFBYTtRQUMzQyxPQUFPLElBQUksT0FBTyxDQUFNLENBQUMsT0FBWSxFQUFFLE1BQVcsRUFBRSxFQUFFO1lBQ2xELElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBUSxFQUFFLFVBQWUsRUFBRSxFQUFFO2dCQUNsRCxJQUFJLEdBQUcsRUFBRTtvQkFDTCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ1osT0FBTztpQkFDVjtnQkFDRCxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxHQUFRLEVBQUUsSUFBUyxFQUFFLEVBQUU7b0JBQ2xELElBQUksR0FBRyxFQUFFO3dCQUNMLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztxQkFDZjt5QkFBTTt3QkFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQ2pCO29CQUNELFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDekIsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQTtRQUNOLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVNLGNBQWMsQ0FBQyxHQUFRO1FBQzFCLElBQUksTUFBTSxHQUFVLEVBQUUsQ0FBQztRQUN2QixLQUFLLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRTtZQUNmLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN2QjtTQUNKO1FBQ0QsSUFBSSxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxFQUFJLE1BQU07WUFDOUIsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDcEI7YUFBTSxFQUFxQixNQUFNO1lBQzlCLE9BQU8sTUFBTSxDQUFDO1NBQ2pCO0lBQ0wsQ0FBQztDQUNKO0FBbERELDRCQWtEQyJ9