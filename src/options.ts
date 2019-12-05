import { Options } from "yargs";
import { Dict, capitalize, Size, parseGenerator, GeneratorWithConfig, RecursiveBacktracker, parseModifier, ModifierWithConfig } from "amazer";
import { AreaWritableFormat, AreaReadableFormat } from "./files";


interface ArgsBase extends Dict<any> {
    config?: string,
    size?: Size,
    generator?: GeneratorWithConfig<any>,
    modifier?: ModifierWithConfig<any>[],
    format?: AreaWritableFormat,
}

function parseGen(arg: string) {
    let gen = parseGenerator(arg);
    return gen;
}

function sharedOptions(): Dict<Options> {
    return {
        c: {
            alias: "config",
            type: "string",
            describe: "The configuration file",
            requiresArg: true
        },
        s: {
            alias: "size",
            type: "string",
            coerce: Size.fromString,
            describe: "The areas size as WIDTHxHEIGHT",
            requiresArg: true
        },
        g: {
            alias: "generator",
            type: "string",
            coerce: parseGen,
            describe: `The area generator to use, defaults to ${capitalize(RecursiveBacktracker.name)}`,
            requiresArg: true
        },
        m: {
            alias: "modifier",
            type: "array",
            coerce: parseModifiers,
            describe: "The modifiers to apply after the generation",
            requiresArg: true
        },
        f: {
            alias: "format",
            choices: ["binary", "base64", "plain"],
            describe: "The format of the output file, defaults to binary",
            requiresArg: true
        },
    }
}

function parseModifiers(modifierArgs: string[]): ModifierWithConfig<any>[] {
    return modifierArgs.map(arg => parseModifier(arg));
}


export interface CliArgs extends ArgsBase {
    silent?: boolean,
    saveConfig?: string,
    file?: string,
}

export const cliOptions: Dict<Options> = {
    ...sharedOptions(),
    silent: {
        type: "boolean",
        describe: "Don't print the generated area"
    },
    // TODO Option to save defaults
    saveConfig: {
        type: "string",
        describe: "File type or filename to store the used configuration in",
    }
}
cliOptions.s.demandOption = true;

export interface InteractiveArgs extends ArgsBase {
    directory?: string
}

export const interactiveOptions: Dict<Options> = {
    ...sharedOptions(),
}

export interface DisplayArgs extends Dict<any> {
    format: AreaReadableFormat,
    file: string,
}

export const displayOptions: Dict<Options> = {
    f: {
        alias: "format",
        choices: ["binary", "base64"],
        describe: "The format of the output file, defaults to binary",
        requiresArg: true
    }
}