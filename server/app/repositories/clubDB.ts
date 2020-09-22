import { Database } from "./database";

export class ClubDB extends Database {

    constructor() {
        super();
    }

    public async createClub(userID: number, clubName: string, rand?: number) {
        let sql = 'set @ret=0; call create_club(?,?,?,@ret); select @ret as ret;';
        let ret = await this.query(sql, [userID, clubName, rand ? 0 : 1]);
        if (!ret || ret.length === 0) return null;
        return this.getClubInfo(this.filterOKPacket(ret)[0].ret);
    }

    public async getClubInfo(clubID: number) {
        let sql = ' SELECT * FROM club_list WHERE ClubID = ?';
        let ret = await this.query(sql, [clubID]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }

    public async getClubInfoByKey(clubKey: number) {
        let sql = 'SELECT * FROM club_list WHERE ClubKey = ?';
        let ret = await this.query(sql, [clubKey]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }

    public async getTableCnt(clubKey: number) {
        let sql = 'SELECT COUNT(ID) as TableCnt FROM game_rooms AS gr WHERE ClubKey = ?'
        let ret = await this.query(sql, [clubKey]);
        return (!ret || ret.length == 0) ? 0 : ret[ret.length - 1].TableCnt;
    }

    public async getClubMembers(clubKey: number) {
        let sql = 'SELECT * FROM club_members WHERE ClubKey= ? AND JoinStatus = 1';
        let ret = await this.query(sql, [clubKey]);
        return ret;
    }

    public async getClubUserInfo(clubKey: number, userID: number) {
        let sql = 'SELECT * FROM club_members WHERE ClubKey = ? AND UserID = ?';
        let ret = await this.query(sql, [clubKey, userID]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }

    public async getRequiredMembers(clubKey: number) {
        let sql = 'SELECT * FROM club_members WHERE ClubKey= ? AND JoinStatus = 0';
        let ret = await this.query(sql, [clubKey]);
        return ret;
    }

    public async getClubRoom(clubKey: number): Promise<any[]> {
        let sql = 'SELECT * FROM game_rooms WHERE ClubKey= ?';
        let ret = await this.query(sql, [clubKey]);
        return ret;
    }

    public async deleteClub(clubKey: number): Promise<boolean> {
        let sql = 'set @ClubKey =?; DELETE FROM club_list WHERE ClubKey=@ClubKey; \
            DELETE FROM club_members WHERE ClubKey=@ClubKey;';
        let ret = await this.query(sql, [clubKey]);
        return ret.length > 0;
    }

    public async exitClub(clubKey: number, userID: number): Promise<boolean> {
        let sql = 'DELETE FROM club_members WHERE ClubKey =? AND UserID = ?';
        let ret = await this.query(sql, [clubKey, userID]);
        await this._updateMemberCnt(clubKey);
        return ret.length > 0;
    }


    public async getClubList(userID: number) {
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

    public async joinClub(userID: number, clubKey: number) {
        let sql = 'INSERT INTO club_members (UserID, ClubKey, CreateTime) VALUES (?, ?, CURRENT_TIMESTAMP)'
        let ret = await this.query(sql, [userID, clubKey]);
        return ret.length > 0;
    }

    public async getJoinStatus(userID: number, clubKey: number) {
        let sql = 'SELECT * FROM club_members WHERE UserID = ? AND ClubKey = ?';
        let ret = await this.query(sql, [userID, clubKey]);
        return (!ret || ret.length == 0) ? null : ret[ret.length - 1];
    }

    public async updateJoinStatus(userID: number, clubKey: number, state: number) {
        let sql = 'UPDATE club_members SET JoinStatus = ? WHERE UserID = ? AND ClubKey= ?';
        let ret = await this.query(sql, [state, userID, clubKey]);
        await this._updateMemberCnt(clubKey);
        return ret.length > 0;
    }

    public async updateAllJoinStatus(clubKey: number, state: number) {
        let sql = 'UPDATE club_members SET JoinStatus = ? WHERE ClubKey= ? AND JoinStatus = 0';
        let ret = await this.query(sql, [state, clubKey]);
        await this._updateMemberCnt(clubKey);
        return ret.length > 0;
    }

    public async updateUserOrder(clubKey: number, userID: number, order: number) {
        let sql = 'UPDATE club_members SET MemberOrder = ? WHERE ClubKey = ? AND UserID = ?';
        let ret = await this.query(sql, [order, clubKey, userID]);
        return ret.length > 0;
    }

    public async deleteClubMember(clubKey: number, userID: number) {
        let sql = 'DELETE FROM club_members WHERE ClubKey = ? AND UserID = ?';
        let ret = await this.query(sql, [clubKey, userID]);
        await this._updateMemberCnt(clubKey);
        return ret.length > 0;
    }

    public async _updateMemberCnt(clubKey: number) {
        let sql = 'UPDATE club_list SET MemberCount = (SELECT COUNT(ID) FROM club_members WHERE ClubKey=? AND JoinStatus=1) WHERE ClubKey=?';
        let ret = await this.query(sql, [clubKey, clubKey]);
        return ret.length > 0;
    }

    public async addScore(clubKey: number, userID: number, score: number) {
        let sql = 'UPDATE club_members SET Score=Score+? WHERE ClubKey=? and UserID=?';
        let ret = await this.query(sql, [score, clubKey, userID]);
        return ret.length > 0;
    }

    public async addScoreLog(clubKey: number, userID: number, score: number, tarUser: number, tarScore: number, addScore: number) {
        let sql = 'INSERT INTO club_swapscore_list (ClubKey, SrcUserID, SrcBeforeScore, DstUserID, \
            DstBeforeScore, SwapScore, CreateTime) VALUES (?,?,?,?,?,?, CURRENT_TIMESTAMP())';
        let ret = await this.query(sql, [clubKey, userID, score, tarUser, tarScore, addScore]);
        return ret.length > 0;
    }

    public async getScoreLog(clubKey: number) {
        let sql = 'SELECT * FROM club_swapscore_list WHERE ClubKey= ? AND DATEDIFF(NOW(), CreateTime) <= 3';
        let ret = await this.query(sql, [clubKey]);
        return ret;
    }

    public async writeScore(clubKey: number, userID: number, score: number, revenue: number) {
        let sql = 'set @Revenue=?;  UPDATE club_members SET score = score + ? - @Revenue, Revenue= Revenue+ @Revenue WHERE ClubKey =? AND UserID = ?;';
        let ret = await this.query(sql, [revenue, score, clubKey, userID]);
        return ret.length > 0;
    }

    public async getClubUserDrawInfo(clubKey: number, userID: number) {
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

    public async getClubDrawInfo(clubKey: number) {
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