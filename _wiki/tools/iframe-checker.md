---
title: Iframe / Clickjacking Checker
category: tools
order: 40
description: "Load a URL in an iframe to check whether it can be framed (clickjacking exposure)."
tags: [clickjacking, web, utility]
tool: true
tool_script: iframe-checker
tool_libs: []
---

Test whether a page can be embedded in an `<iframe>`. A page that refuses to render is protected by `X-Frame-Options` or a `frame-ancestors` Content-Security-Policy; a page that renders may be vulnerable to clickjacking.

<div id="tool-root"></div>
