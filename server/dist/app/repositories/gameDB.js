"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameDB = void 0;
const database_1 = require("./database");
class GameDB extends database_1.Database {
    constructor() {
        super();
    }
    async getGameOption(kindID) {
        let ret = await this.query('select * from game_option where KindID = ?', [kindID]);
        if (!ret || ret.length == 0)
            return null;
        return ret[0];
    }
    async createRoom(kindID, serverRules, gameRules, clubKey, creator, rand) {
        let sql = 'set @ret=0; call create_room(?,?,?,?,?,?,@ret); select @ret as ret;';
        let ret = await this.query(sql, [kindID, serverRules, gameRules, clubKey, creator, rand]);
        if (!ret || ret.length === 0)
            return null;
        return this.getRoomInfo(this.filterOKPacket(ret)[0].ret);
    }
    async updateServerID(roomID, serverID) {
        let sql = 'UPDATE  game_rooms SET ServerID = ? WHERE RoomID = ?';
        let ret = await this.query(sql, [serverID, roomID]);
        return ret.length > 0;
    }
    async getRoomInfo(roomID) {
        let sql = 'SELECT * FROM game_rooms WHERE RoomID = ?';
        let ret = await this.query(sql, [roomID]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }
    async getRoomInfoByID(id) {
        let sql = 'SELECT * FROM game_rooms WHERE ID = ?';
        let ret = await this.query(sql, [id]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }
    async getRoomInfoByServerID(serverID) {
        let sql = 'SELECT * FROM game_rooms WHERE ServerID = ?';
        let ret = await this.query(sql, [serverID]);
        return (!ret || ret.length == 0) ? null : ret;
    }
    async delRoomInfo(roomID) {
        let sql = 'DELETE FROM game_rooms WHERE RoomID = ?';
        let ret = await this.query(sql, [roomID]);
        return ret.length > 0;
    }
    async updateProcess(roomID, process) {
        let sql = 'UPDATE  game_rooms SET Process = ? WHERE RoomID = ?';
        let ret = await this.query(sql, [process, roomID]);
        return ret.length > 0;
    }
    async insertRoomLocker(userID, kindID, roomID, ip) {
        let sql = 'INSERT INTO game_account_locker (UserID, KindID, ServerID, EnterIP, EnterTime) VALUES (?,?,?,?,CURRENT_TIMESTAMP())';
        let ret = await this.query(sql, [userID, kindID, roomID, ip]);
        return ret.length > 0;
    }
    async delRoomLocker(userID) {
        let sql = 'DELETE FROM game_account_locker WHERE UserID = ?';
        let ret = await this.query(sql, [userID]);
        return ret.length > 0;
    }
    async delRoomLockerByRoomID(roomID) {
        let sql = 'DELETE FROM game_account_locker WHERE ServerID = ?';
        let ret = await this.query(sql, [roomID]);
        return ret.length > 0;
    }
    async getInRoom(userID) {
        let sql = 'select * from game_account_locker where UserID=?';
        let ret = await this.query(sql, [userID]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }
    async writeDrawInfo(kindID, serverID, roomID, userCnt, totalRevenue, gameRules, serverRules, startTime, endTime, clubKey) {
        let sql = 'INSERT INTO game_draw_info ( KindID, ServiceID, RoomID, UserCount, Revenue, GameRules, \
                ServerRules, StartTime, EndTime, ClubKey ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        let ret = await this.query(sql, [kindID, serverID, roomID, userCnt, totalRevenue,
            gameRules, serverRules, startTime, endTime, clubKey]);
        return ret;
    }
    async writeDrawScore(drawID, userID, serviceID, chair, score, revenue) {
        let sql = 'INSERT INTO game_draw_score (DrawID, UserID, ServiceID, ChairID, Score, Revenue, InsertTime) \
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)';
        let ret = await this.query(sql, [drawID, userID, serviceID, chair, score, revenue]);
        return ret;
    }
    async getWriteScore(serviceID, userID) {
        let sql = 'SELECT SUM(Score) + SUM(Revenue) as Score FROM game_draw_score WHERE UserID=? AND ServiceID=?;';
        let ret = await this.query(sql, [userID, serviceID]);
        let score = ret[0].Score;
        return score ? score : 0;
    }
    async getDrawInfo(userID) {
        let sql = '\
            SELECT\
                gds.ServiceID,\
                gdi.KindID,\
                gdi.RoomID,\
                gdi.StartTime\
            FROM\
                game_draw_score AS gds\
            LEFT JOIN game_draw_info as gdi ON gds.ServiceID = gdi.ServiceID	\
            WHERE\
                gds.UserID = ? \
                AND DATEDIFF( NOW(), gds.InsertTime ) <= 3 \
            GROUP BY\
                gds.ServiceID \
            ORDER BY\
                gds.InsertTime DESC';
        let ret = await this.query(sql, [userID]);
        return ret;
    }
    async getDrawInfoUser(serviceID) {
        let sql = `SELECT UserID, SUM( Score ) AS Score, ServiceID FROM game_draw_score WHERE ServiceID IN (${serviceID.join(',')}) \
            GROUP BY ServiceID, UserID ORDER BY ChairID`;
        let ret = await this.query(sql, []);
        return ret;
    }
    async getDrawScore(serviceID) {
        let sql = '\
            SELECT\
                gbs.DrawID,\
                gbi.StartTime\
            FROM\
                game_draw_score AS gbs\
                LEFT JOIN game_draw_info AS gbi ON gbs.DrawID = gbi.DrawID \
            WHERE\
                gbs.ServiceID = ? \
            GROUP BY\
                gbs.DrawID';
        let ret = await this.query(sql, [serviceID]);
        return ret;
    }
    async getDrawScoreUser(drawID) {
        let sql = `SELECT UserID, Score, DrawID FROM game_draw_score WHERE DrawID IN (${drawID.join(',')}) \
            ORDER BY ChairID`;
        let ret = await this.query(sql, []);
        return ret;
    }
    async insertDrawVideo(drawID, data) {
        let sql = 'insert into game_draw_video (DrawID, GameData) Values (? , ?)';
        let ret = await this.query(sql, [drawID, data]);
        return ret;
    }
    async getDrawVideo(drawID) {
        let sql = 'SELECT * FROM game_draw_video WHERE DrawID = ?';
        let ret = await this.query(sql, [drawID]);
        return ret[ret.length - 1];
    }
    async getDrawIDByServiceID(serviceID) {
        let sql = 'SELECT DrawID FROM game_draw_info WHERE ServiceID = ? ORDER BY DrawID';
        let ret = await this.query(sql, [serviceID]);
        return ret;
    }
    async getServiceIDByDrawID(drawID) {
        let sql = 'SELECT ServiceID FROM game_draw_info WHERE DrawID = ?';
        let ret = await this.query(sql, [drawID]);
        return ret[ret.length - 1] ? ret[ret.length - 1].ServiceID : 0;
    }
}
exports.GameDB = GameDB;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZURCLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vYXBwL3JlcG9zaXRvcmllcy9nYW1lREIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEseUNBQXNDO0FBRXRDLE1BQWEsTUFBTyxTQUFRLG1CQUFRO0lBRWhDO1FBQ0ksS0FBSyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFjO1FBQ3JDLElBQUksR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyw0Q0FBNEMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDbkYsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUM7WUFDdkIsT0FBTyxJQUFJLENBQUM7UUFDaEIsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQztJQUVNLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBYyxFQUFFLFdBQW1CLEVBQUUsU0FBaUIsRUFDMUUsT0FBZSxFQUFFLE9BQWUsRUFBRSxJQUFZO1FBQzlDLElBQUksR0FBRyxHQUFHLHFFQUFxRSxDQUFDO1FBQ2hGLElBQUksR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDMUYsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUM7WUFBRSxPQUFPLElBQUksQ0FBQztRQUMxQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRU0sS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFjLEVBQUUsUUFBZ0I7UUFD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