# frozen_string_literal: true

source "https://rubygems.org"

gemspec

# Pin Jekyll to the version GitHub Pages runs (3.10). This keeps the build on the
# pure-Ruby `sass` converter and avoids `jekyll-sass-converter 3.x` → `sass-embedded`,
# whose native extension currently fails to compile on CI runners
# (NameError: uninitialized constant JSON::Fragment).
gem "jekyll", "~> 3.10"
