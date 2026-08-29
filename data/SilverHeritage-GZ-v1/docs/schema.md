# SilverHeritage-GZ 数据字段说明

## 通用字段
- `id`: 稳定唯一ID
- `description` / `facts`: 对知识单元的来源型描述
- `source_ids`: 必填，指向 `sources.json`
- `evidence_level`: `official` 表示来自官方资料；未来可扩展 `interview`, `museum`, `academic`, `inference`
- `documented_meaning`: 只有来源明确给出文化寓意时才填写；当前多数为 null

## AI 使用原则
RAG返回时必须同时返回：
- knowledge text
- region
- source
- evidence level

禁止只返回一句“这个纹样代表爱情/新生/保护”而不返回证据。
