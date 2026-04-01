#!/bin/bash
# Regenerate people.js from people.json
printf 'window.PEOPLE_DATA = ' > people.js && cat people.json >> people.js && printf ';' >> people.js
echo "people.js updated."
