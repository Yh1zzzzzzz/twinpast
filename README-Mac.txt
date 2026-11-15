TwinPast — Mac 本地使用说明

1. 下载 twinpast-mac.zip 并双击解压。
2. 进入 TwinPast-website，双击 Open Website.command。
   也可以直接在 Safari 或 Chrome 中打开 dist/index.html。
   直接打开无需安装 Node.js、Python 或前端依赖，也不需要连接原服务器。

可选：在 Mac 的 localhost 上预览
如果 Mac 已安装 Node.js，在这个文件夹中打开终端，执行：
    npm run dev
然后在浏览器打开 http://localhost:4173。
终端窗口保持打开；结束预览按 Control+C。
若端口被占用，可执行 npm run dev -- --port 8080，访问对应端口。

页面内容
- 首屏：论文标题、Paper/Code/Dataset/BibTeX 链接、一句话概括，以及用舞者案例画出的配对设计图。
- 三点摘要（问题、基准、发现）和可展开的论文摘要。
- 正文四节：无历史也能答对、TwinPast 设计与 8 对视频案例、结果（配对结果图、分任务图、遮挡实验、完整表格）、证据仍在却答错的两个案例。
- 结果对齐论文 Table 2：34 个配置 + 2 个人工参考，可下载 CSV。

文件说明
- dist/：可独立运行、修改和部署的完整静态网站。
- dist/index.html、dist/site.css、dist/site.js：页面结构、样式与交互（播放器、图表、表格）。
- dist/cases.js：视频案例及问答；dist/assets/media/ 包含所有视频与封面。
- dist/results.js、dist/assets/results.csv：论文 Table 2 的展示数据。
- scripts/results-paper.json：与提供的论文核对过的结果数据来源。
- scripts/export_results.py：从随包 JSON 导出结果，无需原服务器或研究仓库。
- scripts/serve.mjs、package.json：可选的本地预览服务器。
- scripts/package_mac.py：重新生成此迁移包。
- .github/workflows/pages.yml：以后发布到 GitHub Pages 可使用的配置。
- scripts/prepare_media.py：可选的素材再生成工具，运行它才需要原研究仓库及 ffmpeg；浏览和部署不需要运行。

修改后刷新浏览器即可。请保持 dist/ 内资源的相对位置不变。
作者、论文、代码与数据集正式公开链接仍待补充。
