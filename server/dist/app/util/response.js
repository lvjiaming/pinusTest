"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = void 0;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["NO_ERROR"] = 0] = "NO_ERROR";
    ErrorCode[ErrorCode["ERROR_SHOW"] = 1] = "ERROR_SHOW";
})(ErrorCode || (ErrorCode = {}));
;
class Response {
    static OK(msg, data) {
        if (typeof msg === 'object') {
            data = msg;
            msg = '';
        }
        return {
            status: ErrorCode.NO_ERROR,
            msg: msg || '',
            data: data || {},
        };
    }
    static ERROR(error, msg) {
        if (typeof error === 'string') {
            msg = error;
            error = ErrorCode.ERROR_SHOW;
        }
        return {
            status: error,
            msg: msg || '',
            data: {},
        };
    }
}
exports.Response = Response;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9hcHAvdXRpbC9yZXNwb25zZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxJQUFLLFNBR0o7QUFIRCxXQUFLLFNBQVM7SUFDVixpREFBWSxDQUFBO0lBQ1oscURBQVUsQ0FBQTtBQUNkLENBQUMsRUFISSxTQUFTLEtBQVQsU0FBUyxRQUdiO0FBQUEsQ0FBQztBQVNGLE1BQWEsUUFBUTtJQUdWLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBb0IsRUFBRSxJQUFhO1FBQ2hELElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO1lBQ3pCLElBQUksR0FBRyxHQUFHLENBQUM7WUFDWCxHQUFHLEdBQUcsRUFBRSxDQUFDO1NBQ1o7UUFDRCxPQUFPO1lBQ0gsTUFBTSxFQUFFLFNBQVMsQ0FBQyxRQUFRO1lBQzFCLEdBQUcsRUFBRSxHQUFHLElBQUksRUFBRTtZQUNkLElBQUksRUFBRSxJQUFJLElBQUksRUFBRTtTQUNOLENBQUM7SUFDbkIsQ0FBQztJQUdNLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBeUIsRUFBRSxHQUFZO1FBQ3ZELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQzNCLEdBQUcsR0FBRyxLQUFLLENBQUM7WUFDWixLQUFLLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQztTQUNoQztRQUNELE9BQU87WUFDSCxNQUFNLEVBQUUsS0FBSztZQUNiLEdBQUcsRUFBRSxHQUFHLElBQUksRUFBRTtZQUNkLElBQUksRUFBRSxFQUFFO1NBQ0UsQ0FBQTtJQUNsQixDQUFDO0NBQ0o7QUEzQkQsNEJBMkJDIn0=