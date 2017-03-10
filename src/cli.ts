import {server, run} from ".";

const DEFAULTRUNOPTIONS = {
  port: 3000,
  verbosity: 'silly'
}

/**
 * parse command line options
 */
const commandLineArgs = require('command-line-args')
const optionDefinitions = [
  { name: 'verbosity', alias: 'v', type: String },
  { name: 'port', alias: 'p', type: Number }
]
const cla = commandLineArgs(optionDefinitions);
/** end parse command line argunments */


run(Object.assign(DEFAULTRUNOPTIONS, cla));