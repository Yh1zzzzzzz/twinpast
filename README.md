# TwinPast project page

英文静态展示页，输出目录为 `dist/`。无需安装前端依赖，无账号、数据库或后端。按用户审核意见，页面不展示作者与单位。论文公开地址未提供，代码仓库仍为私有，数据集公开访问未确认，资源入口保留 forthcoming 状态。

页面按“研究动机 → 配对设计与 PairAcc → 视频案例 → 关键结果 → 历史证据的正确使用”组织。核心故事默认可见，完整表格与数据集范围按需展开。结果表默认显示流式系统，可切换到全部 36 行。保留原来的 8 对示例、5 类任务、完整媒体和结果数据。

2026-10-30 叙事更新依据用户提供的 `TwinPast_Arxiv.pdf`：前置两类审计发现；显式解释独立评测和 PairAcc；展示 42% Acc / 0% PairAcc、输入排名反转、模型组别与同家族差距；默认呈现 ReKV、OneStreamer 以及 §6.3 的计数问答案例。`dist/story.css` 负责新增版式。`dist/assets/evidence/` 的图片直接提取自论文 Figure 4，未改动图像内容；网页重新安排时间、问题和答案标注。

本轮审核修改：删除首屏眉题、Construction and human review 折叠块与并排查看说明；加粗 FOUR RECENT FRAMES；替换素材包中的 favicon，并使用 web 版概念图作为链接分享预览（不作为正文中的数据集证据）。重新通读本地 `TwinPast_Arxiv` 全文后，将流式差距改为 Figure 3 的五任务 PairAcc 对照，逐项展示最高流式分数与最低通用模型分数。该指标不同于 Table 2 中各任务的单视频准确率。ReKV 与 OneStreamer 案例的最终版式和采样依据见下面“证据使用案例”。

本轮进一步调整：两类无历史作答途径增加显著的 1 / 2 编号；流式比较标题与图例明确比较 system / model。输入排名表的 StreamingBench 指标改为 `StreamingBench Avg`，以题量加权合并 2,499 道 Real-Time Visual Understanding 与 498 道 Contextual Understanding，共 2,997 题。由原始答对数计算，不对论文已舍入的百分数再加权：Qwen 4 帧 (2,044 + 330) / 2,997 = 79.21%，64 帧 (1,692 + 141) / 2,997 = 61.16%；DeepSeek 4 帧 (2,016 + 302) / 2,997 = 77.34%，64 帧 (1,856 + 189) / 2,997 = 68.23%。数值来源为本地 `TwinPast_Overleaf/research/tables/data/parser_audit_table_scores.json` 中对应近期帧／DeepSeek 条件，Qwen 64 帧来自 `qwen_visual_reference.json` 的 `uniform64.stream_rt` 和 `uniform64.stream_context`；组别分数已与 `TwinPast_Arxiv/sections/03_audit.tex` 复核。

本轮版本已于 2026-10-30 经用户审核并明确批准发布。审核版本保存在 `review/story-update-20261030`，通过 `main` 分支发布到 GitHub Pages；后续更新仍先提供本地审核。

修改前完整备份（含视频）保存在项目外的 `../TwinPast-backups/2026-10-30-before-story-update/TwinPast-website.tar.gz`；同目录的 `backup-info.json` 保存原提交 `21a66fede30cf8226bbed9ce44d9b780e16b98ea`、文件数和 SHA-256。恢复时先解压到独立目录检查。

## 证据使用案例

第 05 节按“系统与问题 → 1 fps 关键历史胶片 → 最终答题可用证据 → 模型答案”呈现。`dist/evidence.css` 和 `dist/evidence.js` 负责胶片与无障碍放大查看；支持前后帧、左右方向键和 Esc 关闭，关闭后焦点回到原帧。

- 历史胶片直接复制本地 `TwinPast_Overleaf/figures/Case_study/section62_key_frames_1fps 2` 的 22 张原始 PNG：ReKV A/B 各 0–4 秒，OneStreamer A 为 0–11 秒。图片内容未修改。来源文件、视频帧索引和校验值记录于 `scripts/evidence-cases.json`。
- 1 fps 是网页历史回放的展示采样率。原始证据元数据 `figures/source/evidence_use_single_column_v8/assets/evidence/original_evidence_metadata.json` 确认 ReKV 实际采样时间为 0、2、4、6、8、10、12、14 秒，8/8 候选帧均返回。网页的答题证据区只展示其中与问题相关的 0、2、4 秒原帧，明确标为相关返回帧，没有把历史胶片误标为模型全部检索帧。旧版网页使用的 Figure 4 内 1–8 秒示意条不再用作“全部模型采样帧”的展示。
- OneStreamer 展示元数据中最终 QA 文本记忆的两段原句，保留论文引用的生成时间区间 2–7 秒、7–10 秒；只显示论文讨论的 A 分支，答案为 hairbrush，正确答案为 spray bottle。
- 本轮改动前的审核源文件和证据图备份于 `../TwinPast-backups/2026-10-30-before-evidence-flow/review-source.zip`。论文原文件未修改。

## 预览

在本目录执行 `npm run dev`，打开终端打印的地址。默认端口 4173；可用 `npm run dev -- --port 8080` 修改。开发服务器支持视频分段请求与拖动进度。

`npm run check` 检查浏览器脚本的语法。`dist/index.html` 也可以直接打开，全部资源使用相对路径。

`python3 scripts/package_mac.py` 生成完整的 `twinpast-mac.zip`，包含双击打开入口和 Mac 使用说明。视频直接复用，不重新编码；不包含 Git 历史、托管身份、论文草稿或研究仓库。

## 内容来源与更新

- `scripts/selection.json`：页面明确选用的 8 对案例、封面时间、历史证据跳转点及共享后缀边界来源。AIR 保留 `pilot_r2_00048`；HSR 为 `pilot_r3_00073`、`pilot_b07_00023`；EOR 为 `pilot_b08_00042`、`pilot_b06_00056`、`pilot_00004`；HAC 为 `pilot_00001`；MEI 为 `pilot_b08_00091`。
- `dist/cases.js`：由选择配置及当前 release350 的原问题、选项、答案生成。HSR、EOR 支持类内示例切换，切换时重置播放与答案显示，返回类别时记住上次所选示例。页面示例不代表独立测试子集。
- `scripts/results-paper.json` 是网站的结果来源，初始对齐用户提供的 `main.pdf`（2026-10-28，第 7 页 Table 2），本次关键结果已复核 `TwinPast_Arxiv.pdf`（2026-10-30，第 6 页 Table 2）：34 个模型／输入配置和 2 个人工参考，共 36 行。`npm run export-results` 将其导出为 `dist/results.js` 与 `dist/assets/results.csv`。后续论文更新时先审阅并更新该 JSON，不自动用其他研究目录的表格覆盖网站。本轮另从 `TwinPast_Arxiv/figures/paired_answer_patterns_main.pdf` 核对五任务 PairAcc，并从其 §6 及 Figure 4 核对错误案例。
- `dist/assets/media/`：保留完整时长与源帧率的展示副本，宽度最多 960 像素且不放大，提供 H.264 MP4 和 VP9 WebM。无音轨，未裁切视频，原始评测媒体未修改。封面来自已选历史原帧与共享后缀原帧；关键证据跳转从相关过程开始前进入，不以封面时间代替。AIR 复用原展示文件。
- `scripts/prepare_media.py`：按同目录的 `selection.json` 从研究仓库生成素材，需要 ffmpeg、ffprobe；日常修改页面不需要运行。示例：`python3 scripts/prepare_media.py --repo-root ../.. --reuse-dir dist --output /tmp/twinpast-web-assets-v2`。默认最多两路编码，每路两线程。输出后将素材复制到 `dist/assets/media/`，将 cases.json 包装为 `window.TWINPAST_CASES = ...;` 保存到 `dist/cases.js`。仅复制完成的文件，勿复制编码中的 `.part.mp4` / `.part.webm`；移除不再使用的旧展示副本，保留 AIR 文件供首屏使用。
- `dist/project.css` 与 `dist/project.js`：论文项目页的首屏证据切换、配对评分示意、输入条件对照和诊断案例。配对设计区使用 `pilot_r3_00073` 小船案例；虚线框仅提示问题相关区域，不是编辑掩码或像素相等性证明。评分演示明确标为示意，不当作实测结果。
- 内容依据是用户提供的 `main.pdf`：构造原则见 §4.2（历史中无关内容尽可能匹配，共享最近帧严格相同）；两类审计动机见 §3；结果见 Tables 1–2；保留证据但用错时间／顺序的案例及多事实失败见 §6，计数与多事件任务 PairAcc 见 Figure 3；范围限制见 §7。不会将“尽可能匹配”写成所有历史无关像素完全相同，也不声称排除所有捷径。
- “32%”仅描述论文额外抽查的 400 道历史任务题；网页避免将其扩展为两个基准的总体比例。PairAcc 与 Acc 分开呈现，不把不同基准的不同指标混为同一排行榜。
- 按用户审核意见，移除正文中的模型协议对照说明、Read within setting 和 Human reference protocol 段落；表格的六组条件与既有数值保持不变，排序仍仅在组内进行。

正式论文、代码和数据集公开入口仍待确认。当前 AIR 示例来自 VidPair-Halluc，其公开再分发条款在研究仓库的 `OUR_Benchmark/THIRD_PARTY_NOTICES.md` 中仍为未明确；公开展示时应确认该素材或替换该案例。

## GitHub Pages

此目录对应独立公开仓库 [Yh1zzzzzzz/twinpast](https://github.com/Yh1zzzzzzz/twinpast)，项目网址为 <https://yh1zzzzzzz.github.io/twinpast/>。

GitHub 仓库 Settings → Pages 已选择 GitHub Actions。向 `main` 推送后，`.github/workflows/pages.yml` 先检查浏览器脚本语法，再自动部署 `dist/`，无需构建步骤。项目子路径 `/twinpast/` 受支持。仅在用户审核并明确同意发布后，才提交并推送到 main；发布结果可在仓库 Actions 页面查看。

若合并到已有 `用户名.github.io` 仓库，将 `dist/` 的内容放到该仓库 `twinpast/` 子目录，并使用已有站点的发布流程。不要将整个研究仓库或原始700视频上传到网站仓库。

视频若改放对象存储，只需修改 `dist/cases.js` 的 `video_a/video_b/video_a_webm/video_b_webm` 地址。服务器需提供正确的 MIME 类型并支持字节范围请求。

Sites 私有预览的身份文件是 `.openai/hosting.json`；GitHub Pages 不依赖它。没有发布到 GitHub 时，不应将私有预览地址当作正式项目网址。
