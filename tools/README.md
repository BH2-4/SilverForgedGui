# tools — GLB 压缩管线

`compress-glb.sh`：把 Meshy 导出的全量 GLB 压成可上线档位（贴图 WebP 化 + gltfpack 简化/压缩），产物直接落 `public/models/`。

## 依赖

- `cwebp`、`magick`（ImageMagick）、`node`（brew 安装即可）
- gltfpack 用**项目内** `node_modules/gltfpack`（WASM 版，只压几何不编码贴图，贴图由脚本内联 node 程序解包→cwebp→回写 GLB）
- 运行时：three 0.185 + drei `useGLTF(url, true, true)` 已支持产物的 `KHR_mesh_quantization` / `EXT_meshopt_compression` 扩展，无需额外配置

## 3 步接入新模型

```bash
# 1. 把源 GLB 放到素材目录（路径含中文时记得加引号）
ls "~/Desktop/苗族银饰3D/"

# 2. 选档位跑管线（第 4 个参数可选，覆盖简化率 si）
tools/compress-glb.sh "~/Desktop/苗族银饰3D/Meshy_AI_xxx_texture.glb" hero hero-xxx 0.03

# 3. 在组件里引用（hero 环绕层加进 ScrollScene.tsx 的 HERO_ORBIT 即可）
useGLTF("/models/hero-xxx.glb", true, true)
```

脚本自动完成：贴图解包 → 按档缩放 → cwebp → 回写 GLB → gltfpack 简化压缩 → 产物校验（GLB 魔数 / meshopt+量化扩展 / 体积面数报告）→ 落位 `public/models/<名字>.glb`。校验不过不会落位。

## 档位

| 档位 | 贴图 | 几何 | 用途 | 预算 |
|------|------|------|------|------|
| `detail` | baseColor/normal 2048 q85, metalRough 1024 q75 | `-cc -si 0.12`（默认），保留 TANGENT | 详情页全量档 | ~2.5-3MB/只 |
| `hero` | 全部 512（q55-62 低档） | `-cc -si 0.05`（默认）+ `-vp 12 -vt 12 -vn 6`，剥 TANGENT（three 由屏幕空间导数重建切线，省 ~15% 几何体积） | 首屏环绕档 | **<400KB/只**，首屏环绕层合计 <1.5MB |

### si 覆盖建议（hero 档）

源模型 160-200 万三角形时，`-si 0.05` 几何约 570KB，会超 400KB 预算；实测按**目标 ~4.8-5 万面**反推 si 最稳：

| 源模型面数 | 建议 si | 实测产物 |
|-----------|---------|---------|
| ~160 万 | 0.030 | hero-tribal.glb 324KB / 48,290 面 |
| ~180 万 | 0.027 | hero-crescent.glb 372KB / 48,960 面 |
| ~200 万 | 0.025 | hero-spirals.glb 316KB / 49,954 面 |

## 当前产物对照

| 文件 | 档位 | 体积 | 面数 | 引用处 |
|------|------|------|------|--------|
| tribal-ornament / spirals-infinity / engraved-dragon / crescent-headdress / blossom-headdress | detail | 2.9-3.9MB | ~24 万 | 详情页 ProductViewer |
| hero-tribal / hero-spirals / hero-crescent | hero | 316-372KB（合计 1.01MB） | ~4.9 万 | ScrollScene 环绕层 |
| collar-meshopt | （无贴图源直压） | 175KB | 60,564 | 主角项圈 + 环绕层复用（零新增下载） |

## 常见问题

- **校验报"缺少扩展"**：说明 gltfpack 没带 `-cc`，产物未压缩，检查脚本第 2 步输出。
- **hero 超预算**：优先降 si（面数是体积大头），再降贴图 q；不要动 `-vp/-vt/-vn`（再低会出现贴图采样跳动）。
- **产物在 three 里报法线/切线警告**：hero 档剥了 TANGENT 属预期，three 会走屏幕空间导数路径；若新模型 normal map 依赖切线出现视觉异常，改用 detail 档（保留 TANGENT）。
