import { execFile } from "child_process";
import { Resolver } from "dns/promises";
import { promisify } from "util";
import { status } from "minecraft-server-util";
import { ServerStatusResponse } from "@/types/server-status";

const execFileAsync = promisify(execFile);
const srvResolver = new Resolver();
srvResolver.setServers(["1.1.1.1", "8.8.8.8"]);

interface CacheEntry {
  response: ServerStatusResponse;
  timestamp: number;
  isError: boolean;
}

interface PingResult {
  motd?: string | { clean?: string; raw?: string };
  version?: { name?: string; protocol?: number };
  players?: {
    online?: number;
    max?: number;
    sample?: { name?: string }[] | null;
  };
  roundTripLatency?: number;
}

interface PingTarget {
  host: string;
  port: number;
}

let cachedStatus: CacheEntry | null = null;

function getStatusConfig() {
  const host = process.env.NEXT_PUBLIC_SERVER_IP || "infcraft.mistycn.com";
  const port = parseInt(process.env.NEXT_PUBLIC_SERVER_PORT || "25565", 10) || 25565;
  const timeout = parseInt(process.env.MC_STATUS_TIMEOUT_MS || "8000", 10) || 8000;
  const cacheTTL = parseInt(process.env.MC_STATUS_CACHE_TTL_SECONDS || "30", 10) || 30;

  return { host, port, timeout, cacheTTL };
}

function toResponse(input: {
  result: PingResult;
  host: string;
  port: number;
  checkedAt: string;
  fallbackLatency: number;
}): ServerStatusResponse {
  const { result, host, port, checkedAt, fallbackLatency } = input;

  let motd: string | null = null;
  if (typeof result.motd === "string") {
    motd = result.motd;
  } else if (result.motd?.clean) {
    motd = result.motd.clean;
  } else if (result.motd?.raw) {
    motd = result.motd.raw;
  }

  return {
    online: true,
    host,
    port,
    motd,
    version: result.version?.name || "未知版本",
    protocol: result.version?.protocol || null,
    players: {
      online: result.players?.online || 0,
      max: result.players?.max || 0,
      sample: result.players?.sample?.map((player) => player.name).filter((name): name is string => Boolean(name)) || [],
    },
    latency: typeof result.roundTripLatency === "number" ? result.roundTripLatency : fallbackLatency,
    checkedAt,
  };
}

async function resolvePingTarget(host: string, port: number): Promise<PingTarget> {
  if (port !== 25565) {
    return { host, port };
  }

  try {
    const records = await srvResolver.resolveSrv(`_minecraft._tcp.${host}`);
    const [record] = records.sort((a, b) => a.priority - b.priority || b.weight - a.weight);

    if (record) {
      return { host: record.name, port: record.port };
    }
  } catch {
    // No SRV record: ping the displayed default address directly.
  }

  return { host, port };
}

async function queryInProcess(target: PingTarget, timeout: number) {
  return await status(target.host, target.port, {
    timeout,
    enableSRV: false,
  });
}

async function queryInSubprocess(target: PingTarget, timeout: number) {
  const script = `
    const { status } = require("minecraft-server-util");
    const [host, port, timeout] = process.argv.slice(1);
    status(host, Number(port), { timeout: Number(timeout), enableSRV: false })
      .then((result) => {
        console.log(JSON.stringify({
          motd: result.motd,
          version: result.version,
          players: result.players,
          roundTripLatency: result.roundTripLatency
        }));
      })
      .catch((error) => {
        console.error(error && (error.stack || error.message) || error);
        process.exit(1);
      });
  `;

  const { stdout } = await execFileAsync(process.execPath, ["-e", script, target.host, String(target.port), String(timeout)], {
    cwd: process.cwd(),
    timeout: timeout + 3000,
    windowsHide: true,
  });

  return JSON.parse(stdout) as PingResult;
}

function isSocketAccessError(error: unknown) {
  return error instanceof Error && /EACCES|EPERM/.test(error.message);
}

export async function getServerStatus(forceRefresh = false): Promise<ServerStatusResponse> {
  const { host, port, timeout, cacheTTL } = getStatusConfig();
  const errorCacheTTL = 2;
  const checkedAt = new Date().toISOString();

  if (!forceRefresh && cachedStatus && cachedStatus.response.host === host && cachedStatus.response.port === port) {
    const age = Date.now() - cachedStatus.timestamp;
    const ttl = cachedStatus.isError ? errorCacheTTL * 1000 : cacheTTL * 1000;

    if (age < ttl) {
      return { ...cachedStatus.response };
    }
  }

  const startedAt = Date.now();

  try {
    let result: PingResult;
    const target = await resolvePingTarget(host, port);

    try {
      result = await queryInProcess(target, timeout);
    } catch (error) {
      if (!isSocketAccessError(error)) {
        throw error;
      }

      console.warn(`Minecraft ping in Next process hit ${String((error as Error).message)}; retrying in a child process.`);
      result = await queryInSubprocess(target, timeout);
    }

    const response = toResponse({
      result,
      host,
      port,
      checkedAt,
      fallbackLatency: Date.now() - startedAt,
    });

    cachedStatus = {
      response,
      timestamp: Date.now(),
      isError: false,
    };

    return response;
  } catch (error) {
    console.error(`Failed to query Minecraft server (${host}:${port}):`, error instanceof Error ? error.message : error);

    const response: ServerStatusResponse = {
      online: false,
      host,
      port,
      motd: null,
      version: null,
      protocol: null,
      players: {
        online: 0,
        max: 0,
        sample: [],
      },
      latency: null,
      checkedAt,
      error: "Server status unavailable",
    };

    cachedStatus = {
      response,
      timestamp: Date.now(),
      isError: true,
    };

    return response;
  }
}
