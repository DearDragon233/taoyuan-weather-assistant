# -*- coding: utf-8 -*-
"""生成 PWA 图标：沿用页面 logo（绿圆角方块 + 浅绿桃 + 白叶）。用法：python tools/make_icons.py"""
from PIL import Image, ImageDraw
import os, sys

GREEN = (4, 120, 87, 255)      # #047857
PEACH = (167, 243, 208, 255)   # #a7f3d0
WHITE = (255, 255, 255, 255)

def draw_logo(size, maskable=False):
    """maskable=True 时整体缩小到 78% 并铺满底色，留出安全边距"""
    img = Image.new("RGBA", (size, size), GREEN)
    d = ImageDraw.Draw(img)
    scale = 0.78 if maskable else 1.0
    cx = size / 2

    def s(v):  # 相对单位 -> 像素（以 26 为基准坐标系，同页面 logo 的 viewBox）
        return v * size / 26 * scale

    if not maskable:  # 普通图标才画圆角方块描边式底板（maskable 铺满即可）
        r = s(7)
        d.rounded_rectangle([s(1), s(1), s(25), s(25)], radius=r, fill=GREEN)

    # 桃子：主圆 + 顶部中缝一道底色细缝，形似桃
    pr = s(6.2)
    pc = cx, s(14.5) * (1 / scale) * scale  # 圆心 y≈14.5（基准坐标）
    pc = (cx, s(14.5) if not maskable else size * 0.56)
    d.ellipse([pc[0] - pr, pc[1] - pr, pc[0] + pr, pc[1] + pr], fill=PEACH)
    gap = s(0.45)
    d.line([pc[0], pc[1] - pr + s(0.8), pc[0], pc[1] - pr + s(2.6)], fill=GREEN, width=max(1, int(gap * 2)))

    # 叶子：右上角一枚斜椭圆
    lx, ly = cx + s(2.2), s(5.2)
    d.ellipse([lx - s(2.3), ly - s(1.1), lx + s(2.3), ly + s(1.1)], fill=WHITE)
    return img

out = os.path.join(os.path.dirname(__file__), "..", "icons")
os.makedirs(out, exist_ok=True)
for name, size, mask in [("icon-192.png", 192, False),
                         ("icon-512.png", 512, False),
                         ("icon-512-maskable.png", 512, True)]:
    p = os.path.join(out, name)
    draw_logo(size, mask).save(p)
    print("wrote", os.path.normpath(p))
