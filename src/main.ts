import yargs from "yargs";
import _ from "lodash";
import amazer, { Area, areaToString, } from "amazer";
import { areaToFile, writeStructuredFile, areaFromFile } from "./files";
import { cliOptions, displayOptions, interactiveOptions, CliArgs, DisplayArgs } from "./options";
import { interactiveLoop } from "./interactive";
import { prepareAmazerConfig, configFromArgs } from "./util";


// TODO Migrate from yargs to vorpal
// TODO Add logging
// TODO Cleanup the config mess

export const version = "0.1.0"

export const cli = yargs
    .version(version)
    .showHelpOnFail(true)
    .usage("Usage: $0 [-c FILE|-s WIDTHxHEIGHT] [OPTIONS] [FILE]")
    .usage("       $0 interactive [OPTIONS] [DIRECTORY]")
    .usage("       $0 display [OPTIONS] <FILE>")
    .command(["generate [file]", "$0"], "Generate areas", cliOptions, main)
    .command("interactive [directory]", "Start an interactive session", interactiveOptions, interactiveLoop)
    .command("display <file>", "Read file and print area to console", displayOptions, (argv) => display(argv as any as DisplayArgs));

// This executes the parsing of process.argv
cli.argv;


function main(argv: CliArgs) {
    let config = configFromArgs(argv);
    const area = amazer(config).generate();
    if (!argv.silent) {
        console.log(areaToString(area));
    }
    if (argv.file !== undefined) {
        areaToFile(area, argv.file, argv.format);
    }
    const configOutputPath = getConfigOutputPath(argv);
    if (configOutputPath !== undefined) {
        writeStructuredFile(configOutputPath, prepareAmazerConfig(config));
    }
}


function display(argv: DisplayArgs) {
    const area: Area = areaFromFile(argv.file, argv.format);
    console.log(areaToString(area));
}

function getConfigOutputPath(args: CliArgs): string | undefined {
    if (args.saveConfig === undefined) {
        return undefined;
    }
    const dotIndex = args.saveConfig.indexOf(".");
    if (dotIndex <= 0 && args.file === undefined) {
        return undefined;
    }
    if (dotIndex > 0) {
        return args.saveConfig;
    }

    const saveConfig = args.saveConfig.length == 0 ? "yml" : args.saveConfig.substr(dotIndex + 1);
    if (saveConfig === "yml" || saveConfig === "yaml" || saveConfig === "json") {
        const outputPath: string = args.file!;
        const filename = outputPath.substr(0, outputPath.length - outputPath.lastIndexOf(".") + 1);
        return `${filename}.${saveConfig}`
    } else {
        return `${saveConfig}.yml`
    }
}