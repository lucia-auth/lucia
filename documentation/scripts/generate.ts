import { generateContent } from "integrations/cela/generate";
import { generateSearchIndex } from "search/generate";
import { fetchGithub } from "integrations/preprocess/github";

generateContent();
generateSearchIndex();
await fetchGithub();
