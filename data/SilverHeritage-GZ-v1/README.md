# SilverHeritage-GZ v1.0

贵州苗族银饰文化知识库（比赛 Demo / Source-first 版本）

## 这不是“AI编出来的苗族文化”
本版本以国家级非遗官方项目资料和国家级非遗代表性传承人官方资料为主要证据源。
每条知识都绑定 `source_ids`，并明确 `evidence_level`。

## 当前覆盖
- 雷山
- 台江
- 剑河
- 黄平
- 器物
- 地域风格
- 纹样题材
- 制作工艺
- 国家级代表性传承人
- Cultural Guardrail 规则

## 当前限制
1. 这不是完整的苗族银饰百科。
2. “纹样题材”不等于“文化寓意”。
3. 未核验授权的网页图片不进入训练/商业图片集。
4. AI现代设计建议必须和官方事实分离。
5. V1只适合比赛原型和RAG验证，不应宣称覆盖全部贵州苗族银饰文化。

## 推荐下一步
1. 把 `data/*.json` 接入你的 Next.js 项目。
2. 先做关键词/结构化检索，再上embedding。
3. 实现 Cultural Match：Global Design DNA × Heritage Knowledge。
4. 实现 Cultural Guardrail：来源、地域、寓意三重校验。
5. 后续通过贵州本地匠人/非遗中心补充授权图片、工艺过程和访谈数据。
