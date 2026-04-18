import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";

import type { DatasetProfile, DatasetRow } from "../types/analytics.js";
import { env } from "../config/env.js";

const datasetsRoot = join(env.storageRoot, "datasets");
const tempUploadsRoot = join(env.storageRoot, "tmp");

export async function ensureStorageDirectories() {
  await mkdir(datasetsRoot, { recursive: true });
  await mkdir(tempUploadsRoot, { recursive: true });
}

export function getTempUploadsRoot() {
  return tempUploadsRoot;
}

export function getDatasetDirectory(datasetId: string) {
  return join(datasetsRoot, datasetId);
}

export function toStoredPath(filePath: string) {
  return relative(process.cwd(), filePath).replace(/\\/g, "/");
}

export function resolveStoredPath(filePath: string) {
  return isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
}

export async function writeDatasetArtifacts(options: {
  datasetId: string;
  uploadPath: string;
  originalFilename: string;
  rows: DatasetRow[];
  profile: DatasetProfile;
}) {
  const datasetDirectory = getDatasetDirectory(options.datasetId);
  await mkdir(datasetDirectory, { recursive: true });

  const originalExtension = options.originalFilename.toLowerCase().endsWith(".csv")
    ? ".csv"
    : ".txt";
  const originalFilePath = join(datasetDirectory, `source${originalExtension}`);
  const normalizedFilePath = join(datasetDirectory, "rows.json");
  const profilePath = join(datasetDirectory, "profile.json");

  await rename(options.uploadPath, originalFilePath);
  await writeFile(normalizedFilePath, JSON.stringify(options.rows, null, 2), "utf8");
  await writeFile(profilePath, JSON.stringify(options.profile, null, 2), "utf8");

  return {
    storageDirectory: toStoredPath(datasetDirectory),
    originalFilePath: toStoredPath(originalFilePath),
    normalizedFilePath: toStoredPath(normalizedFilePath),
    profilePath: toStoredPath(profilePath),
  };
}

export async function loadStoredRows(normalizedFilePath: string) {
  const contents = await readFile(resolveStoredPath(normalizedFilePath), "utf8");
  return JSON.parse(contents) as DatasetRow[];
}

export async function loadStoredProfile(profilePath: string) {
  const contents = await readFile(resolveStoredPath(profilePath), "utf8");
  return JSON.parse(contents) as DatasetProfile;
}

export async function deleteDatasetArtifacts(storageDirectory: string) {
  if (!storageDirectory) {
    return;
  }

  await rm(resolveStoredPath(storageDirectory), { recursive: true, force: true });
}

