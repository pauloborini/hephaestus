import { createHash } from 'node:crypto';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

import type {
  SourceFragment,
  SourceSnapshotRecord,
} from '../domain/index.js';
import { classifyFragment } from '../shared/index.js';

export interface ExtractFragmentsOptions {
  workspaceRoot: string;
  snapshots: SourceSnapshotRecord[];
  extractedAt?: string;
}

interface FragmentBlock {
  heading?: string;
  lineStart: number;
  lineEnd: number;
  lines: string[];
}

export async function extractFragments(
  options: ExtractFragmentsOptions,
): Promise<SourceFragment[]> {
  const extractedAt = options.extractedAt ?? new Date().toISOString();
  const allFragments = await Promise.all(
    options.snapshots.map(async (snapshot) => {
      const snapshotAbsolutePath = path.join(options.workspaceRoot, snapshot.snapshotPath);
      const contents = await readFile(snapshotAbsolutePath, 'utf8');
      const blocks = splitIntoBlocks(contents);

      return blocks.map((block, index) => {
        const text = block.lines.join('\n').trim();
        const classification = classifyFragment({
          sourcePath: snapshot.sourcePath,
          sourceType: snapshot.sourceType,
          contents: text,
        });

        return {
          fragmentId: createFragmentId(snapshot.sourceId, block.lineStart, index),
          sourceId: snapshot.sourceId,
          sourcePath: snapshot.sourcePath,
          sourceType: snapshot.sourceType,
          topic: classification.topic,
          taskTypes: classification.taskTypes,
          locator: {
            heading: block.heading,
            lineStart: block.lineStart,
            lineEnd: block.lineEnd,
          },
          confidence: classification.confidence,
          confidenceLevel: classification.confidenceLevel,
          ambiguity: classification.ambiguity,
          derivedFrom: 'deterministic_fragmentation',
          extractedAt,
        } satisfies SourceFragment;
      });
    }),
  );

  return allFragments.flat();
}

function splitIntoBlocks(contents: string): FragmentBlock[] {
  const lines = contents.split(/\r?\n/);
  const blocks: FragmentBlock[] = [];
  let currentLines: string[] = [];
  let currentHeading: string | undefined;
  let blockStart = 1;

  const flush = (lineEnd: number) => {
    const normalizedLines = currentLines.map((line) => line.trimEnd()).filter((line) => line.length > 0);

    if (normalizedLines.length === 0) {
      currentLines = [];
      blockStart = lineEnd + 1;
      return;
    }

    blocks.push({
      heading: currentHeading,
      lineStart: blockStart,
      lineEnd,
      lines: normalizedLines,
    });

    currentLines = [];
    blockStart = lineEnd + 1;
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    const isHeading = /^#{1,6}\s+/.test(trimmed);
    const isBoundary = trimmed === '';

    if (isHeading) {
      flush(lineNumber - 1);
      currentHeading = trimmed.replace(/^#{1,6}\s+/, '');
      blockStart = lineNumber;
      currentLines.push(trimmed);
      return;
    }

    currentLines.push(line);

    if (isBoundary) {
      flush(lineNumber);
    }
  });

  flush(lines.length);

  if (blocks.length === 0 && contents.trim().length > 0) {
    return [
      {
        heading: currentHeading,
        lineStart: 1,
        lineEnd: lines.length,
        lines: lines.filter((line) => line.trim().length > 0),
      },
    ];
  }

  return blocks;
}

function createFragmentId(sourceId: string, lineStart: number, index: number): string {
  const digest = createHash('sha1').update(`${sourceId}:${lineStart}:${index}`).digest('hex').slice(0, 8);
  return `frag_${sourceId}_${digest}`;
}
