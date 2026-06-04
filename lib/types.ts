export type ModerationStatus = "approved" | "flagged";

export type MediaContent = {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatorAddress: string;
  createdAt: string;
  imageUrl: string | null;
  aspect: "portrait" | "landscape" | "square";
  tags: string[];
  moderationStatus: ModerationStatus;
  isDemo?: boolean;
  contentHash: string;
  mediaBlobId: string;
  metadataBlobId: string;
  suiObjectId: string;
  mintTxId: string;
  safetyScore: number;
};

export type AiAnalysis = {
  tags: string[];
  description: string;
  safetyScore: number;
  moderationStatus: ModerationStatus;
  isDemo?: boolean;
};

export type UploadedContentMetadata = {
  title: string;
  description: string;
  creator: string;
  createdAt: string;
  tags: string[];
  moderationStatus: ModerationStatus;
  isDemo?: boolean;
  contentHash: string;
  mediaSizeBytes: number;
  metadataSizeBytes: number;
  safetyScore: number;
};

export type WalrusUploadResult = {
  mediaBlobId: string;
  metadataBlobId: string;
  mediaSizeBytes: number;
  metadataSizeBytes: number;
};

export type OwnedContent = {
  id: string;
  title: string;
  description: string;
  creatorAddress: string;
  createdAt: string;
  imageUrl: string;
  tags: string[];
  moderationStatus: ModerationStatus;
  isDemo?: boolean;
  contentHash: string;
  mediaBlobId: string;
  metadataBlobId: string;
  suiObjectId: string;
  safetyScore: number;
  storageBytes: number;
};

export type TipEvent = {
  digest: string;
  amountMist: string;
  timestampMs: string | null;
};

export type RevenuePoint = {
  label: string;
  amountMist: string;
};

export type DashboardData = {
  totalEarningsMist: string;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  storagePercent: number;
  revenue: RevenuePoint[];
  recentTips: TipEvent[];
  ownedContent: OwnedContent[];
};
