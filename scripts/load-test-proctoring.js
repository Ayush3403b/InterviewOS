#!/usr/bin/env node
/**
 * scripts/load-test-proctoring.js
 *
 * Load testing tool for InterviewOS proctoring WebSocket gateway.
 * Simulates N concurrent candidate connections streaming proctoring
 * telemetry packets (face, gaze, tab focus, audio levels) at configurable intervals.
 *
 * Usage:
 *   node scripts/load-test-proctoring.js --clients 20 --duration 10 --interval 2000
 */

const { io } = require("socket.io-client");

// Parse CLI args
const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return Number(args[index + 1]);
  }
  return defaultValue;
}

const NUM_CLIENTS = getArg("--clients", 10);
const DURATION_SECONDS = getArg("--duration", 10);
const SIGNAL_INTERVAL_MS = getArg("--interval", 2000);
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

console.log(`=======================================================`);
console.log(`🚀 InterviewOS Proctoring Socket Load Test`);
console.log(`=======================================================`);
console.log(`Target URL:        ${SERVER_URL}`);
console.log(`Concurrent Sockets: ${NUM_CLIENTS}`);
console.log(`Test Duration:     ${DURATION_SECONDS}s`);
console.log(`Signal Interval:   ${SIGNAL_INTERVAL_MS}ms`);
console.log(`-------------------------------------------------------\n`);

let connectedCount = 0;
let disconnectedCount = 0;
let signalsSent = 0;
let errorsCount = 0;
const latencies = [];

const clients = [];

for (let i = 0; i < NUM_CLIENTS; i++) {
  const sessionId = `sim_session_${i + 1}`;
  const candidateId = `sim_cand_${i + 1}`;

  const socket = io(SERVER_URL, {
    transports: ["websocket"],
    reconnection: false,
    timeout: 5000,
  });

  let intervalId = null;

  socket.on("connect", () => {
    connectedCount++;
    socket.emit("proctoring:join", {
      sessionId,
      candidateId,
      consentGiven: true,
    });

    intervalId = setInterval(() => {
      const sendTime = Date.now();
      signalsSent++;

      socket.emit("proctoring:signal", {
        sessionId,
        signalType: "GAZE_OFF_CENTER",
        payload: {
          faceDetected: true,
          multipleFaces: false,
          lookingAway: Math.random() > 0.8,
          noiseLevel: Math.random() * 0.4,
          timestamp: sendTime,
        },
      });

      latencies.push(Date.now() - sendTime);
    }, SIGNAL_INTERVAL_MS);
  });

  socket.on("connect_error", (err) => {
    errorsCount++;
  });

  socket.on("disconnect", () => {
    disconnectedCount++;
    if (intervalId) clearInterval(intervalId);
  });

  clients.push({ socket, getInterval: () => intervalId });
}

// Progress reporting
const start = Date.now();
const reportInterval = setInterval(() => {
  const elapsed = Math.floor((Date.now() - start) / 1000);
  console.log(
    `[T+${elapsed}s] Active: ${connectedCount - disconnectedCount}/${NUM_CLIENTS} | Signals: ${signalsSent} | Errors: ${errorsCount}`
  );
}, 2000);

// Tear down after duration
setTimeout(() => {
  clearInterval(reportInterval);
  for (const client of clients) {
    if (client.getInterval()) clearInterval(client.getInterval());
    client.socket.disconnect();
  }

  const avgLatency =
    latencies.length > 0
      ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2)
      : 0;

  console.log(`\n=======================================================`);
  console.log(`📊 Load Test Results`);
  console.log(`=======================================================`);
  console.log(`Total Connected:    ${connectedCount}`);
  console.log(`Total Disconnected: ${disconnectedCount}`);
  console.log(`Signals Streamed:   ${signalsSent}`);
  console.log(`Connection Errors:  ${errorsCount}`);
  console.log(`Avg Local Latency:  ${avgLatency} ms`);
  console.log(`Status:             ${errorsCount === 0 ? "PASSED (Healthy)" : "DEGRADED"}`);
  console.log(`=======================================================\n`);

  process.exit(0);
}, DURATION_SECONDS * 1000);
