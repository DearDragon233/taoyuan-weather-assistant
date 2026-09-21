# -*- coding: utf-8 -*-
"""本地预览服务器：带 no-cache 头，避免浏览器启发式缓存干扰调试。用法：python tools/devserver.py [端口]"""
import http.server, sys

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8933
http.server.ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
