"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClubDB = void 0;
const database_1 = require("./database");
class ClubDB extends database_1.Database {
    constructor() {
        super();
    }
    async createClub(userID, clubName, rand) {
        let sql = 'set @ret=0; call create_club(?,?,?,@ret); select @ret as ret;';
        let ret = await this.query(sql, [userID, clubName, rand ? 0 : 1]);
        if (!ret || ret.length === 0)
            return null;
        return this.getClubInfo(this.filterOKPacket(ret)[0].ret);
    }
    async getClubInfo(clubID) {
        let sql = ' SELECT * FROM club_list WHERE ClubID = ?';
        let ret = await this.query(sql, [clubID]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }
    async getClubInfoByKey(clubKey) {
        let sql = 'SELECT * FROM club_list WHERE ClubKey = ?';
        let ret = await this.query(sql, [clubKey]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }
    async getTableCnt(clubKey) {
        let sql = 'SELECT COUNT(ID) as TableCnt FROM game_rooms AS gr WHERE ClubKey = ?';
        let ret = await this.query(sql, [clubKey]);
        return (!ret || ret.length == 0) ? 0 : ret[ret.length - 1].TableCnt;
    }
    async getClubMembers(clubKey) {
        let sql = 'SELECT * FROM club_members WHERE ClubKey= ? AND JoinStatus = 1';
        let ret = await this.query(sql, [clubKey]);
        return ret;
    }
    async getClubUserInfo(clubKey, userID) {
        let sql = 'SELECT * FROM club_members WHERE ClubKey = ? AND UserID = ?';
        let ret = await this.query(sql, [clubKey, userID]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }
    async getRequiredMembers(clubKey) {
        let sql = 'SELECT * FROM club_members WHERE ClubKey= ? AND JoinStatus = 0';
        let ret = await this.query(sql, [clubKey]);
        return ret;
    }
    async getClubRoom(clubKey) {
        let sql = 'SELECT * FROM game_rooms WHERE ClubKey= ?';
        let ret = await this.query(sql, [clubKey]);
        return ret;
    }
    async deleteClub(clubKey) {
        let sql = 'set @ClubKey =?; DELETE FROM club_list WHERE ClubKey=@ClubKey; \
            DELETE FROM club_members WHERE ClubKey=@ClubKey;';
        let ret = await this.query(sql, [clubKey]);
        return ret.length > 0;
    }
    async exitClub(clubKey, userID) {
        let sql = 'DELETE FROM club_members WHERE ClubKey =? AND UserID = ?';
        let ret = await this.query(sql, [clubKey, userID]);
        await this._updateMemberCnt(clubKey);
        return ret.length > 0;
    }
    async getClubList(userID) {
        let sql = '\
            SELECT\
                cl.*,\
                ( SELECT COUNT( gr.ID ) FROM game_rooms AS gr WHERE gr.ClubKey = cl.ClubKey ) AS TableCnt \
            FROM\
                club_list AS cl \
            WHERE\
                EXISTS (\
                SELECT\
                    cm.ID\
                FROM\
                    club_members AS cm \
                WHERE\
                cm.UserID = ? \
                AND cm.JoinStatus = 1 \
                AND cm.ClubKey = cl.ClubKey)';
        let ret = await this.query(sql, [userID]);
        return ret;
    }
    async joinClub(userID, clubKey) {
        let sql = 'INSERT INTO club_members (UserID, ClubKey, CreateTime) VALUES (?, ?, CURRENT_TIMESTAMP)';
        let ret = await this.query(sql, [userID, clubKey]);
        return ret.length > 0;
    }
    async getJoinStatus(userID, clubKey) {
        let sql = 'SELECT * FROM club_members WHERE UserID = ? AND ClubKey = ?';
        let ret = await this.query(sql, [userID, clubKey]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }
    async updateJoinStatus(userID, clubKey, state) {
        let sql = 'UPDATE club_members SET JoinStatus = ? WHERE UserID = ? AND ClubKey= ?';
        let ret = await this.query(sql, [state, userID, clubKey]);
        await this._updateMemberCnt(clubKey);
        return ret.length > 0;
    }
    async updateAllJoinStatus(clubKey, state) {
        let sql = 'UPDATE club_members SET JoinStatus = ? WHERE ClubKey= ? AND JoinStatus = 0';
        let ret = await this.query(sql, [state, clubKey]);
        await this._updateMemberCnt(clubKey);
        return ret.length > 0;
    }
    async updateUserOrder(clubKey, userID, order) {
        let sql = 'UPDATE club_members SET MemberOrder = ? WHERE ClubKey = ? AND UserID = ?';
        let ret = await this.query(sql, [order, clubKey, userID]);
        return ret.length > 0;
    }
    async deleteClubMember(clubKey, userID) {
        let sql = 'DELETE FROM club_members WHERE ClubKey = ? AND UserID = ?';
        let ret = await this.query(sql, [clubKey, userID]);
        await this._updateMemberCnt(clubKey);
        return ret.length > 0;
    }
    async _updateMemberCnt(clubKey) {
        let sql = 'UPDATE club_list SET MemberCount = (SELECT COUNT(ID) FROM club_members WHERE ClubKey=? AND JoinStatus=1) WHERE ClubKey=?';
        let ret = await this.query(sql, [clubKey, clubKey]);
        return ret.length > 0;
    }
    async addScore(clubKey, userID, score) {
        let sql = 'UPDATE club_members SET Score=Score+? WHERE ClubKey=? and UserID=?';
        let ret = await this.query(sql, [score, clubKey, userID]);
        return ret.length > 0;
    }
    async addScoreLog(clubKey, userID, score, tarUser, tarScore, addScore) {
        let sql = 'INSERT INTO club_swapscore_list (ClubKey, SrcUserID, SrcBeforeScore, DstUserID, \
            DstBeforeScore, SwapScore, CreateTime) VALUES (?,?,?,?,?,?, CURRENT_TIMESTAMP())';
        let ret = await this.query(sql, [clubKey, userID, score, tarUser, tarScore, addScore]);
        return ret.length > 0;
    }
    async getScoreLog(clubKey) {
        let sql = 'SELECT * FROM club_swapscore_list WHERE ClubKey= ? AND DATEDIFF(NOW(), CreateTime) <= 3';
        let ret = await this.query(sql, [clubKey]);
        return ret;
    }
    async writeScore(clubKey, userID, score, revenue) {
        let sql = 'set @Revenue=?;  UPDATE club_members SET score = score + ? - @Revenue, Revenue= Revenue+ @Revenue WHERE ClubKey =? AND UserID = ?;';
        let ret = await this.query(sql, [revenue, score, clubKey, userID]);
        return ret.length > 0;
    }
    async getClubUserDrawInfo(clubKey, userID) {
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
                AND gdi.ClubKey=? \
            GROUP BY\
                gds.ServiceID \
            ORDER BY\
                gds.InsertTime DESC';
        let ret = await this.query(sql, [userID, clubKey]);
        return ret;
    }
    async getClubDrawInfo(clubKey) {
        let sql = '\
            SELECT\
                ServiceID,\
                KindID,\
                RoomID,\
                min( StartTime ) AS StartTime \
            FROM\
                game_draw_info \
            WHERE\
                ClubKey = ? \
                AND DATEDIFF( NOW(), StartTime ) <= 3 \
            GROUP BY\
                ServiceID,\
                KindID,\
                RoomID \
            ORDER BY\
                StartTime DESC';
        let ret = await this.query(sql, [clubKey]);
        return ret;
    }
}
exports.ClubDB = ClubDB;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2x1YkRCLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vYXBwL3JlcG9zaXRvcmllcy9jbHViREIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEseUNBQXNDO0FBRXRDLE1BQWEsTUFBTyxTQUFRLG1CQUFRO0lBRWhDO1FBQ0ksS0FBSyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRU0sS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFjLEVBQUUsUUFBZ0IsRUFBRSxJQUFhO1FBQ25FLElBQUksR0FBRyxHQUFHLCtEQUErRCxDQUFDO1FBQzFFLElBQUksR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFDMUMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVNLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBYztRQUNuQyxJQUFJLEdBQUcsR0FBRywyQ0FBMkMsQ0FBQztRQUN0RCxJQUFJLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMxQyxPQUFPLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lB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