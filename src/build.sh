#!/bin/bash
cd "$(dirname "$0")"
{ cat part1.html part2.js part3.js part4.js; echo '</script></body></html>'; } > ../index.html
