import Start from "./Start";
import CustomProgressBar from "../../Common/script/CustomProgressBar";
const { ccclass, property } = cc._decorator;

@ccclass
export default class HotUpdate extends cc.Component {

    @property({
        type: cc.Asset
    })
    public manifestUrl: cc.Asset = null;

    @property(cc.Label)
    public m_title: cc.Label = null;

    @property(CustomProgressBar)
    public m_progressBar: CustomProgressBar = null;

    private _am: any = null;
    private _updating: Boolean = false;
    private _updateListener: any = null;
    private _canRetry: any = null;
    public m_Hook: Start;
    private _storagePath:string = '';
    private versionCompareHandle = null;

    // use this for initialization
    updateHotRes(hook: Start) {
        // Hot update is only available in Native build
        if (!cc.sys.isNative) {
            return;
        }
        this.m_Hook = hook;
        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'take-remote-asset');
        cc.log('Storage path for remote asset : ' + this._storagePath);

        // Setup your own version compare handler, versionA and B is versions in string
        // if the return value greater than 0, versionA is greater than B,
        // if the return value equals 0, versionA equals to B,
        // if the return value smaller than 0, versionA is smaller than B.
        this.versionCompareHandle = function (versionA, versionB) {
            cc.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
            var vA = versionA.split('.');
            var vB = versionB.split('.');
            for (var i = 0; i < vA.length; ++i) {
                var a = parseInt(vA[i]);
                var b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                }
                else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            }
            else {
                return 0;
            }
        };

        // Init with empty manifest url for testing custom manifest
        this._am = new (<any>jsb).AssetsManager('', this._storagePath, this.versionCompareHandle);

        // Setup the verification callback, but we don't have md5 check function yet, so only print some message
        // Return true if the verification passed, otherwise return false
        this._am.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            var compressed = asset.compressed;
            // Retrieve the correct md5 value.
            var expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            var relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            var size = asset.size;
            if (compressed) {
                console.log("Verification passed : ", relativePath);
            }
            else {
                console.log("Verification passed : ", relativePath, ' (', expectedMD5, ')');
            }
            return true;
        });


        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            this._am.setMaxConcurrentTask(2);
        }

        this.checkUpdate();
    }

    private checkUpdate() {
        if (this._updating) {
            console.log("Checking or updating ...");
            return;
        }
        if (this._am.getState() === (<any>jsb).AssetsManager.State.UNINITED) {
            // Resolve md5 url
            var url = this.manifestUrl.nativeUrl;
            if (cc.loader.md5Pipe) {
                url = cc.loader.md5Pipe.transformURL(url);
            }
            this._am.loadLocalManifest(url);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            console.log("Failed to load local manifest ...");
            return;
        }
        this._am.setEventCallback(this.checkCb.bind(this));

        this._am.checkUpdate();
        this._updating = true;
    }

    private checkCb(event) {
        console.log('Code: ' + event.getEventCode());
        switch (event.getEventCode()) {
            case (<any>jsb).EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                console.log("No local manifest file found, hot update skipped.");
                this.m_Hook.queryEntry();;
                break;
            case (<any>jsb).EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case (<any>jsb).EventAssetsManager.ERROR_PARSE_MANIFEST:
                console.log("Fail to prase manifest file, hot update skipped.");
                this.m_Hook.queryEntry();
                break;
            case (<any>jsb).EventAssetsManager.ALREADY_UP_TO_DATE:
                console.log("已经是最新的");
                this.m_title.string = '当前版本已经是最新的';
                this.m_Hook.queryEntry();
                break;
            case (<any>jsb).EventAssetsManager.NEW_VERSION_FOUND:
                console.log('发现新的更新');
                this.m_title.string = '发现新的版本. 准备更新...';
                this._am.setEventCallback(null);
                this._updating = false;
                this.hotUpdate();
                return;
            default:
                return;
        }

        this._am.setEventCallback(null);
        this._updating = false;
    }

    private hotUpdate() {
        if (this._am && !this._updating) {
            this._am.setEventCallback(this.updateCb.bind(this));

            if (this._am.getState() === (<any>jsb).AssetsManager.State.UNINITED) {
                // Resolve md5 url
                var url = this.manifestUrl.nativeUrl;
                if (cc.loader.md5Pipe) {
                    url = cc.loader.md5Pipe.transformURL(url);
                }
                this._am.loadLocalManifest(url);
            }

            this._am.update();
            this._updating = true;
        }
    }


    private updateCb(event) {
        var needRestart = false;
        var failed = false;
        switch (event.getEventCode()) {
            case (<any>jsb).EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.m_title.string = "更新失败,本地没有配置文件";
                failed = true;
                break;
            case (<any>jsb).EventAssetsManager.UPDATE_PROGRESSION:
                this.m_title.string = "自动更新文件" + Math.floor(event.getPercentByFile() * 100) + "%...";
                if (this.m_progressBar) {
                    this.m_progressBar.progress = event.getPercentByFile();
                }

                var msg = event.getMessage();
                if (msg) {
                    console.log("Updated file: ", msg);
                    console.log(event.getPercent().toFixed(2) + '% : ' + msg);
                }
                break;
            case (<any>jsb).EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case (<any>jsb).EventAssetsManager.ERROR_PARSE_MANIFEST:

                this.m_title.string = "解析文件错误";
                failed = true;
                break;
            case (<any>jsb).EventAssetsManager.ALREADY_UP_TO_DATE:
                this.m_title.string = "";
                failed = true;
                break;
            case (<any>jsb).EventAssetsManager.UPDATE_FINISHED:
                console.log("Update finished. ", event.getMessage());
                needRestart = true;
                break;
            case (<any>jsb).EventAssetsManager.UPDATE_FAILED:
                this.m_title.string = "更新失败:" + event.getMessage();
                console.log("Update failed. ", event.getMessage());
                this._updating = false;
                this._canRetry = true;
                break;
            case (<any>jsb).EventAssetsManager.ERROR_UPDATING:
                this.m_title.string = "更新失败:" + event.getAssetId() + " ," + event.getMessage();
                console.log("Asset update error: ", event.getAssetId(), ', ', event.getMessage());
                break;
            case (<any>jsb).EventAssetsManager.ERROR_DECOMPRESS:
                this.m_title.string = "更新失败:" + event.getMessage();
                console.log(event.getMessage());
                break;
            default:
                break;
        }

        if (failed) {
            this._am.setEventCallback(null);
            this._updateListener = null;
            this._updating = false;
        }

        if (!this._updating && this._canRetry) {
            this._canRetry = false;

            this._am.downloadFailedAssets();
        }

        if (needRestart) {
            this._am.setEventCallback(null);
            this._updateListener = null;
            // Prepend the manifest's search path
            var searchPaths = (<any>jsb).fileUtils.getSearchPaths();
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            console.log('newPaths: ' + JSON.stringify(newPaths));
            Array.prototype.unshift(searchPaths, newPaths);
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));

            jsb.fileUtils.setSearchPaths(searchPaths);
            cc.game.restart();
        }
    }

    public onDestroy() {
        if (this._updateListener) {
            this._am.setEventCallback(null);
            this._updateListener = null;
        }
    }
}
