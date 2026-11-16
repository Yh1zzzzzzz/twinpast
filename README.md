# TwinPast project page

## 访问统计（2026-11-16）

- 中英文页面共用用户提供的 Cloudflare Web Analytics 统计代码，安装在 `dist/index.html` 的 `</body>` 前。运行 `npm run build-locales` 会将同一段代码同步到 `dist/zh.html`，不需要分别配置两个统计站点。
- 在 [Cloudflare Web Analytics 后台](https://dash.cloudflare.com/?to=/:account/web-analytics) 选择 `yh1zzzzzzz.github.io` 查看数据。按 Path 筛选时，英文入口包括 `/twinpast/` 和 `/twinpast/index.html`，中文入口为 `/twinpast/zh.html`。
- 数据从接入上线后开始累计，无法补回此前未记录的访问。网页中的 beacon token 是公开的网站统计标识，不是账户 API 密钥。

## 视频概览（2026-11-15）

- 首屏标题区与配对设计图之间新增视频卡片（`#video`），按钮组新增视频平台入口：英文页为 YouTube，中文页为 bilibili（用 `.only-en` / `.only-zh` 按页面语言显示）。英文页播放 `dist/assets/video/twinpast-overview-en.mp4`（3:31），中文页播放 `twinpast-overview-zh.mp4`（3:34）；两者均为烧录字幕加配乐的 H.264 MP4，片尾标题页含作者与单位。为减轻国内访问 GitHub Pages 时的卡顿，网页版用 x264 veryslow、`-tune animation`、CRF 23（峰值 900 kbps）与 128 kbps AAC 重编码，总码率约 400 kbps（原 685 kbps），画面与原片肉眼无差；地址带 `?v=2` 以免浏览器混用旧文件的缓存分段。
- 封面 `twinpast-overview-{en,zh}.jpg` 取自各自视频开头无字幕的标题帧（英文 10.5 s、中文 9.5 s），1280×720。视频 `preload="none"`，点击封面上的播放按钮后才加载并显示原生控件；无 JS 时直接显示原生控件。
- 中文页的视频、封面与“观看中文版 / Watch in English”链接通过 `scripts/translations-zh.json` 的 `attributes` 映射替换，仅作用于带 `data-l10n-attrs` 的元素（见 `scripts/build_locales.py`）。
- 2026-11-15：用户审核后明确确认发布。

## 中英文版本（2026-11-15 发布版本）

- 页面顶部主导航提供 `English / 中文` 切换，滚动时保持可见。英文入口为 `dist/index.html`，简体中文入口为 `dist/zh.html`；切换时保留当前阅读章节。
- 两版共用 `site.css` 和 `site.js`，保持相同的页面结构、图片、视频与图表布局。中文版翻译正文、图注、交互提示、无障碍标签和 8 对视频问答；模型名称、实验数值、答案键及正式 BibTeX 保持不变。模型文本记忆的翻译明确标注为中文译文。
- `scripts/translations-zh.json` 保存中文译文；`scripts/build_locales.py` 以英文页为模板生成 `dist/zh.html` 和 `dist/locale-zh.js`。更新英文页面或译文后运行 `npm run build-locales`，不要直接修改这两个生成文件。
- `npm run check` 同时检查脚本语法、中文页面是否同步，以及全部视频对的翻译覆盖情况。两版均支持本地直接打开；GitHub Pages 使用相同的 `dist/` 发布目录。
- 2026-11-15：用户审核后明确确认，将当前中英文版本一并发布到 GitHub Pages。[英文入口](https://yh1zzzzzzz.github.io/twinpast/)；[中文入口](https://yh1zzzzzzz.github.io/twinpast/zh.html)。

## 2026-11-13 改版（纳入 2026-11-15 发布版本）

依据 `TwinPast_Overleaf/draft_with_appendix.pdf` 重写页面，目的是让访问者在首屏看懂论文在做什么，并去掉营销落地页式的写法。本节描述当前页面；下文更早的记录保留作历史参考，其中提到的 `style.css`、`project.css`、`story.css`、`evidence.css`、`app.js`、`project.js`、`evidence.js` 和 Lora 字体已删除（Git 历史中可找回）。

- 同日第二轮（用户反馈第一轮过于简陋）：保留上述结构与文案，重做视觉。配色取自 `assets/favicon.svg` 与 `TwinPast_website_assets` 的概念图（深蓝 #172B42、History A 蓝、History B 玫红）；新增吸顶导航与分节高亮、大字标首屏与四项规模数字、胶片条样式的配对设计图（`dist/assets/teaser/` 的 9 张帧由 `AIR-A/B.mp4` 在 5/9/14.5 s、5/9/13 s 及共享段 18/30/38 s 处抽取并缩放为 480×270，未做其他修改）、三张关键数字卡、输入对照柱状图（可切换模型，替代原表格）、V^A/V^B 结构示意、Qwen3.8-Omni-Flash 同家族 D/C 对比条、遮挡表数据条、案例胶片条。图表条形在进入视口时有一次展开动画，系统设置减少动态效果时关闭。
- 2026-11-15：按用户确认，依据当天更新的 `draft_with_appendix.pdf` 附录 D 加入“证据与提问的距离”一块（结果一节，遮挡实验之后）。一张折线图合并 Table S4（去掉共享后缀）与 Table S5（插入 30/60/180/600 s 中性片段），横轴为六个有序档位，非等比例；数值写在 `site.js` 的 `distanceSeries` 中，论文更新时需手动同步。图注注明原始分为该实验的重跑结果（StreamForest 35.14，主表为 35.43）、离线参考为 Qwen3-VL-4B、MiniCPM-o 4.5 在 +600 s 超出模型配置长度。此前因公开 arXiv 版尚无附录而暂缓发布；2026-11-15 用户审核后明确确认，将包含本节的当前中英文版本一并发布。
- 文件：`dist/index.html`（结构与文案）、`dist/site.css`（全部样式）、`dist/site.js`（视频播放器、两张图、完整表格、帧放大、BibTeX 复制）。`cases.js`、`results.js` 仍是数据来源，生成方式不变。
- 页面顺序：论文标题与资源链接 → 一句话概括 → 配对设计图（AIR 舞者案例的三张原帧）→ 三点摘要与论文摘要 → Correct answers without history（§3，Table 1/2 的输入对照表）→ TwinPast 设计与视频案例（§4）→ 结果（§5：配对结果堆叠条形图、分任务点图、遮挡实验 Table 3、完整 Table 2）→ 证据仍在却答错（§6.2 的 ReKV、OneStreamer）→ BibTeX。
- 配对结果图由 `results.js` 的 PairAcc 与 D 绘制：深色为两支均对，浅色为 D − PairAcc，灰色为 100 − D。分任务点图的数值取自论文 Figure 3，写在 `site.js` 的 `taskPairAcc` 中，论文更新时需手动同步。
- 输入对照表直接使用论文 Table 1 的 OVO-Bench Avg 与 StreamingBench Real-Time Avg，不再使用旧版自行按题量合并的 StreamingBench Avg。
- 删除的交互：首屏历史/近期帧切换、三种答案模式演示、答案揭示按钮、模型下拉、表格搜索/筛选/排序、全屏按钮。答案现在直接标在选项后。
- `scripts/results-paper.json` 的 Human (streaming) 行改为当前稿 Table 2 的数值：PairAcc 65.43、D 70.86、C 92.34、S 65.43（原为 65.29、70.91、92.07、65.29）。其余 35 行与当前稿一致。组名改用论文的写法。
- 仍按此前审核意见不展示作者与单位。

英文静态展示页，输出目录为 `dist/`。无需安装前端依赖，无账号、数据库或后端。按用户审核意见，页面不单独展示作者与单位；页末 BibTeX 引用保留完整作者列表。

2026-11-02 按用户要求更新正式入口并发布：[Paper / arXiv](https://arxiv.org/abs/2610.41983)、[Code / GitHub](https://github.com/Yh1zzzzzzz/TwinPast_code)、[Dataset / Hugging Face](https://huggingface.co/datasets/younght/TwinPast)。页末 `#citation` 提供用户给定的完整 BibTeX 与复制按钮。

页面按“研究动机 → 配对设计与 PairAcc → 视频案例 → 关键结果 → 历史证据的正确使用”组织。核心故事默认可见，完整表格与数据集范围按需展开。结果表默认显示流式系统，可切换到全部 36 行。保留原来的 8 对示例、5 类任务、完整媒体和结果数据。

2026-10-30 叙事更新依据用户提供的 `TwinPast_Arxiv.pdf`：前置两类审计发现；显式解释独立评测和 PairAcc；展示 42% Acc / 0% PairAcc、输入排名反转、模型组别与同家族差距；默认呈现 ReKV、OneStreamer 以及 §6.3 的计数问答案例。`dist/story.css` 负责新增版式。`dist/assets/evidence/` 的图片直接提取自论文 Figure 4，未改动图像内容；网页重新安排时间、问题和答案标注。

本轮审核修改：删除首屏眉题、Construction and human review 折叠块与并排查看说明；加粗 FOUR RECENT FRAMES；替换素材包中的 favicon，并使用 web 版概念图作为链接分享预览（不作为正文中的数据集证据）。重新通读本地 `TwinPast_Arxiv` 全文后，将流式差距改为 Figure 3 的五任务 PairAcc 对照，逐项展示最高流式分数与最低通用模型分数。该指标不同于 Table 2 中各任务的单视频准确率。ReKV 与 OneStreamer 案例的最终版式和采样依据见下面“证据使用案例”。

本轮进一步调整：两类无历史作答途径增加显著的 1 / 2 编号；流式比较标题与图例明确比较 system / model。输入排名表的 StreamingBench 指标改为 `StreamingBench Avg`，以题量加权合并 2,499 道 Real-Time Visual Understanding 与 498 道 Contextual Understanding，共 2,997 题。由原始答对数计算，不对论文已舍入的百分数再加权：Qwen 4 帧 (2,044 + 330) / 2,997 = 79.21%，64 帧 (1,692 + 141) / 2,997 = 61.16%；DeepSeek 4 帧 (2,016 + 302) / 2,997 = 77.34%，64 帧 (1,856 + 189) / 2,997 = 68.23%。数值来源为本地 `TwinPast_Overleaf/research/tables/data/parser_audit_table_scores.json` 中对应近期帧／DeepSeek 条件，Qwen 64 帧来自 `qwen_visual_reference.json` 的 `uniform64.stream_rt` 和 `uniform64.stream_context`；组别分数已与 `TwinPast_Arxiv/sections/03_audit.tex` 复核。

本轮版本已于 2026-10-30 经用户审核并明确批准发布。审核版本保存在 `review/story-update-20261030`，通过 `main` 分支发布到 GitHub Pages；后续更新仍先提供本地审核。

2026-11-13 按用户要求删除项目外的旧版本备份、审核源文件备份和预览截图，并清理本项目 `.qa/` 中的旧审核截图。当前网站、Git 历史、个人主页和原始设计素材保留。

## 证据使用案例

第 05 节按“系统与问题 → 1 fps 关键历史胶片 → 最终答题可用证据 → 模型答案”呈现。`dist/evidence.css` 和 `dist/evidence.js` 负责胶片与无障碍放大查看；支持前后帧、左右方向键和 Esc 关闭，关闭后焦点回到原帧。

- 历史胶片直接复制本地 `TwinPast_Overleaf/figures/Case_study/section62_key_frames_1fps 2` 的 22 张原始 PNG：ReKV A/B 各 0–4 秒，OneStreamer A 为 0–11 秒。图片内容未修改。来源文件、视频帧索引和校验值记录于 `scripts/evidence-cases.json`。
- 1 fps 是网页历史回放的展示采样率。原始证据元数据 `figures/source/evidence_use_single_column_v8/assets/evidence/original_evidence_metadata.json` 确认 ReKV 实际采样时间为 0、2、4、6、8、10、12、14 秒，8/8 候选帧均返回。网页的答题证据区只展示其中与问题相关的 0、2、4 秒原帧，明确标为相关返回帧，没有把历史胶片误标为模型全部检索帧。旧版网页使用的 Figure 4 内 1–8 秒示意条不再用作“全部模型采样帧”的展示。
- OneStreamer 展示元数据中最终 QA 文本记忆的两段原句，保留论文引用的生成时间区间 2–7 秒、7–10 秒；只显示论文讨论的 A 分支，答案为 hairbrush，正确答案为 spray bottle。

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

当前 AIR 示例来自 VidPair-Halluc，其公开再分发条款在研究仓库的 `OUR_Benchmark/THIRD_PARTY_NOTICES.md` 中仍为未明确；公开展示时应确认该素材或替换该案例。

## GitHub Pages

此目录对应独立公开仓库 [Yh1zzzzzzz/twinpast](https://github.com/Yh1zzzzzzz/twinpast)，项目网址为 <https://yh1zzzzzzz.github.io/twinpast/>。

GitHub 仓库 Settings → Pages 已选择 GitHub Actions。向 `main` 推送后，`.github/workflows/pages.yml` 先检查浏览器脚本语法，再自动部署 `dist/`，无需构建步骤。项目子路径 `/twinpast/` 受支持。仅在用户审核并明确同意发布后，才提交并推送到 main；发布结果可在仓库 Actions 页面查看。

若合并到已有 `用户名.github.io` 仓库，将 `dist/` 的内容放到该仓库 `twinpast/` 子目录，并使用已有站点的发布流程。不要将整个研究仓库或原始700视频上传到网站仓库。

视频若改放对象存储，只需修改 `dist/cases.js` 的 `video_a/video_b/video_a_webm/video_b_webm` 地址。服务器需提供正确的 MIME 类型并支持字节范围请求。

Sites 私有预览的身份文件是 `.openai/hosting.json`；GitHub Pages 不依赖它。没有发布到 GitHub 时，不应将私有预览地址当作正式项目网址。
