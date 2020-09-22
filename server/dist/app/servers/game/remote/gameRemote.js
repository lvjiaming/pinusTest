"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRemote = void 0;
const table_1 = require("../../../game/table");
const dbManager_1 = require("../../../repositories/dbManager");
const gameService_1 = require("../service/gameService");
const table_2 = require("../../../game/table");
const response_1 = require("../../../util/response");
function default_1(app) {
    return new GameRemote(app);
}
exports.default = default_1;
class GameRemote {
    constructor(app) {
        this.app = app;
        this.initRoom();
    }
    async initRoom() {
        if (this.app.getServerType() === 'game') {
            let res = await dbManager_1.DBManager.get().gameDB.getRoomInfoByServerID(this.app.getServerId());
            if (res == null)
                return;
            res.forEach(async (ret) => {
                await this.setRoomInfo(ret.RoomID, ret.KindID);
            });
        }
    }
    async hasEmptyChair(roomID) {
        let table = gameService_1.GameService.getTable(roomID, this.app);
        if (!table)
            return false;
        return table.hasEmptyChair();
    }
    async getSitUser(roomID) {
        let table = gameService_1.GameService.getTable(roomID, this.app);
        if (!table)
            return null;
        return table.sitUser;
    }
    async userOffline(userID, roomID) {
        let table = gameService_1.GameService.getTable(roomID, this.app);
        if (!table)
            return;
        table.userOffline(userID);
    }
    async setRoomInfo(roomID, kindID) {
        let channel = this.app.get('channelService').getChannel(roomID + '', true);
        let room = channel;
        if (!room.Table) {
            room.Table = new table_1.CTable(this.app, channel, kindID);
            await room.Table.setRoomInfo(roomID);
            console.log('setRoomInfo sucess');
        }
    }
    async dissRoom(roomID, force) {
        let table = gameService_1.GameService.getTable(roomID, this.app);
        if (!table)
            return false;
        if (table.roomInfo.Process == 0) {
            table.sendMsgToAll('onErrMsg', response_1.Response.ERROR('房间已经解散!'));
            await table.clearRoom();
        }
        else {
            if (force) {
                table.sendMsgToAll('onErrMsg', response_1.Response.OK('房间已经由管理员强制解散!'));
                table.m_pTableSink.concludeGame(table_2.INVALID_CHAIR, true);
            }
        }
    }
}
exports.GameRemote = GameRemote;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZVJlbW90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2FwcC9zZXJ2ZXJzL2dhbWUvcmVtb3RlL2dhbWVSZW1vdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsK0NBQTZDO0FBQzdDLCtEQUE0RDtBQUU1RCx3REFBcUQ7QUFDckQsK0NBQW9EO0FBQ3BELHFEQUFrRDtBQUVsRCxtQkFBeUIsR0FBZ0I7SUFDckMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBRkQsNEJBRUM7QUFFRCxNQUFhLFVBQVU7SUFDbkIsWUFBb0IsR0FBZ0I7UUFBaEIsUUFBRyxHQUFILEdBQUcsQ0FBYTtRQUNoQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDcEIsQ0FBQztJQUVPLEtBQUssQ0FBQyxRQUFRO1FBQ2xCLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxNQUFNLEVBQUU7WUFDckMsSUFBSSxHQUFHLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDckYsSUFBSSxHQUFHLElBQUksSUFBSTtnQkFBRSxPQUFPO1lBQ3hCLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQVEsRUFBRSxFQUFFO2dCQUMxQixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEQsQ0FBQyxDQUFDLENBQUM7U0FDTjtJQUNMLENBQUM7SUFHTSxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQWM7UUFDckMsSUFBSSxLQUFLLEdBQUcseUJBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsS0FBSztZQUFFLE9BQU8sS0FBSyxDQUFDO1FBQ3pCLE9BQU8sS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFFTSxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQWM7UUFDbEMsSUFBSSxLQUFLLEdBQUcseUJBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsS0FBSztZQUFFLE9BQU8sSUFBSSxDQUFDO1FBQ3hCLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQztJQUN6QixDQUFDO0lBRU0sS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFjLEVBQUUsTUFBYztRQUNuRCxJQUFJLEtBQUssR0FBRyx5QkFBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxLQUFLO1lBQUUsT0FBTztRQUNuQixLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFTSxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQWMsRUFBRSxNQUFjO1FBQ25ELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDM0UsSUFBSSxJQUFJLEdBQVUsT0FBdUIsQ0FBQztRQUMxQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNiLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxjQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbkQsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDckM7SUFDTCxDQUFDO0lBRU0sS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFjLEVBQUUsS0FBYztRQUNoRCxJQUFJLEtBQUssR0FBRyx5QkFBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxLQUFLO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDekIsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sSUFBSSxDQUFDLEVBQUU7WUFDN0IsS0FBSyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsbUJBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUMxRCxNQUFNLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztTQUMzQjthQUFNO1lBQ0gsSUFBSSxLQUFLLEVBQUU7Z0JBQ1AsS0FBSyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsbUJBQVEsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztnQkFDN0QsS0FBSyxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMscUJBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUN4RDtTQUNKO0lBQ0wsQ0FBQztDQUVKO0FBMURELGdDQTBEQyJ9