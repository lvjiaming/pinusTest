import { Application } from 'pinus';
import { CTable } from '../../../game/table';
import { DBManager } from '../../../repositories/dbManager';
import { Room } from '../handler/gameHandler';
import { GameService } from '../service/gameService';
import { INVALID_CHAIR } from '../../../game/table';
import { Response } from '../../../util/response';

export default function (app: Application) {
    return new GameRemote(app);
}

export class GameRemote {
    constructor(private app: Application) {
        this.initRoom();
    }

    private async initRoom() {
        if (this.app.getServerType() === 'game') {
            let res = await DBManager.get().gameDB.getRoomInfoByServerID(this.app.getServerId());
            if (res == null) return;
            res.forEach(async (ret: any) => {
                 await this.setRoomInfo(ret.RoomID, ret.KindID);
            });
        }
    }


    public async hasEmptyChair(roomID: number): Promise<boolean> {
        let table = GameService.getTable(roomID, this.app);
        if (!table) return false;
        return table.hasEmptyChair();
    }

    public async getSitUser(roomID: number) {
        let table = GameService.getTable(roomID, this.app);
        if (!table) return null;
        return table.sitUser;
    }

    public async userOffline(userID: number, roomID: number) {
        let table = GameService.getTable(roomID, this.app);
        if (!table) return;
        table.userOffline(userID);
    }

    public async setRoomInfo(roomID: number, kindID: number) {
        let channel = this.app.get('channelService').getChannel(roomID + '', true);
        let room: Room = (channel as any as Room);
        if (!room.Table) {
            room.Table = new CTable(this.app, channel, kindID);
            await room.Table.setRoomInfo(roomID);
            console.log('setRoomInfo sucess');
        }
    }

    public async dissRoom(roomID: number, force: boolean) {
        let table = GameService.getTable(roomID, this.app);
        if (!table) return false;
        if (table.roomInfo.Process == 0) {
            table.sendMsgToAll('onErrMsg', Response.ERROR('房间已经解散!'));
            await table.clearRoom();
        } else {
            if (force) {
                table.sendMsgToAll('onErrMsg', Response.OK('房间已经由管理员强制解散!'));
                table.m_pTableSink.concludeGame(INVALID_CHAIR, true); 
            }
        }
    }

}