export interface NewsItem {
  title: string;
  date: string;
  summary: string;
  slug: string;
  content?: string;
}

// 默认导出空数组，不编造虚假公告。页面会根据此数组是否为空显示“暂无公告”状态。
export const newsList: NewsItem[] = [];
