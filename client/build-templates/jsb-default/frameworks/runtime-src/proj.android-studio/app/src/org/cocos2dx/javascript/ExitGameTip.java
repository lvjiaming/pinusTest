package org.cocos2dx.javascript;


import android.app.AlertDialog;
import android.app.Dialog;
import android.app.AlertDialog.Builder;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;

public class ExitGameTip {
    private Context mContext;
    private boolean mIsShow = false;

    private String updateMsg = "确定退出游戏？";

    private Dialog noticeDialog;

    public ExitGameTip(Context context) {
        this.mContext = context;
        AlertDialog.Builder builder = new Builder(mContext);
        builder.setTitle("");
        builder.setMessage(updateMsg);
        builder.setPositiveButton("确定", new OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
                dialog.cancel();
                System.exit(0);
            }
        });
        builder.setNegativeButton("取消", new OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
                dialog.cancel();
                mIsShow = false;
            }
        });
        noticeDialog = builder.create();
    }

    public void ExitGame() {
        if (mIsShow == false) {
            mIsShow = true;
            showNoticeDialog();
        } else {
            mIsShow = false;
        }
    }

    private void showNoticeDialog() {
        noticeDialog.show();
    }

}

