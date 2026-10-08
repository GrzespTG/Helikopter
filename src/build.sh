#!/bin/bash
cd "$(dirname "$0")"
{ cat part1.html; echo; cat assets.js audio.js part2.js part2b.js part3.js part4.js; echo '</script></body></html>'; } > ../index.html
