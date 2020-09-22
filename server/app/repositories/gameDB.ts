import { Database } from "./database";

export class GameDB extends Database {

    constructor() {
        super();
    }

    public async getGameOption(kindID: number) {
        let ret = await this.query('select * from game_option where KindID = ?', [kindID]);
        if (!ret || ret.length == 0)
            return null;
        return ret[0];
    }

    public async createRoom(kindID: number, serverRules: number, gameRules: string,
        clubKey: number, creator: number, rand: number) {
        let sql = 'set @ret=0; call create_room(?,?,?,?,?,?,@ret); select @ret as ret;';
        let ret = await this.query(sql, [kindID, serverRules, gameRules, clubKey, creator, rand]);
        if (!ret || ret.length === 0) return null;
        return this.getRoomInfo(this.filterOKPacket(ret)[0].ret);
    }

    public async updateServerID(roomID: number, serverID: string) {
        let sql = 'UPDATE  game_rooms SET ServerID = ? WHERE RoomID = ?';
        let ret = await this.query(sql, [serverID, roomID]);
        return ret.length > 0;
    }

    public async getRoomInfo(roomID: number) {
        let sql = 'SELECT * FROM game_rooms WHERE RoomID = ?';
        let ret = await this.query(sql, [roomID]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }

    public async getRoomInfoByID(id: number) {
        let sql = 'SELECT * FROM game_rooms WHERE ID = ?';
        let ret = await this.query(sql, [id]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }

    public async getRoomInfoByServerID(serverID: string) {
        let sql = 'SELECT * FROM game_rooms WHERE ServerID = ?';
        let ret = await this.query(sql, [serverID]);
        return (!ret || ret.length == 0) ? null : ret;
    }

    public async delRoomInfo(roomID: number) {
        let sql = 'DELETE FROM game_rooms WHERE RoomID = ?';
        let ret = await this.query(sql, [roomID]);
        return ret.length > 0;
    }

    public async updateProcess(roomID: number, process: number) {
        let sql = 'UPDATE  game_rooms SET Process = ? WHERE RoomID = ?';
        let ret = await this.query(sql, [process, roomID]);
        return ret.length > 0;
    }

    public async insertRoomLocker(userID: number, kindID: number, roomID: number, ip: string) {
        let sql = 'INSERT INTO game_account_locker (UserID, KindID, ServerID, EnterIP, EnterTime) VALUES (?,?,?,?,CURRENT_TIMESTAMP())';
        let ret = await this.query(sql, [userID, kindID, roomID, ip]);
        return ret.length > 0;
    }

    public async delRoomLocker(userID: number) {
        let sql = 'DELETE FROM game_account_locker WHERE UserID = ?';
        let ret = await this.query(sql, [userID]);
        return ret.length > 0;
    }

    public async delRoomLockerByRoomID(roomID: number) {
        let sql = 'DELETE FROM game_account_locker WHERE ServerID = ?';
        let ret = await this.query(sql, [roomID]);
        return ret.length > 0;
    }

    public async getInRoom(userID: number) {
        let sql = 'select * from game_account_locker where UserID=?';
        let ret = await this.query(sql, [userID]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }

    public async writeDrawInfo(kindID: number, serverID: number, roomID: number,
        userCnt: number, totalRevenue: number, gameRules: string, serverRules: number,
        startTime: Date, endTime: Date, clubKey: number) {
        let sql = 'INSERT INTO game_draw_info ( KindID, ServiceID, RoomID, UserCount, Revenue, GameRules, \
                ServerRules, StartTime, EndTime, ClubKey ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        let ret = await this.query(sql, [kindID, serverID, roomID, userCnt, totalRevenue,
            gameRules, serverRules, startTime, endTime, clubKey]);
        return ret;
    }

    public async writeDrawScore(drawID: number, userID: number, serviceID: number,
        chair: number, score: number, revenue: number) {
        let sql = 'INSERT INTO game_draw_score (DrawID, UserID, ServiceID, ChairID, Score, Revenue, InsertTime) \
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)';
        let ret = await this.query(sql, [drawID, userID, serviceID, chair, score, revenue]);
        return ret;
    }

    public async getWriteScore(serviceID: number, userID: number) {
        let sql = 'SELECT SUM(Score) + SUM(Revenue) as Score FROM game_draw_score WHERE UserID=? AND ServiceID=?;';
        let ret = await this.query(sql, [userID, serviceID]);
        let score = ret[0].Score;
        return score ? score : 0;
    }

    public async getDrawInfo(userID: number) {
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

    public async getDrawInfoUser(serviceID: number[]) {
        let sql = `SELECT UserID, SUM( Score ) AS Score, ServiceID FROM game_draw_score WHERE ServiceID IN (${serviceID.join(',')}) \
            GROUP BY ServiceID, UserID ORDER BY ChairID`;
        let ret = await this.query(sql, []);
        return ret;
    }

    public async getDrawScore(serviceID: number) {
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

    public async getDrawScoreUser(drawID: number[]) {
        let sql = `SELECT UserID, Score, DrawID FROM game_draw_score WHERE DrawID IN (${drawID.join(',')}) \
            ORDER BY ChairID`
        let ret = await this.query(sql, []);
        return ret;
    }

    public async insertDrawVideo(drawID: number, data: string) {
        let sql = 'insert into game_draw_video (DrawID, GameData) Values (? , ?)';
        let ret = await this.query(sql, [drawID, data]);
        return ret;
    }

    public async getDrawVideo(drawID: number) {
        let sql = 'SELECT * FROM game_draw_video WHERE DrawID = ?';
        let ret = await this.query(sql, [drawID]);
        return ret[ret.length - 1];
    }

    public async getDrawIDByServiceID(serviceID: number) {
        let sql = 'SELECT DrawID FROM game_draw_info WHERE ServiceID = ? ORDER BY DrawID';
        let ret = await this.query(sql, [serviceID]);
        return ret;
    }

    public async getServiceIDByDrawID(drawID: number) {
        let sql = 'SELECT ServiceID FROM game_draw_info WHERE DrawID = ?';
        let ret = await this.query(sql, [drawID]);
        return ret[ret.length - 1] ? ret[ret.length - 1].ServiceID : 0;
    }
}