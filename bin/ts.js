#!/usr/bin/env node

var _ = require('underscore');
var fs = require('fs');
var program = require('commander');
var tilde = require('tilde-expansion');

var ts = require('../lib/ts');

function store(filepath, callback) {
  tilde(filepath, function(filepath) {
    var store;
    try {
      store = require( filepath );
    } catch(e) {
      if(e.code && e.code == 'MODULE_NOT_FOUND') {
        console.error('warning: no config file, using defaults.');
        store = {
          records: []
        };
      } else {
        throw e;
      }
    }
    callback(store, function(changed) {
      if(changed !== false) {
        fs.writeFileSync(filepath, JSON.stringify(store));
      }
    });
  });
}

program
  .version('0.0.0')
  .option('-v, --verbose', 'display what\'s going on')
  .option('-q, --quiet', 'suppress all output (expect for error\'s)')
  .option('-c, --config <file>', 'config/store file to use [~/.teamsnippets.json]', '~/.teamsnippets.json')
  .on('--help', function() {
    console.log( '  Example:\n');
    console.log( '    $ ts Wrote code');
    console.log( '    $ ts Has a meeting about coffee');
    console.log( '    $ ts stage');
    console.log( '    $ ts send\n');

    console.log( '  Protip:\n\n    Change your teamsnippts settings to use Markdown!\n');
  })
  .on('--verbose', function() {
    console.log('asd');
  });

program
  .command('post')
  .description('post an update of all records on stage to TeamSnippets.com')
  //.option('-y, --yes', 'send without confirmation')
  .option('-d, --dryrun', 'don\'t accually send any data')
  .action(function(options){
    store(program.config, function(store, done) {
      ts.postupdate(store.records, {
        from: store.from,
        team: store.team,
        dryrun: options.dryrun
      }, function(err, result) {
        if(err) {
          console.error('error: failed to post update: ' + err.message );
          process.exit(1);
        }
        store.records = [];
        done(!options.dryrun);
      });
    });
  });

program
  .command('stage')
  .description('list record currently on stage')
  .action(function(options){
    store(program.config, function(store, done) {
      console.log('stage');
      console.log(store);
      done(false);
    });
  });

program
  .command('*')
  .description('write a new record on stage')
  .action(function(options){
    var args = _.toArray(arguments);
    args.pop();
    var line = args.join(' ');
    store(program.config, function(store, done) {
      store.records.push({text: line, date: new Date()});
      done(true);
    });
  });

program.parse(process.argv);

if(program.args.length == 0) {
  program.outputHelp();
  process.exit(65);
}
