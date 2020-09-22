import * as crypto from "crypto";

export class Security {
    public static md5(s: string) {
        let md5_str = crypto.createHash('md5').update(s).digest('hex');
        return md5_str.toLowerCase();
    }

    public static md5_file(buffer:any){
        let md5_str = crypto.createHash('md5').update(buffer).digest('hex');
        return md5_str.toLowerCase();
    }

    public static toBase64(s: string) {
        return new Buffer(s).toString('base64');
    }

    public static fromBase64(s: string) {
        return new Buffer(s, 'base64').toString();
    }
}