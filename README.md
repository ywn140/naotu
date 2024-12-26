# 智能思维导图生成器

[![Deploy to GitHub Pages](https://github.com/ywn140/naotu/actions/workflows/deploy.yml/badge.svg)](https://github.com/ywn140/naotu/actions/workflows/deploy.yml)

一个基于自然语言处理的智能思维导图生成工具，可以自动分析文本并生成结构化的思维导图。

## 特性

- 🧠 智能分析：自动识别文本中的关键概念和关系
- 🎨 美观呈现：使用 G6 图可视化库，生成美观的思维导图
- 📱 响应式设计：支持各种设备的屏幕尺寸
- 🚀 实时生成：输入文本后即时生成思维导图

## 功能特点

- 自动识别文本中的主要主题和子主题
- 智能提取关键信息点和层级关系
- 支持多达四个层级的节点展示
- 自动识别行动项、结果、评价标准和相关概念
- 美观的可视化展示效果
- 支持画布拖拽和缩放

## 使用方法

1. 访问 [https://ywn140.github.io/naotu/](https://ywn140.github.io/naotu/)
2. 在文本输入框中输入或粘贴你想要分析的文本
3. 点击"生成思维导图"按钮
4. 查看生成的思维导图

## 开发中的功能

- [ ] 保存思维导图
- [ ] 导出为图片
- [ ] 主题切换
- [ ] 移动端优化
- [ ] 历史记录

## 在线使用

访问 [https://[你的GitHub用户名].github.io/naotu](https://[你的GitHub用户名].github.io/naotu) 即可在线使用。

## 本地运行

1. 克隆项目：
```bash
git clone https://github.com/[你的GitHub用户名]/naotu.git
```

2. 进入项目目录：
```bash
cd naotu
```

3. 使用任意 HTTP 服务器运行，例如：
```bash
python -m http.server 8000
```

4. 在浏览器中访问 `http://localhost:8000`

## 技术栈

- 前端框架：原生 JavaScript
- 可视化库：AntV G6
- 文本分析：自定义算法

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
