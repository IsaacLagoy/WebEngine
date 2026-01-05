#!/usr/bin/env node

/**
 * Script to add "o Cube" header before every section of vertices in glue_gun.obj
 * A vertex section starts when we encounter a vertex line after a non-vertex line
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'public/models/glue_gun.obj');
const outputFile = path.join(__dirname, 'public/models/glue_gun.obj');

// Read the file
const lines = fs.readFileSync(inputFile, 'utf8').split('\n');

const output = [];
let inVertexSection = false;
let lastWasVertex = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const isVertex = line.trim().startsWith('v ');
  
  // If we encounter a vertex line
  if (isVertex) {
    // If the previous line was NOT a vertex, we're starting a new vertex section
    if (!lastWasVertex && !inVertexSection) {
      output.push('o Cube');
      inVertexSection = true;
    }
    lastWasVertex = true;
  } else {
    // We're no longer in a vertex section
    if (lastWasVertex) {
      inVertexSection = false;
    }
    lastWasVertex = false;
  }
  
  output.push(line);
}

// Write the output
fs.writeFileSync(outputFile, output.join('\n'), 'utf8');

console.log(`Processed ${lines.length} lines`);
console.log(`Added "o Cube" headers before vertex sections`);
console.log(`Output written to: ${outputFile}`);


