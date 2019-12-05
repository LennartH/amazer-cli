import _ from "lodash";
import { Config, Dict, capitalize, Size, parseGenerator, parseModifier } from "amazer";
import { readStructuredFile } from "./files";
import { CliArgs, InteractiveArgs } from "./options";


export function configFromArgs(args: CliArgs | InteractiveArgs): Config {
    if (args.config !== undefined) {
        const config = configFromFile(args.config);

        let size = config.size;
        try {
            size = Size.fromObject(args);
        } catch { }
        let generator = args.generator || config.generator;
        let modifiers = args.modifier !== undefined && args.modifier.length > 0 ? args.modifier : config.modifiers;
        return new Config(size, generator, modifiers);
    } else {
        return Config.fromObject(args);
    }
}


export function configFromFile(path: string): Config {
    const fileContent = readStructuredFile(path);
    const args: Dict<any> = {};
    args.size = Size.fromObject(fileContent);
    if (fileContent.generator !== undefined) {
        args.generator = parseGenerator(fileContent.generator);
    }
    if (fileContent.modifiers !== undefined) {
        args.modifier = [];
        for (let modifier of fileContent.modifiers) {
            args.modifier.push(parseModifier(modifier));
        }
    }
    return Config.fromObject(args);
}

export function prepareAmazerConfig(config: Config): Dict<any> {
    const data: Dict<any> = {};
    data.size = Size.stringify(config.size);
    data.generator = prepareFunctionWithConfig(config.generator.generator, config.generator.config);
    const modifiers: any[] = [];
    for (let modWithConfig of config.modifiers) {
        modifiers.push(prepareFunctionWithConfig(modWithConfig.modifier, modWithConfig.config));
    }
    if (modifiers.length > 0) {
        data.modifiers = modifiers;
    }
    return data;
}

function prepareFunctionWithConfig(func: Function, config: Dict<any> | undefined): any {
    const capitalizedName = capitalize(func.name);
    if (config === undefined) {
        return capitalizedName;
    } else {
        return {[capitalizedName]: prepareConfig(config)};
    }
}

function prepareConfig(config: Dict<any>): Dict<any> {
    const result: Dict<any> = {};
    for (let key in config) {
        const value: any = config[key];
        if (value !== undefined) {
            let resultValue = value;
            if (value instanceof Object && _.difference(Object.keys(value), ["width", "height"]).length === 0) {
                resultValue = Size.stringify(value);
            }
            result[key] = resultValue;
        }
    }
    return result;
}