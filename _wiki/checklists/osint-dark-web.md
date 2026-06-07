---
title: "Dark Web OSINT Checklist"
category: checklists
order: 15
description: "Dark web OSINT reconnaissance checklist."
tags: [osint, darkweb]
---

## 1. Dark web OSINT

### ransomware - APTS

check if the target organization is mentioned on any ransomware leak sites.

{% raw %}
```bash
# 1. navigate to https://www.ransomware.live
...
                
# 2. search for the target organization
https://www.ransomware.live/search?q=odido&scope=all

# 3. click on the group, e.g. shinyhunters
...

# 4. check if there is any information about the target organization/ known locations
...
```
{% endraw %}
