enum ErrorCode {
    NO_ERROR = 0,
    ERROR_SHOW
};

declare interface IResponse {
    status: number,
    msg: string,
    data: any
}


export class Response {


    public static OK(msg: string | object, data?: object): IResponse {
        if (typeof msg === 'object') {
            data = msg;
            msg = '';
        }
        return {
            status: ErrorCode.NO_ERROR,
            msg: msg || '',
            data: data || {},
        } as IResponse;
    }


    public static ERROR(error: string | ErrorCode, msg?: string): IResponse {
        if (typeof error === 'string') {
            msg = error;
            error = ErrorCode.ERROR_SHOW;
        }
        return {
            status: error,
            msg: msg || '',
            data: {},
        } as IResponse
    }
}