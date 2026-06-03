"use client";

import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction
} from "@mysten/dapp-kit";
import {
  CheckCircle2,
  CloudUpload,
  FileImage,
  Loader2,
  Sparkles,
  Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/loading-overlay";
import { StorageStatus } from "@/components/storage-status";
import { TagList } from "@/components/tag-list";
import { uploadMediaAndMetadata } from "@/lib/walrus";
import { getSuiExplorerTransactionUrl } from "@/lib/config";
import { buildMintContentTransaction } from "@/lib/sui-transactions";
import { sha256Hex } from "@/lib/utils";
import type { AiAnalysis } from "@/lib/types";

type Stage = "idle" | "analyzing" | "storing" | "minting" | "complete";
type AnalysisState = "idle" | "loading" | "ready" | "unavailable";

export function UploadModal() {
  const account = useCurrentAccount();
  const signAndExecute = useSignAndExecuteTransaction();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<{
    hash: string;
    mediaBlobId: string;
    metadataBlobId: string;
    digest?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => {
    return {
      idle: 0,
      analyzing: 38,
      storing: 68,
      minting: 88,
      complete: 100
    }[stage];
  }, [stage]);

  async function analyzeSelectedFile(selected: File) {
    setAnalysisState("loading");

    try {
      const formData = new FormData();
      formData.set("image", selected);
      const response = await fetch("/api/moderate", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        setAnalysis(null);
        setAnalysisState("unavailable");
        return;
      }

      const nextAnalysis = (await response.json()) as AiAnalysis;
      setAnalysis(nextAnalysis);
      setAnalysisState("ready");
      setDescription((current) => current || nextAnalysis.description);
    } catch {
      setAnalysis(null);
      setAnalysisState("unavailable");
    }
  }

  function acceptFile(selected?: File | null) {
    if (!selected) {
      return;
    }

    setFile(selected);
    setTitle(selected.name.replace(/\.[^.]+$/, "") || "");
    setDescription("");
    setAnalysis(null);
    setResult(null);
    setError(null);
    void analyzeSelectedFile(selected);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0]);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    acceptFile(event.dataTransfer.files?.[0]);
  }

  async function runUpload() {
    setError(null);

    if (!account) {
      setError("Connect a mainnet Sui wallet before uploading or minting.");
      return;
    }

    if (!file) {
      setError("Select an image before uploading to Walrus.");
      return;
    }

    if (!title.trim()) {
      setError("Add a title before minting.");
      return;
    }

    if (analysisState === "loading") {
      setError("Wait for AI analysis to finish before minting.");
      return;
    }

    if (analysis?.moderationStatus === "flagged") {
      setError("AI moderation flagged this image. Minting is disabled.");
      return;
    }

    try {
      setStage("analyzing");
      const finalDescription =
        description.trim() ||
        analysis?.description ||
        "AI analysis unavailable";
      const metadataPreview = {
        title: title.trim(),
        description: finalDescription,
        creator: account.address,
        createdAt: new Date().toISOString(),
        tags: analysis?.tags ?? [],
        moderationStatus: analysis?.moderationStatus ?? "flagged",
        contentHash: "",
        mediaSizeBytes: file.size,
        metadataSizeBytes: 0,
        safetyScore: analysis?.safetyScore ?? 0
      } as const;

      setStage("storing");
      const hash = await sha256Hex(file);
      const metadata = {
        ...metadataPreview,
        contentHash: hash,
        metadataSizeBytes: new Blob(
          [
            JSON.stringify(
              {
                ...metadataPreview,
                contentHash: hash
              },
              null,
              2
            )
          ],
          { type: "application/json" }
        ).size
      };
      const upload = await uploadMediaAndMetadata({ media: file, metadata });

      setStage("minting");
      const transaction = buildMintContentTransaction({
        title: title.trim(),
        description: finalDescription,
        mediaBlobId: upload.mediaBlobId,
        metadataBlobId: upload.metadataBlobId,
        contentHash: hash
      });
      const execution = await signAndExecute.mutateAsync({
        transaction,
        chain: "sui:mainnet"
      });

      setResult({ hash, ...upload, digest: execution.digest });
      setStage("complete");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload or mint failed.");
      setStage("idle");
    }
  }

  return (
    <>
      <LoadingOverlay
        visible={stage !== "idle" && stage !== "complete"}
        label={
          stage === "analyzing"
            ? "AI moderation running"
            : stage === "storing"
              ? "Writing bundle to Walrus"
              : "Preparing Sui content NFT"
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Upload Content
            </h1>
            <p className="mt-2 text-on-muted">
              Analyze an image, store media plus metadata on Walrus, then mint a
              Sui content object.
            </p>
          </div>

          <label
            onDrop={onDrop}
            onDragOver={(event) => event.preventDefault()}
            className="group relative flex min-h-80 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-outline-soft bg-surface-low p-8 text-center transition-colors hover:border-primary"
          >
            <div className="technical-grid absolute inset-0 opacity-30" />
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={onFileChange}
            />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border border-outline-soft bg-surface-high transition-transform group-hover:scale-105">
              {file ? (
                <FileImage className="h-8 w-8 text-primary" />
              ) : (
                <CloudUpload className="h-8 w-8 text-primary" />
              )}
            </div>
            <h2 className="relative mt-4 text-xl font-semibold">
              {file ? file.name : "Drag and drop image"}
            </h2>
            <p className="relative mt-2 max-w-md text-sm text-on-muted">
              High-resolution images are analyzed for safety, tagged, bundled
              with metadata, and registered as Sui content.
            </p>
            <span className="relative mt-5 rounded-lg border border-outline-soft bg-surface-high px-4 py-2 text-sm font-semibold">
              Select File
            </span>
          </label>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Metadata</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase text-on-muted">
                    Asset name
                  </span>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase text-on-muted">
                    Category
                  </span>
                  <select className="focus-ring h-11 w-full rounded-lg border border-outline-soft bg-surface-low px-3 text-sm text-on-surface focus:border-primary">
                    <option>Digital Art</option>
                    <option>Cinematic</option>
                    <option>Developer Tool</option>
                    <option>Research Media</option>
                  </select>
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase text-on-muted">
                  Description
                </span>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe your creation for the SuiStream ecosystem..."
                />
              </label>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  AI Content Insight
                </h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-lg border border-outline-soft bg-surface-low p-3 text-sm text-on-muted">
                {analysisState === "loading"
                  ? "Analyzing image..."
                  : analysis?.description ?? "AI analysis unavailable"}
              </p>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase text-on-muted">
                  Tags
                </div>
                {analysis?.tags.length ? (
                  <TagList tags={analysis.tags} dense />
                ) : (
                  <p className="text-sm text-on-muted">AI analysis unavailable</p>
                )}
              </div>
              <div className="border-t border-outline-soft pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-muted">Safety score</span>
                  <span className="font-mono text-success">
                    {analysis
                      ? `${(analysis.safetyScore * 100).toFixed(0)}%`
                      : "Unavailable"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <StorageStatus />

          <Card>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-mono text-on-muted">
                  <span>Pipeline</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-surface-high">
                  <div
                    className="h-full rounded bg-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={runUpload}>
                {stage !== "idle" && stage !== "complete" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : stage === "complete" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <CloudUpload className="h-4 w-4" />
                )}
                {stage === "complete" ? "Minted Mainnet NFT" : "Mint NFT & Store"}
              </Button>
              {!account ? (
                <p className="rounded-lg border border-warning/25 bg-warning/10 p-3 text-center text-xs text-warning">
                  Connect a Sui mainnet wallet before upload and mint.
                </p>
              ) : null}
              {error ? (
                <p className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-center text-xs text-danger">
                  {error}
                </p>
              ) : null}
              {result ? (
                <div className="space-y-2 rounded-lg border border-primary/25 bg-primary/10 p-3 text-xs">
                  <div className="text-success">Upload complete</div>
                  <code className="block truncate text-primary">{result.mediaBlobId}</code>
                  <code className="block truncate text-primary">{result.metadataBlobId}</code>
                  <code className="block truncate text-primary">{result.hash}</code>
                  {result.digest ? (
                    <a
                      className="block truncate text-primary underline-offset-4 hover:underline"
                      href={getSuiExplorerTransactionUrl(result.digest)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {result.digest}
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="text-center text-xs text-on-muted">
                  Uses mainnet Walrus publisher endpoints and signs the Sui
                  mint transaction with your connected wallet.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
