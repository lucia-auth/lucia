import path from "path";
import fs from "fs";
import crypto from "crypto";
import { imageSize } from "image-size";
import sharp from "sharp";
const generateFileHash = (data) => {
    return crypto
        .createHash("shake256", {
        outputLength: 21
    })
        .update(data)
        .digest("hex");
};
const safeUrlParse = (maybeUrl) => {
    try {
        return new URL(maybeUrl);
    }
    catch {
        return null;
    }
};
let isInitialCall = true;
const generatedImages = new Set();
class HastElement {
    type = "element";
    children;
    tagName;
    properties;
    constructor(tagName, options) {
        this.tagName = tagName;
        this.children = options.children ?? [];
        this.properties = options.properties;
    }
}
const handleImageElement = async (element, markdownLocation, cwd) => {
    if (element.tagName !== "img" || !element.properties)
        return;
    if (!markdownLocation)
        return;
    if (element.properties.__siena)
        return;
    const imgSrc = element.properties.src?.toString() ?? null;
    const imgAlt = element.properties.alt?.toString() ?? null;
    if (!imgSrc)
        return;
    const getImageData = async (src) => {
        const remoteImgUrl = safeUrlParse(src);
        if (!remoteImgUrl) {
            const imagePath = path.resolve(path.dirname(markdownLocation), imgSrc);
            return fs.readFileSync(imagePath);
        }
        const response = await fetch(src);
        const data = await response.arrayBuffer();
        return Buffer.from(data);
    };
    const imageData = await getImageData(imgSrc);
    const { width: baseImageWidth } = imageSize(imageData);
    if (!baseImageWidth)
        return;
    element.tagName = "picture";
    element.properties = {};
    const imageHash = generateFileHash(imageData.toString());
    if (!generatedImages.has(imageHash)) {
        const sienaDirPath = path.resolve(cwd, path.join(`public`, ".siena"));
        if (!fs.existsSync(sienaDirPath)) {
            fs.mkdirSync(sienaDirPath, {
                recursive: true
            });
        }
        const imageWidth = baseImageWidth > 1920 ? 1920 : baseImageWidth;
        const sharpImage = sharp(imageData);
        const generateImage = async (format) => {
            const imageFileName = `${imageHash}.${format}`;
            const outputPath = path.resolve(sienaDirPath, imageFileName);
            const outputImage = await sharpImage
                .resize(imageWidth)
                .toFile(outputPath);
            if (format === "jpg") {
                const imageElement = new HastElement("img", {
                    properties: {
                        __siena: true,
                        src: path.join("/.siena", `${imageHash}.jpg`),
                        width: outputImage.width,
                        height: outputImage.height,
                        loading: "lazy",
                        alt: imgAlt
                    }
                });
                element.children.push(imageElement);
                return;
            }
            const sourceElement = new HastElement("source", {
                properties: {
                    srcset: path.join("/.siena", imageFileName)
                }
            });
            element.children.push(sourceElement);
        };
        await generateImage("avif");
        await generateImage("webp");
        await generateImage("jpg");
    }
};
const readContent = async (content, file) => {
    if (content.type !== "element" && content.type !== "root")
        return;
    if (content.type === "element") {
        await handleImageElement(content, file.history[0] ?? null, file.cwd);
    }
    await Promise.all(content.children.map((children) => readContent(children, file)));
};
const plugin = async (root, file) => {
    if (isInitialCall) {
        const sienaDirPath = path.resolve(file.cwd, path.join("public", ".siena"));
        fs.rmSync(sienaDirPath, {
            recursive: true,
            force: true
        });
        isInitialCall = false;
    }
    await readContent(root, file);
};
export default () => {
    return plugin;
};
