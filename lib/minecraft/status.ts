import { status } from "minecraft-server-util";
import { ServerStatusResponse } from "@/types/server-status";

interface CacheEntry {
  response: ServerStatusResponse;
  timestamp: number;
  isError: boolean;
}

// 模块级服务端内存缓存
let cachedStatus: CacheEntry | null = null;

export async function getServerStatus(forceRefresh = false): Promise<ServerStatusResponse> {
  // 1. 读取并解析环境变量
  const host =
    process.env.MC_SERVER_HOST ||
    process.env.NEXT_PUBLIC_SERVER_IP ||
    "s10-2.yxsjmc.cn";
  
  const portStr =
    process.env.MC_SERVER_PORT ||
    process.env.NEXT_PUBLIC_SERVER_PORT ||
    "20065";
  const port = parseInt(portStr, 10) || 25565;

  // 默认超时从 3000 提升到 8000，给高延迟服务器更多握手时间
  const timeoutMsStr = process.env.MC_STATUS_TIMEOUT_MS || "8000";
  const timeout = parseInt(timeoutMsStr, 10) || 8000;

  const cacheTTLStr = process.env.MC_STATUS_CACHE_TTL_SECONDS || "30";
  const cacheTTL = parseInt(cacheTTLStr, 10) || 30;

  // 失败结果只缓存很短时间(5秒)，避免一次超时导致30秒全部离线
  const errorCacheTTL = 5;

  const checkedAt = new Date().toISOString();

  // 2. 检查缓存是否命中
  if (
    !forceRefresh &&
    cachedStatus &&
    cachedStatus.response.host === host &&
    cachedStatus.response.port === port
  ) {
    const age = Date.now() - cachedStatus.timestamp;
    const ttl = cachedStatus.isError ? errorCacheTTL * 1000 : cacheTTL * 1000;
    
    if (age < ttl) {
      return { ...cachedStatus.response };
    }
  }

  // 3. 执行真实查询
  const startTime = Date.now();
  try {
    const result = await status(host, port, {
      timeout: timeout,
      enableSRV: true,
    });

    const endTime = Date.now();
    const calculatedLatency = endTime - startTime;

    // 对 MOTD 进行兼容处理
    let motdString: string | null = null;
    if (result.motd) {
      if (typeof result.motd === "string") {
        motdString = result.motd;
      } else if (result.motd.clean) {
        motdString = result.motd.clean;
      } else if (result.motd.raw) {
        motdString = result.motd.raw;
      }
    }

    // 对 players.sample 进行兼容处理
    const playerSample: string[] = [];
    if (result.players && result.players.sample) {
      result.players.sample.forEach((player) => {
        if (player && player.name) {
          playerSample.push(player.name);
        }
      });
    }

    const latency = typeof result.roundTripLatency === "number" ? result.roundTripLatency : calculatedLatency;

    const response: ServerStatusResponse = {
      online: true,
      host,
      port,
      motd: motdString,
      version: result.version?.name || "未知版本",
      protocol: result.version?.protocol || null,
      players: {
        online: result.players?.online || 0,
        max: result.players?.max || 0,
        sample: playerSample,
      },
      latency,
      checkedAt,
    };

    // 成功结果缓存 30 秒
    cachedStatus = {
      response,
      timestamp: Date.now(),
      isError: false,
    };

    return response;
  } catch (error: any) {
    console.error(`Failed to query Minecraft server (${host}:${port}):`, error?.message || error);

    const errorResponse: ServerStatusResponse = {
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

    // 失败结果只缓存 5 秒，快速重试
    cachedStatus = {
      response: errorResponse,
      timestamp: Date.now(),
      isError: true,
    };

    return errorResponse;
  }
}
