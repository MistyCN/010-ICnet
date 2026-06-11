export interface FeatureItem {
  id: string;
  title: string;
  description: string;
}

export interface SocialLinks {
  qqGroup: string | null;
  discord: string | null;
  kook: string | null;
  bilibili: string | null;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SiteConfig {
  siteName: string;
  serverName: string;
  serverIp: string;
  serverPort: number;
  serverAddress: string;
  serverVersionDisplay: string;
  description: string;
  navLinks: NavLink[];
  features: FeatureItem[];
  socialLinks: SocialLinks;
}

export const siteConfig: SiteConfig = {
  siteName: "InfCraft Web",
  serverName: "InfCraft / 无限大陆",
  serverIp: process.env.NEXT_PUBLIC_SERVER_IP || "infcraft.mistycn.com",
  serverPort: parseInt(process.env.NEXT_PUBLIC_SERVER_PORT || "25565", 10),
  get serverAddress() {
    const ip = this.serverIp;
    const port = this.serverPort;
    return port !== 25565 ? `${ip}:${port}` : ip;
  },
  serverVersionDisplay: "26.1.2", // 服务器支持的版本
  description: "",
  
  navLinks: [
    { label: "首页", href: "/" },
    { label: "玩法", href: "/features" },
    { label: "公告", href: "/news" },
    { label: "加入", href: "/join" },
    { label: "关于", href: "/about" },
  ],

  features: [
    {
      id: "survival",
      title: "生存",
      description: "TODO: 填写生存玩法说明",
    },
    {
      id: "building",
      title: "建筑",
      description: "TODO: 填写建筑规则说明",
    },
    {
      id: "economy",
      title: "经济",
      description: "TODO: 填写经济系统说明",
    },
    {
      id: "community",
      title: "社区",
      description: "TODO: 填写社区规则与活动说明",
    },
  ],

  // 默认全部留空，以便界面正确显示为“待补充”或“TODO”占位，不编造虚假信息
  socialLinks: {
    qqGroup: "672587903",
    discord: null,
    kook: null,
    bilibili: null,
  },
};
