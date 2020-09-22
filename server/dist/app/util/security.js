"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Security = void 0;
const crypto = require("crypto");
class Security {
    static md5(s) {
        let md5_str = crypto.createHash('md5').update(s).digest('hex');
        return md5_str.toLowerCase();
    }
    static md5_file(buffer) {
        let md5_str = crypto.createHash('md5').update(buffer).digest('hex');
        return md5_str.toLowerCase();
    }
    static toBase64(s) {
        return new Buffer(s).toString('base64');
    }
    static fromBase64(s) {
        return new Buffer(s, 'base64').toString();
    }
}
exports.Security = Security;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9hcHAvdXRpbC9zZWN1cml0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBaUM7QUFFakMsTUFBYSxRQUFRO0lBQ1YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFTO1FBQ3ZCLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvRCxPQUFPLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFVO1FBQzdCLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwRSxPQUFPLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFTO1FBQzVCLE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFTSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQVM7UUFDOUIsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDOUMsQ0FBQztDQUNKO0FBbEJELDRCQWtCQyJ9