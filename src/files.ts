import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { Area } from "amazer";
import { serialize } from "amazer";
import { areaToString } from "amazer";


export type AreaReadableFormat = "binary" | "base64";
export type AreaWritableFormat = AreaReadableFormat | "plain";

// TODO Use first line as marker for the format?
export function areaToFile(area: Area, path: string, format: AreaWritableFormat | undefined = "binary") {
    if (format === undefined) {
        format = "binary";
    }
    let data: any;
    let fileFormat = "utf8";
    if (format === "binary") {
        data = serialize.toBytes(area);
        fileFormat = "binary";
    } else if (format === "base64") {
        data = serialize.toBase64(area);
    } else if (format === "plain") {
        data = areaToString(area);
    } else {
        throw new Error(`Unsupported format ${format}`)
    }
    writeFile(path, data, fileFormat);
}

export function areaFromFile(path: string, format: AreaReadableFormat | undefined = "binary"): Area {
    const encoding: "utf8" | undefined = format === "base64" ? "utf8" : undefined;
    const data: string | Uint8Array = fs.readFileSync(path, encoding);
    if (format === "base64") {
        return serialize.fromBase64(data as string);
    } else if (format === "binary") {
        return serialize.fromBytes(data as Uint8Array);
    } else {
        throw new Error(`Unsupported format ${format}`)
    }
}

export function readStructuredFile(filePath: string): any {
    let [fileType] = filePath.split(".").slice(-1);
    let fileContent: string = fs.readFileSync(filePath, "utf8");
    let result: any;
    switch (fileType) {
        case "yml":
        case "yaml":
            result = yaml.safeLoad(fileContent);
            break;
        case "json":
            result = JSON.parse(fileContent);
            break;
        default:
            throw new Error(`Unable to read file type ${fileType}`);
    }
    return result;
}

export function writeStructuredFile(filePath: string, data: any) {
    let [fileType] = filePath.split(".").slice(-1);
    let output: string;
    switch (fileType) {
        case "yml":
        case "yaml":
            output = yaml.safeDump(data);
            break;
        case "json":
            output = JSON.stringify(data);
            break;
        default:
            throw new Error(`Unable to write file type ${fileType}`);
    }
    writeFile(filePath, output, "utf8");
}

export function writeFile(filePath: string, data: any, encoding?: string) {
    const directory: string = path.dirname(filePath);
    fs.mkdirSync(directory, {recursive: true});
    fs.writeFileSync(filePath, data, encoding);
}