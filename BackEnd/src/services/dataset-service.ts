import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";

import csv from "csv-parser";
import type { Dataset } from "@prisma/client";

import { db } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import type {
  ColumnProfile,
  DatasetProfile,
  DatasetRow,
  InferredColumnType,
  Primitive,
  QualitySummary,
} from "../types/analytics";
import {
  deleteDatasetArtifacts,
  loadStoredProfile,
  loadStoredRows,
  writeDatasetArtifacts,
} from "./storage-service";

type RawRow = Record<string, string | null>;

type ColumnAccumulator = {
  nullCount: number;
  nonNullCount: number;
  uniqueValues: Set<string>;
  samples: Set<string>;
  numericCount: number;
  booleanCount: number;
  dateCount: number;
  stringCount: number;
};

function normalizeCell(value: unknown) {
  if (value == null) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function isNumeric(value: string) {
  return /^-?\d+(\.\d+)?$/.test(value.replace(/,/g, ""));
}

function isBoolean(value: string) {
  return ["true", "false", "yes", "no"].includes(value.toLowerCase());
}

function isDate(value: string) {
  if (/^\d+$/.test(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function inferColumnType(stats: ColumnAccumulator): InferredColumnType {
  if (stats.nonNullCount === 0) {
    return "string";
  }

  if (stats.numericCount === stats.nonNullCount) {
    return "number";
  }
  if (stats.booleanCount === stats.nonNullCount) {
    return "boolean";
  }
  if (stats.dateCount === stats.nonNullCount) {
    return "date";
  }

  const threshold = 0.75;

  if (stats.numericCount / stats.nonNullCount >= threshold) {
    return "number";
  }
  if (stats.dateCount / stats.nonNullCount >= threshold) {
    return "date";
  }
  if (stats.booleanCount / stats.nonNullCount >= threshold) {
    return "boolean";
  }

  return stats.stringCount === stats.nonNullCount ? "string" : "mixed";
}

function normalizeTypedValue(value: string | null, inferredType: InferredColumnType): Primitive {
  if (value == null) {
    return null;
  }

  if (inferredType === "number" && isNumeric(value)) {
    return Number(value.replace(/,/g, ""));
  }

  if (inferredType === "boolean" && isBoolean(value)) {
    return ["true", "yes"].includes(value.toLowerCase());
  }

  if (inferredType === "date" && isDate(value)) {
    return new Date(value).toISOString();
  }

  return value;
}

function buildQualitySummary(
  rowCount: number,
  duplicateRowCount: number,
  columnProfiles: ColumnProfile[],
) {
  const sparseColumns = columnProfiles
    .filter((column) => rowCount > 0 && column.nullCount / rowCount >= 0.4)
    .map((column) => column.name);

  const flaggedColumns = columnProfiles
    .filter((column) => column.invalidCount > 0)
    .map((column) => ({
      column: column.name,
      issue: `Detected ${column.invalidCount} values that do not match inferred ${column.inferredType} formatting.`,
      count: column.invalidCount,
    }));

  const warnings: string[] = [];
  if (duplicateRowCount > 0) {
    warnings.push(`${duplicateRowCount} duplicate rows detected.`);
  }
  if (sparseColumns.length > 0) {
    warnings.push(`Sparse columns detected: ${sparseColumns.join(", ")}.`);
  }
  if (flaggedColumns.length > 0) {
    warnings.push("Some columns contain values that do not match their dominant inferred type.");
  }

  const quality: QualitySummary = {
    duplicateRowCount,
    sparseColumns,
    flaggedColumns,
    warnings,
  };

  return quality;
}

async function profileCsvFile(filePath: string) {
  const rawRows: RawRow[] = [];
  const rowFingerprints = new Set<string>();
  let duplicateRowCount = 0;
  let headers: string[] = [];
  const accumulators = new Map<string, ColumnAccumulator>();

  await new Promise<void>((resolve, reject) => {
    createReadStream(filePath)
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim(),
          strict: true,
          skipComments: false,
        }),
      )
      .on("headers", (incomingHeaders: string[]) => {
        headers = incomingHeaders.map((header) => header.trim()).filter(Boolean);

        if (headers.length === 0) {
          reject(new AppError(400, "CSV file is missing a valid header row.", "INVALID_CSV"));
          return;
        }

        const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
        if (duplicates.length > 0) {
          reject(
            new AppError(
              400,
              `CSV contains duplicate column names: ${duplicates.join(", ")}.`,
              "DUPLICATE_COLUMNS",
            ),
          );
          return;
        }

        for (const header of headers) {
          accumulators.set(header, {
            nullCount: 0,
            nonNullCount: 0,
            uniqueValues: new Set<string>(),
            samples: new Set<string>(),
            numericCount: 0,
            booleanCount: 0,
            dateCount: 0,
            stringCount: 0,
          });
        }
      })
      .on("data", (row: Record<string, unknown>) => {
        const cleanRow: RawRow = {};

        for (const header of headers) {
          const value = normalizeCell(row[header]);
          cleanRow[header] = value;

          const stats = accumulators.get(header);
          if (!stats) {
            continue;
          }

          if (value == null) {
            stats.nullCount += 1;
            continue;
          }

          stats.nonNullCount += 1;
          stats.uniqueValues.add(value);
          if (stats.samples.size < 5) {
            stats.samples.add(value);
          }

          if (isNumeric(value)) {
            stats.numericCount += 1;
          } else if (isBoolean(value)) {
            stats.booleanCount += 1;
          } else if (isDate(value)) {
            stats.dateCount += 1;
          } else {
            stats.stringCount += 1;
          }
        }

        const fingerprint = JSON.stringify(cleanRow);
        if (rowFingerprints.has(fingerprint)) {
          duplicateRowCount += 1;
        } else {
          rowFingerprints.add(fingerprint);
        }

        rawRows.push(cleanRow);
      })
      .on("end", () => resolve())
      .on("error", (error) => reject(new AppError(400, error.message, "CSV_PARSE_ERROR")));
  });

  if (rawRows.length === 0) {
    throw new AppError(400, "CSV contains no data rows.", "EMPTY_DATASET");
  }

  const columnProfiles: ColumnProfile[] = headers.map((header) => {
    const stats = accumulators.get(header);
    if (!stats) {
      throw new AppError(500, `Missing column accumulator for ${header}.`, "PROFILE_ERROR");
    }

    const inferredType = inferColumnType(stats);
    const invalidCount =
      inferredType === "number"
        ? stats.nonNullCount - stats.numericCount
        : inferredType === "boolean"
          ? stats.nonNullCount - stats.booleanCount
          : inferredType === "date"
            ? stats.nonNullCount - stats.dateCount
            : 0;

    return {
      name: header,
      inferredType,
      nullCount: stats.nullCount,
      nonNullCount: stats.nonNullCount,
      uniqueCount: stats.uniqueValues.size,
      invalidCount,
      sampleValues: Array.from(stats.samples),
    };
  });

  const inferredTypes = Object.fromEntries(
    columnProfiles.map((profile) => [profile.name, profile.inferredType]),
  ) as Record<string, InferredColumnType>;

  const normalizedRows: DatasetRow[] = rawRows.map((row) => {
    const normalizedRow: DatasetRow = {};
    for (const header of headers) {
      normalizedRow[header] = normalizeTypedValue(row[header], inferredTypes[header]);
    }
    return normalizedRow;
  });

  const quality = buildQualitySummary(rawRows.length, duplicateRowCount, columnProfiles);

  const profile: DatasetProfile = {
    rowCount: normalizedRows.length,
    columnCount: headers.length,
    columns: columnProfiles,
    previewRows: normalizedRows.slice(0, 10),
    quality,
  };

  return {
    rows: normalizedRows,
    columns: headers,
    previewRows: profile.previewRows,
    rowCount: profile.rowCount,
    columnCount: profile.columnCount,
    profile,
    inferredTypes,
    quality,
  };
}

function getDatasetStatus(dataset: Dataset) {
  return dataset.normalizedFilePath ? dataset.ingestionStatus : "legacy";
}

function serializeDataset(dataset: Dataset) {
  return {
    id: dataset.id,
    filename: dataset.filename,
    rowCount: dataset.rowCount,
    columnCount: dataset.columnCount,
    columns: JSON.parse(dataset.columns) as string[],
    dataPreview: JSON.parse(dataset.dataPreview) as DatasetRow[],
    fileSize: dataset.fileSize,
    createdAt: dataset.createdAt,
    ingestionStatus: getDatasetStatus(dataset),
    inferredTypes: JSON.parse(dataset.inferredTypes || "{}") as Record<string, InferredColumnType>,
    qualitySummary: JSON.parse(dataset.qualitySummary || "{}") as QualitySummary,
  };
}

export async function ingestDataset(userId: string, file: Express.Multer.File) {
  const datasetId = randomUUID();

  try {
    const profiled = await profileCsvFile(file.path);
    const artifactPaths = await writeDatasetArtifacts({
      datasetId,
      uploadPath: file.path,
      originalFilename: file.originalname,
      rows: profiled.rows,
      profile: profiled.profile,
    });

    const dataset = await db.dataset.create({
      data: {
        id: datasetId,
        ownerId: userId,
        filename: file.originalname,
        rowCount: profiled.rowCount,
        columnCount: profiled.columnCount,
        columns: JSON.stringify(profiled.columns),
        dataPreview: JSON.stringify(profiled.previewRows),
        fileSize: file.size,
        profileJson: JSON.stringify(profiled.profile),
        qualitySummary: JSON.stringify(profiled.quality),
        inferredTypes: JSON.stringify(profiled.inferredTypes),
        ingestionStatus: "ready",
        ...artifactPaths,
      },
    });

    return serializeDataset(dataset);
  } catch (error) {
    await unlink(file.path).catch(() => undefined);
    throw error;
  }
}

export async function listDatasets(userId: string) {
  const datasets = await db.dataset.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return datasets.map(serializeDataset);
}

export async function getDatasetRecordOrThrow(userId: string, datasetId: string) {
  const dataset = await db.dataset.findFirst({
    where: {
      id: datasetId,
      ownerId: userId,
    },
  });

  if (!dataset) {
    throw new AppError(404, "Dataset not found.", "DATASET_NOT_FOUND");
  }

  return dataset;
}

export async function getDatasetMetadata(userId: string, datasetId: string) {
  const dataset = await getDatasetRecordOrThrow(userId, datasetId);
  const base = serializeDataset(dataset);

  if (!dataset.profilePath || !dataset.normalizedFilePath) {
    return {
      ...base,
      profile: null,
      quality: JSON.parse(dataset.qualitySummary || "{}") as QualitySummary,
      legacyDataset: true,
    };
  }

  let profile: DatasetProfile;
  try {
    profile = await loadStoredProfile(dataset.profilePath);
  } catch {
    profile = JSON.parse(dataset.profileJson) as DatasetProfile;
  }

  return {
    ...base,
    profile,
    quality: profile.quality,
    legacyDataset: false,
  };
}

export async function getDatasetRowsAndProfile(userId: string, datasetId: string) {
  const dataset = await getDatasetRecordOrThrow(userId, datasetId);

  if (!dataset.normalizedFilePath || !dataset.profilePath) {
    throw new AppError(
      409,
      "This dataset was uploaded before the analytics engine upgrade. Re-upload it to enable full AI analysis.",
      "LEGACY_DATASET",
    );
  }

  const [rows, profile] = await Promise.all([
    loadStoredRows(dataset.normalizedFilePath),
    loadStoredProfile(dataset.profilePath).catch(
      () => JSON.parse(dataset.profileJson) as DatasetProfile,
    ),
  ]);

  return { dataset, rows, profile };
}

export async function deleteDataset(userId: string, datasetId: string) {
  const dataset = await getDatasetRecordOrThrow(userId, datasetId);

  await Promise.all([
    db.dataset.delete({ where: { id: datasetId } }),
    deleteDatasetArtifacts(dataset.storageDirectory),
  ]);
}

export async function listQueryHistory(userId: string) {
  const queries = await db.query.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return queries.map((query) => ({
    id: query.id,
    datasetId: query.datasetId,
    question: query.question,
    response: query.response,
    createdAt: query.createdAt,
  }));
}

