---
title: "I'm Stuck \u2014 What Now?"
category: checklists
order: 90
description: "General recovery checklist for when you are stuck."
tags: [methodology]
---

## 1. General tips when stuck

### general tips

Use writeups to get inspiration on how to proceed.

{% raw %}
```bash
# 1. check writeups for similar applications/ machines
https://ippsec.rocks
https://0xdf.gitlab.io/search

# 2. if an exploit does not work, look for another, e.g. online (search by CVE if possible)
# A: "CVE-XXXX-XXXX" PoC site:github.com,
# B: "CVE-XXXX-XXXX" Proof of concept site:github.com
# C: "CVE-XXXX-XXXX" exploit site:github.com
```
{% endraw %}

## 2. st*ck per protocol

### protocol: http(s)

{% raw %}
```bash
# 1. check if the service is running http and https on the same port
...

# 2. [LFI REQUIRED] - Check default users for the application(s) (no assumptions), then test SSH key paths for each discovered user via LFI
# PG-box = "DRV4" (user 'viewer' seemed like a app-only account, but had a home directory and an SSH key)
/home/<FOUND_USER>/.ssh/id_rsa
/users/<FOUND_USER>/.ssh/id_rsa
```
{% endraw %}
