"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
class GameService {
    static getTable(roomID, app) {
        let channelService = app.get('channelService');
        let channel = channelService.getChannel(roomID + '', false);
        if (!channel) {
            console.log('没有获取channel');
            return null;
        }
        let room = channel;
        if (!room.Table) {
            console.log('没有获取channel');
            return null;
        }
        return room.Table;
    }
}
exports.GameService = GameService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9hcHAvc2VydmVycy9nYW1lL3NlcnZpY2UvZ2FtZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBTUEsTUFBYSxXQUFXO0lBRWIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFjLEVBQUUsR0FBZ0I7UUFDbkQsSUFBSSxjQUFjLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQy9DLElBQUksT0FBTyxHQUFHLGNBQWMsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1RCxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMzQixPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsSUFBSSxJQUFJLEdBQUcsT0FBc0IsQ0FBQztRQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDM0IsT0FBTyxJQUFJLENBQUM7U0FDZjtRQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUN0QixDQUFDO0NBQ0o7QUFoQkQsa0NBZ0JDIn0=