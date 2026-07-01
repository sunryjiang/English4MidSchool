# 初中英语提升 · 安卓 App

这是把「初中英语四周提升」网页版打包成安卓 App 的工程。
首页有三大模块：**语法精讲 / 背单词 / 分级阅读**，点进去即可学习，
内容、音标、发音都和电脑网页版一致（发音改用手机自带的语音引擎）。

打包方式：**GitHub Actions 云端自动打包**，你本地不用装 Android Studio。
把这个文件夹传到 GitHub，云端会自动编译出可安装的 `APK`。

---

## 一、准备：注册一个 GitHub 账号

打开 https://github.com ，注册并登录（免费）。

## 二、把工程传到 GitHub（二选一）

### 方式 A：用 GitHub Desktop（推荐，全程点鼠标）

1. 下载安装 GitHub Desktop：https://desktop.github.com ，用你的账号登录。
2. 菜单 `File` → `Add Local Repository…`（添加本地仓库）。
3. 选择本文件夹：`android-app`。
   - 如果提示 “this directory does not appear to be a Git repository”，
     点旁边的 **`create a repository`**（创建仓库），然后点 `Create Repository`。
4. 点右上角 **`Publish repository`**（发布仓库）。
   - 建议把 “Keep this code private”（保持私有）**取消勾选**或保留都行，
     私有也能正常打包。
   - 点 `Publish Repository`。
5. 上传完成后，会自动触发云端打包。跳到下面「三、下载 APK」。

### 方式 B：用命令行 git

在本文件夹打开终端（PowerShell），依次运行：

```powershell
git init
git add .
git commit -m "初中英语提升 安卓App"
```

然后到 GitHub 网站点右上角 `+` → `New repository` 新建一个空仓库（不要勾选任何初始化选项），
建好后按它页面上 “…or push an existing repository” 给出的命令执行，例如：

```powershell
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

## 三、下载 APK

1. 打开你在 GitHub 上的这个仓库页面，点顶部的 **`Actions`** 标签。
2. 会看到一条名为「构建安卓 APK」的运行记录，点进去。
   - 图标转圈=正在打包（约 3~6 分钟），变成绿色勾=成功。
   - 如果没有自动开始，点右上角 `Run workflow` 手动运行一次。
3. 打包成功后，在该运行页面**最下方 `Artifacts`** 区域，
   有一个 **`chuzhong-yingyu-apk`**，点击下载（下载下来是个 zip）。
4. 解压 zip，里面就是 `app-debug.apk`。

## 四、安装到安卓手机

1. 把 `app-debug.apk` 传到手机（微信文件传输、数据线、网盘均可）。
2. 在手机上点这个 apk 安装。
   - 第一次安装可能提示“未知来源/未知应用”，按提示允许即可。
3. 装好后桌面就有「初中英语提升」App，点开即用，**完全离线**。

---

## 常见问题

- **发音没声音？** 请确认手机装有中文/英文的 TTS 语音（一般系统自带 Google 语音服务）。
  路径大致是：设置 → 系统 → 语言和输入法 → 文字转语音输出。
- **想改内容/加单词？** 修改本工程 `www/` 里的文件（和网页版结构一致），
  重新推送到 GitHub 就会自动打出新的 APK。
- **这是 Debug 版**，用于自己安装学习足够了；若以后要上架应用商店再另配签名。
