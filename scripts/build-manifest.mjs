import { readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const imagesRoot = join(root, "public", "images");

const SECTION_ORDER = {
  introduction: 0,
  "rule-in-practice": 1,
  traps: 2,
  "worked-example": 3,
  condensed: 4,
};

const SECTION_LABELS = {
  introduction: "Introduction",
  "rule-in-practice": "Rule in practice",
  traps: "Traps",
  "worked-example": "Worked example",
  condensed: "Condensed",
};

const IMAGE_SOURCES = ["golden-hugh-1", "golden-hugh-2"];

function camelToTitle(key) {
  const small = new Set(["of", "and", "the", "a", "an"]);
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && small.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function parseFilename(filename) {
  const match = filename.match(/^snapshotGoldenHugh([^.]+)\.(.+)\.png$/);
  if (!match) return null;

  const topicKey = match[1];
  const slug = match[2];

  let section;
  let order;

  const numbered = slug.match(/-(\d{2})-([a-z-]+)$/);
  if (numbered) {
    order = Number(numbered[1]);
    section = numbered[2];
  } else {
    const sectionMatch = slug.match(
      /-(introduction|rule-in-practice|traps|worked-example|condensed)$/
    );
    section = sectionMatch?.[1] ?? slug;
    order = SECTION_ORDER[section] ?? 99;
  }

  const topicSlug = slug
    .replace(/golden-hugh-/, "")
    .replace(/-\d{2}-[a-z-]+$/, "")
    .replace(/-(introduction|rule-in-practice|traps|worked-example|condensed)$/, "");

  return {
    filename,
    topicKey,
    topicSlug,
    topicTitle: camelToTitle(topicKey),
    section,
    sectionLabel: SECTION_LABELS[section] ?? section,
    order,
  };
}

const topicMap = new Map();

for (const sourceId of IMAGE_SOURCES) {
  const dir = join(imagesRoot, sourceId);
  const files = readdirSync(dir).filter((f) => f.endsWith(".png"));
  const sourceTopics = new Map();

  for (const file of files) {
    const parsed = parseFilename(file);
    if (!parsed) continue;

    if (!sourceTopics.has(parsed.topicSlug)) {
      sourceTopics.set(parsed.topicSlug, {
        slug: parsed.topicSlug,
        title: parsed.topicTitle,
        pages: [],
      });
    }

    sourceTopics.get(parsed.topicSlug).pages.push({
      section: parsed.section,
      label: parsed.sectionLabel,
      order: parsed.order,
      src: `/images/${sourceId}/${parsed.filename}`,
      filename: parsed.filename,
    });
  }

  for (const topic of sourceTopics.values()) {
    topic.pages.sort((a, b) => a.order - b.order);
    topicMap.set(topic.slug, topic);
  }
}

const topics = [...topicMap.values()].sort((a, b) => a.title.localeCompare(b.title));
const manifest = { topics };

writeFileSync(
  join(root, "public", "manifest.json"),
  JSON.stringify(manifest, null, 2)
);

const pageCount = topics.reduce((n, topic) => n + topic.pages.length, 0);
console.log(`Wrote manifest with ${topics.length} topics and ${pageCount} pages.`);
