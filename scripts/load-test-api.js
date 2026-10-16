#!/usr/bin/env node
/**
 * scripts/load-test-api.js
 *
 * REST API concurrency & latency benchmark tool.
 * Sends parallel batches of requests against health and public endpoints
 * to calculate requests/sec, p50, p95, p99 latency distributions.
 *
 * Usage:
 *   node scripts/load-test-api.js --requests 100 --concurrency 10
 */

const http = require("http");
const https = require("https");
const { URL } = require("url");

const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return Number(args[index + 1]);
  }
  return defaultValue;
}

const TOTAL_REQUESTS = getArg("--requests", 100);
const CONCURRENCY = getArg("--concurrency", 10);
const TARGET_PATH = process.env.TARGET_PATH || "/api/v1/health";
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const targetUrl = new URL(TARGET_PATH, BASE_URL);

console.log(`=======================================================`);
console.log(`⚡ InterviewOS REST API Concurrency Benchmark`);
console.log(`=======================================================`);
console.log(`Target:       ${targetUrl.href}`);
console.log(`Requests:     ${TOTAL_REQUESTS}`);
console.log(`Concurrency:  ${CONCURRENCY}`);
console.log(`-------------------------------------------------------\n`);

const client = targetUrl.protocol === "https:" ? https : http;
const latencies = [];
let completed = 0;
let successful = 0;
let failed = 0;

function makeRequest() {
  return new Promise((resolve) => {
    const start = process.hrtime();
    const req = client.get(targetUrl, (res) => {
      res.on("data", () => {});
      res.on("end", () => {
        const diff = process.hrtime(start);
        const latencyMs = (diff[0] * 1e9 + diff[1]) / 1e6;
        latencies.push(latencyMs);
        completed++;
        if (res.statusCode >= 200 && res.statusCode < 400) {
          successful++;
        } else {
          failed++;
        }
        resolve();
      });
    });

    req.on("error", () => {
      failed++;
      completed++;
      resolve();
    });

    req.setTimeout(5000, () => {
      req.destroy();
      failed++;
      completed++;
      resolve();
    });
  });
}

async function runBenchmark() {
  const startTime = Date.now();
  let index = 0;

  async function worker() {
    while (index < TOTAL_REQUESTS) {
      index++;
      await makeRequest();
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.5)]?.toFixed(2) ?? 0;
  const p90 = latencies[Math.floor(latencies.length * 0.9)]?.toFixed(2) ?? 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)]?.toFixed(2) ?? 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)]?.toFixed(2) ?? 0;
  const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
  const rps = (completed / totalTimeSec).toFixed(2);

  console.log(`=======================================================`);
  console.log(`📈 API Benchmark Results`);
  console.log(`=======================================================`);
  console.log(`Total Requests:      ${completed}`);
  console.log(`Successful:          ${successful}`);
  console.log(`Failed / Errors:     ${failed}`);
  console.log(`Total Duration:      ${totalTimeSec.toFixed(2)}s`);
  console.log(`Throughput:          ${rps} req/sec`);
  console.log(`Latency (Avg):       ${avg} ms`);
  console.log(`Latency (p50):       ${p50} ms`);
  console.log(`Latency (p90):       ${p90} ms`);
  console.log(`Latency (p95):       ${p95} ms`);
  console.log(`Latency (p99):       ${p99} ms`);
  console.log(`=======================================================\n`);
}

runBenchmark();
