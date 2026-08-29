#!/usr/bin/env bash
# compress-glb.sh — 苗族银饰 GLB 压缩管线（贴图 WebP 化 + gltfpack 几何简化/压缩）
#
# 用法:
#   tools/compress-glb.sh <源.glb> <detail|hero> <输出名> [si覆盖值]
#   例: tools/compress-glb.sh "~/Desktop/苗族银饰3D/Meshy_xxx_texture.glb" hero hero-tribal 0.03
#   产物: public/models/<输出名>.glb
#
# 档位:
#   detail  贴图 baseColor/normal 2048(q85) + metalRough 1024(q75), 保留 TANGENT,
#           gltfpack -cc -si 0.12        (详情页全量档, ~240K 面 / 2.9MB)
#   hero    贴图全部 512(q55-62 低档), 剥 TANGENT(three 由屏幕空间导数重建),
#           gltfpack -cc -si 0.05 -vp 12 -vt 12 -vn 6   (首屏环绕档, 目标 <400KB/只)
#
# 依赖: cwebp / magick / node; gltfpack 用项目内 node_modules(gltfpack WASM 版
#       不支持贴图编码, 故贴图由本脚本内联 node 脚本解包→cwebp→回写)。
set -euo pipefail

# ---------- 参数与依赖 ----------
SRC="${1:?用法: compress-glb.sh <源.glb> <detail|hero> <输出名> [si]}"
TIER="${2:?档位必须是 detail 或 hero}"
NAME="${3:?输出名不能为空, 例: hero-tribal}"
SI="${4:-}"

case "$TIER" in
  detail) SI="${SI:-0.12}" ;;
  hero)   SI="${SI:-0.05}" ;;
  *) echo "错误: 未知档位 '$TIER'(只能是 detail|hero)" >&2; exit 1 ;;
esac

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GLTFPACK="$ROOT/node_modules/gltfpack/cli.js"
OUT_DIR="$ROOT/public/models"
OUT="$OUT_DIR/$NAME.glb"

for dep in cwebp magick node; do
  command -v "$dep" >/dev/null || { echo "错误: 缺少依赖 $dep" >&2; exit 1; }
done
[ -f "$GLTFPACK" ] || { echo "错误: 找不到项目内 gltfpack ($GLTFPACK)" >&2; exit 1; }
[ -f "$SRC" ] || { echo "错误: 源文件不存在: $SRC" >&2; exit 1; }
mkdir -p "$OUT_DIR"

WORK="$(mktemp -d /tmp/compress-glb.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT

echo "==> 档位=$TIER si=$SI"
echo "==> 源: $SRC"

# ---------- 第 1 步: 贴图解包 → (按档缩放) → cwebp → 回写 GLB ----------
cat > "$WORK/repack.js" <<'EOF'
// 贴图换装: 解包 GLB 内贴图 → 按档位缩放+webp 压缩 → 回写 GLB; hero 档同时剥 TANGENT
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [input, output, tier] = process.argv.slice(2);

const PLAN = {
  detail: {
    roles: { baseColor: { size: 2048, q: 85 }, normal: { size: 2048, q: 85 }, metalRough: { size: 1024, q: 75 } },
    stripTangent: false,
  },
  hero: {
    roles: { baseColor: { size: 512, q: 62 }, normal: { size: 512, q: 58 }, metalRough: { size: 512, q: 55 } },
    stripTangent: true,
  },
}[tier];
if (!PLAN) throw new Error(`未知档位: ${tier}`);

// ---- 解析 GLB(JSON chunk + BIN chunk) ----
const buf = fs.readFileSync(input);
if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('不是 GLB 文件');
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
let bin = null, binOff = 20 + jsonLen + ((4 - (jsonLen % 4)) % 4);
if (buf.length > binOff + 8 && buf.readUInt32LE(binOff + 4) === 0x004e4942) {
  bin = buf.slice(binOff + 8, binOff + 8 + buf.readUInt32LE(binOff));
}
if (!bin) throw new Error('GLB 无 BIN 块');

// ---- 由材质推导每张 image 的角色(baseColor/metalRough/normal, 其余原样保留) ----
const roleOf = {};
for (const m of json.materials || []) {
  const tag = (tex, role) => {
    if (tex !== undefined) roleOf[json.textures[tex.index].source] = role;
  };
  tag(m.pbrMetallicRoughness && m.pbrMetallicRoughness.baseColorTexture, 'baseColor');
  tag(m.pbrMetallicRoughness && m.pbrMetallicRoughness.metallicRoughnessTexture, 'metalRough');
  tag(m.normalTexture, 'normal');
}

// ---- 读图片实际分辨率(png/jpeg/webp 头解析) ----
function dims(b, mime) {
  if (mime.includes('png') && b.length > 24 && b.readUInt32BE(12) === 0x49484452)
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (mime.includes('jpeg')) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const mk = b[i + 1];
      if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc)
        return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

// ---- 逐张转码(未知角色原样保留; 只缩不放) ----
const keepBytes = []; // 与 json.images 同序: Buffer=新 webp | null=原样保留
for (let i = 0; i < json.images.length; i++) {
  const img = json.images[i];
  const bv = json.bufferViews[img.bufferView];
  const raw = bin.slice(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
  const role = roleOf[i];
  const plan = role && PLAN.roles[role];
  if (!plan) { keepBytes.push(null); console.log(`  image${i} 角色未知(${role || '未引用'}) → 原样保留 ${(raw.length / 1024).toFixed(0)}KB`); continue; }

  const ext = img.mimeType === 'image/png' ? 'png' : 'jpg';
  const srcPath = path.join(process.env.WORK_DIR, `img${i}.${ext}`);
  fs.writeFileSync(srcPath, raw);

  let feed = srcPath;
  const d = dims(raw, img.mimeType || '');
  const needResize = d && Math.max(d.w, d.h) > plan.size;
  if (needResize) {
    const mid = path.join(process.env.WORK_DIR, `img${i}_r.png`);
    execFileSync('magick', [srcPath, '-resize', `${plan.size}x${plan.size}`, mid], { stdio: ['ignore', 'ignore', 'inherit'] });
    feed = mid;
  }
  const webpPath = path.join(process.env.WORK_DIR, `img${i}.webp`);
  execFileSync('cwebp', ['-quiet', '-q', String(plan.q), feed, '-o', webpPath], { stdio: ['ignore', 'ignore', 'inherit'] });
  keepBytes.push(fs.readFileSync(webpPath));
  console.log(`  image${i} ${role}: ${d ? d.w + 'x' + d.h : '?'} ${(raw.length / 1024).toFixed(0)}KB → webp ${plan.size}px q${plan.q} ${(keepBytes[i].length / 1024).toFixed(0)}KB`);
}

// ---- hero 档: 剥 TANGENT 属性(省 ~15% 几何体积; three 用屏幕空间导数重建切线) ----
if (PLAN.stripTangent) {
  for (const m of json.meshes || []) for (const p of m.primitives || []) delete p.attributes.TANGENT;
}

// ---- 回写: 新 webp 追加到 BIN 尾部, 重定向 bufferView(旧字节成孤儿, 由 gltfpack 重建时丢弃) ----
const parts = [bin];
let cursor = bin.length;
for (let i = 0; i < json.images.length; i++) {
  if (!keepBytes[i]) continue;
  const pad = (4 - (cursor % 4)) % 4;
  if (pad) { parts.push(Buffer.alloc(pad)); cursor += pad; }
  parts.push(keepBytes[i]);
  const bvIdx = json.images[i].bufferView;
  json.bufferViews[bvIdx] = { buffer: 0, byteOffset: cursor, byteLength: keepBytes[i].length };
  json.images[i].mimeType = 'image/webp';
  cursor += keepBytes[i].length;
}
if (cursor % 4) { parts.push(Buffer.alloc(4 - (cursor % 4))); cursor += 4 - (cursor % 4); }
const newBin = Buffer.concat(parts);
json.buffers[0].byteLength = newBin.length;

let jsonBuf = Buffer.from(JSON.stringify(json));
if (jsonBuf.length % 4) jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc((4 - (jsonBuf.length % 4)) % 4, 0x20)]);
const total = 12 + 8 + jsonBuf.length + 8 + newBin.length;
const out = Buffer.alloc(total);
out.writeUInt32LE(0x46546c67, 0);
out.writeUInt32LE(2, 4);
out.writeUInt32LE(total, 8);
out.writeUInt32LE(jsonBuf.length, 12);
out.writeUInt32LE(0x4e4f534a, 16);
jsonBuf.copy(out, 20);
out.writeUInt32LE(newBin.length, 20 + jsonBuf.length);
out.writeUInt32LE(0x004e4942, 24 + jsonBuf.length);
newBin.copy(out, 28 + jsonBuf.length);
fs.writeFileSync(output, out);
console.log(`  贴图回写完成: ${(total / 1024).toFixed(0)}KB (待 gltfpack 重建丢弃孤儿字节)`);
EOF

export WORK_DIR="$WORK"
node "$WORK/repack.js" "$SRC" "$WORK/repacked.glb" "$TIER"

# ---------- 第 2 步: gltfpack 几何简化 + meshopt 压缩 ----------
EXTRA_FLAGS=""
[ "$TIER" = "hero" ] && EXTRA_FLAGS="-vp 12 -vt 12 -vn 6"
echo "==> gltfpack -cc -si $SI $EXTRA_FLAGS"
node "$GLTFPACK" -cc -si "$SI" $EXTRA_FLAGS -i "$WORK/repacked.glb" -o "$WORK/out.glb"

# ---------- 第 3 步: 产物校验(魔数/体积/扩展/关键扩展) + 落位 ----------
cat > "$WORK/verify.js" <<'EOF'
// 产物校验: GLB 魔数 / meshopt+quantization 扩展 / 体积与面数报告
const fs = require('fs');
const [f, tier] = process.argv.slice(2);
const buf = fs.readFileSync(f);
if (buf.readUInt32LE(0) !== 0x46546c67) { console.error('校验失败: 不是合法 GLB(魔数不符)'); process.exit(1); }
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
const exts = json.extensionsUsed || [];
for (const need of ['KHR_mesh_quantization', 'EXT_meshopt_compression']) {
  if (!exts.includes(need)) { console.error(`校验失败: 缺少扩展 ${need}`); process.exit(1); }
}
let tris = 0;
for (const m of json.meshes || []) for (const p of m.primitives || []) {
  tris += p.indices != null ? json.accessors[p.indices].count / 3 : json.accessors[p.attributes.POSITION].count / 3;
}
let tex = 0;
for (const im of json.images || []) tex += json.bufferViews[im.bufferView].byteLength;
const kb = buf.length / 1024;
const budget = tier === 'hero' ? 400 : 4096;
const verdict = kb <= budget ? '✓ 预算内' : `⚠ 超出${tier}档预算(${budget}KB)`;
console.log(`校验通过: ${(kb / 1024).toFixed(2)}MB | 几何${((buf.length - tex) / 1024).toFixed(0)}KB + 贴图${(tex / 1024).toFixed(0)}KB | ${Math.round(tris).toLocaleString()} 三角形 | ${verdict}`);
EOF

if ! node "$WORK/verify.js" "$WORK/out.glb" "$TIER"; then
  echo "错误: 产物校验未通过, 不落位" >&2
  exit 1
fi
mv "$WORK/out.glb" "$OUT"
echo "==> 完成: $OUT ($(du -h "$OUT" | cut -f1))"
