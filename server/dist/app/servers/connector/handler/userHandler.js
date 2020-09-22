"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserHandler = void 0;
const dbManager_1 = require("../../../repositories/dbManager");
const response_1 = require("../../../util/response");
function default_1(app) {
    return new UserHandler(app);
}
exports.default = default_1;
class UserHandler {
    constructor(app) {
        this.app = app;
    }
    async user(msg, session) {
        let res = await dbManager_1.DBManager.get().accountDB.getAccountsInfoByUserID(msg.uid);
        if (res == null) {
            return response_1.Response.ERROR('查无此人');
        }
        let base = {
            UserID: res.UserID,
            GameID: res.GameID,
            NickName: encodeURI(res.NickName),
            FaceURL: res.FaceURL,
            ip: res.LastLogonIP
        };
        return response_1.Response.OK(base);
    }
}
exports.UserHandler = UserHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9hcHAvc2VydmVycy9jb25uZWN0b3IvaGFuZGxlci91c2VySGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSwrREFBNEQ7QUFDNUQscURBQWtEO0FBRWxELG1CQUF5QixHQUFnQjtJQUNyQyxPQUFPLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLENBQUM7QUFGRCw0QkFFQztBQVVELE1BQWEsV0FBVztJQUNwQixZQUFvQixHQUFnQjtRQUFoQixRQUFHLEdBQUgsR0FBRyxDQUFhO0lBQ3BDLENBQUM7SUFFTyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQW9CLEVBQUUsT0FBd0I7UUFDN0QsSUFBSSxHQUFHLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0UsSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFO1lBQ2IsT0FBTyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNqQztRQUNELElBQUksSUFBSSxHQUFjO1lBQ2xCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTTtZQUNsQixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU07WUFDbEIsUUFBUSxFQUFFLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO1lBQ2pDLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTztZQUNwQixFQUFFLEVBQUUsR0FBRyxDQUFDLFdBQVc7U0FDdEIsQ0FBQztRQUNGLE9BQU8sbUJBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztDQUNKO0FBbEJELGtDQWtCQyJ9