#!/usr/bin/env node

// Generates PNG icons for the Chrome extension
// Run: node scripts/generate-icons.js
// Requires: npm install canvas

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 48, 128];
const outputDir = path.join(__dirname, '..', 'extension', 'icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function drawIcon(ctx, size) {
  const padding = size * 0.1;
  const center = size / 2;

  // Background - rounded square with gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1c1917');
  gradient.addColorStop(1, '#292524');

  ctx.fillStyle = gradient;
  const radius = size * 0.2;
  roundedRect(ctx, 0, 0, size, size, radius);
  ctx.fill();

  // Draw bridge/arrow icon
  ctx.strokeStyle = '#f5f5f4';
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const iconPadding = size * 0.25;
  const iconSize = size - iconPadding * 2;

  // Arrow pointing up-right (export symbol)
  const startX = iconPadding;
  const startY = size - iconPadding;
  const endX = size - iconPadding;
  const endY = iconPadding;

  // Main arrow line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Arrow head
  const headSize = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(endX - headSize, endY);
  ctx.lineTo(endX, endY);
  ctx.lineTo(endX, endY + headSize);
  ctx.stroke();

  // Small terminal prompt at bottom left
  ctx.strokeStyle = '#c2410c';
  ctx.lineWidth = size * 0.06;
  const promptX = iconPadding;
  const promptY = size - iconPadding - size * 0.15;
  ctx.beginPath();
  ctx.moveTo(promptX, promptY);
  ctx.lineTo(promptX + size * 0.12, promptY - size * 0.08);
  ctx.lineTo(promptX, promptY - size * 0.16);
  ctx.stroke();
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

console.log('Generating extension icons...');

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  drawIcon(ctx, size);

  const outputPath = path.join(outputDir, `icon${size}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  console.log(`  Created: icon${size}.png`);
}

console.log('Done!');
