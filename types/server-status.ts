export type ServerStatusResponse = {
  online: boolean;
  host: string;
  port: number;
  motd: string | null;
  version: string | null;
  protocol: number | null;
  players: {
    online: number;
    max: number;
    sample: string[];
  };
  latency: number | null;
  checkedAt: string;
  error?: string;
};
