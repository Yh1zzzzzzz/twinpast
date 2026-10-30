# TwinPast project page

英文静态展示页，输出目录为 `dist/`。无需安装前端依赖，无账号、数据库或后端。作者、论文、代码及数据集公开链接尚未提供，页面保留 forthcoming 状态，不生成虚假地址或引用。

页面按“配对设计 → 视频案例 → 关键结果”组织。首屏使用大幅历史画面对照，正文以 18–21px 为主；构造与评分说明、审计动机、完整表格和错误分析按需展开。结果表默认显示流式系统，可切换到全部 36 行。所有论文数据和指定案例均保留。

## 预览

在本目录执行 `npm run dev`，打开终端打印的地址。默认端口 4173；可用 `npm run dev -- --port 8080` 修改。开发服务器支持视频分段请求与拖动进度。

`npm run check` 检查浏览器脚本的语法。`dist/index.html` 也可以直接打开，全部资源使用相对路径。

`python3 scripts/package_mac.py` 生成完整的 `twinpast-mac.zip`，包含双击打开入口和 Mac 使用说明。视频直接复用，不重新编码；不包含 Git 历史、托管身份、论文草稿或研究仓库。

## 内容来源与更新

- `scripts/selection.json`：页面明确选用的 8 对案例、封面时间、历史证据跳转点及共享后缀边界来源。AIR 保留 `pilot_r2_00048`；HSR 为 `pilot_r3_00073`、`pilot_b07_00023`；EOR 为 `pilot_b08_00042`、`pilot_b06_00056`、`pilot_00004`；HAC 为 `pilot_00001`；MEI 为 `pilot_b08_00091`。
- `dist/cases.js`：由选择配置及当前 release350 的原问题、选项、答案生成。HSR、EOR 支持类内示例切换，切换时重置播放与答案显示，返回类别时记住上次所选示例。页面示例不代表独立测试子集。
- `scripts/results-paper.json` 是网站的结果来源，已对齐用户提供的 `main.pdf`（2026-10-28，第 7 页 Table 2）：34 个模型／输入配置和 2 个人工参考，共 36 行。`npm run export-results` 将其导出为 `dist/results.js` 与 `dist/assets/results.csv`。本地研究仓库 TeX 仍保留旧表号及 Flash-VStream 两行，因此不再自动读取它覆盖网站；后续论文更新时先审阅并更新该 JSON。
- `dist/assets/media/`：保留完整时长与源帧率的展示副本，宽度最多 960 像素且不放大，提供 H.264 MP4 和 VP9 WebM。无音轨，未裁切视频，原始评测媒体未修改。封面来自已选历史原帧与共享后缀原帧；关键证据跳转从相关过程开始前进入，不以封面时间代替。AIR 复用原展示文件。
- `scripts/prepare_media.py`：按同目录的 `selection.json` 从研究仓库生成素材，需要 ffmpeg、ffprobe；日常修改页面不需要运行。示例：`python3 scripts/prepare_media.py --repo-root ../.. --reuse-dir dist --output /tmp/twinpast-web-assets-v2`。默认最多两路编码，每路两线程。输出后将素材复制到 `dist/assets/media/`，将 cases.json 包装为 `window.TWINPAST_CASES = ...;` 保存到 `dist/cases.js`。仅复制完成的文件，勿复制编码中的 `.part.mp4` / `.part.webm`；移除不再使用的旧展示副本，保留 AIR 文件供首屏使用。
- `dist/project.css` 与 `dist/project.js`：论文项目页的首屏证据切换、配对评分示意、输入条件对照和诊断案例。首屏使用 `pilot_r3_00073` 小船案例；虚线框仅提示问题相关区域，不是编辑掩码或像素相等性证明。评分演示明确标为示意，不当作实测结果。
- 内容依据是用户提供的 `main.pdf`：构造原则见 §4.2（历史中无关内容尽可能匹配，共享最近帧严格相同）；两类审计动机见 §3；结果见 Tables 1–2；保留证据但用错时间／顺序的案例及多事实失败见 §6，计数与多事件任务 PairAcc 见 Figure 3；范围限制见 §7。不会将“尽可能匹配”写成所有历史无关像素完全相同，也不声称排除所有捷径。
- “32%”仅描述论文额外抽查的 400 道历史任务题；网页避免将其扩展为两个基准的总体比例。PairAcc 与 Acc 分开呈现，不把不同基准的不同指标混为同一排行榜。
- 人工流式参考保留既有评测协议中的 105 对样本、校准权重外推和既往数据接触说明；这些细节不声称来自所附正文 PDF。表格的六组条件保持独立，排序也仅在组内进行。

作者及正式论文、代码和数据集链接尚待补充。当前 AIR 示例来自 VidPair-Halluc，其公开再分发条款在研究仓库的 `OUR_Benchmark/THIRD_PARTY_NOTICES.md` 中仍为未明确；公开展示时应确认该素材或替换该案例。

## GitHub Pages

此目录对应独立公开仓库 [Yh1zzzzzzz/twinpast](https://github.com/Yh1zzzzzzz/twinpast)，项目网址为 <https://yh1zzzzzzz.github.io/twinpast/>。

GitHub 仓库 Settings → Pages 已选择 GitHub Actions。向 `main` 推送后，`.github/workflows/pages.yml` 先检查浏览器脚本语法，再自动部署 `dist/`，无需构建步骤。项目子路径 `/twinpast/` 受支持。后续在本目录修改文件并提交、推送即可更新网站，发布结果可在仓库 Actions 页面查看。

若合并到已有 `用户名.github.io` 仓库，将 `dist/` 的内容放到该仓库 `twinpast/` 子目录，并使用已有站点的发布流程。不要将整个研究仓库或原始700视频上传到网站仓库。

视频若改放对象存储，只需修改 `dist/cases.js` 的 `video_a/video_b/video_a_webm/video_b_webm` 地址。服务器需提供正确的 MIME 类型并支持字节范围请求。

Sites 私有预览的身份文件是 `.openai/hosting.json`；GitHub Pages 不依赖它。没有发布到 GitHub 时，不应将私有预览地址当作正式项目网址。
