"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameHandler = void 0;
const gameService_1 = require("../service/gameService");
function default_1(app) {
    return new GameHandler(app);
}
exports.default = default_1;
class GameHandler {
    constructor(app) {
        this.app = app;
    }
    async enter(msg, session) {
        let table = gameService_1.GameService.getTable(msg.RoomID, this.app);
        if (!table)
            return;
        let res = await table.enterRoom(parseInt(session.uid), session, msg.GPSInfo);
        if (!res) {
            console.log('进入房间失败!');
        }
        else {
            session.set('RoomID', msg.RoomID + '');
            session.push('RoomID', function (err) {
                if (err) {
                    console.error('set rid for session service failed! error is : %j', err.stack);
                }
            });
        }
    }
    async onFrameMsg(msg, session) {
        console.log("frameMsg", msg);
        let roomID = session.get('RoomID');
        if (!roomID) {
            console.log('session 中无 RoomID!');
            return;
        }
        let table = gameService_1.GameService.getTable(parseInt(roomID), this.app);
        if (table == null)
            return;
        if (table[msg.route]) {
            table[msg.route](parseInt(session.uid), msg.data);
        }
        else {
            console.log('框架无 ' + msg.route + ' 接口');
        }
    }
    async onGameMsg(msg, session) {
        console.log("消息入口：", msg);
        let roomID = session.get('RoomID');
        if (!roomID) {
            console.log('session 中无 RoomID!');
            return;
        }
        let table = gameService_1.GameService.getTable(parseInt(roomID), this.app);
        if (table == null)
            return;
        table.onGameMsg(parseInt(session.uid), msg.route, msg.data);
    }
}
exports.GameHandler = GameHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZUhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9hcHAvc2VydmVycy9nYW1lL2hhbmRsZXIvZ2FtZUhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0Esd0RBQXFEO0FBS3JELG1CQUF5QixHQUFnQjtJQUNyQyxPQUFPLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLENBQUM7QUFGRCw0QkFFQztBQU1ELE1BQWEsV0FBVztJQUVwQixZQUFvQixHQUFnQjtRQUFoQixRQUFHLEdBQUgsR0FBRyxDQUFhO0lBQ3BDLENBQUM7SUFFRCxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQWtCLEVBQUUsT0FBdUI7UUFDbkQsSUFBSSxLQUFLLEdBQUcseUJBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLEtBQUs7WUFBRSxPQUFPO1FBQ25CLElBQUksR0FBRyxHQUFZLE1BQU0sS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEYsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDMUI7YUFBTTtZQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDdkMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBVSxHQUFHO2dCQUNoQyxJQUFJLEdBQUcsRUFBRTtvQkFDTCxPQUFPLENBQUMsS0FBSyxDQUFDLG1EQUFtRCxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDakY7WUFDTCxDQUFDLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBYSxFQUFFLE9BQXVCO1FBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNsQyxPQUFPO1NBQ1Y7UUFDRCxJQUFJLEtBQUssR0FBUSx5QkFBVyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xFLElBQUksS0FBSyxJQUFJLElBQUk7WUFBRSxPQUFPO1FBQzFCLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNsQixLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3JEO2FBQU07WUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDO1NBQzNDO0lBRUwsQ0FBQztJQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBYSxFQUFFLE9BQXVCO1FBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNsQyxPQUFPO1NBQ1Y7UUFDRCxJQUFJLEtBQUssR0FBRyx5QkFBVyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdELElBQUksS0FBSyxJQUFJLElBQUk7WUFBRSxPQUFPO1FBQzFCLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoRSxDQUFDO0NBQ0o7QUFqREQsa0NBaURDIn0=