export interface ActivityAction {
  id: string;
  type?: string;
  theme?: string;
  count?: number;
  lang?: string;
  timestamp?: string | Date;
}

export interface UserData {
  id: string;
  email: string;
  createdAt: string;
}

export interface TopicStat {
  label: string;
  count: number;
}

export interface ReviewIdeaSample {
  name: string;
  description: string;
}

export interface ReviewRecord {
  id: string;
  theme: string;
  lang: string;
  domain: string;
  source: string;
  reviewStatus: string;
  reviewTags: string[];
  error?: string;
  createdAt: string;
  ideas?: ReviewIdeaSample[];
}

export interface ReviewDomainStat {
  label: string;
  count: number;
}

export interface ReviewSummary {
  total: number;
  pending: number;
  failed: number;
  approved: number;
  flagged: number;
  byDomain: ReviewDomainStat[];
  recent: ReviewRecord[];
}

export interface DashboardStats {
  totalUsers: number;
  totalIdeas: number;
  recentActions: ActivityAction[];
  recentUsers: UserData[];
  topTopics: TopicStat[];
  langDistribution: { ru: number; en: number; uk: number };
  conversionRate: number;
  reviews: ReviewSummary;
}
