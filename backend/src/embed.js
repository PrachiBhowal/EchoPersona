import { pipeline } from "@huggingface/transformers";

const MODEL = "Xenova/all-MiniLM-L6-v2"; // small, fast, 384 dimensions
let extractorPromise;

function getExtractor() {
    extractorPromise ??= pipeline("feature-extraction", MODEL);
    return extractorPromise;
}

// Returns one normalized vector (plain array) per input text.
export async function embedTexts(texts) {
    const extractor = await getExtractor();
    const output = await extractor(texts, { pooling: "mean", normalize: true });
    return output.tolist();
}

// Vectors are normalized, so the dot product equals cosine similarity.
export const cosine = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);