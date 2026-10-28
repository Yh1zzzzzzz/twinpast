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
- 首屏用大幅小船案例呈现历史证据变化，可切换为两支相同的最近画面。
- 放大正文，主线为配对设计、视频案例、关键结果；论文细节按需展开。
- 展开构造与评分说明，可操作重复答案、正确区分和完全反转三种示例。
- 保留指定的 8 对展示视频与原问题、选项、答案。
- 结果对齐提供的论文正文 Table 2：34 个配置 + 2 个人工参考；展开完整结果后可筛选、排序、下载 CSV。
- 审计动机、输入条件对照、保留证据但使用错误的案例也已对齐论文。

文件说明
- dist/：可独立运行、修改和部署的完整静态网站。
- dist/project.css、dist/project.js：论文项目页的新布局与交互。
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
