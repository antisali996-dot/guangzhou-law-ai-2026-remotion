# 素材和第三方组件

## 字体

- `public/fonts/NotoSansSC-VF.ttf`：Noto Sans SC；Google Fonts 字体目录见 <https://github.com/google/fonts/tree/main/ofl/notosanssc>。许可文本随仓库保留在 `public/fonts/licenses/NotoSansSC-OFL.txt`。
- `public/fonts/NotoSerifSC-VF.ttf`：Noto Serif SC；Google Fonts 字体目录见 <https://github.com/google/fonts/tree/main/ofl/notoserifsc>。许可文本随仓库保留在 `public/fonts/licenses/NotoSerifSC-OFL.txt`。

两套字体均保留为本地文件，视频渲染无需在线加载字体。

## 音频

- `public/audio/`：本工程已有的配乐、环境音及音效；对应合成源码为 `work/audio/make.mjs`。
- `public/vo/`：本工程已有的 11 段旁白 WAV；时间、字幕和引用标签为 `src/film/vo.ts`。正常预览、渲染和验收直接使用这些文件，不需要调用语音服务。

## GPT 生成的美术资源

- `public/film-v18/`：车筐细节、低对比纸面纹理。由内置 GPT 生图生成，提示词与参考记录见同目录 `asset-manifest.json`。
- `public/film-v19/`：楼上俯视、撞击前车筐近景、楼体仰视、肩后取证四张画面。参考本工程原生二维人物与街景生成；肩后落杯经过一次连续性编辑。完整提示词与参考图名见同目录 `asset-manifest.json`。
- 上述资源没有使用网上搜索的图片；杯子轨迹、撞击裂纹、飞溅、住户手势和手机屏幕由 Remotion 绘制或合成。人物正面表演、单车行走和主要街景沿用工程已有 SVG 组件。

## 依赖

Remotion、React、TypeScript 和 NumPy 的许可证以各自项目及安装包所附文本为准。字体许可证不替代工程其他部分的许可。
