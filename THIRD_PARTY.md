# 素材和第三方组件

## 字体

- `public/fonts/NotoSansSC-VF.ttf`：Noto Sans SC；Google Fonts 字体目录见 <https://github.com/google/fonts/tree/main/ofl/notosanssc>。许可文本随仓库保留在 `public/fonts/licenses/NotoSansSC-OFL.txt`。
- `public/fonts/NotoSerifSC-VF.ttf`：Noto Serif SC；Google Fonts 字体目录见 <https://github.com/google/fonts/tree/main/ofl/notoserifsc>。许可文本随仓库保留在 `public/fonts/licenses/NotoSerifSC-OFL.txt`。

两套字体均保留为本地文件，视频渲染无需在线加载字体。

## 音频

- `public/audio/`：本工程已有的配乐、环境音及音效；对应合成源码为 `work/audio/make.mjs`。
- `public/vo/`：本工程已有的 11 段旁白 WAV；时间、字幕和引用标签为 `src/film/vo.ts`。正常预览、渲染和验收直接使用这些文件，不需要调用语音服务。

## 依赖

Remotion、React、TypeScript 和 NumPy 的许可证以各自项目及安装包所附文本为准。字体许可证不替代工程其他部分的许可。
