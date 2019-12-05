import readlineSync from "readline-sync";
import yaml from "js-yaml";
import path from "path";
import fs from "fs";
import amazer, { Config, Area, areaToString, Dict } from "amazer";
import { InteractiveArgs } from "./options";
import { areaToFile, writeStructuredFile, AreaWritableFormat } from "./files";
import { prepareAmazerConfig, configFromArgs } from "./util";
import { cli } from "./main";


class Command {
    constructor(
        readonly aliases: string[],
        readonly description: string,
        readonly handler: (args: string[]) => void
    ) { }
}


// TODO Enable history usable with arrows
let targetDirectory: string;
let outputFormat: AreaWritableFormat | undefined;
let exit: boolean;
let generateArea: boolean;
let configArgs: Dict<any>;
let config: Config | undefined;
let area: Area | undefined;
let helpString: string = "This should be helpful"  // TODO Compile help string


const defaultCommand: Command = new Command(["set"], "Set generation options", args => {
    cli.parse(args, (err: Error, argv: InteractiveArgs, output: string) => {
        configArgs = {...configArgs, ...argv};
        if (argv.format !== undefined) {
            outputFormat = argv.format;
        }
        if (output) {
            console.log(output);
        }
        if (err) {
            console.log(helpString);
        }
    });
    generateArea = true;
})
// TODO Add revert command
const commands: Command[] = [
    new Command(["save", "s"], "Save the current area", args => {
        if (area !== undefined) {
            const file = args[0]
            const areaPath = determinePath(targetDirectory, file);
            areaToFile(area, areaPath, outputFormat);
        } else {
            console.log("No area could be generated due to previous error. Saving not possible.");
        }
        generateArea = true;
    }),
    new Command(["show-config", "c"], "Show the current configuration", _ => {
        if (config !== undefined) {
            // TODO Option to show defaults
            const configDict = prepareAmazerConfig(config);
            console.log(yaml.dump(configDict));
        } else {
            console.log("No config could be created due to previous error. Showing not possible.");
        }
    }),
    new Command(["save-config", "sc"], "Save the current configuration", args => {
        if (config !== undefined) {
            const file = args[0];
            const configPath = determinePath(targetDirectory, file, "area-config", "yml");
            writeStructuredFile(configPath, prepareAmazerConfig(config));
        } else {
            console.log("No config could be created due to previous error. Saving not possible.");
        }
    }),
    new Command(["exit", "quit", "q"], "Quit the application", _ => exit = true),
    new Command(["next", "n"], "Generate and display the next area", _ => generateArea = true),
    new Command(["help", "h"], "Show the help text", _ => console.log(helpString)),
    defaultCommand
]

export function interactiveLoop(args: InteractiveArgs) {
    targetDirectory = ".";
    if (args.directory !== undefined && args.directory.length > 0) {
        targetDirectory = args.directory;
    }
    outputFormat = args.format;

    exit = false;
    generateArea = true;
    configArgs = args;
    config = undefined;
    area = undefined;
    readlineSync.promptLoop(input => {
        const args = input.split(/\s+/)
        let commandToExecute = defaultCommand;
        let commandArgs = args;
        for (let command of commands) {
            if (command.aliases.includes(args[0])) {
                commandToExecute = command;
                commandArgs = args.slice(1);
                break;
            }
        }
        generateArea = false;
        commandToExecute.handler(commandArgs);

        if (generateArea) {
            try {
                config = configFromArgs(configArgs);
                area = amazer(config).generate();
                console.log(areaToString(area));
            } catch(error) {
                console.log(`Error: ${error.message}`);
                config = undefined;
                area = undefined;
            }
        }
        return exit;
    });
}

function determinePath(directory: string, name?: string | undefined, fallbackName="area", fallbackType="mz"): string {
    if (name) {
        if (!path.extname(name)) {
            name = `${name}.${fallbackType}`;
        }
        return path.join(directory, name);
    }
    let i = 1;
    let p: string;
    do {
        p = path.join(directory, `${fallbackName}${i}.${fallbackType}`);
        i++;
    } while (fs.existsSync(p));
    return p;
}