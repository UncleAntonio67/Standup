# APK 发布说明（EAS）

## 前置条件
- 安装并登录 Expo 账号：`npx expo login`
- 安装 EAS CLI：`npm i -g eas-cli`

## 一次性初始化
- 在项目根目录执行：`eas build:configure`
- 当前仓库已提供 `eas.json`，并配置了 `preview` 产物为 `apk`

## 打包 APK
- 执行命令：`eas build -p android --profile preview`
- 构建完成后在命令行返回下载链接，可直接下载 `.apk`

## 说明
- `preview`：用于测试分发，输出 APK
- `production`：默认输出 AAB（应用商店上架）

