#!/usr/bin/env node

var _ = require('underscore');
var fs = require('fs');
var program = require('commander');
var tilde = require('tilde-expansion');
var prompt = require('prompt');

var ts = require('../lib/ts');

var package_json = require('../package.json');

var settings_schema = {
    properties: {
      from: {
        type: 'string',
        description: 'Your TeamSnippets.com e-mail',
        pattern: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        message: 'this is not an e-email address',
        required: true
      },
      team: {
        conform: parseInt,
        description: 'Your TeamSnippets team number',
        message: 'must be a number',
        required: true
      }
    }
  };

function store(filepath, valid, callback) {
  tilde(filepath, function(filepath) {
    var store;
    try {
      store = require( filepath );
    } catch(e) {
      if(e.code && e.code == 'MODULE_NOT_FOUND') {
        console.error('warning: no config file, using defaults.');
        store = {
          records: [],
          history: []
        };
      } else {
        throw e;
      }
    }

    if(!store.records) store.records = [];
    if(!store.history) store.history = [];

    var run = function run() {
      callback(store, function(changed) {
        if(changed !== false) {
          fs.writeFileSync(filepath, JSON.stringify(store, null, 2));
        }
      });
    };

    if(valid && (!store.from || !store.team)) {
      prompt.colors = false;
      prompt.start();
      if(store.from) delete settings_schema.properties.from;
      if(store.team) delete settings_schema.properties.team;
      prompt.get(settings_schema, function(err, result) {
        if(err) {
          console.error(err);
          process.exit(1);
        }
        store.from = result.from;
        store.team = result.team;
        fs.writeFileSync(filepath, JSON.stringify(store, null, 2));
        run();
      });
    } else {
      run();
    }
  });
}

program
  .version(package_json.version)
  .description(package_json.description)
  .option('-v, --verbose', 'display what\'s going on')
  .option('-q, --quiet', 'suppress all output (expect for error\'s)')
  .option('-c, --config <file>', 'config/store file to use [~/.teamsnippets.json]', '~/.teamsnippets.json')
  .on('--help', function() {
    console.log( '  Example:\n');
    console.log( '    $ ts Wrote code');
    console.log( '    $ ts Has a meeting about coffee');
    console.log( '    $ ts stage');
    console.log( '    $ ts post\n');

    console.log( '  Protip:\n\n    Change your TeamSnippets.com settings to use Markdown!\n');
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
    store(program.config, true, function(store, done) {

      if(store.records.length == 0) {
        console.log('# Your TeamSnippets stage is currently clean, get workin\'!')
      } else {
        if(program.verbose) {
          console.log('# Posting the following update to team ' + store.team + ':');
          console.log(ts.format_post(store.records)+'\n');
        }
        ts.postupdate(store.records, {
          from: store.from,
          team: store.team,
          dryrun: options.dryrun
        }, function(err, result) {
          if(err) {
            console.error('error: failed to post update: ' + err.message );
            process.exit(1);
          }
          store.history.push({
            posted: new Date(),
            records: store.records,
          });
          store.records = [];
          if(program.verbose) {
            console.log(options.dryrun ? '# not sent' : '# sent');
          }
          done(!options.dryrun);
        });
      }
    });
  });

program
  .command('stage')
  .description('list record currently on stage')
  .action(function(options){
    store(program.config, false, function(store, done) {
      if(store.records.length == 0) {
        console.log('# Your TeamSnippets stage is currently clean, get workin\'!')
      } else {
        console.log('# TeamSnippets currently on stage:\n');
        console.log(ts.format_post(store.records)+'\n');
      }
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
    store(program.config, false, function(store, done) {
      store.records.push({text: line, date: new Date()});
      done(true);
    });
  });

program.parse(process.argv);

if(program.args.length == 0) {
  program.outputHelp();
  process.exit(65);
}
