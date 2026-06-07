---
layout: default
title: Wiki
description: A searchable pentest knowledge base — checklists, command cheatsheets, payloads, shells and interactive tools.
permalink: /wiki/
search_hidden: true
nav_hidden: true
---

<article class="wiki-page wiki-landing">
  <header class="wiki-header">
    <h1 class="wiki-title">🛡️ Pentest Wiki</h1>
    <p class="wiki-desc">A searchable knowledge base of checklists, command cheatsheets, exploit payloads, shells, curated resources and interactive tools. Use the search box in the sidebar, or browse by category below.</p>
  </header>

  <div class="wiki-cards">
    {% for cat in site.wiki_categories %}
      {% assign cat_pages = site.wiki | where: "category", cat.key | where_exp: "p", "p.nav_hidden != true" | sort: "order" %}
      {% if cat_pages.size > 0 %}
        <section class="wiki-card">
          <h2 class="wiki-card-title"><span class="wiki-card-icon">{{ cat.icon }}</span> {{ cat.title }}</h2>
          <ul class="wiki-card-list">
            {% for p in cat_pages %}
              <li><a href="{{ p.url | relative_url }}">{{ p.title }}</a></li>
            {% endfor %}
          </ul>
        </section>
      {% endif %}
    {% endfor %}
  </div>
</article>
