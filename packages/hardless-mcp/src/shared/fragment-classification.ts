import type {
  AmbiguityLevel,
  ConfidenceLevel,
  SourceType,
  TaskType,
} from '../domain/index.js';

const TOPIC_KEYWORDS = [
  { topic: 'workflow', keywords: ['workflow', 'triage', 'ritual', 'gates', 'fast mode', 'spec flow'] },
  { topic: 'architecture', keywords: ['architecture', 'adapter', 'module', 'package', 'runtime', 'domain'] },
  { topic: 'testing', keywords: ['test', 'tests', 'validation', 'assert', 'coverage'] },
  { topic: 'contracts', keywords: ['contract', 'schema', 'api', 'dto', 'json', 'manifest'] },
  { topic: 'security', keywords: ['permission', 'security', 'secret', 'sensitive', 'pii'] },
  { topic: 'ui', keywords: ['ui', 'layout', 'screen', 'component', 'visual'] },
];

const TASK_TYPE_KEYWORDS: Array<{ taskType: TaskType; keywords: string[] }> = [
  { taskType: 'feature', keywords: ['feature', 'capability', 'workflow', 'bootstrap'] },
  { taskType: 'ui', keywords: ['ui', 'layout', 'screen', 'component'] },
  { taskType: 'contract', keywords: ['contract', 'schema', 'dto', 'api', 'manifest'] },
  { taskType: 'navigation', keywords: ['navigation', 'route', 'router', 'guard'] },
  { taskType: 'shared', keywords: ['shared', 'common', 'utility', 'helper'] },
  { taskType: 'security', keywords: ['security', 'permission', 'secret', 'pii'] },
  { taskType: 'diagnostic', keywords: ['bug', 'incident', 'diagnostic', 'investigation'] },
  { taskType: 'refactoring', keywords: ['refactor', 'cleanup', 'reorganize', 'simplify'] },
  { taskType: 'testing', keywords: ['test', 'validation', 'assert', 'coverage'] },
];

export interface FragmentClassification {
  topic: string;
  taskTypes: TaskType[];
  ambiguity: AmbiguityLevel;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
}

export function classifyFragment(input: {
  sourcePath: string;
  sourceType: SourceType;
  contents: string;
}): FragmentClassification {
  const haystack = `${input.sourcePath}\n${input.contents}`.toLowerCase();

  const topicScores = TOPIC_KEYWORDS.map((entry) => ({
    topic: entry.topic,
    score: entry.keywords.reduce((total, keyword) => total + Number(haystack.includes(keyword)), 0),
  }));
  const topTopicScore = Math.max(...topicScores.map((entry) => entry.score), 0);
  const dominantTopics = topicScores.filter((entry) => entry.score === topTopicScore && entry.score > 0);

  const taskTypeScores = TASK_TYPE_KEYWORDS.map((entry) => ({
    taskType: entry.taskType,
    score: entry.keywords.reduce((total, keyword) => total + Number(haystack.includes(keyword)), 0),
  }));
  const sortedTaskTypes = taskTypeScores
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.taskType);

  const taskTypes = sortedTaskTypes.length > 0 ? [...new Set(sortedTaskTypes)].slice(0, 2) : [inferTaskType(input.sourceType)];
  const topic = dominantTopics[0]?.topic ?? inferTopic(input.sourceType);
  const ambiguity = dominantTopics.length > 1 || taskTypes.length > 1 ? 'medium' : 'low';
  const confidence = Math.min(0.95, 0.55 + topTopicScore * 0.1 + taskTypes.length * 0.05);
  const confidenceLevel = confidence >= 0.8 ? 'high' : confidence >= 0.65 ? 'medium' : 'low';

  return {
    topic,
    taskTypes,
    ambiguity,
    confidence,
    confidenceLevel,
  };
}

function inferTopic(sourceType: SourceType): string {
  switch (sourceType) {
    case 'agents_md':
    case 'claude_md':
    case 'cloud_md':
      return 'workflow';
    case 'specs_directory':
      return 'contracts';
    default:
      return 'architecture';
  }
}

function inferTaskType(sourceType: SourceType): TaskType {
  switch (sourceType) {
    case 'specs_directory':
      return 'feature';
    case 'cursor_rules':
      return 'shared';
    default:
      return 'contract';
  }
}
