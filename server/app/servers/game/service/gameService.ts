import { Room } from "../handler/gameHandler";
import { Application } from "pinus";
import { CTable } from "../../../game/table";



export class GameService {

    public static getTable(roomID: number, app: Application): CTable {
        let channelService = app.get('channelService');
        let channel = channelService.getChannel(roomID + '', false);
        if (!channel) {
            console.log('没有获取channel');
            return null;
        }
        let room = channel as any as Room;
        if (!room.Table) {
            console.log('没有获取channel');
            return null;
        }
        return room.Table;
    }
}