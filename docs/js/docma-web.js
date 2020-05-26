/*! dustjs-linkedin - v2.7.5
* http://dustjs.com/
* Copyright (c) 2016 Aleksander Williams; Released under the MIT License */
(function (root, factory) {
  if (typeof define === 'function' && define.amd && define.amd.dust === true) {
    define('dust.core', [], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.dust = factory();
  }
}(this, function() {
  var dust = {
        "version": "2.7.5"
      },
      NONE = 'NONE', ERROR = 'ERROR', WARN = 'WARN', INFO = 'INFO', DEBUG = 'DEBUG',
      EMPTY_FUNC = function() {};

  dust.config = {
    whitespace: false,
    amd: false,
    cjs: false,
    cache: true
  };

  // Directive aliases to minify code
  dust._aliases = {
    "write": "w",
    "end": "e",
    "map": "m",
    "render": "r",
    "reference": "f",
    "section": "s",
    "exists": "x",
    "notexists": "nx",
    "block": "b",
    "partial": "p",
    "helper": "h"
  };

  (function initLogging() {
    /*global process, console*/
    var loggingLevels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 },
        consoleLog,
        log;

    if (typeof console !== 'undefined' && console.log) {
      consoleLog = console.log;
      if(typeof consoleLog === 'function') {
        log = function() {
          consoleLog.apply(console, arguments);
        };
      } else {
        log = function() {
          consoleLog(Array.prototype.slice.apply(arguments).join(' '));
        };
      }
    } else {
      log = EMPTY_FUNC;
    }

    /**
     * Filters messages based on `dust.debugLevel`.
     * This default implementation will print to the console if it exists.
     * @param {String|Error} message the message to print/throw
     * @param {String} type the severity of the message(ERROR, WARN, INFO, or DEBUG)
     * @public
     */
    dust.log = function(message, type) {
      type = type || INFO;
      if (loggingLevels[type] >= loggingLevels[dust.debugLevel]) {
        log('[DUST:' + type + ']', message);
      }
    };

    dust.debugLevel = NONE;
    if(typeof process !== 'undefined' && process.env && /\bdust\b/.test(process.env.DEBUG)) {
      dust.debugLevel = DEBUG;
    }

  }());

  dust.helpers = {};

  dust.cache = {};

  dust.register = function(name, tmpl) {
    if (!name) {
      return;
    }
    tmpl.templateName = name;
    if (dust.config.cache !== false) {
      dust.cache[name] = tmpl;
    }
  };

  dust.render = function(nameOrTemplate, context, callback) {
    var chunk = new Stub(callback).head;
    try {
      load(nameOrTemplate, chunk, context).end();
    } catch (err) {
      chunk.setError(err);
    }
  };

  dust.stream = function(nameOrTemplate, context) {
    var stream = new Stream(),
        chunk = stream.head;
    dust.nextTick(function() {
      try {
        load(nameOrTemplate, chunk, context).end();
      } catch (err) {
        chunk.setError(err);
      }
    });
    return stream;
  };

  /**
   * Extracts a template function (body_0) from whatever is passed.
   * @param nameOrTemplate {*} Could be:
   *   - the name of a template to load from cache
   *   - a CommonJS-compiled template (a function with a `template` property)
   *   - a template function
   * @param loadFromCache {Boolean} if false, don't look in the cache
   * @return {Function} a template function, if found
   */
  function getTemplate(nameOrTemplate, loadFromCache/*=true*/) {
    if(!nameOrTemplate) {
      return;
    }
    if(typeof nameOrTemplate === 'function' && nameOrTemplate.template) {
      // Sugar away CommonJS module templates
      return nameOrTemplate.template;
    }
    if(dust.isTemplateFn(nameOrTemplate)) {
      // Template functions passed directly
      return nameOrTemplate;
    }
    if(loadFromCache !== false) {
      // Try loading a template with this name from cache
      return dust.cache[nameOrTemplate];
    }
  }

  function load(nameOrTemplate, chunk, context) {
    if(!nameOrTemplate) {
      return chunk.setError(new Error('No template or template name provided to render'));
    }

    var template = getTemplate(nameOrTemplate, dust.config.cache);

    if (template) {
      return template(chunk, Context.wrap(context, template.templateName));
    } else {
      if (dust.onLoad) {
        return chunk.map(function(chunk) {
          // Alias just so it's easier to read that this would always be a name
          var name = nameOrTemplate;
          // Three possible scenarios for a successful callback:
          //   - `require(nameOrTemplate)(dust); cb()`
          //   - `src = readFile('src.dust'); cb(null, src)`
          //   - `compiledTemplate = require(nameOrTemplate)(dust); cb(null, compiledTemplate)`
          function done(err, srcOrTemplate) {
            var template;
            if (err) {
              return chunk.setError(err);
            }
            // Prefer a template that is passed via callback over the cached version.
            template = getTemplate(srcOrTemplate, false) || getTemplate(name, dust.config.cache);
            if (!template) {
              // It's a template string, compile it and register under `name`
              if(dust.compile) {
                template = dust.loadSource(dust.compile(srcOrTemplate, name));
              } else {
                return chunk.setError(new Error('Dust compiler not available'));
              }
            }
            template(chunk, Context.wrap(context, template.templateName)).end();
          }

          if(dust.onLoad.length === 3) {
            dust.onLoad(name, context.options, done);
          } else {
            dust.onLoad(name, done);
          }
        });
      }
      return chunk.setError(new Error('Template Not Found: ' + nameOrTemplate));
    }
  }

  dust.loadSource = function(source) {
    /*jshint evil:true*/
    return eval(source);
  };

  if (Array.isArray) {
    dust.isArray = Array.isArray;
  } else {
    dust.isArray = function(arr) {
      return Object.prototype.toString.call(arr) === '[object Array]';
    };
  }

  dust.nextTick = (function() {
    return function(callback) {
      setTimeout(callback, 0);
    };
  })();

  /**
   * Dust has its own rules for what is "empty"-- which is not the same as falsy.
   * Empty arrays, null, and undefined are empty
   */
  dust.isEmpty = function(value) {
    if (value === 0) {
      return false;
    }
    if (dust.isArray(value) && !value.length) {
      return true;
    }
    return !value;
  };

  dust.isEmptyObject = function(obj) {
    var key;
    if (obj === null) {
      return false;
    }
    if (obj === undefined) {
      return false;
    }
    if (obj.length > 0) {
      return false;
    }
    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return true;
  };

  dust.isTemplateFn = function(elem) {
    return typeof elem === 'function' &&
           elem.__dustBody;
  };

  /**
   * Decide somewhat-naively if something is a Thenable.
   * @param elem {*} object to inspect
   * @return {Boolean} is `elem` a Thenable?
   */
  dust.isThenable = function(elem) {
    return elem &&
           typeof elem === 'object' &&
           typeof elem.then === 'function';
  };

  /**
   * Decide very naively if something is a Stream.
   * @param elem {*} object to inspect
   * @return {Boolean} is `elem` a Stream?
   */
  dust.isStreamable = function(elem) {
    return elem &&
           typeof elem.on === 'function' &&
           typeof elem.pipe === 'function';
  };

  // apply the filter chain and return the output string
  dust.filter = function(string, auto, filters, context) {
    var i, len, name, filter;
    if (filters) {
      for (i = 0, len = filters.length; i < len; i++) {
        name = filters[i];
        if (!name.length) {
          continue;
        }
        filter = dust.filters[name];
        if (name === 's') {
          auto = null;
        } else if (typeof filter === 'function') {
          string = filter(string, context);
        } else {
          dust.log('Invalid filter `' + name + '`', WARN);
        }
      }
    }
    // by default always apply the h filter, unless asked to unescape with |s
    if (auto) {
      string = dust.filters[auto](string, context);
    }
    return string;
  };

  dust.filters = {
    h: function(value) { return dust.escapeHtml(value); },
    j: function(value) { return dust.escapeJs(value); },
    u: encodeURI,
    uc: encodeURIComponent,
    js: function(value) { return dust.escapeJSON(value); },
    jp: function(value) {
      if (!JSON) {dust.log('JSON is undefined; could not parse `' + value + '`', WARN);
        return value;
      } else {
        return JSON.parse(value);
      }
    }
  };

  function Context(stack, global, options, blocks, templateName) {
    if(stack !== undefined && !(stack instanceof Stack)) {
      stack = new Stack(stack);
    }
    this.stack = stack;
    this.global = global;
    this.options = options;
    this.blocks = blocks;
    this.templateName = templateName;
    this._isContext = true;
  }

  dust.makeBase = dust.context = function(global, options) {
    return new Context(undefined, global, options);
  };

  dust.isContext = function(obj) {
    return typeof obj === "object" && obj._isContext === true;
  };

  /**
   * Factory function that creates a closure scope around a Thenable-callback.
   * Returns a function that can be passed to a Thenable that will resume a
   * Context lookup once the Thenable resolves with new data, adding that new
   * data to the lookup stack.
   */
  function getWithResolvedData(ctx, cur, down) {
    return function(data) {
      return ctx.push(data)._get(cur, down);
    };
  }

  Context.wrap = function(context, name) {
    if (dust.isContext(context)) {
      return context;
    }
    return new Context(context, {}, {}, null, name);
  };

  /**
   * Public API for getting a value from the context.
   * @method get
   * @param {string|array} path The path to the value. Supported formats are:
   * 'key'
   * 'path.to.key'
   * '.path.to.key'
   * ['path', 'to', 'key']
   * ['key']
   * @param {boolean} [cur=false] Boolean which determines if the search should be limited to the
   * current context (true), or if get should search in parent contexts as well (false).
   * @public
   * @returns {string|object}
   */
  Context.prototype.get = function(path, cur) {
    if (typeof path === 'string') {
      if (path[0] === '.') {
        cur = true;
        path = path.substr(1);
      }
      path = path.split('.');
    }
    return this._get(cur, path);
  };

  /**
   * Get a value from the context
   * @method _get
   * @param {boolean} cur Get only from the current context
   * @param {array} down An array of each step in the path
   * @private
   * @return {string | object}
   */
  Context.prototype._get = function(cur, down) {
    var ctx = this.stack || {},
        i = 1,
        value, first, len, ctxThis, fn;

    first = down[0];
    len = down.length;

    if (cur && len === 0) {
      ctxThis = ctx;
      ctx = ctx.head;
    } else {
      if (!cur) {
        // Search up the stack for the first value
        while (ctx) {
          if (ctx.isObject) {
            ctxThis = ctx.head;
            value = ctx.head[first];
            if (value !== undefined) {
              break;
            }
          }
          ctx = ctx.tail;
        }

        // Try looking in the global context if we haven't found anything yet
        if (value !== undefined) {
          ctx = value;
        } else {
          ctx = this.global && this.global[first];
        }
      } else if (ctx) {
        // if scope is limited by a leading dot, don't search up the tree
        if(ctx.head) {
          ctx = ctx.head[first];
        } else {
          // context's head is empty, value we are searching for is not defined
          ctx = undefined;
        }
      }

      while (ctx && i < len) {
        if (dust.isThenable(ctx)) {
          // Bail early by returning a Thenable for the remainder of the search tree
          return ctx.then(getWithResolvedData(this, cur, down.slice(i)));
        }
        ctxThis = ctx;
        ctx = ctx[down[i]];
        i++;
      }
    }

    if (typeof ctx === 'function') {
      fn = function() {
        try {
          return ctx.apply(ctxThis, arguments);
        } catch (err) {
          dust.log(err, ERROR);
          throw err;
        }
      };
      fn.__dustBody = !!ctx.__dustBody;
      return fn;
    } else {
      if (ctx === undefined) {
        dust.log('Cannot find reference `{' + down.join('.') + '}` in template `' + this.getTemplateName() + '`', INFO);
      }
      return ctx;
    }
  };

  Context.prototype.getPath = function(cur, down) {
    return this._get(cur, down);
  };

  Context.prototype.push = function(head, idx, len) {
    if(head === undefined) {
      dust.log("Not pushing an undefined variable onto the context", INFO);
      return this;
    }
    return this.rebase(new Stack(head, this.stack, idx, len));
  };

  Context.prototype.pop = function() {
    var head = this.current();
    this.stack = this.stack && this.stack.tail;
    return head;
  };

  Context.prototype.rebase = function(head) {
    return new Context(head, this.global, this.options, this.blocks, this.getTemplateName());
  };

  Context.prototype.clone = function() {
    var context = this.rebase();
    context.stack = this.stack;
    return context;
  };

  Context.prototype.current = function() {
    return this.stack && this.stack.head;
  };

  Context.prototype.getBlock = function(key) {
    var blocks, len, fn;

    if (typeof key === 'function') {
      key = key(new Chunk(), this).data.join('');
    }

    blocks = this.blocks;

    if (!blocks) {
      dust.log('No blocks for context `' + key + '` in template `' + this.getTemplateName() + '`', DEBUG);
      return false;
    }

    len = blocks.length;
    while (len--) {
      fn = blocks[len][key];
      if (fn) {
        return fn;
      }
    }

    dust.log('Malformed template `' + this.getTemplateName() + '` was missing one or more blocks.');
    return false;
  };

  Context.prototype.shiftBlocks = function(locals) {
    var blocks = this.blocks,
        newBlocks;

    if (locals) {
      if (!blocks) {
        newBlocks = [locals];
      } else {
        newBlocks = blocks.concat([locals]);
      }
      return new Context(this.stack, this.global, this.options, newBlocks, this.getTemplateName());
    }
    return this;
  };

  Context.prototype.resolve = function(body) {
    var chunk;

    if(typeof body !== 'function') {
      return body;
    }
    chunk = new Chunk().render(body, this);
    if(chunk instanceof Chunk) {
      return chunk.data.join(''); // ie7 perf
    }
    return chunk;
  };

  Context.prototype.getTemplateName = function() {
    return this.templateName;
  };

  function Stack(head, tail, idx, len) {
    this.tail = tail;
    this.isObject = head && typeof head === 'object';
    this.head = head;
    this.index = idx;
    this.of = len;
  }

  function Stub(callback) {
    this.head = new Chunk(this);
    this.callback = callback;
    this.out = '';
  }

  Stub.prototype.flush = function() {
    var chunk = this.head;

    while (chunk) {
      if (chunk.flushable) {
        this.out += chunk.data.join(''); //ie7 perf
      } else if (chunk.error) {
        this.callback(chunk.error);
        dust.log('Rendering failed with error `' + chunk.error + '`', ERROR);
        this.flush = EMPTY_FUNC;
        return;
      } else {
        return;
      }
      chunk = chunk.next;
      this.head = chunk;
    }
    this.callback(null, this.out);
  };

  /**
   * Creates an interface sort of like a Streams2 ReadableStream.
   */
  function Stream() {
    this.head = new Chunk(this);
  }

  Stream.prototype.flush = function() {
    var chunk = this.head;

    while(chunk) {
      if (chunk.flushable) {
        this.emit('data', chunk.data.join('')); //ie7 perf
      } else if (chunk.error) {
        this.emit('error', chunk.error);
        this.emit('end');
        dust.log('Streaming failed with error `' + chunk.error + '`', ERROR);
        this.flush = EMPTY_FUNC;
        return;
      } else {
        return;
      }
      chunk = chunk.next;
      this.head = chunk;
    }
    this.emit('end');
  };

  /**
   * Executes listeners for `type` by passing data. Note that this is different from a
   * Node stream, which can pass an arbitrary number of arguments
   * @return `true` if event had listeners, `false` otherwise
   */
  Stream.prototype.emit = function(type, data) {
    var events = this.events || {},
        handlers = events[type] || [],
        i, l;

    if (!handlers.length) {
      dust.log('Stream broadcasting, but no listeners for `' + type + '`', DEBUG);
      return false;
    }

    handlers = handlers.slice(0);
    for (i = 0, l = handlers.length; i < l; i++) {
      handlers[i](data);
    }
    return true;
  };

  Stream.prototype.on = function(type, callback) {
    var events = this.events = this.events || {},
        handlers = events[type] = events[type] || [];

    if(typeof callback !== 'function') {
      dust.log('No callback function provided for `' + type + '` event listener', WARN);
    } else {
      handlers.push(callback);
    }
    return this;
  };

  /**
   * Pipes to a WritableStream. Note that backpressure isn't implemented,
   * so we just write as fast as we can.
   * @param stream {WritableStream}
   * @return self
   */
  Stream.prototype.pipe = function(stream) {
    if(typeof stream.write !== 'function' ||
       typeof stream.end !== 'function') {
      dust.log('Incompatible stream passed to `pipe`', WARN);
      return this;
    }

    var destEnded = false;

    if(typeof stream.emit === 'function') {
      stream.emit('pipe', this);
    }

    if(typeof stream.on === 'function') {
      stream.on('error', function() {
        destEnded = true;
      });
    }

    return this
    .on('data', function(data) {
      if(destEnded) {
        return;
      }
      try {
        stream.write(data, 'utf8');
      } catch (err) {
        dust.log(err, ERROR);
      }
    })
    .on('end', function() {
      if(destEnded) {
        return;
      }
      try {
        stream.end();
        destEnded = true;
      } catch (err) {
        dust.log(err, ERROR);
      }
    });
  };

  function Chunk(root, next, taps) {
    this.root = root;
    this.next = next;
    this.data = []; //ie7 perf
    this.flushable = false;
    this.taps = taps;
  }

  Chunk.prototype.write = function(data) {
    var taps = this.taps;

    if (taps) {
      data = taps.go(data);
    }
    this.data.push(data);
    return this;
  };

  Chunk.prototype.end = function(data) {
    if (data) {
      this.write(data);
    }
    this.flushable = true;
    this.root.flush();
    return this;
  };

  Chunk.prototype.map = function(callback) {
    var cursor = new Chunk(this.root, this.next, this.taps),
        branch = new Chunk(this.root, cursor, this.taps);

    this.next = branch;
    this.flushable = true;
    try {
      callback(branch);
    } catch(err) {
      dust.log(err, ERROR);
      branch.setError(err);
    }
    return cursor;
  };

  Chunk.prototype.tap = function(tap) {
    var taps = this.taps;

    if (taps) {
      this.taps = taps.push(tap);
    } else {
      this.taps = new Tap(tap);
    }
    return this;
  };

  Chunk.prototype.untap = function() {
    this.taps = this.taps.tail;
    return this;
  };

  Chunk.prototype.render = function(body, context) {
    return body(this, context);
  };

  Chunk.prototype.reference = function(elem, context, auto, filters) {
    if (typeof elem === 'function') {
      elem = elem.apply(context.current(), [this, context, null, {auto: auto, filters: filters}]);
      if (elem instanceof Chunk) {
        return elem;
      } else {
        return this.reference(elem, context, auto, filters);
      }
    }
    if (dust.isThenable(elem)) {
      return this.await(elem, context, null, auto, filters);
    } else if (dust.isStreamable(elem)) {
      return this.stream(elem, context, null, auto, filters);
    } else if (!dust.isEmpty(elem)) {
      return this.write(dust.filter(elem, auto, filters, context));
    } else {
      return this;
    }
  };

  Chunk.prototype.section = function(elem, context, bodies, params) {
    var body = bodies.block,
        skip = bodies['else'],
        chunk = this,
        i, len, head;

    if (typeof elem === 'function' && !dust.isTemplateFn(elem)) {
      try {
        elem = elem.apply(context.current(), [this, context, bodies, params]);
      } catch(err) {
        dust.log(err, ERROR);
        return this.setError(err);
      }
      // Functions that return chunks are assumed to have handled the chunk manually.
      // Make that chunk the current one and go to the next method in the chain.
      if (elem instanceof Chunk) {
        return elem;
      }
    }

    if (dust.isEmptyObject(bodies)) {
      // No bodies to render, and we've already invoked any function that was available in
      // hopes of returning a Chunk.
      return chunk;
    }

    if (!dust.isEmptyObject(params)) {
      context = context.push(params);
    }

    /*
    Dust's default behavior is to enumerate over the array elem, passing each object in the array to the block.
    When elem resolves to a value or object instead of an array, Dust sets the current context to the value
    and renders the block one time.
    */
    if (dust.isArray(elem)) {
      if (body) {
        len = elem.length;
        if (len > 0) {
          head = context.stack && context.stack.head || {};
          head.$len = len;
          for (i = 0; i < len; i++) {
            head.$idx = i;
            chunk = body(chunk, context.push(elem[i], i, len));
          }
          head.$idx = undefined;
          head.$len = undefined;
          return chunk;
        } else if (skip) {
          return skip(this, context);
        }
      }
    } else if (dust.isThenable(elem)) {
      return this.await(elem, context, bodies);
    } else if (dust.isStreamable(elem)) {
      return this.stream(elem, context, bodies);
    } else if (elem === true) {
     // true is truthy but does not change context
      if (body) {
        return body(this, context);
      }
    } else if (elem || elem === 0) {
       // everything that evaluates to true are truthy ( e.g. Non-empty strings and Empty objects are truthy. )
       // zero is truthy
       // for anonymous functions that did not returns a chunk, truthiness is evaluated based on the return value
      if (body) {
        return body(this, context.push(elem));
      }
     // nonexistent, scalar false value, scalar empty string, null,
     // undefined are all falsy
    } else if (skip) {
      return skip(this, context);
    }
    dust.log('Section without corresponding key in template `' + context.getTemplateName() + '`', DEBUG);
    return this;
  };

  Chunk.prototype.exists = function(elem, context, bodies) {
    var body = bodies.block,
        skip = bodies['else'];

    if (!dust.isEmpty(elem)) {
      if (body) {
        return body(this, context);
      }
      dust.log('No block for exists check in template `' + context.getTemplateName() + '`', DEBUG);
    } else if (skip) {
      return skip(this, context);
    }
    return this;
  };

  Chunk.prototype.notexists = function(elem, context, bodies) {
    var body = bodies.block,
        skip = bodies['else'];

    if (dust.isEmpty(elem)) {
      if (body) {
        return body(this, context);
      }
      dust.log('No block for not-exists check in template `' + context.getTemplateName() + '`', DEBUG);
    } else if (skip) {
      return skip(this, context);
    }
    return this;
  };

  Chunk.prototype.block = function(elem, context, bodies) {
    var body = elem || bodies.block;

    if (body) {
      return body(this, context);
    }
    return this;
  };

  Chunk.prototype.partial = function(elem, context, partialContext, params) {
    var head;

    if(params === undefined) {
      // Compatibility for < 2.7.0 where `partialContext` did not exist
      params = partialContext;
      partialContext = context;
    }

    if (!dust.isEmptyObject(params)) {
      partialContext = partialContext.clone();
      head = partialContext.pop();
      partialContext = partialContext.push(params)
                                     .push(head);
    }

    if (dust.isTemplateFn(elem)) {
      // The eventual result of evaluating `elem` is a partial name
      // Load the partial after getting its name and end the async chunk
      return this.capture(elem, context, function(name, chunk) {
        partialContext.templateName = name;
        load(name, chunk, partialContext).end();
      });
    } else {
      partialContext.templateName = elem;
      return load(elem, this, partialContext);
    }
  };

  Chunk.prototype.helper = function(name, context, bodies, params, auto) {
    var chunk = this,
        filters = params.filters,
        ret;

    // Pre-2.7.1 compat: if auto is undefined, it's an old template. Automatically escape
    if (auto === undefined) {
      auto = 'h';
    }

    // handle invalid helpers, similar to invalid filters
    if(dust.helpers[name]) {
      try {
        ret = dust.helpers[name](chunk, context, bodies, params);
        if (ret instanceof Chunk) {
          return ret;
        }
        if(typeof filters === 'string') {
          filters = filters.split('|');
        }
        if (!dust.isEmptyObject(bodies)) {
          return chunk.section(ret, context, bodies, params);
        }
        // Helpers act slightly differently from functions in context in that they will act as
        // a reference if they are self-closing (due to grammar limitations)
        // In the Chunk.await function we check to make sure bodies is null before acting as a reference
        return chunk.reference(ret, context, auto, filters);
      } catch(err) {
        dust.log('Error in helper `' + name + '`: ' + err.message, ERROR);
        return chunk.setError(err);
      }
    } else {
      dust.log('Helper `' + name + '` does not exist', WARN);
      return chunk;
    }
  };

  /**
   * Reserve a chunk to be evaluated once a thenable is resolved or rejected
   * @param thenable {Thenable} the target thenable to await
   * @param context {Context} context to use to render the deferred chunk
   * @param bodies {Object} must contain a "body", may contain an "error"
   * @param auto {String} automatically apply this filter if the Thenable is a reference
   * @param filters {Array} apply these filters if the Thenable is a reference
   * @return {Chunk}
   */
  Chunk.prototype.await = function(thenable, context, bodies, auto, filters) {
    return this.map(function(chunk) {
      thenable.then(function(data) {
        if (bodies) {
          chunk = chunk.section(data, context, bodies);
        } else {
          // Actually a reference. Self-closing sections don't render
          chunk = chunk.reference(data, context, auto, filters);
        }
        chunk.end();
      }, function(err) {
        var errorBody = bodies && bodies.error;
        if(errorBody) {
          chunk.render(errorBody, context.push(err)).end();
        } else {
          dust.log('Unhandled promise rejection in `' + context.getTemplateName() + '`', INFO);
          chunk.end();
        }
      });
    });
  };

  /**
   * Reserve a chunk to be evaluated with the contents of a streamable.
   * Currently an error event will bomb out the stream. Once an error
   * is received, we push it to an {:error} block if one exists, and log otherwise,
   * then stop listening to the stream.
   * @param streamable {Streamable} the target streamable that will emit events
   * @param context {Context} context to use to render each thunk
   * @param bodies {Object} must contain a "body", may contain an "error"
   * @return {Chunk}
   */
  Chunk.prototype.stream = function(stream, context, bodies, auto, filters) {
    var body = bodies && bodies.block,
        errorBody = bodies && bodies.error;
    return this.map(function(chunk) {
      var ended = false;
      stream
        .on('data', function data(thunk) {
          if(ended) {
            return;
          }
          if(body) {
            // Fork a new chunk out of the blockstream so that we can flush it independently
            chunk = chunk.map(function(chunk) {
              chunk.render(body, context.push(thunk)).end();
            });
          } else if(!bodies) {
            // When actually a reference, don't fork, just write into the master async chunk
            chunk = chunk.reference(thunk, context, auto, filters);
          }
        })
        .on('error', function error(err) {
          if(ended) {
            return;
          }
          if(errorBody) {
            chunk.render(errorBody, context.push(err));
          } else {
            dust.log('Unhandled stream error in `' + context.getTemplateName() + '`', INFO);
          }
          if(!ended) {
            ended = true;
            chunk.end();
          }
        })
        .on('end', function end() {
          if(!ended) {
            ended = true;
            chunk.end();
          }
        });
    });
  };

  Chunk.prototype.capture = function(body, context, callback) {
    return this.map(function(chunk) {
      var stub = new Stub(function(err, out) {
        if (err) {
          chunk.setError(err);
        } else {
          callback(out, chunk);
        }
      });
      body(stub.head, context).end();
    });
  };

  Chunk.prototype.setError = function(err) {
    this.error = err;
    this.root.flush();
    return this;
  };

  // Chunk aliases
  for(var f in Chunk.prototype) {
    if(dust._aliases[f]) {
      Chunk.prototype[dust._aliases[f]] = Chunk.prototype[f];
    }
  }

  function Tap(head, tail) {
    this.head = head;
    this.tail = tail;
  }

  Tap.prototype.push = function(tap) {
    return new Tap(tap, this);
  };

  Tap.prototype.go = function(value) {
    var tap = this;

    while(tap) {
      value = tap.head(value);
      tap = tap.tail;
    }
    return value;
  };

  var HCHARS = /[&<>"']/,
      AMP    = /&/g,
      LT     = /</g,
      GT     = />/g,
      QUOT   = /\"/g,
      SQUOT  = /\'/g;

  dust.escapeHtml = function(s) {
    if (typeof s === "string" || (s && typeof s.toString === "function")) {
      if (typeof s !== "string") {
        s = s.toString();
      }
      if (!HCHARS.test(s)) {
        return s;
      }
      return s.replace(AMP,'&amp;').replace(LT,'&lt;').replace(GT,'&gt;').replace(QUOT,'&quot;').replace(SQUOT, '&#39;');
    }
    return s;
  };

  var BS = /\\/g,
      FS = /\//g,
      CR = /\r/g,
      LS = /\u2028/g,
      PS = /\u2029/g,
      NL = /\n/g,
      LF = /\f/g,
      SQ = /'/g,
      DQ = /"/g,
      TB = /\t/g;

  dust.escapeJs = function(s) {
    if (typeof s === 'string') {
      return s
        .replace(BS, '\\\\')
        .replace(FS, '\\/')
        .replace(DQ, '\\"')
        .replace(SQ, '\\\'')
        .replace(CR, '\\r')
        .replace(LS, '\\u2028')
        .replace(PS, '\\u2029')
        .replace(NL, '\\n')
        .replace(LF, '\\f')
        .replace(TB, '\\t');
    }
    return s;
  };

  dust.escapeJSON = function(o) {
    if (!JSON) {
      dust.log('JSON is undefined; could not escape `' + o + '`', WARN);
      return o;
    } else {
      return JSON.stringify(o)
        .replace(LS, '\\u2028')
        .replace(PS, '\\u2029')
        .replace(LT, '\\u003c');
    }
  };

  return dust;

}));

if (typeof define === "function" && define.amd && define.amd.dust === true) {
    define(["require", "dust.core"], function(require, dust) {
        dust.onLoad = function(name, cb) {
            require([name], function() {
                cb();
            });
        };
        return dust;
    });
}

/*! dustjs-helpers - v1.7.4
* http://dustjs.com/
* Copyright (c) 2017 Aleksander Williams; Released under the MIT License */
(function(root, factory) {
  if (typeof define === 'function' && define.amd && define.amd.dust === true) {
    define(['dust.core'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('dustjs-linkedin'));
    module.exports.registerWith = factory;
  } else {
    factory(root.dust);
  }
}(this, function(dust) {

function log(helper, msg, level) {
  level = level || "INFO";
  helper = helper ? '{@' + helper + '}: ' : '';
  dust.log(helper + msg, level);
}

var _deprecatedCache = {};
function _deprecated(target) {
  if(_deprecatedCache[target]) { return; }
  log(target, "Deprecation warning: " + target + " is deprecated and will be removed in a future version of dustjs-helpers", "WARN");
  log(null, "For help and a deprecation timeline, see https://github.com/linkedin/dustjs-helpers/wiki/Deprecated-Features#" + target.replace(/\W+/g, ""), "WARN");
  _deprecatedCache[target] = true;
}

function isSelect(context) {
  return context.stack.tail &&
         context.stack.tail.head &&
         typeof context.stack.tail.head.__select__ !== "undefined";
}

function getSelectState(context) {
  return isSelect(context) && context.get('__select__');
}

/**
 * Adds a special __select__ key behind the head of the context stack. Used to maintain the state
 * of {@select} blocks
 * @param context {Context} add state to this Context
 * @param opts {Object} add these properties to the state (`key` and `type`)
 */
function addSelectState(context, opts) {
  var head = context.stack.head,
      newContext = context.rebase(),
      key;

  if(context.stack && context.stack.tail) {
    newContext.stack = context.stack.tail;
  }

  var state = {
    isPending: false,
    isResolved: false,
    isDeferredComplete: false,
    deferreds: []
  };

  for(key in opts) {
    state[key] = opts[key];
  }

  return newContext
  .push({ "__select__": state })
  .push(head, context.stack.index, context.stack.of);
}

/**
 * After a {@select} or {@math} block is complete, they invoke this function
 */
function resolveSelectDeferreds(state) {
  var x, len;
  state.isDeferredPending = true;
  if(state.deferreds.length) {
    state.isDeferredComplete = true;
    for(x=0, len=state.deferreds.length; x<len; x++) {
      state.deferreds[x]();
    }
  }
  state.isDeferredPending = false;
}

/**
 * Used by {@contextDump}
 */
function jsonFilter(key, value) {
  if (typeof value === "function") {
    return value.toString()
      .replace(/(^\s+|\s+$)/mg, '')
      .replace(/\n/mg, '')
      .replace(/,\s*/mg, ', ')
      .replace(/\)\{/mg, ') {');
  }
  return value;
}

/**
 * Generate a truth test helper
 */
function truthTest(name, test) {
  return function(chunk, context, bodies, params) {
    return filter(chunk, context, bodies, params, name, test);
  };
}

/**
 * This function is invoked by truth test helpers
 */
function filter(chunk, context, bodies, params, helperName, test) {
  var body = bodies.block,
      skip = bodies['else'],
      selectState = getSelectState(context) || {},
      willResolve, key, value, type;

  // Once one truth test in a select passes, short-circuit the rest of the tests
  if (selectState.isResolved && !selectState.isDeferredPending) {
    return chunk;
  }

  // First check for a key on the helper itself, then look for a key on the {@select}
  if (params.hasOwnProperty('key')) {
    key = params.key;
  } else if (selectState.hasOwnProperty('key')) {
    key = selectState.key;
  } else {
    log(helperName, "No key specified", "WARN");
    return chunk;
  }

  type = params.type || selectState.type;

  key = coerce(context.resolve(key), type);
  value = coerce(context.resolve(params.value), type);

  if (test(key, value)) {
    // Once a truth test passes, put the select into "pending" state. Now we can render the body of
    // the truth test (which may contain truth tests) without altering the state of the select.
    if (!selectState.isPending) {
      willResolve = true;
      selectState.isPending = true;
    }
    if (body) {
      chunk = chunk.render(body, context);
    }
    if (willResolve) {
      selectState.isResolved = true;
    }
  } else if (skip) {
    chunk = chunk.render(skip, context);
  }
  return chunk;
}

function coerce(value, type) {
  if (type) {
    type = type.toLowerCase();
  }
  switch (type) {
    case 'number': return +value;
    case 'string': return String(value);
    case 'boolean':
      value = (value === 'false' ? false : value);
      return Boolean(value);
    case 'date': return new Date(value);
  }

  return value;
}

var helpers = {

  // Utility helping to resolve dust references in the given chunk
  // uses native Dust Context#resolve (available since Dust 2.6.2)
  "tap": function(input, chunk, context) {
    // deprecated for removal in 1.8
    _deprecated("tap");
    return context.resolve(input);
  },

  "sep": function(chunk, context, bodies) {
    var body = bodies.block;
    if (context.stack.index === context.stack.of - 1) {
      return chunk;
    }
    if (body) {
      return body(chunk, context);
    } else {
      return chunk;
    }
  },

  "first": function(chunk, context, bodies) {
    if (context.stack.index === 0) {
      return bodies.block(chunk, context);
    }
    return chunk;
  },

  "last": function(chunk, context, bodies) {
    if (context.stack.index === context.stack.of - 1) {
      return bodies.block(chunk, context);
    }
    return chunk;
  },

  /**
   * {@contextDump}
   * @param key {String} set to "full" to the full context stack, otherwise the current context is dumped
   * @param to {String} set to "console" to log to console, otherwise outputs to the chunk
   */
  "contextDump": function(chunk, context, bodies, params) {
    var to = context.resolve(params.to),
        key = context.resolve(params.key),
        target, output;
    switch(key) {
      case 'full':
        target = context.stack;
        break;
      default:
        target = context.stack.head;
    }
    output = JSON.stringify(target, jsonFilter, 2);
    switch(to) {
      case 'console':
        log('contextDump', output);
        break;
      default:
        output = output.replace(/</g, '\\u003c');
        chunk = chunk.write(output);
    }
    return chunk;
  },

  /**
   * {@math}
   * @param key first value
   * @param method {String} operation to perform
   * @param operand second value (not required for operations like `abs`)
   * @param round if truthy, round() the result
   */
  "math": function (chunk, context, bodies, params) {
    var key = params.key,
        method = params.method,
        operand = params.operand,
        round = params.round,
        output, state, x, len;

    if(!params.hasOwnProperty('key') || !params.method) {
      log("math", "`key` or `method` was not provided", "ERROR");
      return chunk;
    }

    key = parseFloat(context.resolve(key));
    operand = parseFloat(context.resolve(operand));

    switch(method) {
      case "mod":
        if(operand === 0) {
          log("math", "Division by 0", "ERROR");
        }
        output = key % operand;
        break;
      case "add":
        output = key + operand;
        break;
      case "subtract":
        output = key - operand;
        break;
      case "multiply":
        output = key * operand;
        break;
      case "divide":
        if(operand === 0) {
          log("math", "Division by 0", "ERROR");
        }
        output = key / operand;
        break;
      case "ceil":
      case "floor":
      case "round":
      case "abs":
        output = Math[method](key);
        break;
      case "toint":
        output = parseInt(key, 10);
        break;
      default:
        log("math", "Method `" + method + "` is not supported", "ERROR");
    }

    if (typeof output !== 'undefined') {
      if (round) {
        output = Math.round(output);
      }
      if (bodies && bodies.block) {
        context = addSelectState(context, { key: output });
        chunk = chunk.render(bodies.block, context);
        resolveSelectDeferreds(getSelectState(context));
      } else {
        chunk = chunk.write(output);
      }
    }

    return chunk;
  },

  /**
   * {@select}
   * Groups a set of truth tests and outputs the first one that passes.
   * Also contains {@any} and {@none} blocks.
   * @param key a value or reference to use as the left-hand side of comparisons
   * @param type coerce all truth test keys without an explicit type to this type
   */
  "select": function(chunk, context, bodies, params) {
    var body = bodies.block,
        state = {};

    if (params.hasOwnProperty('key')) {
      state.key = context.resolve(params.key);
    }
    if (params.hasOwnProperty('type')) {
      state.type = params.type;
    }

    if (body) {
      context = addSelectState(context, state);
      chunk = chunk.render(body, context);
      resolveSelectDeferreds(getSelectState(context));
    } else {
      log("select", "Missing body block", "WARN");
    }
    return chunk;
  },

  /**
   * Truth test helpers
   * @param key a value or reference to use as the left-hand side of comparisons
   * @param value a value or reference to use as the right-hand side of comparisons
   * @param type if specified, `key` and `value` will be forcibly cast to this type
   */
  "eq": truthTest('eq', function(left, right) {
    return left === right;
  }),
  "ne": truthTest('ne', function(left, right) {
    return left !== right;
  }),
  "lt": truthTest('lt', function(left, right) {
    return left < right;
  }),
  "lte": truthTest('lte', function(left, right) {
    return left <= right;
  }),
  "gt": truthTest('gt', function(left, right) {
    return left > right;
  }),
  "gte": truthTest('gte', function(left, right) {
    return left >= right;
  }),

  /**
   * {@any}
   * Outputs as long as at least one truth test inside a {@select} has passed.
   * Must be contained inside a {@select} block.
   * The passing truth test can be before or after the {@any} block.
   */
  "any": function(chunk, context, bodies, params) {
    var selectState = getSelectState(context);

    if(!selectState) {
      log("any", "Must be used inside a {@select} block", "ERROR");
    } else {
      if(selectState.isDeferredComplete) {
        log("any", "Must not be nested inside {@any} or {@none} block", "ERROR");
      } else {
        chunk = chunk.map(function(chunk) {
          selectState.deferreds.push(function() {
            if(selectState.isResolved) {
              chunk = chunk.render(bodies.block, context);
            }
            chunk.end();
          });
        });
      }
    }
    return chunk;
  },

  /**
   * {@none}
   * Outputs if no truth tests inside a {@select} pass.
   * Must be contained inside a {@select} block.
   * The position of the helper does not matter.
   */
  "none": function(chunk, context, bodies, params) {
    var selectState = getSelectState(context);

    if(!selectState) {
      log("none", "Must be used inside a {@select} block", "ERROR");
    } else {
      if(selectState.isDeferredComplete) {
        log("none", "Must not be nested inside {@any} or {@none} block", "ERROR");
      } else {
        chunk = chunk.map(function(chunk) {
          selectState.deferreds.push(function() {
            if(!selectState.isResolved) {
              chunk = chunk.render(bodies.block, context);
            }
            chunk.end();
          });
        });
      }
    }
    return chunk;
  },

  /**
  * {@size}
  * Write the size of the target to the chunk
  * Falsy values and true have size 0
  * Numbers are returned as-is
  * Arrays and Strings have size equal to their length
  * Objects have size equal to the number of keys they contain
  * Dust bodies are evaluated and the length of the string is returned
  * Functions are evaluated and the length of their return value is evaluated
  * @param key find the size of this value or reference
  */
  "size": function(chunk, context, bodies, params) {
    var key = params.key,
        value, k;

    key = context.resolve(params.key);
    if (!key || key === true) {
      value = 0;
    } else if(dust.isArray(key)) {
      value = key.length;
    } else if (!isNaN(parseFloat(key)) && isFinite(key)) {
      value = key;
    } else if (typeof key === "object") {
      value = 0;
      for(k in key){
        if(key.hasOwnProperty(k)){
          value++;
        }
      }
    } else {
      value = (key + '').length;
    }
    return chunk.write(value);
  }

};

for(var key in helpers) {
  dust.helpers[key] = helpers[key];
}

return dust;

}));

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.page = factory());
}(this, (function () { 'use strict';

var isarray = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

/**
 * Expose `pathToRegexp`.
 */
var pathToRegexp_1 = pathToRegexp;
var parse_1 = parse;
var compile_1 = compile;
var tokensToFunction_1 = tokensToFunction;
var tokensToRegExp_1 = tokensToRegExp;

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
].join('|'), 'g');

/**
 * Parse a string for the raw tokens.
 *
 * @param  {String} str
 * @return {Array}
 */
function parse (str) {
  var tokens = [];
  var key = 0;
  var index = 0;
  var path = '';
  var res;

  while ((res = PATH_REGEXP.exec(str)) != null) {
    var m = res[0];
    var escaped = res[1];
    var offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1];
      continue
    }

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path);
      path = '';
    }

    var prefix = res[2];
    var name = res[3];
    var capture = res[4];
    var group = res[5];
    var suffix = res[6];
    var asterisk = res[7];

    var repeat = suffix === '+' || suffix === '*';
    var optional = suffix === '?' || suffix === '*';
    var delimiter = prefix || '/';
    var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?');

    tokens.push({
      name: name || key++,
      prefix: prefix || '',
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      pattern: escapeGroup(pattern)
    });
  }

  // Match any characters still remaining.
  if (index < str.length) {
    path += str.substr(index);
  }

  // If the path exists, push it onto the end.
  if (path) {
    tokens.push(path);
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {String}   str
 * @return {Function}
 */
function compile (str) {
  return tokensToFunction(parse(str))
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length);

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^' + tokens[i].pattern + '$');
    }
  }

  return function (obj) {
    var path = '';
    var data = obj || {};

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        path += token;

        continue
      }

      var value = data[token.name];
      var segment;

      if (value == null) {
        if (token.optional) {
          continue
        } else {
          throw new TypeError('Expected "' + token.name + '" to be defined')
        }
      }

      if (isarray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
        }

        if (value.length === 0) {
          if (token.optional) {
            continue
          } else {
            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }
        }

        for (var j = 0; j < value.length; j++) {
          segment = encodeURIComponent(value[j]);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment;
        }

        continue
      }

      segment = encodeURIComponent(value);

      if (!matches[i].test(segment)) {
        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
      }

      path += token.prefix + segment;
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {String} str
 * @return {String}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1')
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys;
  return re
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {String}
 */
function flags (options) {
  return options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {RegExp} path
 * @param  {Array}  keys
 * @return {RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        pattern: null
      });
    }
  }

  return attachKeys(path, keys)
}

/**
 * Transform an array into a regexp.
 *
 * @param  {Array}  path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = [];

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

  return attachKeys(regexp, keys)
}

/**
 * Create a path regexp from string input.
 *
 * @param  {String} path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function stringToRegexp (path, keys, options) {
  var tokens = parse(path);
  var re = tokensToRegExp(tokens, options);

  // Attach keys back to the regexp.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] !== 'string') {
      keys.push(tokens[i]);
    }
  }

  return attachKeys(re, keys)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {Array}  tokens
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function tokensToRegExp (tokens, options) {
  options = options || {};

  var strict = options.strict;
  var end = options.end !== false;
  var route = '';
  var lastToken = tokens[tokens.length - 1];
  var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken);

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];

    if (typeof token === 'string') {
      route += escapeString(token);
    } else {
      var prefix = escapeString(token.prefix);
      var capture = token.pattern;

      if (token.repeat) {
        capture += '(?:' + prefix + capture + ')*';
      }

      if (token.optional) {
        if (prefix) {
          capture = '(?:' + prefix + '(' + capture + '))?';
        } else {
          capture = '(' + capture + ')?';
        }
      } else {
        capture = prefix + '(' + capture + ')';
      }

      route += capture;
    }
  }

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
  }

  if (end) {
    route += '$';
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithSlash ? '' : '(?=\\/|$)';
  }

  return new RegExp('^' + route, flags(options))
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 [keys]
 * @param  {Object}                [options]
 * @return {RegExp}
 */
function pathToRegexp (path, keys, options) {
  keys = keys || [];

  if (!isarray(keys)) {
    options = keys;
    keys = [];
  } else if (!options) {
    options = {};
  }

  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys, options)
  }

  if (isarray(path)) {
    return arrayToRegexp(path, keys, options)
  }

  return stringToRegexp(path, keys, options)
}

pathToRegexp_1.parse = parse_1;
pathToRegexp_1.compile = compile_1;
pathToRegexp_1.tokensToFunction = tokensToFunction_1;
pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

/**
   * Module dependencies.
   */



  /**
   * Short-cuts for global-object checks
   */

  var hasDocument = ('undefined' !== typeof document);
  var hasWindow = ('undefined' !== typeof window);
  var hasHistory = ('undefined' !== typeof history);
  var hasProcess = typeof process !== 'undefined';

  /**
   * Detect click event
   */
  var clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

  /**
   * To work properly with the URL
   * history.location generated polyfill in https://github.com/devote/HTML5-History-API
   */

  var isLocation = hasWindow && !!(window.history.location || window.location);

  /**
   * The page instance
   * @api private
   */
  function Page() {
    // public things
    this.callbacks = [];
    this.exits = [];
    this.current = '';
    this.len = 0;

    // private things
    this._decodeURLComponents = true;
    this._base = '';
    this._strict = false;
    this._running = false;
    this._hashbang = false;

    // bound functions
    this.clickHandler = this.clickHandler.bind(this);
    this._onpopstate = this._onpopstate.bind(this);
  }

  /**
   * Configure the instance of page. This can be called multiple times.
   *
   * @param {Object} options
   * @api public
   */

  Page.prototype.configure = function(options) {
    var opts = options || {};

    this._window = opts.window || (hasWindow && window);
    this._decodeURLComponents = opts.decodeURLComponents !== false;
    this._popstate = opts.popstate !== false && hasWindow;
    this._click = opts.click !== false && hasDocument;
    this._hashbang = !!opts.hashbang;

    var _window = this._window;
    if(this._popstate) {
      _window.addEventListener('popstate', this._onpopstate, false);
    } else if(hasWindow) {
      _window.removeEventListener('popstate', this._onpopstate, false);
    }

    if (this._click) {
      _window.document.addEventListener(clickEvent, this.clickHandler, false);
    } else if(hasDocument) {
      _window.document.removeEventListener(clickEvent, this.clickHandler, false);
    }

    if(this._hashbang && hasWindow && !hasHistory) {
      _window.addEventListener('hashchange', this._onpopstate, false);
    } else if(hasWindow) {
      _window.removeEventListener('hashchange', this._onpopstate, false);
    }
  };

  /**
   * Get or set basepath to `path`.
   *
   * @param {string} path
   * @api public
   */

  Page.prototype.base = function(path) {
    if (0 === arguments.length) return this._base;
    this._base = path;
  };

  /**
   * Gets the `base`, which depends on whether we are using History or
   * hashbang routing.

   * @api private
   */
  Page.prototype._getBase = function() {
    var base = this._base;
    if(!!base) return base;
    var loc = hasWindow && this._window && this._window.location;

    if(hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
      base = loc.pathname;
    }

    return base;
  };

  /**
   * Get or set strict path matching to `enable`
   *
   * @param {boolean} enable
   * @api public
   */

  Page.prototype.strict = function(enable) {
    if (0 === arguments.length) return this._strict;
    this._strict = enable;
  };


  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  Page.prototype.start = function(options) {
    var opts = options || {};
    this.configure(opts);

    if (false === opts.dispatch) return;
    this._running = true;

    var url;
    if(isLocation) {
      var window = this._window;
      var loc = window.location;

      if(this._hashbang && ~loc.hash.indexOf('#!')) {
        url = loc.hash.substr(2) + loc.search;
      } else if (this._hashbang) {
        url = loc.search + loc.hash;
      } else {
        url = loc.pathname + loc.search + loc.hash;
      }
    }

    this.replace(url, null, true, opts.dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  Page.prototype.stop = function() {
    if (!this._running) return;
    this.current = '';
    this.len = 0;
    this._running = false;

    var window = this._window;
    this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
    hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
    hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {string} path
   * @param {Object=} state
   * @param {boolean=} dispatch
   * @param {boolean=} push
   * @return {!Context}
   * @api public
   */

  Page.prototype.show = function(path, state, dispatch, push) {
    var ctx = new Context(path, state, this),
      prev = this.prevContext;
    this.prevContext = ctx;
    this.current = ctx.path;
    if (false !== dispatch) this.dispatch(ctx, prev);
    if (false !== ctx.handled && false !== push) ctx.pushState();
    return ctx;
  };

  /**
   * Goes back in the history
   * Back should always let the current route push state and then go back.
   *
   * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
   * @param {Object=} state
   * @api public
   */

  Page.prototype.back = function(path, state) {
    var page = this;
    if (this.len > 0) {
      var window = this._window;
      // this may need more testing to see if all browsers
      // wait for the next tick to go back in history
      hasHistory && window.history.back();
      this.len--;
    } else if (path) {
      setTimeout(function() {
        page.show(path, state);
      });
    } else {
      setTimeout(function() {
        page.show(page._getBase(), state);
      });
    }
  };

  /**
   * Register route to redirect from one path to other
   * or just redirect to another route
   *
   * @param {string} from - if param 'to' is undefined redirects to 'from'
   * @param {string=} to
   * @api public
   */
  Page.prototype.redirect = function(from, to) {
    var inst = this;

    // Define route from a path to another
    if ('string' === typeof from && 'string' === typeof to) {
      page.call(this, from, function(e) {
        setTimeout(function() {
          inst.replace(/** @type {!string} */ (to));
        }, 0);
      });
    }

    // Wait for the push state and replace it with another
    if ('string' === typeof from && 'undefined' === typeof to) {
      setTimeout(function() {
        inst.replace(from);
      }, 0);
    }
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {string} path
   * @param {Object=} state
   * @param {boolean=} init
   * @param {boolean=} dispatch
   * @return {!Context}
   * @api public
   */


  Page.prototype.replace = function(path, state, init, dispatch) {
    var ctx = new Context(path, state, this),
      prev = this.prevContext;
    this.prevContext = ctx;
    this.current = ctx.path;
    ctx.init = init;
    ctx.save(); // save before dispatching, which may redirect
    if (false !== dispatch) this.dispatch(ctx, prev);
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Context} ctx
   * @api private
   */

  Page.prototype.dispatch = function(ctx, prev) {
    var i = 0, j = 0, page = this;

    function nextExit() {
      var fn = page.exits[j++];
      if (!fn) return nextEnter();
      fn(prev, nextExit);
    }

    function nextEnter() {
      var fn = page.callbacks[i++];

      if (ctx.path !== page.current) {
        ctx.handled = false;
        return;
      }
      if (!fn) return unhandled.call(page, ctx);
      fn(ctx, nextEnter);
    }

    if (prev) {
      nextExit();
    } else {
      nextEnter();
    }
  };

  /**
   * Register an exit route on `path` with
   * callback `fn()`, which will be called
   * on the previous context when a new
   * page is visited.
   */
  Page.prototype.exit = function(path, fn) {
    if (typeof path === 'function') {
      return this.exit('*', path);
    }

    var route = new Route(path, null, this);
    for (var i = 1; i < arguments.length; ++i) {
      this.exits.push(route.middleware(arguments[i]));
    }
  };

  /**
   * Handle "click" events.
   */

  /* jshint +W054 */
  Page.prototype.clickHandler = function(e) {
    if (1 !== this._which(e)) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;

    // ensure link
    // use shadow dom when available if not, fall back to composedPath()
    // for browsers that only have shady
    var el = e.target;
    var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

    if(eventPath) {
      for (var i = 0; i < eventPath.length; i++) {
        if (!eventPath[i].nodeName) continue;
        if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
        if (!eventPath[i].href) continue;

        el = eventPath[i];
        break;
      }
    }

    // continue ensure link
    // el.nodeName for svg links are 'a' instead of 'A'
    while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
    if (!el || 'A' !== el.nodeName.toUpperCase()) return;

    // check if link is inside an svg
    // in this case, both href and target are always inside an object
    var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

    // Check for mailto: in the href
    if (link && link.indexOf('mailto:') > -1) return;

    // check target
    // svg target is an object and its desired value is in .baseVal property
    if (svg ? el.target.baseVal : el.target) return;

    // x-origin
    // note: svg links that are not relative don't call click events (and skip page.js)
    // consequently, all svg links tested inside page.js are relative and in the same origin
    if (!svg && !this.sameOrigin(el.href)) return;

    // rebuild path
    // There aren't .pathname and .search properties in svg links, so we use href
    // Also, svg href is an object and its desired value is in .baseVal property
    var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

    path = path[0] !== '/' ? '/' + path : path;

    // strip leading "/[drive letter]:" on NW.js on Windows
    if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
      path = path.replace(/^\/[a-zA-Z]:\//, '/');
    }

    // same page
    var orig = path;
    var pageBase = this._getBase();

    if (path.indexOf(pageBase) === 0) {
      path = path.substr(pageBase.length);
    }

    if (this._hashbang) path = path.replace('#!', '');

    if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
      return;
    }

    e.preventDefault();
    this.show(orig);
  };

  /**
   * Handle "populate" events.
   * @api private
   */

  Page.prototype._onpopstate = (function () {
    var loaded = false;
    if ( ! hasWindow ) {
      return function () {};
    }
    if (hasDocument && document.readyState === 'complete') {
      loaded = true;
    } else {
      window.addEventListener('load', function() {
        setTimeout(function() {
          loaded = true;
        }, 0);
      });
    }
    return function onpopstate(e) {
      if (!loaded) return;
      var page = this;
      if (e.state) {
        var path = e.state.path;
        page.replace(path, e.state);
      } else if (isLocation) {
        var loc = page._window.location;
        page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
      }
    };
  })();

  /**
   * Event button.
   */
  Page.prototype._which = function(e) {
    e = e || (hasWindow && this._window.event);
    return null == e.which ? e.button : e.which;
  };

  /**
   * Convert to a URL object
   * @api private
   */
  Page.prototype._toURL = function(href) {
    var window = this._window;
    if(typeof URL === 'function' && isLocation) {
      return new URL(href, window.location.toString());
    } else if (hasDocument) {
      var anc = window.document.createElement('a');
      anc.href = href;
      return anc;
    }
  };

  /**
   * Check if `href` is the same origin.
   * @param {string} href
   * @api public
   */

  Page.prototype.sameOrigin = function(href) {
    if(!href || !isLocation) return false;

    var url = this._toURL(href);
    var window = this._window;

    var loc = window.location;
    return loc.protocol === url.protocol &&
      loc.hostname === url.hostname &&
      loc.port === url.port;
  };

  /**
   * @api private
   */
  Page.prototype._samePath = function(url) {
    if(!isLocation) return false;
    var window = this._window;
    var loc = window.location;
    return url.pathname === loc.pathname &&
      url.search === loc.search;
  };

  /**
   * Remove URL encoding from the given `str`.
   * Accommodates whitespace in both x-www-form-urlencoded
   * and regular percent-encoded form.
   *
   * @param {string} val - URL component to decode
   * @api private
   */
  Page.prototype._decodeURLEncodedURIComponent = function(val) {
    if (typeof val !== 'string') { return val; }
    return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
  };

  /**
   * Create a new `page` instance and function
   */
  function createPage() {
    var pageInstance = new Page();

    function pageFn(/* args */) {
      return page.apply(pageInstance, arguments);
    }

    // Copy all of the things over. In 2.0 maybe we use setPrototypeOf
    pageFn.callbacks = pageInstance.callbacks;
    pageFn.exits = pageInstance.exits;
    pageFn.base = pageInstance.base.bind(pageInstance);
    pageFn.strict = pageInstance.strict.bind(pageInstance);
    pageFn.start = pageInstance.start.bind(pageInstance);
    pageFn.stop = pageInstance.stop.bind(pageInstance);
    pageFn.show = pageInstance.show.bind(pageInstance);
    pageFn.back = pageInstance.back.bind(pageInstance);
    pageFn.redirect = pageInstance.redirect.bind(pageInstance);
    pageFn.replace = pageInstance.replace.bind(pageInstance);
    pageFn.dispatch = pageInstance.dispatch.bind(pageInstance);
    pageFn.exit = pageInstance.exit.bind(pageInstance);
    pageFn.configure = pageInstance.configure.bind(pageInstance);
    pageFn.sameOrigin = pageInstance.sameOrigin.bind(pageInstance);
    pageFn.clickHandler = pageInstance.clickHandler.bind(pageInstance);

    pageFn.create = createPage;

    Object.defineProperty(pageFn, 'len', {
      get: function(){
        return pageInstance.len;
      },
      set: function(val) {
        pageInstance.len = val;
      }
    });

    Object.defineProperty(pageFn, 'current', {
      get: function(){
        return pageInstance.current;
      },
      set: function(val) {
        pageInstance.current = val;
      }
    });

    // In 2.0 these can be named exports
    pageFn.Context = Context;
    pageFn.Route = Route;

    return pageFn;
  }

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or redirection,
   * or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page('/from', '/to')
   *   page();
   *
   * @param {string|!Function|!Object} path
   * @param {Function=} fn
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' === typeof path) {
      return page.call(this, '*', path);
    }

    // route <path> to <callback ...>
    if ('function' === typeof fn) {
      var route = new Route(/** @type {string} */ (path), null, this);
      for (var i = 1; i < arguments.length; ++i) {
        this.callbacks.push(route.middleware(arguments[i]));
      }
      // show <path> with [state]
    } else if ('string' === typeof path) {
      this['string' === typeof fn ? 'redirect' : 'show'](path, fn);
      // start [options]
    } else {
      this.start(path);
    }
  }

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */
  function unhandled(ctx) {
    if (ctx.handled) return;
    var current;
    var page = this;
    var window = page._window;

    if (page._hashbang) {
      current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
    } else {
      current = isLocation && window.location.pathname + window.location.search;
    }

    if (current === ctx.canonicalPath) return;
    page.stop();
    ctx.handled = false;
    isLocation && (window.location.href = ctx.canonicalPath);
  }

  function escapeRegExp(s) {
    return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @constructor
   * @param {string} path
   * @param {Object=} state
   * @api public
   */

  function Context(path, state, pageInstance) {
    var _page = this.page = pageInstance || page;
    var window = _page._window;
    var hashbang = _page._hashbang;

    var pageBase = _page._getBase();
    if ('/' === path[0] && 0 !== path.indexOf(pageBase)) path = pageBase + (hashbang ? '#!' : '') + path;
    var i = path.indexOf('?');

    this.canonicalPath = path;
    var re = new RegExp('^' + escapeRegExp(pageBase));
    this.path = path.replace(re, '') || '/';
    if (hashbang) this.path = this.path.replace('#!', '') || '/';

    this.title = (hasDocument && window.document.title);
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
    this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
    this.params = {};

    // fragment
    this.hash = '';
    if (!hashbang) {
      if (!~this.path.indexOf('#')) return;
      var parts = this.path.split('#');
      this.path = this.pathname = parts[0];
      this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
      this.querystring = this.querystring.split('#')[0];
    }
  }

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function() {
    var page = this.page;
    var window = page._window;
    var hashbang = page._hashbang;

    page.len++;
    if (hasHistory) {
        window.history.pushState(this.state, this.title,
          hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
    }
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function() {
    var page = this.page;
    if (hasHistory && page._window.location.protocol !== 'file:') {
        page._window.history.replaceState(this.state, this.title,
          page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
    }
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @constructor
   * @param {string} path
   * @param {Object=} options
   * @api private
   */

  function Route(path, options, page) {
    var _page = this.page = page || globalPage;
    var opts = options || {};
    opts.strict = opts.strict || page._strict;
    this.path = (path === '*') ? '(.*)' : path;
    this.method = 'GET';
    this.regexp = pathToRegexp_1(this.path, this.keys = [], opts);
  }

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn) {
    var self = this;
    return function(ctx, next) {
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
      next();
    };
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {string} path
   * @param {Object} params
   * @return {boolean}
   * @api private
   */

  Route.prototype.match = function(path, params) {
    var keys = this.keys,
      qsIndex = path.indexOf('?'),
      pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
      m = this.regexp.exec(decodeURIComponent(pathname));

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];
      var val = this.page._decodeURLEncodedURIComponent(m[i]);
      if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
        params[key.name] = val;
      }
    }

    return true;
  };


  /**
   * Module exports.
   */

  var globalPage = createPage();
  var page_js = globalPage;
  var default_1 = globalPage;

page_js.default = default_1;

return page_js;

})));

/*!
 * EventEmitter v5.2.4 - git.io/ee
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - http://oli.me.uk/
 * @preserve
 */

;(function (exports) {
    'use strict';

    /**
     * Class for managing events.
     * Can be extended to provide event functionality in other classes.
     *
     * @class EventEmitter Manages event registering and emitting.
     */
    function EventEmitter() {}

    // Shortcuts to improve speed and size
    var proto = EventEmitter.prototype;
    var originalGlobalValue = exports.EventEmitter;

    /**
     * Finds the index of the listener for the event in its storage array.
     *
     * @param {Function[]} listeners Array of listeners to search through.
     * @param {Function} listener Method to look for.
     * @return {Number} Index of the specified listener, -1 if not found
     * @api private
     */
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Alias a method while keeping the context correct, to allow for overwriting of target method.
     *
     * @param {String} name The name of the target method.
     * @return {Function} The aliased method
     * @api private
     */
    function alias(name) {
        return function aliasClosure() {
            return this[name].apply(this, arguments);
        };
    }

    /**
     * Returns the listener array for the specified event.
     * Will initialise the event object and listener arrays if required.
     * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
     * Each property in the object response is an array of listener functions.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Function[]|Object} All listener functions for the event.
     */
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;

        // Return a concatenated array of all matching events if
        // the selector is a regular expression.
        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        }
        else {
            response = events[evt] || (events[evt] = []);
        }

        return response;
    };

    /**
     * Takes a list of listener objects and flattens it into a list of listener functions.
     *
     * @param {Object[]} listeners Raw listener objects.
     * @return {Function[]} Just the listener functions.
     */
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;

        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }

        return flatListeners;
    };

    /**
     * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Object} All listener functions for an event in an object.
     */
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;

        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }

        return response || listeners;
    };

    function isValidListener (listener) {
        if (typeof listener === 'function' || listener instanceof RegExp) {
            return true
        } else if (listener && typeof listener === 'object') {
            return isValidListener(listener.listener)
        } else {
            return false
        }
    }

    /**
     * Adds a listener function to the specified event.
     * The listener will not be added if it is a duplicate.
     * If the listener returns true then it will be removed after it is called.
     * If you pass a regular expression as the event name then the listener will be added to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListener = function addListener(evt, listener) {
        if (!isValidListener(listener)) {
            throw new TypeError('listener must be a function');
        }

        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }

        return this;
    };

    /**
     * Alias of addListener
     */
    proto.on = alias('addListener');

    /**
     * Semi-alias of addListener. It will add a listener that will be
     * automatically removed after its first execution.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addOnceListener = function addOnceListener(evt, listener) {
        return this.addListener(evt, {
            listener: listener,
            once: true
        });
    };

    /**
     * Alias of addOnceListener.
     */
    proto.once = alias('addOnceListener');

    /**
     * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
     * You need to tell it what event names should be matched by a regex.
     *
     * @param {String} evt Name of the event to create.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };

    /**
     * Uses defineEvent to define multiple events.
     *
     * @param {String[]} evts An array of event names to define.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvents = function defineEvents(evts) {
        for (var i = 0; i < evts.length; i += 1) {
            this.defineEvent(evts[i]);
        }
        return this;
    };

    /**
     * Removes a listener function from the specified event.
     * When passed a regular expression as the event name, it will remove the listener from all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to remove the listener from.
     * @param {Function} listener Method to remove from the event.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListener = function removeListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);

                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }

        return this;
    };

    /**
     * Alias of removeListener
     */
    proto.off = alias('removeListener');

    /**
     * Adds listeners in bulk using the manipulateListeners method.
     * If you pass an object as the first argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
     * You can also pass it a regular expression to add the array of listeners to all events that match it.
     * Yeah, this function does quite a bit. That's probably a bad thing.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListeners = function addListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(false, evt, listeners);
    };

    /**
     * Removes listeners in bulk using the manipulateListeners method.
     * If you pass an object as the first argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be removed.
     * You can also pass it a regular expression to remove the listeners from all events that match it.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListeners = function removeListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(true, evt, listeners);
    };

    /**
     * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
     * The first argument will determine if the listeners are removed (true) or added (false).
     * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be added/removed.
     * You can also pass it a regular expression to manipulate the listeners of all events that match it.
     *
     * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;

        // If evt is an object then pass each of its properties to this method
        if (typeof evt === 'object' && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    // Pass the single listener straight through to the singular method
                    if (typeof value === 'function') {
                        single.call(this, i, value);
                    }
                    else {
                        // Otherwise pass back to the multiple function
                        multiple.call(this, i, value);
                    }
                }
            }
        }
        else {
            // So evt must be a string
            // And listeners must be an array of listeners
            // Loop over it and pass each one to the multiple method
            i = listeners.length;
            while (i--) {
                single.call(this, evt, listeners[i]);
            }
        }

        return this;
    };

    /**
     * Removes all listeners from a specified event.
     * If you do not specify an event then all listeners will be removed.
     * That means every event will be emptied.
     * You can also pass a regex to remove all events that match it.
     *
     * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;

        // Remove different things depending on the state of evt
        if (type === 'string') {
            // Remove all listeners for the specified event
            delete events[evt];
        }
        else if (evt instanceof RegExp) {
            // Remove all events matching the regex.
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    delete events[key];
                }
            }
        }
        else {
            // Remove all listeners in all events
            delete this._events;
        }

        return this;
    };

    /**
     * Alias of removeEvent.
     *
     * Added to mirror the node API.
     */
    proto.removeAllListeners = alias('removeEvent');

    /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {Array} [args] Optional array of arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emitEvent = function emitEvent(evt, args) {
        var listenersMap = this.getListenersAsObject(evt);
        var listeners;
        var listener;
        var i;
        var key;
        var response;

        for (key in listenersMap) {
            if (listenersMap.hasOwnProperty(key)) {
                listeners = listenersMap[key].slice(0);

                for (i = 0; i < listeners.length; i++) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[i];

                    if (listener.once === true) {
                        this.removeListener(evt, listener.listener);
                    }

                    response = listener.listener.apply(this, args || []);

                    if (response === this._getOnceReturnValue()) {
                        this.removeListener(evt, listener.listener);
                    }
                }
            }
        }

        return this;
    };

    /**
     * Alias of emitEvent
     */
    proto.trigger = alias('emitEvent');

    /**
     * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
     * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {...*} Optional additional arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emit = function emit(evt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(evt, args);
    };

    /**
     * Sets the current value to check against when executing listeners. If a
     * listeners return value matches the one set here then it will be removed
     * after execution. This value defaults to true.
     *
     * @param {*} value The new value to check for when executing listeners.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };

    /**
     * Fetches the current value to check against when executing listeners. If
     * the listeners return value matches this one then it should be removed
     * automatically. It will return true by default.
     *
     * @return {*|Boolean} The current value to check for or the default, true.
     * @api private
     */
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        }
        else {
            return true;
        }
    };

    /**
     * Fetches the events object and creates one if required.
     *
     * @return {Object} The events storage object.
     * @api private
     */
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };

    /**
     * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
     *
     * @return {Function} Non conflicting EventEmitter class.
     */
    EventEmitter.noConflict = function noConflict() {
        exports.EventEmitter = originalGlobalValue;
        return EventEmitter;
    };

    // Expose the class either via AMD, CommonJS or the global object
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return EventEmitter;
        });
    }
    else if (typeof module === 'object' && module.exports){
        module.exports = EventEmitter;
    }
    else {
        exports.EventEmitter = EventEmitter;
    }
}(this || {}));

/* docma (dust) compiled templates */
(function(dust){dust.register("docma-404",body_0);function body_0(chk,ctx){return chk.p("navbar",ctx,ctx,{"boxed":"true"}).w("<div id=\"page-content-wrapper\"><div class=\"container container-boxed\"><br /><br /><h1>404</h1><hr /><h3>Page Not Found</h3><br />The file or page you have requested is not found. &nbsp;&nbsp;<br />Please make sure page address is entered correctly.<br /><br /><br /></div></div>");}body_0.__dustBody=!0;return body_0}(dust));
(function(dust){dust.register("docma-api",body_0);function body_0(chk,ctx){return chk.p("navbar",ctx,ctx,{}).w("<div id=\"wrapper\">").x(ctx.getPath(false, ["template","options","sidebar","enabled"]),ctx,{"block":body_1},{}).w("<div id=\"page-content-wrapper\"><div class=\"container\"><br />").s(ctx.get(["documentation"], false),ctx,{"block":body_2},{}).w("<br /><span class=\"docma-info\">Documentation built with <b><a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://onury.io/docma\">Docma</a></b>.</span></div></div></div>");}body_0.__dustBody=!0;function body_1(chk,ctx){return chk.w("<div id=\"sidebar-wrapper\">").p("sidebar",ctx,ctx,{}).w("</div>");}body_1.__dustBody=!0;function body_2(chk,ctx){return chk.p("symbol",ctx,ctx,{"symbol":ctx.getPath(true, []),"template":ctx.get(["template"], false)});}body_2.__dustBody=!0;return body_0}(dust));
(function(dust){dust.register("docma-content",body_0);function body_0(chk,ctx){return chk.p("navbar",ctx,ctx,{"boxed":"true"}).w("<div id=\"page-content-wrapper\"><div class='").h("eq",ctx,{"block":body_1},{"key":ctx.getPath(false, ["currentRoute","sourceType"]),"value":"md"},"h").w("'><div id=\"docma-content\"></div>").h("eq",ctx,{"block":body_2},{"key":ctx.getPath(false, ["currentRoute","sourceType"]),"value":"md"},"h").w("</div></div>");}body_0.__dustBody=!0;function body_1(chk,ctx){return chk.w("container container-boxed");}body_1.__dustBody=!0;function body_2(chk,ctx){return chk.w("<br /><hr /><span class=\"docma-info\">Documentation built with <b><a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://onury.io/docma\">Docma</a></b>.</span>");}body_2.__dustBody=!0;return body_0}(dust));
(function(dust){dust.register("enums",body_0);function body_0(chk,ctx){return chk.x(ctx.get(["$members"], false),ctx,{"block":body_1},{});}body_0.__dustBody=!0;function body_1(chk,ctx){return chk.h("eq",ctx,{"else":body_2,"block":body_4},{"key":ctx.getPath(false, ["template","options","symbols","enums"]),"value":"table"},"h");}body_1.__dustBody=!0;function body_2(chk,ctx){return chk.w("<div class=\"space-top-sm space-bottom-xs fw-bold\">Enumeration</div><ul class=\"param-list\">").s(ctx.get(["$members"], false),ctx,{"block":body_3},{}).w("</ul>");}body_2.__dustBody=!0;function body_3(chk,ctx){return chk.w("<li><div class=\"param-meta clearfix\"><span class=\"inline-block space-right-sm\"><code>").f(ctx.getPath(true, []),ctx,"h",["$longname","s","$dot_prop"]).w("</code>&nbsp;:&nbsp;<code>").f(ctx.getPath(true, []),ctx,"h",["s","$type"]).w("</code></span><span class=\"param-info-box\"><span class=\"param-info value\">Value:&nbsp;</span><code>").f(ctx.getPath(true, []),ctx,"h",["$val"]).w("</code></span></div><div class=\"param-desc\">").f(ctx.getPath(true, []),ctx,"h",["s","$desc"]).w("</div></li>");}body_3.__dustBody=!0;function body_4(chk,ctx){return chk.w("<table class=\"table table-striped table-bordered\"><thead><tr><th>Enumeration</th><th>Type</th><th>Value</th><th>Description</th></tr></thead><tbody>").s(ctx.get(["$members"], false),ctx,{"block":body_5},{}).w("</tbody></table>");}body_4.__dustBody=!0;function body_5(chk,ctx){return chk.w("<tr><td><code>").f(ctx.getPath(true, []),ctx,"h",["$longname","s","$dot_prop"]).w("</code></td><td><code>").f(ctx.getPath(true, []),ctx,"h",["s","$type"]).w("</code></td><td><code>").f(ctx.getPath(true, []),ctx,"h",["$val"]).w("</code></td><td>").f(ctx.getPath(true, []),ctx,"h",["s","$desc"]).w("</td></tr>");}body_5.__dustBody=!0;return body_0}(dust));
(function(dust){dust.register("navbar",body_0);function body_0(chk,ctx){return chk.x(ctx.getPath(false, ["template","options","navbar","enabled"]),ctx,{"block":body_1},{});}body_0.__dustBody=!0;function body_1(chk,ctx){return chk.w("<nav class=\"navbar ").x(ctx.getPath(false, ["template","options","navbar","dark"]),ctx,{"block":body_2},{}).w("\"><div class=\"navbar-inner ").x(ctx.get(["boxed"], false),ctx,{"block":body_3},{}).w("\"><div class=\"navbar-brand\">").x(ctx.getPath(false, ["template","options","logo","dark"]),ctx,{"block":body_4},{}).w("<span class=\"navbar-title\"><a href=\"").f(ctx.getPath(false, ["template","options","title","href"]),ctx,"h").w("\">").f(ctx.getPath(false, ["template","options","title","label"]),ctx,"h").w("</a></span></div>").h("gt",ctx,{"block":body_7},{"key":ctx.getPath(false, ["template","options","navbar","menu","length"]),"value":0},"h").w("</div></nav>").x(ctx.getPath(false, ["template","options","navbar","fixed"]),ctx,{"block":body_16},{}).w("<div class=\"nav-overlay\"></div>");}body_1.__dustBody=!0;function body_2(chk,ctx){return chk.w("dark");}body_2.__dustBody=!0;function body_3(chk,ctx){return chk.w("container container-boxed");}body_3.__dustBody=!0;function body_4(chk,ctx){return chk.x(ctx.getPath(false, ["template","options","navbar","dark"]),ctx,{"else":body_5,"block":body_6},{});}body_4.__dustBody=!0;function body_5(chk,ctx){return chk.w("<img src=\"").f(ctx.getPath(false, ["template","options","logo","dark"]),ctx,"h").w("\" alt=\"logo\" class=\"navbar-logo\" />");}body_5.__dustBody=!0;function body_6(chk,ctx){return chk.w("<img src=\"").f(ctx.getPath(false, ["template","options","logo","light"]),ctx,"h").w("\" alt=\"logo\" class=\"navbar-logo\" />");}body_6.__dustBody=!0;function body_7(chk,ctx){return chk.w("<div class=\"navbar-menu-btn\" tabindex=\"0\"><i class=\"fas fa-lg fa-bars trans-all-ease\"></i><i class=\"fas fa-md fa-times trans-all-ease\"></i></div><div class=\"navbar-menu\"><ul class=\"navbar-list\">").s(ctx.getPath(false, ["template","options","navbar","menu"]),ctx,{"block":body_8},{}).w("</ul></div>");}body_7.__dustBody=!0;function body_8(chk,ctx){return chk.x(ctx.get(["items"], false),ctx,{"else":body_9,"block":body_10},{});}body_8.__dustBody=!0;function body_9(chk,ctx){return chk.p("navitem",ctx,ctx.rebase(ctx.getPath(true, [])),{});}body_9.__dustBody=!0;function body_10(chk,ctx){return chk.w("<li class=\"dropdown\"><a href=\"").x(ctx.get(["href"], false),ctx,{"else":body_11,"block":body_12},{}).w("\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\"><i class=\"nav-icon ").f(ctx.get(["iconClass"], false),ctx,"h").w("\" aria-hidden=\"true\"></i>").x(ctx.get(["label"], false),ctx,{"block":body_13},{}).x(ctx.get(["chevron"], false),ctx,{"block":body_14},{}).w("</a><ul>").s(ctx.get(["items"], false),ctx,{"block":body_15},{}).w("</ul></li>");}body_10.__dustBody=!0;function body_11(chk,ctx){return chk.w("#");}body_11.__dustBody=!0;function body_12(chk,ctx){return chk.f(ctx.get(["href"], false),ctx,"h");}body_12.__dustBody=!0;function body_13(chk,ctx){return chk.w("<span class=\"nav-label\">").f(ctx.get(["label"], false),ctx,"h").w("</span>");}body_13.__dustBody=!0;function body_14(chk,ctx){return chk.w("<i class=\"nav-arrow fas fa-sm fa-angle-down\"></i>");}body_14.__dustBody=!0;function body_15(chk,ctx){return chk.w(" ").p("navitem",ctx,ctx.rebase(ctx.getPath(true, [])),{}).w(" ");}body_15.__dustBody=!0;function body_16(chk,ctx){return chk.w("<div class=\"nav-spacer\"></div>");}body_16.__dustBody=!0;return body_0}(dust));
(function(dust){dust.register("navitem",body_0);function body_0(chk,ctx){return chk.x(ctx.get(["separator"], false),ctx,{"else":body_1,"block":body_6},{});}body_0.__dustBody=!0;function body_1(chk,ctx){return chk.w("<li><a href=\"").x(ctx.get(["href"], false),ctx,{"else":body_2,"block":body_3},{}).w("\" target=\"").f(ctx.get(["target"], false),ctx,"h").w("\">").x(ctx.get(["iconClass"], false),ctx,{"block":body_4},{}).x(ctx.get(["label"], false),ctx,{"block":body_5},{}).w("</a></li>");}body_1.__dustBody=!0;function body_2(chk,ctx){return chk.w("#");}body_2.__dustBody=!0;function body_3(chk,ctx){return chk.f(ctx.get(["href"], false),ctx,"h");}body_3.__dustBody=!0;function body_4(chk,ctx){return chk.w("<i class=\"nav-icon ").f(ctx.get(["iconClass"], false),ctx,"h").w("\" aria-hidden=\"true\"></i>");}body_4.__dustBody=!0;function body_5(chk,ctx){return chk.w("<span class=\"nav-label\">").f(ctx.get(["label"], false),ctx,"h",["s"]).w("</span>");}body_5.__dustBody=!0;function body_6(chk,ctx){return chk.w("<li role=\"separator\" class=\"divider\"></li>");}body_6.__dustBody=!0;return body_0}(dust));
(function(dust){dust.register("params",body_0);function body_0(chk,ctx){return chk.x(ctx.get(["params"], false),ctx,{"block":body_1},{});}body_0.__dustBody=!0;function body_1(chk,ctx){return chk.h("eq",ctx,{"else":body_2,"block":body_8},{"key":ctx.getPath(false, ["template","options","symbols","params"]),"value":"table"},"h");}body_1.__dustBody=!0;function body_2(chk,ctx){return chk.w("<div class=\"space-top-sm space-bottom-xs fw-bold\">Parameters</div><ul class=\"param-list\">").s(ctx.get(["params"], false),ctx,{"block":body_3},{}).w("</ul>");}body_2.__dustBody=!0;function body_3(chk,ctx){return chk.w("<li><div class=\"param-meta clearfix\"><span class=\"inline-block space-right-sm\"><code>").x(ctx.get(["variable"], false),ctx,{"block":body_4},{}).f(ctx.get(["name"], false),ctx,"h",["s","$dot_prop"]).w("</code>&nbsp;:&nbsp;<code>").x(ctx.get(["variable"], false),ctx,{"block":body_5},{}).f(ctx.getPath(true, []),ctx,"h",["s","$type"]).w("</code></span><span class=\"param-info-box\">").x(ctx.get(["optional"], false),ctx,{"else":body_6,"block":body_7},{}).w("</span></div><div class=\"param-desc\">").f(ctx.getPath(true, []),ctx,"h",["s","$param_desc"]).w("</div></li>");}body_3.__dustBody=!0;function body_4(chk,ctx){return chk.w("...");}body_4.__dustBody=!0;function body_5(chk,ctx){return chk.w("...");}body_5.__dustBody=!0;function body_6(chk,ctx){return chk.w("<span class=\"param-info required boxed\">Required</span>");}body_6.__dustBody=!0;function body_7(chk,ctx){return chk.w("<span class=\"param-info default\">Default:&nbsp;</span><code>").f(ctx.getPath(true, []),ctx,"h",["$def"]).w("</code>");}body_7.__dustBody=!0;function body_8(chk,ctx){return chk.w("<table class=\"table table-striped table-bordered\"><thead><tr><th>Param</th><th>Type</th><th>Description</th></tr></thead><tbody>").s(ctx.get(["params"], false),ctx,{"block":body_9},{}).w("</tbody></table>");}body_8.__dustBody=!0;function body_9(chk,ctx){return chk.w("<tr><td><code>").x(ctx.get(["variable"], false),ctx,{"block":body_10},{}).f(ctx.get(["name"], false),ctx,"h",["s","$dot_prop"]).w("</code></td><td><code>").x(ctx.get(["variable"], false),ctx,{"block":body_11},{}).f(ctx.getPath(true, []),ctx,"h",["s","$type"]).w("</code></td><td>").x(ctx.get(["optional"], false),ctx,{"else":body_12,"block":body_13},{}).f(ctx.getPath(true, []),ctx,"h",["s","$param_desc"]).w("</td></tr>");}body_9.__dustBody=!0;function body_10(chk,ctx){return chk.w("...");}body_10.__dustBody=!0;function body_11(chk,ctx){return chk.w("...");}body_11.__dustBody=!0;function body_12(chk,ctx){return chk.w("<span class=\"param-info required boxed\">Required</span>");}body_12.__dustBody=!0;function body_13(chk,ctx){return chk.w("<span class=\"param-info default boxed\">Default</span><span class=\"color-gray\">:</span><code>").f(ctx.getPath(true, []),ctx,"h",["$def"]).w("</code>");}body_13.__dustBody=!0;return body_0}(dust));
(function(dust){dust.register("properties",body_0);function body_0(chk,ctx){return chk.x(ctx.get(["properties"], false),ctx,{"block":body_1},{});}body_0.__dustBody=!0;function body_1(chk,ctx){return chk.h("eq",ctx,{"else":body_2,"block":body_4},{"key":ctx.getPath(false, ["template","options","symbols","props"]),"value":"table"},"h");}body_1.__dustBody=!0;function body_2(chk,ctx){return chk.w("<div class=\"space-top-sm space-bottom-xs fw-bold\">Properties</div><ul class=\"param-list\">").s(ctx.get(["properties"], false),ctx,{"block":body_3},{}).w("</ul>");}body_2.__dustBody=!0;function body_3(chk,ctx){return chk.w("<li><div class=\"param-meta clearfix\"><span class=\"inline-block space-right-sm\"><code>").f(ctx.get(["name"], false),ctx,"h",["s","$dot_prop"]).w("</code>&nbsp;:&nbsp;<code>").f(ctx.getPath(true, []),ctx,"h",["s","$type"]).w("</code></span></div><div class=\"param-desc\">").f(ctx.get(["description"], false),ctx,"h",["s","$p"]).w("</div></li>");}body_3.__dustBody=!0;function body_4(chk,ctx){return chk.w("<table class=\"table table-striped table-bordered\"><thead><tr><th>Property</th><th>Type</th><th>Description</th></tr></thead><tbody>").s(ctx.get(["properties"], false),ctx,{"block":body_5},{}).w("</tbody></table>");}body_4.__dustBody=!0;function body_5(chk,ctx){return chk.w("<tr><td><code>").f(ctx.get(["name"], false),ctx,"h",["s","$dot_prop"]).w("</code></td><td><code>").f(ctx.getPath(true, []),ctx,"h",["s","$type"]).w("</code></td><td>").f(ctx.get(["description"], false),ctx,"h",["s","$p"]).w("</td></tr>");}body_5.__dustBody=!0;return body_0}(dust));
(function(dust){dust.register("sidebar",body_0);function body_0(chk,ctx){return chk.w("<div class=\"sidebar-header\"><div id=\"sidebar-toggle\"><i class=\"fas fa-lg fa-bars trans-all-ease\"></i></div><div class=\"sidebar-brand\">").x(ctx.getPath(false, ["template","options","logo","light"]),ctx,{"block":body_1},{}).w("<span class=\"sidebar-title\"><a href=\"").f(ctx.getPath(false, ["template","options","title","href"]),ctx,"h").w("\">").f(ctx.getPath(false, ["template","options","title","label"]),ctx,"h").w("</a></span></div>").x(ctx.getPath(false, ["template","options","sidebar","search"]),ctx,{"block":body_2},{}).x(ctx.getPath(false, ["template","options","sidebar","toolbar"]),ctx,{"block":body_3},{}).w("</div><div class=\"sidebar-nav-container\"><ul class=\"sidebar-nav\">").f(ctx.get(["symbols"], false),ctx,"h",["s","$navnodes"]).w("</ul></div>");}body_0.__dustBody=!0;function body_1(chk,ctx){return chk.w("<img src=\"").f(ctx.getPath(false, ["template","options","logo","light"]),ctx,"h").w("\" alt=\"logo\" class=\"sidebar-logo\" />");}body_1.__dustBody=!0;function body_2(chk,ctx){return chk.w("<div class=\"sidebar-search\"><div class=\"sidebar-search-icon\"><i class=\"fas fa-md fa-search\"></i></div><input id=\"txt-search\" type=\"search\" placeholder=\"Search...\" autocorrect=\"off\" autocapitalize=\"off\" spellcheck=\"false\" /><div class=\"sidebar-search-clean\"><i class=\"fas fa-lg fa-times-circle\"></i></div></div>");}body_2.__dustBody=!0;function body_3(chk,ctx){return chk.w("<div class=\"sidebar-toolbar\"><div class=\"toolbar-scope-filters\"></div><div class=\"toolbar-kind-filters\"></div><div class=\"toolbar-buttons\"><span class=\"btn-switch-fold inline-block\" title=\"Fold Symbols\">").h("eq",ctx,{"else":body_4,"block":body_5},{"key":ctx.getPath(false, ["template","options","sidebar","itemsFolded"]),"type":"boolean","value":"true"},"h").w("</span><span class=\"btn-switch-outline inline-block space-left-xs\" title=\"Toggle Outline\">").h("eq",ctx,{"else":body_6,"block":body_7},{"key":ctx.getPath(false, ["template","options","sidebar","outline"]),"type":"string","value":"tree"},"h").w("</span></div></div>");}body_3.__dustBody=!0;function body_4(chk,ctx){return chk.w("<i class=\"far fa-lg fa-caret-square-down\"></i>");}body_4.__dustBody=!0;function body_5(chk,ctx){return chk.w("<i class=\"far fa-lg fa-caret-square-right\"></i>");}body_5.__dustBody=!0;function body_6(chk,ctx){return chk.w("<i class=\"fas fa-lg fa-outdent\"></i>");}body_6.__dustBody=!0;function body_7(chk,ctx){return chk.w("<i class=\"fas fa-lg fa-indent\"></i>");}body_7.__dustBody=!0;return body_0}(dust));
(function(dust){dust.register("symbol",body_0);function body_0(chk,ctx){return chk.nx(ctx.getPath(false, ["symbol","$hide"]),ctx,{"block":body_1},{});}body_0.__dustBody=!0;function body_1(chk,ctx){return chk.w("<div id=\"").f(ctx.get(["symbol"], false),ctx,"h",["$id"]).w("\" class=\"symbol-container\"><div class=\"symbol-heading\"><div class=\"symbol\"><a href=\"#").f(ctx.get(["symbol"], false),ctx,"h",["$id"]).w("\"><i class=\"fas fa-link color-gray-light\" aria-hidden=\"true\"></i></a><code class=\"symbol-name\">").f(ctx.get(["symbol"], false),ctx,"h",["s","$longname_params"]).w("</code><span class=\"symbol-sep\">").f(ctx.get(["symbol"], false),ctx,"h",["$type_sep"]).w("</span><code class=\"symbol-type\">").f(ctx.get(["symbol"], false),ctx,"h",["s","$type"]).w("</code>").f(ctx.get(["symbol"], false),ctx,"h",["s","$tags"]).w("</div></div><div class=\"symbol-definition\"><div class=\"symbol-info\">").x(ctx.getPath(false, ["symbol","alias"]),ctx,{"block":body_2},{}).x(ctx.getPath(false, ["symbol","augments"]),ctx,{"block":body_4},{}).x(ctx.getPath(false, ["symbol","version"]),ctx,{"block":body_5},{}).x(ctx.getPath(false, ["symbol","since"]),ctx,{"block":body_6},{}).x(ctx.getPath(false, ["symbol","copyright"]),ctx,{"block":body_7},{}).x(ctx.getPath(false, ["symbol","author"]),ctx,{"block":body_8},{}).x(ctx.getPath(false, ["symbol","license"]),ctx,{"block":body_9},{}).w("</div>").x(ctx.getPath(false, ["symbol","defaultvalue"]),ctx,{"block":body_10},{}).f(ctx.get(["symbol"], false),ctx,"h",["s","$desc"]).x(ctx.getPath(false, ["symbol","see"]),ctx,{"block":body_11},{}).h("ne",ctx,{"block":body_16},{"key":ctx.getPath(false, ["symbol","meta","code","type"]),"value":"ClassDeclaration"},"h").x(ctx.getPath(false, ["symbol","fires"]),ctx,{"block":body_19},{}).x(ctx.getPath(false, ["symbol","returns"]),ctx,{"block":body_21},{}).x(ctx.getPath(false, ["symbol","generator"]),ctx,{"block":body_24},{}).x(ctx.getPath(false, ["symbol","exceptions"]),ctx,{"block":body_28},{}).x(ctx.getPath(false, ["symbol","isEnum"]),ctx,{"block":body_31},{}).x(ctx.getPath(false, ["symbol","examples"]),ctx,{"block":body_32},{}).x(ctx.getPath(false, ["template","options","symbols","meta"]),ctx,{"block":body_35},{}).w("</div></div><hr />").x(ctx.getPath(false, ["symbol","$constructor"]),ctx,{"block":body_39},{}).nx(ctx.getPath(false, ["symbol","isEnum"]),ctx,{"block":body_41},{});}body_1.__dustBody=!0;function body_2(chk,ctx){return chk.nx(ctx.get(["$constructor"], false),ctx,{"block":body_3},{});}body_2.__dustBody=!0;function body_3(chk,ctx){return chk.w("<p><b class=\"caption\">Alias:</b> <code>").f(ctx.getPath(false, ["symbol","alias"]),ctx,"h",["s","$dot_prop"]).w("</code></p>");}body_3.__dustBody=!0;function body_4(chk,ctx){return chk.w("<p><b class=\"caption\">Extends:</b> ").f(ctx.get(["symbol"], false),ctx,"h",["s","$extends"]).w("</p>");}body_4.__dustBody=!0;function body_5(chk,ctx){return chk.w("<p><b class=\"caption\">Version:</b>&nbsp;").f(ctx.getPath(false, ["symbol","version"]),ctx,"h",["s"]).w("</p>");}body_5.__dustBody=!0;function body_6(chk,ctx){return chk.w("<p><b class=\"caption\">Since:</b>&nbsp;").f(ctx.getPath(false, ["symbol","since"]),ctx,"h",["s"]).w("</p>");}body_6.__dustBody=!0;function body_7(chk,ctx){return chk.w("<p><b class=\"caption\">Copyright:</b>&nbsp;").f(ctx.getPath(false, ["symbol","copyright"]),ctx,"h",["s"]).w("</p>");}body_7.__dustBody=!0;function body_8(chk,ctx){return chk.w("<p><b class=\"caption\">Author:</b>&nbsp;").f(ctx.getPath(false, ["symbol","author"]),ctx,"h",["s","$author"]).w("</p>");}body_8.__dustBody=!0;function body_9(chk,ctx){return chk.w("<p><b class=\"caption\">License:</b>&nbsp;").f(ctx.getPath(false, ["symbol","license"]),ctx,"h",["s"]).w("</p>");}body_9.__dustBody=!0;function body_10(chk,ctx){return chk.w("<p class=\"symbol-def-val\"><b class=\"caption\"><i>Value:</i></b>&nbsp;<code>").f(ctx.get(["symbol"], false),ctx,"h",["$def"]).w("</code></p>");}body_10.__dustBody=!0;function body_11(chk,ctx){return chk.w("<p class=\"no-margin\"><b>See</b>").h("gt",ctx,{"else":body_12,"block":body_14},{"key":ctx.getPath(false, ["symbol","see","length"]),"value":1},"h").w("</p>");}body_11.__dustBody=!0;function body_12(chk,ctx){return chk.s(ctx.getPath(false, ["symbol","see"]),ctx,{"block":body_13},{});}body_12.__dustBody=!0;function body_13(chk,ctx){return chk.w("&nbsp;").f(ctx.getPath(true, []),ctx,"h",["s","$pl"]);}body_13.__dustBody=!0;function body_14(chk,ctx){return chk.w("<ul>").s(ctx.getPath(false, ["symbol","see"]),ctx,{"block":body_15},{}).w("</ul>");}body_14.__dustBody=!0;function body_15(chk,ctx){return chk.w("<li>").f(ctx.getPath(true, []),ctx,"h",["s","$pl"]).w("</li>");}body_15.__dustBody=!0;function body_16(chk,ctx){return chk.p("params",ctx,ctx.rebase(ctx.get(["symbol"], false)),{"template":ctx.get(["template"], false)}).w(" ").x(ctx.getPath(false, ["symbol","isEnum"]),ctx,{"else":body_17,"block":body_18},{});}body_16.__dustBody=!0;function body_17(chk,ctx){return chk.p("properties",ctx,ctx.rebase(ctx.get(["symbol"], false)),{"template":ctx.get(["template"], false)}).w(" ");}body_17.__dustBody=!0;function body_18(chk,ctx){return chk;}body_18.__dustBody=!0;function body_19(chk,ctx){return chk.h("gt",ctx,{"block":body_20},{"key":ctx.getPath(false, ["symbol","fires","length"]),"value":"0","type":"number"},"h");}body_19.__dustBody=!0;function body_20(chk,ctx){return chk.w("<p><b class=\"caption\">Emits:</b>&nbsp;&nbsp;").f(ctx.get(["symbol"], false),ctx,"h",["s","$emits"]).w("</p>");}body_20.__dustBody=!0;function body_21(chk,ctx){return chk.h("gt",ctx,{"else":body_22,"block":body_23},{"key":ctx.getPath(false, ["symbol","returns","length"]),"value":"1","type":"number"},"h");}body_21.__dustBody=!0;function body_22(chk,ctx){return chk.w("<p><b class=\"caption\">Returns:</b>&nbsp;&nbsp;").f(ctx.get(["symbol"], false),ctx,"h",["s","$returns"]).w("</p>");}body_22.__dustBody=!0;function body_23(chk,ctx){return chk.w("<b class=\"caption\">Returns:</b><p class=\"pad-left\">").f(ctx.get(["symbol"], false),ctx,"h",["s","$returns"]).w("</p>");}body_23.__dustBody=!0;function body_24(chk,ctx){return chk.x(ctx.getPath(false, ["symbol","yields"]),ctx,{"block":body_25},{});}body_24.__dustBody=!0;function body_25(chk,ctx){return chk.h("gt",ctx,{"else":body_26,"block":body_27},{"key":ctx.getPath(false, ["symbol","yields","length"]),"value":"1","type":"number"},"h");}body_25.__dustBody=!0;function body_26(chk,ctx){return chk.w("<p><b class=\"caption\">Yields:</b>&nbsp;&nbsp;").f(ctx.get(["symbol"], false),ctx,"h",["s","$yields"]).w("</p>");}body_26.__dustBody=!0;function body_27(chk,ctx){return chk.w("<b class=\"caption\">Yields:</b><p class=\"pad-left\">").f(ctx.get(["symbol"], false),ctx,"h",["s","$yields"]).w("</p>");}body_27.__dustBody=!0;function body_28(chk,ctx){return chk.h("gt",ctx,{"else":body_29,"block":body_30},{"key":ctx.getPath(false, ["symbol","exceptions","length"]),"value":"1","type":"number"},"h");}body_28.__dustBody=!0;function body_29(chk,ctx){return chk.w("<p><b class=\"caption\">Throws:</b>&nbsp;&nbsp;").f(ctx.get(["symbol"], false),ctx,"h",["s","$exceptions"]).w("</p>");}body_29.__dustBody=!0;function body_30(chk,ctx){return chk.w("<b class=\"caption\">Throws:</b><p class=\"pad-left\">").f(ctx.get(["symbol"], false),ctx,"h",["s","$exceptions"]).w("</p>");}body_30.__dustBody=!0;function body_31(chk,ctx){return chk.p("enums",ctx,ctx.rebase(ctx.get(["symbol"], false)),{"template":ctx.get(["template"], false)}).w(" ");}body_31.__dustBody=!0;function body_32(chk,ctx){return chk.s(ctx.getPath(false, ["symbol","examples"]),ctx,{"block":body_33},{});}body_32.__dustBody=!0;function body_33(chk,ctx){return chk.w("<p><b>Example").h("gt",ctx,{"block":body_34},{"key":ctx.getPath(false, ["symbol","examples","length"]),"value":1},"h").w("</b>").f(ctx.getPath(true, []),ctx,"h",["$get_caption","s"]).w("</p><pre><code>").f(ctx.getPath(true, []),ctx,"h",["$nt","$tnl","$remove_caption"]).w("</code></pre>");}body_33.__dustBody=!0;function body_34(chk,ctx){return chk.w("&nbsp;#").h("math",ctx,{},{"key":ctx.get(["$idx"], false),"method":"add","operand":"1"},"h");}body_34.__dustBody=!0;function body_35(chk,ctx){return chk.x(ctx.getPath(false, ["symbol","meta","lineno"]),ctx,{"block":body_36},{});}body_35.__dustBody=!0;function body_36(chk,ctx){return chk.w("<p class=\"symbol-meta\">").x(ctx.getPath(false, ["symbol","meta","filename"]),ctx,{"block":body_37},{}).x(ctx.getPath(false, ["symbol","meta","lineno"]),ctx,{"block":body_38},{}).w("</p>");}body_36.__dustBody=!0;function body_37(chk,ctx){return chk.w("<b>File:</b> ").f(ctx.getPath(false, ["symbol","meta","filename"]),ctx,"h").w("&nbsp;&nbsp;");}body_37.__dustBody=!0;function body_38(chk,ctx){return chk.w("<b>Line:</b> ").f(ctx.getPath(false, ["symbol","meta","lineno"]),ctx,"h").w("&nbsp;&nbsp;");}body_38.__dustBody=!0;function body_39(chk,ctx){return chk.h("ne",ctx,{"block":body_40},{"key":ctx.getPath(false, ["symbol","hideconstructor"]),"type":"boolean","value":"true"},"h");}body_39.__dustBody=!0;function body_40(chk,ctx){return chk.p("symbol",ctx,ctx,{"symbol":ctx.getPath(false, ["symbol","$constructor"]),"template":ctx.get(["template"], false)});}body_40.__dustBody=!0;function body_41(chk,ctx){return chk.s(ctx.getPath(false, ["symbol","$members"]),ctx,{"block":body_42},{});}body_41.__dustBody=!0;function body_42(chk,ctx){return chk.p("symbol",ctx,ctx,{"symbol":ctx.getPath(true, []),"template":ctx.get(["template"], false)});}body_42.__dustBody=!0;return body_0}(dust));
/*!
 * Docma (Web) Core
 * https://github.com/onury/docma
 * @license MIT
 */
var DocmaWeb = (function () {
'use strict';

/* global */
/* eslint max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

/**
 *  Docma (web) core class.
 *  See {@link api/web|documentation}.
 *  @name DocmaWeb
 *  @class
 */

// --------------------------------
// NAMESPACE: DocmaWeb.Utils
// https://github.com/onury/docma
// --------------------------------

/**
 *  Utilities for inspecting JSDoc documentation and symbols; and parsing
 *  documentation data into proper HTML.
 *  @name DocmaWeb.Utils
 *  @type {Object}
 *  @namespace
 */
var Utils = {};

function getStr(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function bracket(prop) {
    var re = /^[a-z$_][a-z\d$_]*$/i; // non-bracket notation
    return re.test(prop) ? '.' + prop : '["' + prop + '"]';
}
// fixes a jsdoc bug
// e.g. MyClass.Enum."STATE"] —» MyClass.Enum.STATE
function fixBracket(notation) {
    return notation.replace(/(.*?)\."([^"]+)"\]?$/, function (str, $1, $2) {
        return $2 ? $1 + bracket($2) : notation;
    });
}

/**
 *  Cleans the given symbol name.
 *  @private
 *  @param {String} name - Symbol name to be cleaned.
 *  @returns {String} -
 */
function cleanName(name) {
    // e.g. <anonymous>~obj.doStuff —» obj.doStuff
    name = getStr(name)
        .replace(/([^>]+>)?~?(.*)/, '$2')
        // e.g. '"./node_modules/eventemitter3/index.js"~EventEmitter'.
        .replace(/^"[^"]+"\.?~?([^"]+)$/, '$1')
        .replace(/^(module\.)?exports\./, '')
        .replace(/^module:/, '');
    return fixBracket(name);
}

function getMetaCodeName(symbol) {
    return cleanName(Utils.notate(symbol, 'meta.code.name') || '');
}

function identity(o) {
    return o;
}

function hasConstructorTag(symbol) {
    return /\*\s+@construct(s|or)\b/.test(symbol.comment);
}

/**
 *  Gets the type of the given object.
 *  @name DocmaWeb.Utils.type
 *  @function
 *  @static
 *
 *  @param {*} obj - Object to be inspected.
 *  @returns {String} - Lower-case name of the type.
 */
Utils.type = function (obj) {
    return Object.prototype.toString.call(obj).match(/\s(\w+)/i)[1].toLowerCase();
};

/**
 *  Gets the value of the target property by the given dot
 *  {@link https://github.com/onury/notation|notation}.
 *  @name DocmaWeb.Utils.notate
 *  @function
 *  @static
 *
 *  @param {Object} obj - Source object.
 *  @param {String} notation - Path of the property in dot-notation.
 *
 *  @returns {*} - The value of the notation. If the given notation does
 *  not exist, safely returns `undefined`.
 *
 *  @example
 *  var symbol = { code: { meta: { type: "MethodDefinition" } } };
 *  DocmaWeb.Utils.notate(symbol, "code.meta.type"); // returns "MethodDefinition"
 */
Utils.notate = function (obj, notation) {
    if (typeof obj !== 'object') return;
    var o,
        props = !Array.isArray(notation)
            ? notation.split('.')
            : notation,
        prop = props[0];
    if (!prop) return;
    o = obj[prop];
    if (props.length > 1) {
        props.shift();
        return Utils.notate(o, props);
    }
    return o;
};

/**
 *  Gets the short name of the given symbol.
 *  JSDoc overwrites the `longname` and `name` of the symbol, if it has an
 *  alias. This returns the correct short name.
 *  @name DocmaWeb.Utils.getName
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {String} -
 */
Utils.getName = function (symbol) {
    // if @alias is set, the original (long) name is only found at meta.code.name
    if (symbol.alias) {
        var codeName = getMetaCodeName(symbol);
        if (codeName) return codeName.replace(/.*?[#.~:](\w+)$/i, '$1');
    }
    return symbol.name;
};

/**
 *  Gets the original long name of the given symbol.
 *  JSDoc overwrites the `longname` and `name` of the symbol, if it has an
 *  alias. This returns the correct long name.
 *  @name DocmaWeb.Utils.getLongName
 *  @function
 *  @alias getFullName
 *  @static
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {String} -
 */
Utils.getLongName = function (symbol) {
    var longName = cleanName(symbol.longname);
    var metaCodeName = getMetaCodeName(symbol) || longName;
    var memberOf =  symbol.memberof || '';
    // if memberOf is like "\"./some/file.js\""
    memberOf = /^".*"$/.test(memberOf) ? '' : cleanName(memberOf);

    // JSDoc bug: if the constructor is not marked with @constructs, the
    // longname is incorrect. e.g. `ClassName#ClassName`. So we return
    // (clean) meta.code.name in this case. e.g. `ClassName`
    if (symbol.name === memberOf && Utils.isConstructor(symbol)) {
        return metaCodeName;
    }

    // if @alias is set, the original (long) name is generally found at
    // meta.code.name
    var codeName = symbol.alias ? metaCodeName : longName;

    if (!memberOf) return codeName;
    var re = new RegExp('^' + memberOf + '[#.~:]'),
        dot = symbol.scope === 'instance' ? '#' : '.';

    return re.test(codeName) ? codeName : memberOf + dot + codeName;
};
Utils.getFullName = Utils.getLongName;

/**
 *  Gets the code name of the given symbol.
 *  @name DocmaWeb.Utils.getCodeName
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {String} - If no code name, falls back to long name.
 */
Utils.getCodeName = function (symbol) {
    return getMetaCodeName(symbol) || Utils.getLongName(symbol);
};

/**
 *  Gets the first matching symbol by the given name.
 *  @name DocmaWeb.Utils.getSymbolByName
 *  @function
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {String} name - Symbol name to be checked. Better, pass the
 *  `longname` (or `$longname`). It will still find a short name but it'll
 *  return the first occurence if there are multiple symbols with the same
 *  short name. e.g. `create` is ambiguous but `Docma.create` is unique.
 *
 *  @returns {Object} - Symbol object if found. Otherwise, returns `null`.
 */
Utils.getSymbolByName = function (docsOrApis, name) {
    var i, symbol, docs, found;
    if (Utils.type(docsOrApis) === 'object') {
        var apiNames = Object.keys(docsOrApis);
        for (i = 0; i < apiNames.length; i++) {
            docs = docsOrApis[apiNames[i]].documentation;
            found = Utils.getSymbolByName(docs, name);
            if (found) return found;
        }
        return null;
    }

    docs = docsOrApis;
    for (i = 0; i < docs.length; i++) {
        symbol = docs[i];
        if (symbol.name === name
                || symbol.longname === name
                || Utils.getFullName(symbol) === name) {
            return symbol;
        }
        if (symbol.$members) {
            found = Utils.getSymbolByName(symbol.$members, name);
            if (found) return found;
        }
    }
    return null;
};

/**
 *  Gets the number of levels for the given symbol or name. e.g.
 *  `mylib.prop` has 2 levels.
 *  @name DocmaWeb.Utils.getLevels
 *  @function
 *
 *  @param {Object|String} symbol - Documented symbol object or long name.
 *  @returns {Number} -
 */
Utils.getLevels = function (symbol) {
    var longname = (typeof symbol === 'string' ? symbol : symbol.$longname) || '';
    longname = cleanName(longname);
    // colon (:) is not a level separator. JSDoc uses colon in cases like:
    // `obj~event:ready` or `module:someModule`
    return longname
        ? ((longname || '').split(/[.#~]/) || []).length
        : 0;
};

/**
 *  Gets the parent symbol name from the given symbol object or symbol's name
 *  (notation). Note that, this will return the parent name even if the parent
 *  symbol does not exist in the documentation. If there is no parent, returns
 *  `""` (empty string).
 *  @name DocmaWeb.Utils.getParentName
 *  @function
 *
 *  @param {Object|String} symbol - Documented symbol object or long name.
 *  @returns {Number} -
 */
Utils.getParentName = function (symbol) {
    var longname;
    if (typeof symbol !== 'string') {
        if (symbol.memberof
                // if memberOf is like "\"./some/file.js\""
                && /^".*"$/.test(symbol.memberof) === false) {
            return cleanName(symbol.memberof);
        }
        longname = cleanName(symbol.$longname);
    } else {
        longname = cleanName(symbol);
    }
    // colon (:) is not a level separator. JSDoc uses colon in cases like:
    // `obj~event:ready` or `module:someModule`
    if (!longname || !(/[.#~]/g).test(longname)) return '';
    return longname.replace(/[.#~][^.#~]*$/, '');
};

/**
 *  Gets the parent symbol object from the given symbol object or symbol's
 *  name.
 *  @name DocmaWeb.Utils.getParent
 *  @function
 *
 *  @param {Array|Object} docs - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Object|String} symbol - Documented symbol object or long name.
 *  @returns {String} - `null` if symbol has no parent.
 */
Utils.getParent = function (docs, symbol) {
    var sym = typeof symbol === 'string'
        ? Utils.getSymbolByName(docs, symbol)
        : symbol;
    if (!sym) return null;
    // var parentName = (sym && cleanName(sym.memberof)) || Utils.getParentName(symbol);
    var parentName = Utils.getParentName(sym);
    if (parentName) return Utils.getSymbolByName(docs, parentName);
    return null;
};

/**
 *  Checks whether the given symbol is deprecated.
 *  @name DocmaWeb.Utils.isDeprecated
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isDeprecated = function (symbol) {
    return symbol.deprecated;
};

/**
 *  Checks whether the given symbol has global scope.
 *  @name DocmaWeb.Utils.isGlobal
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isGlobal = function (symbol) {
    return symbol.scope === 'global';
};

/**
 *  Checks whether the given symbol is a namespace.
 *  @name DocmaWeb.Utils.isNamespace
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isNamespace = function (symbol) {
    return symbol.kind === 'namespace';
};

/**
 *  Checks whether the given symbol is a module.
 *  @name DocmaWeb.Utils.isModule
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isModule = function (symbol) {
    return symbol.kind === 'module';
};

/**
 *  Checks whether the given symbol is marked as a mixin (is intended to be
 *  added to other objects).
 *  @name DocmaWeb.Utils.isMixin
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isMixin = function (symbol) {
    return symbol.kind === 'mixin';
};

/**
 *  Checks whether the given symbol is a class.
 *  @name DocmaWeb.Utils.isClass
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isClass = function (symbol) {
    return symbol.kind === 'class'
        && Utils.notate(symbol, 'meta.code.type') !== 'MethodDefinition' // constructor if MethodDefinition
        && !hasConstructorTag(symbol);
    // && Utils.notate(symbol, 'meta.code.type') === 'ClassDeclaration';
};

/**
 *  Checks whether the given symbol is marked as a constant.
 *  @name DocmaWeb.Utils.isConstant
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isConstant = function (symbol) {
    return symbol.kind === 'constant';
};

/**
 *  Checks whether the given symbol is a constructor.
 *  @name DocmaWeb.Utils.isConstructor
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isConstructor = function (symbol) {
    return symbol.kind === 'class'
        && (Utils.notate(symbol, 'meta.code.type') === 'MethodDefinition' || hasConstructorTag(symbol));
};

/**
 *  Checks whether the given symbol is a static member.
 *  @name DocmaWeb.Utils.isStaticMember
 *  @function
 *  @alias isStatic
 *  @static
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isStaticMember = function (symbol) {
    return symbol.scope === 'static';
};
/**
 *  Alias for `Utils.isStaticMember`
 *  @private
 */
Utils.isStatic = Utils.isStaticMember;

/**
 *  Checks whether the given symbol has an inner scope.
 *  @name DocmaWeb.Utils.isInner
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isInner = function (symbol) {
    return symbol.scope === 'inner';
};

/**
 *  Checks whether the given symbol is an instance member.
 *  @name DocmaWeb.Utils.isInstanceMember
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isInstanceMember = function (symbol) {
    return symbol.scope === 'instance';
};

/**
 *  Checks whether the given symbol is marked as an interface that other symbols
 *  can implement.
 *  @name DocmaWeb.Utils.isInterface
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isInterface = function (symbol) {
    return symbol.scope === 'interface';
};

/**
 *  Checks whether the given symbol is a method (function).
 *  @name DocmaWeb.Utils.isMethod
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isMethod = function (symbol) {
    var codeType = Utils.notate(symbol, 'meta.code.type');
    return symbol.kind === 'function'
        || codeType === 'FunctionExpression'
        || codeType === 'FunctionDeclaration';
    // for getters/setters codeType might return 'MethodDefinition'
    // so we leave it out.
};
Utils.isFunction = Utils.isMethod;

/**
 *  Checks whether the given symbol is an instance method.
 *  @name DocmaWeb.Utils.isInstanceMethod
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isInstanceMethod = function (symbol) {
    return Utils.isInstanceMember(symbol) && Utils.isMethod(symbol);
};

/**
 *  Checks whether the given symbol is a static method.
 *  @name DocmaWeb.Utils.isStaticMethod
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isStaticMethod = function (symbol) {
    return Utils.isStaticMember(symbol) && Utils.isMethod(symbol);
};

/**
 *  Checks whether the given symbol is a property (and not a method/function).
 *  @name DocmaWeb.Utils.isProperty
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isProperty = function (symbol) {
    return symbol.kind === 'member' && !Utils.isMethod(symbol);
};

/**
 *  Checks whether the given symbol is an instance property.
 *  @name DocmaWeb.Utils.isInstanceProperty
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isInstanceProperty = function (symbol) {
    return Utils.isInstanceMember(symbol) && Utils.isProperty(symbol);
};

/**
 *  Checks whether the given symbol is a static property.
 *  @name DocmaWeb.Utils.isStaticProperty
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isStaticProperty = function (symbol) {
    return Utils.isStaticMember(symbol) && Utils.isProperty(symbol);
};

/**
 *  Checks whether the given symbol is a custom type definition.
 *  @name DocmaWeb.Utils.isTypeDef
 *  @function
 *  @alias isCustomType
 *  @static
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isTypeDef = function (symbol) {
    return symbol.kind === 'typedef';
};
/**
 *  Alias for `Utils.isTypeDef`
 *  @private
 */
Utils.isCustomType = Utils.isTypeDef;

/**
 *  Checks whether the given symbol is a callback definition.
 *  @name DocmaWeb.Utils.isCallback
 *  @function
 *  @static
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isCallback = function (symbol) {
    var typeNames = (symbol.type || {}).names || [];
    return symbol.kind === 'typedef'
        && (symbol.comment || '').indexOf('@callback ' + symbol.longname) >= 0
        && (typeNames.length === 1 && typeNames[0] === 'function');
};

/**
 *  Checks whether the given symbol is an enumeration.
 *  @name DocmaWeb.Utils.isEnum
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isEnum = function (symbol) {
    return Boolean(symbol.isEnum);
};

/**
 *  Checks whether the given symbol is an event.
 *  @name DocmaWeb.Utils.isEvent
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isEvent = function (symbol) {
    return symbol.kind === 'event';
};

/**
 *  Checks whether the given symbol is defined outside of the current package.
 *  @name DocmaWeb.Utils.isExternal
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isExternal = function (symbol) {
    return symbol.kind === 'external';
};

/**
 *  Checks whether the given symbol is a generator function.
 *  @name DocmaWeb.Utils.isGenerator
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isGenerator = function (symbol) {
    return symbol.generator && symbol.kind === 'function';
};

/**
 *  Checks whether the given symbol is read-only.
 *  @name DocmaWeb.Utils.isReadOnly
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isReadOnly = function (symbol) {
    return symbol.readonly;
};

/**
 *  Checks whether the given symbol has `public` access.
 *  @name DocmaWeb.Utils.isPublic
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isPublic = function (symbol) {
    return typeof symbol.access !== 'string' || symbol.access === 'public';
};

/**
 *  Checks whether the given symbol has `private` access.
 *  @name DocmaWeb.Utils.isPrivate
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isPrivate = function (symbol) {
    return symbol.access === 'private';
};

/**
 *  Checks whether the given symbol has `package` private access; indicating
 *  that the symbol is available only to code in the same directory as the
 *  source file for this symbol.
 *  @name DocmaWeb.Utils.isPackagePrivate
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isPackagePrivate = function (symbol) {
    return symbol.access === 'package';
};

/**
 *  Checks whether the given symbol has `protected` access.
 *  @name DocmaWeb.Utils.isProtected
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isProtected = function (symbol) {
    return symbol.access === 'protected';
};

/**
 *  Checks whether the given symbol is undocumented.
 *  This checks if the symbol has any comments.
 *  @name DocmaWeb.Utils.isUndocumented
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isUndocumented = function (symbol) {
    // we could use the `undocumented` property but it still seems buggy.
    // https://github.com/jsdoc3/jsdoc/issues/241
    // `undocumented` is omitted (`undefined`) for documented symbols.
    // return symbol.undocumented !== true;
    return !symbol.comments;
};

/**
 *  Checks whether the given symbol has description.
 *  @name DocmaWeb.Utils.hasDescription
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.hasDescription = function (symbol) {
    return Boolean(getStr(symbol.classdesc) || getStr(symbol.description));
};

/**
 *  Removes leading spaces and dashes. Useful when displaying symbol
 *  descriptions.
 *  @name DocmaWeb.Utils.trimLeft
 *  @function
 *
 *  @param {String} string - String to be trimmed.
 *  @returns {String} -
 */
Utils.trimLeft = function (string) {
    // remove leading space and dashes.
    return string.replace(/^[\s\n\r\-—]*/, '');
};

/**
 *  Removes leading and trailing new lines.
 *  @name DocmaWeb.Utils.trimNewLines
 *  @function
 *
 *  @param {String} string - String to be trimmed.
 *  @returns {String} -
 */
Utils.trimNewLines = function (string) {
    return string.replace(/^[\r\n]+|[\r\n]+$/, '');
};

/**
 *  Converts back-ticks to HTML code tags.
 *  @name DocmaWeb.Utils.parseTicks
 *  @function
 *
 *  @param {String} string
 *         String to be parsed.
 *
 *  @returns {String} -
 */
Utils.parseTicks = function (string) {
    if (typeof string !== 'string') return '';
    return string
        .replace(/(```\s*)([\s\S]*?)(\s*```)/g, function (match, p1, p2) { // , p3, offset, string
            return Utils.normalizeTabs(Utils._wrapCode(p2, true, true).replace(/`/g, '&#x60;'));
        })
        .replace(/(`)(.*?)(`)/g, function (match, p1, p2) { // , p3, offset, string
            return Utils._wrapCode(p2, true);
        });
};

/**
 *  Converts new lines to HTML paragraphs.
 *  @name DocmaWeb.Utils.parseNewLines
 *  @function
 *
 *  @param {String} string - String to be parsed.
 *  @param {Object} [options] - Parse options.
 *         @param {Boolean} [options.keepIfSingle=false]
 *         If `true`, lines will not be converted to paragraphs.
 *
 *  @returns {String} -
 */
Utils.parseNewLines = function (string, options) {
    options = options || {};
    return Utils._tokenize(string, function (block, isCode) {
        if (isCode) return block;
        var parts = block.split(/[\r\n]{2,}/);
        if (parts.length <= 1 && options.keepIfSingle) return block;
        return parts.map(function (part) {
            return '<p>' + part + '</p>';
        }).join('');
    }).join('');
};

/**
 *  Converts JSDoc `@link` directives to HTML anchor tags.
 *  @name DocmaWeb.Utils.parseLinks
 *  @function
 *
 *  @param {String} string - String to be parsed.
 *  @param {Object} [options] - Parse options.
 *  @param {String} [options.target] - Href target. e.g. `"_blank"`
 *
 *  @returns {String} -
 */
Utils.parseLinks = function (string, options) {
    if (typeof string !== 'string') return '';
    options = options || {};
    var re = /\{@link +([^}]*?)\}/g;
    var out = string.replace(re, function (match, p1) { // , offset, string
        var link, label,
            parts = p1.split('|');
        if (parts.length === 1) {
            link = label = parts[0].trim(); // eslint-disable-line
        } else {
            link = parts[0].trim();
            label = parts[1].trim();
        }
        // if does not look like a URL path, treat this as a symbol bookmark.
        // instead, we could check like this:
        // if (symbolNames && symbolNames.indexOf(link) >= 0) {..}
        // but it has too much overhead...
        if ((/[/?&=]/).test(link) === false && link[0] !== '#') link = '#' + link;

        var target = options.target
            ? ' target="' + options.target + '" rel="noopener noreferrer"'
            : '';
        return '<a href="' + link + '"' + target + '>' + label + '</a>';
    });
    return Utils.parseTicks(out);
};

/**
 *  Parses the given string into proper HTML. Removes leading whitespace,
 *  converts new lines to paragraphs, ticks to code tags and JSDoc links to
 *  anchors.
 *  @name DocmaWeb.Utils.parse
 *  @function
 *
 *  @param {String} string - String to be parsed.
 *  @param {Object} [options] - Parse options.
 *         @param {Object} [options.keepIfSingle=false]
 *         If enabled, single lines will not be converted to paragraphs.
 *         @param {String} [options.target]
 *         Href target for links. e.g. `"_blank"`
 *
 *  @returns {String} -
 */
Utils.parse = function (string, options) {
    options = options || {};
    string = Utils.trimLeft(string);
    string = Utils.parseNewLines(string, options);
    string = Utils.parseTicks(string);
    return Utils.parseLinks(string, options);
};

/**
 *  Normalizes the number of spaces/tabs to multiples of 2 spaces, in the
 *  beginning of each line. Useful for fixing mixed indets of a description
 *  or example.
 *  @name DocmaWeb.Utils.normalizeTabs
 *  @function
 *
 *  @param {String} string - String to process.
 *
 *  @returns {String} -
 */
Utils.normalizeTabs = function (string) {
    if (typeof string !== 'string') return '';
    var m = string.match(/^\s*/gm),
        min = Infinity;

    m.forEach(function (wspace, index) {
        // tabs to spaces
        wspace = wspace.replace(/\t/g, '  ');
        // ignoring first line's indent
        if (index > 0) min = Math.min(wspace.length, min);
    });

    // replace the minimum indent from all lines (except first)
    if (min !== Infinity) {
        var re = new RegExp('^\\s{' + min + '}', 'g');
        string = string.replace(re, '');
    }
    // replace all leading spaces from first line
    string = string.replace(/^\s*/, '');

    var spaces;
    return string.replace(/([\r\n]+)(\s+)/gm, function (match, p1, p2) { // , offset, string
        // convert tabs to spaces
        spaces = p2.replace(/\t/g, '  ');
        // convert indent to multiples of 2
        spaces = new Array(spaces.length - (spaces.length % 2) + 1).join(' ');
        return p1 + spaces;
    });
};

/**
 *  Builds a string of keywords from the given symbol.
 *  This is useful for filter/search features of a template.
 *  @name DocmaWeb.Utils.getKeywords
 *  @function
 *
 *  @param {Object} symbol - Target documentation symbol.
 *  @returns {String} -
 */
Utils.getKeywords = function (symbol) {
    if (typeof symbol === 'string') return symbol.toLowerCase();
    var k = Utils.getFullName(symbol) + ' '
        + symbol.longname + ' '
        + symbol.name + ' '
        + (symbol.alias || '') + ' '
        + (symbol.memberOf || '') + ' '
        + (symbol.$kind || '') + ' '
        + (symbol.scope || '') + ' '
        + (symbol.classdesc || '') + ' '
        + (symbol.description || '') + ' '
        + (symbol.filename || '') + ' '
        + (symbol.readonly ? 'readonly' : '')
        + (symbol.isEnum ? 'enum' : '');
    if (Utils.isConstructor(symbol)) k += ' constructor';
    if (Utils.isMethod(symbol)) k += ' method';
    if (Utils.isProperty(symbol)) k += ' property';
    return k.replace(/[><"'`\n\r]/g, '').toLowerCase();
};

/**
 *  Gets code file information from the given symbol.
 *  @name DocmaWeb.Utils.getCodeFileInfo
 *  @function
 *
 *  @param {Object} symbol - Target documentation symbol.
 *  @returns {Object} -
 */
Utils.getCodeFileInfo = function (symbol) {
    return {
        filename: Utils.notate(symbol, 'meta.filename'),
        lineno: Utils.notate(symbol, 'meta.lineno'),
        path: Utils.notate(symbol, 'meta.path')
    };
};

/**
 *  Gets Docma route link for the given symbol or symbol name.
 *  @name DocmaWeb.Utils.getSymbolLink
 *  @function
 *  @static
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Object|String} symbolOrName - Either the symbol itself or the
 *  name of the symbol.
 *
 *  @returns {String} - Empty string if symbol is not found.
 */
Utils.getSymbolLink = function (docsOrApis, symbolOrName) {
    if (typeof symbolOrName !== 'string') {
        return symbolOrName.$docmaLink;
    }
    var symbol = Utils.getSymbolByName(docsOrApis, symbolOrName);
    return symbol ? symbol.$docmaLink : '';
};

var reEndBrackets = /\[\]$/;
// regexp for inspecting type parts such as `Map<String, Object>`,
// `Promise<Boolean|String>[]` or simply `Boolean`. this also
// removes/ignores dots from types such as Array.<String>
var reTypeParts = /^([^<]+?)(?:\.)?(?:<\(([^>)]+)\)>)?(?:<([^>]+)>)?(\[\])?$/;

function _link(docsOrApis, type, options) {
    var endBrackets = reEndBrackets.test(type) ? '[]' : '';
    var t = (type || '').replace(reEndBrackets, '');
    var opts = options || {};
    var link;
    var target = '';
    if (opts.linkType !== 'internal') {
        link = Utils._getTypeExternalLink(t);
        if (link) target = ' target="_blank" rel="noopener noreferrer"';
    }
    if (!link && opts.linkType !== 'external') link = Utils.getSymbolLink(docsOrApis, t);
    if (link) type = '<a href="' + link + '"' + target + '>' + (opts.displayText || t) + endBrackets + '</a>';
    return type;
}

/**
 *  Gets Docma route link for the given symbol or symbol name and returns a
 *  string with anchor tags.
 *  @private
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {String} strType - Symbol type.
 *  @param {String} [options] - Options
 *      @param {String} [options.displayText] - Alternative display text to
 *      be placed within the anchor tag.
 *      @param {String} [options.linkType] - Set to `"internal"` (Docma
 *      symbol link) or `"external"` (JS or Web-API MDN link), or omit to
 *      get any of them, if found.
 *
 *  @returns {String} -
 */
Utils._parseAnchorLinks = function (docsOrApis, strType, options) {
    // see reTypeParts and reEndBrackets
    var m = strType.match(reTypeParts);
    if (!m || !m[1]) return '';
    // maybe we have end brackets e.g. Boolean[] or Promise<Boolean>[]
    var endBrackets = m[4] || '';
    var sTypes = m[2] || m[3] || '';
    // check for multiple types e.g. Map<String, String>
    if (sTypes) {
        sTypes = sTypes.split(',').map(function (outerT) {
            // check for sub-types e.g. Promise<Boolean|String>
            return outerT
                .trim()
                .split('|')
                .map(function (t) {
                    return _link(docsOrApis, t, options);
                })
                .join('<span class="code-delim">|</span>');
        }).join('<span class="code-delim">, </span>');
    }
    if (sTypes) sTypes = '&lt;' + sTypes + '&gt;';
    // check for sub-types e.g. Promise<Boolean|String>
    return _link(docsOrApis, m[1], options) + sTypes + endBrackets;
};

/**
 *  Gets the types of the symbol as a string (joined with pipes `|`).
 *  @name DocmaWeb.Utils.getTypes
 *  @function
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Object} symbol - Target documentation symbol.
 *  @param {Object} [options] - Options.
 *      @param {Boolean|String} [options.links=false] - Whether to add
 *      HTML anchor links to output. Set to `"internal"` to link
 *      internally (to Docma route with symbol hash, if found) or
 *      `"external"` to link externally (to MDN URL if this is a
 *      JS/Web-API built-in type/object) or `true` to try linking either
 *      to an internal or external target, which ever is found.
 *
 *  @returns {String} -
 *
 *  @example
 *  var symbol = { "type": { "names": ["Number", "String"] } };
 *  DocmaWeb.Utils.getTypes(docs, symbol); // "Number|String"
 */
Utils.getTypes = function (docsOrApis, symbol, options) {
    var opts = options || {};
    var types = symbol.kind === 'class'
        ? ['class']
        : Utils.notate(symbol, 'type.names') || [];
    types = types.map(function (type) {
        if (opts.links) type = Utils._parseAnchorLinks(docsOrApis, type, { linkType: opts.links });
        return type;
    }).join('<span class="code-delim">|</span>');
    return symbol.isEnum ? 'enum&lt;' + types + '&gt;' : types;
};

// e.g.
// "returns": [
//   {
//     "type": { "names": ["Date"] },
//     "description": "- Current date."
//   }
// ]

/**
 *  Gets the return types of the symbol as a string (joined with pipes `|`).
 *  @name DocmaWeb.Utils.getReturnTypes
 *  @function
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Object} symbol - Target documentation symbol.
 *  @param {Object} [options] - Options.
 *      @param {Boolean|String} [options.links=false] - Whether to add
 *      HTML anchor links to output. Set to `"internal"` to link
 *      internally (to Docma route with symbol hash, if found) or
 *      `"external"` to link externally (to MDN URL if this is a
 *      JS/Web-API built-in type/object) or `true` to try linking either
 *      to an internal or external target, which ever is found.
 *
 *  @returns {String} -
 */
Utils.getReturnTypes = function (docsOrApis, symbol, options) {
    var ret = symbol.returns;
    if (!Array.isArray(ret)) return 'void';
    var opts = options || {};

    var allTypes = ret.reduce(function (memo, r) {
        var types = Utils.notate(r, 'type.names') || [];
        if (opts.links) {
            types = types.map(function (type) {
                return Utils._parseAnchorLinks(docsOrApis, type, { linkType: opts.links });
            });
        }
        return memo.concat(types);
    }, []);
    return allTypes.length > 0
        ? allTypes.join('<span class="code-delim">|</span>')
        : 'void';
};

/**
 *  Gets HTML formatted, delimeted code tags.
 *  @name DocmaWeb.Utils.getCodeTags
 *  @function
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Array} list - String list of values to be placed within code
 *  tags.
 *  @param {Object} [options] - Options.
 *      @param {String} [options.delimeter=","] - String delimeter.
 *      @param {Boolean|String} [options.links=false] - Whether to add
 *      HTML anchor links to output. Set to `"internal"` to link
 *      internally (to Docma route with symbol hash, if found) or
 *      `"external"` to link externally (to MDN URL if this is a
 *      JS/Web-API built-in type/object) or `true` to try linking either
 *      to an internal or external target, which ever is found.
 *
 *  @returns {String} -
 */
Utils.getCodeTags = function (docsOrApis, list, options) {
    var opts = options || {};
    return list.map(function (item) {
        if (opts.links) {
            var parsed = Utils._parseAnchorLinks(docsOrApis, item, {
                linkType: opts.links
            });
            return Utils._wrapCode(parsed, false);
        }
        return Utils._wrapCode(item, true);
    }).join(opts.demileter || ',');
};

/**
 *  Gets HTML formatted list of types from the given symbols list. Type
 *  items are wrapped with code tags. If multiple, formatted as an HTML
 *  unordered list.
 *  @name DocmaWeb.Utils.getFormattedTypeList
 *  @function
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Array} list - List of symbols to be converted to formatted
 *  string.
 *  @param {Object} [options] - Format options.
 *      @param {String} [options.delimeter="|"] - Types delimeter.
 *      @param {Boolean|String} [options.links=false] - Whether to add
 *      HTML anchor links to output. Set to `"internal"` to link
 *      internally (to Docma route with symbol hash, if found) or
 *      `"external"` to link externally (to MDN URL if this is a
 *      JS/Web-API built-in type/object) or `true` to try linking either
 *      to an internal or external target, which ever is found.
 *      @param {Boolean} [options.descriptions=true] - Whether to include descriptions.
 *      @param {String} [options.descDelimeter="  —  "] - Description delimiter.
 *
 *  @returns {String} -
 */
Utils.getFormattedTypeList = function (docsOrApis, list, options) {
    if (!Array.isArray(list) || list.length === 0) return '';

    var opts = options || {};
    var delim = '<span class="code-delim">' + (opts.delimeter || '|') + '</span>';
    var addDesc = typeof opts.descriptions !== 'boolean' ? true : opts.descriptions;
    var descDelim = opts.descDelimeter || '&nbsp;&nbsp;—&nbsp;&nbsp;';

    var desc = '';
    var pList = list.map(function (item) {
        if (addDesc) {
            desc = Utils.parse(item.description || '', { keepIfSingle: true });
            if (desc) desc = descDelim + desc;
        }
        if (item.type) {
            // https://github.com/onury/docma/issues/55
            var types = (item.type.names || []).map(function (type) {
                if (opts.links) {
                    var parsed = Utils._parseAnchorLinks(docsOrApis, type, {
                        linkType: opts.links
                    });
                    return Utils._wrapCode(parsed, false);
                }
                return Utils._wrapCode(type, true);
            });
            return types.join(delim) + desc;
        }
        // no type names, returning desc only
        return desc ? '— ' + desc : '';
    });
    if (pList.length > 1) {
        return '<ul><li>' + pList.join('</li><li>') + '</li></ul>';
    }
    return pList; // single item
};

/**
 *  Gets HTML formatted list of emitted events from the given list. Event
 *  names items are wrapped with code tags. If multiple, formatted as an
 *  HTML unordered list.
 *  @name DocmaWeb.Utils.getEmittedEvents
 *  @function
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Array} list - List of emitted (fired) events.
 *  @param {Object} [options] - Options.
 *  @param {String} [options.delimeter=", "] - Events delimeter.
 *  @param {Boolean|String} [options.links=false] - Whether to add
 *      HTML anchor links to output. Set to `"internal"` to link
 *      internally (to Docma route with symbol hash, if found) or
 *      `"external"` to link externally (to MDN URL if this is a
 *      JS/Web-API built-in type/object) or `true` to try linking either
 *      to an internal or external target, which ever is found.
 *
 *  @returns {String} -
 */
Utils.getEmittedEvents = function (docsOrApis, list, options) {
    if (!list || list.length === 0) return '';

    var opts = options || {};
    var delim = opts.delimeter || ', ';

    // example:
    // "fires": [
    //     "event:render - some desc." // this is incorrect. no desc allowed here.
    // ]
    var parts, name;
    var events = (list || []).map(function (event) {
        parts = event.split(/\s*[\s-—]\s*/g);
        name = (parts[0] || '').trim(); // .replace(/event:/, '').trim()
        if (opts.links) {
            var parsed = Utils._parseAnchorLinks(docsOrApis, name, {
                linkType: opts.links
            });
            return Utils._wrapCode(parsed, false);
        }
        return Utils._wrapCode(name, true);
    });
    return events.join(delim);
};

// ----------------------
// PRIVATE
// ----------------------

/**
 *  Iterates and gets the first matching item in the array.
 *  @name DocmaWeb.Utils._find
 *  @function
 *  @private
 *
 *  @param {Array} array
 *         Source array.
 *  @param {Object} map
 *         Key/value mapping for the search.
 *
 *  @returns {*} - First matching result. `null` if not found.
 */
Utils._find = function (array, map) {
    // don't type check
    if (!array || !map) return null;
    var i, item,
        found = null;
    for (i = 0; i < array.length; i++) {
        item = array[i];
        if (item && typeof item === 'object') {
            for (var prop in map) {
                // we also ignore undefined !!!
                if (map[prop] !== undefined && map.hasOwnProperty(prop)) {
                    if (map[prop] !== item[prop]) {
                        found = null;
                        break;
                    } else {
                        found = item;
                    }
                }
            }
            if (found) break; // exit
        }
    }
    return found;
};

/**
 *  Assignes the source properties to the target object.
 *  @name DocmaWeb.Utils._assign
 *  @function
 *  @private
 *
 *  @param {Object} target
 *         Target object.
 *  @param {Object} source
 *         Source object.
 *  @param {Boolean} [enumerable=false]
 *         Whether the assigned properties should be enumerable.
 *
 *  @returns {Object} - Modified target object.
 */
Utils._assign = function (target, source, enumerable) {
    target = target || {};
    var prop;
    for (prop in source) {
        if (source.hasOwnProperty(prop)) {
            if (enumerable) {
                Object.defineProperty(target, prop, {
                    enumerable: true,
                    value: source[prop]
                });
            } else {
                target[prop] = source[prop];
            }
        }
    }
    return target;
};

/**
 *  Gets the values of the source object as an `Array`.
 *  @name DocmaWeb.Utils._values
 *  @function
 *  @private
 *
 *  @param {Object} source - Source object.
 *
 *  @returns {Array} -
 */
Utils._values = function (source) {
    if (Array.isArray(source)) return source;
    var prop,
        values = [];
    for (prop in source) {
        if (source.hasOwnProperty(prop)) {
            values.push(source[prop]);
        }
    }
    return values;
};

/**
 *  Wraps the whole string within `&lt;code&gt;` tags.
 *  @name DocmaWeb.Utils._wrapCode
 *  @function
 *  @private
 *
 *  @param {String} code - Code to be processed.
 *  @param {Boolean} [escape=true] - Whether to escape open/close tags. i.e.
 *  `&lt;` and `&gt;`.
 *  @param {Boolean} [pre=false] - Whether to also wrap the code with
 *         `&lt;pre&gt;` tags.
 *
 *  @returns {String} -
 */
Utils._wrapCode = function (code, escape, pre) {
    if (typeof code !== 'string') return '';
    if (escape === undefined || escape === true) {
        code = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    code = '<code>' + code + '</code>';
    return pre ? '<pre>' + code + '</pre>' : code;
};

/**
 *  Tokenizes the given string into blocks.
 *  Each block is either a multiline code block (e.g. ```code```) or
 *  regular string block.
 *  @name DocmaWeb.Utils._tokenize
 *  @function
 *  @private
 *
 *  @param {String} string - String to be tokenized.
 *  @param {Function} [callback=identity] - Function to be executed
 *         on each block. Two arguments are passed; `block`, `isCode`.
 *  @returns {Array}
 *           Array of tokenized blocks.
 */
Utils._tokenize = function (string, callback) {
    if (typeof callback !== 'function') callback = identity;
    var mark = '```';
    if (string.indexOf(mark) < 0) return [callback(string, false)];
    var i,
        len = mark.length,
        token = '',
        mem = '',
        blocks = [],
        entered = false;
    for (i = 0; i < string.length; i++) {
        token += string[i];
        mem += string[i];
        if (token.length > len) token = token.slice(-len);
        if (token === mark) {
            entered = !entered;
            if (entered) {
                blocks.push(callback(mem.slice(0, -len), false));
                mem = token;
            } else {
                blocks.push(callback(mem, true));
                mem = '';
            }
        }
    }
    return blocks;
};

/**
 *  Ensures left and/or right slashes for the given string.
 *  @name DocmaWeb.Utils._ensureSlash
 *  @function
 *  @private
 *
 *  @param {Boolean} left - Whether to ensure left slash.
 *  @param {String} str - String to be checked and modified.
 *  @param {Boolean} right - Whether to ensure right slash.
 *
 *  @returns {String} -
 */
Utils._ensureSlash = function (left, str, right) {
    if (!str) return left || right ? '/' : '';
    if (left && str.slice(0, 1) !== '/') str = '/' + str;
    if (right && str.slice(-1) !== '/') str += '/';
    return str;
};

function serializer(replacer) {
    var stack = [];
    var keys = [];

    return function (key, value) {
        // browsers will not print more than 20K
        if (stack.length > 2000) return '[Too Big Object]';

        if (stack.length > 0) {
            var thisPos = stack.indexOf(this);
            if (~thisPos) {
                stack.splice(thisPos + 1);
                keys.splice(thisPos, Infinity, key);
            } else {
                stack.push(this);
                keys.push(key);
            }
            if (stack.indexOf(value) >= 0) {
                // value = cycleReplacer.call(this, key, value);
                value = (stack[0] === value)
                    ? '[Circular ~]'
                    : '[Circular ~.' + keys.slice(0, stack.indexOf(value)).join('.') + ']';
            }
        } else {
            stack.push(value);
        }

        return !replacer ? value : replacer.call(this, key, value);
    };
}

Utils._safeStringify = function (obj, replacer, spaces) {
    try {
        return JSON.stringify(obj, serializer(replacer), spaces);
    } catch (e) {
        return String(obj);
    }
};

/**
 *  Joins the given strings as a path.
 *  @name DocmaWeb.Utils._joinPath
 *  @function
 *  @private
 *
 *  @param {Array} args - Parts of a path to be joined.
 *  @param {Object} options - Join options.
 *      @param {Boolean} [options.left] - Set to `true` to
 *      ensure the path has a `/` in front of it. `false`
 *      will ensure it has not. Omit to leave it as is.
 *      @param {Boolean} [options.right] - Set to `true` to
 *      ensure the path has a `/` at the end of it. `false`
 *      will ensure it has not. Omit to leave it as is.
 *
 *  @returns {String} -
 */
// Utils._joinPath = function (args, options) {  // NOT USED BUT KEEP THIS
//     options = options || {};
//     var proto = (/^[a-z]*:\/\//i).test(args[0]) ? args.shift() : '';
//     var p = args.join('/').replace(/\/+/g, '/');

//     var left = p[0] === '/';
//     var right = p.slice(-1) === '/';

//     if (proto || options.left === false) {
//         p = p.slice(1);
//     } else if (options.left === true) {
//         if (!left) p = '/' + p;
//     }

//     if (options.right === true) {
//         if (!right) p += '/';
//     } else if (options.right === false) {
//         if (right) p = p.slice(0, -1);
//     }

//     return proto + p;
// };

// ----------------------
// DOM Utils
// ----------------------

// e.g. #Docma%7EBuildConfiguration will not work if "%7E" is not decoded to "~".
function decodeHash(hash) {
    // return hash.replace(/%7E/gi, '~').replace(/^#/, '');
    return decodeURIComponent(hash).replace(/^#/, '');
}

/**
 *  DOM utilities.
 *  @name DocmaWeb.Utils.DOM
 *  @namespace
 *  @type {Object}
 */
Utils.DOM = {};

// this is an attribute name used to mark style tags found within the body,
// that are moved to the head of the document.
var ATTR_BODY_STYLE = 'data-body-style';

/**
 *  Gets the offset coordinates of the given element, relative to document
 *  body.
 *  @name DocmaWeb.Utils.DOM.getOffset
 *  @function
 *  @static
 *
 *  @param {HTMLElement} e - Target element.
 *  @returns {Object|null} -
 */
Utils.DOM.getOffset = function (e) {
    var elem = typeof e === 'object' ? e : document.getElementById(e);
    if (!elem) return;
    var rect = elem.getBoundingClientRect();
    // Make sure element is not hidden (display: none) or disconnected
    if (rect.width || rect.height || elem.getClientRects().length) {
        var docElem = document.documentElement;
        return {
            top: rect.top + window.pageYOffset - docElem.clientTop,
            left: rect.left + window.pageXOffset - docElem.clientLeft
        };
    }
};

/**
 *  Scrolls the document to the given hash target.
 *  @name DocmaWeb.Utils.DOM.scrollTo
 *  @function
 *  @static
 *
 *  @param {String} [hash] - Bookmark target. If omitted, document is
 *  scrolled to the top.
 */
Utils.DOM.scrollTo = function (hash) {
    // Some browsers place the overflow at the <html> level, unless else is
    // specified. Therefore, we use the documentElement property for these
    // browsers
    var body = document.documentElement // Chrome, Firefox, IE/Edge, Opera
        || document.body; // safari
    hash = decodeHash(hash || window.location.hash || '');
    if (!hash) {
        body.scrollTop = 0;
        return;
    }
    var elem = document.getElementById(hash);
    if (!elem) return;
    var offset = Utils.DOM.getOffset(elem);
    if (offset) body.scrollTop = offset.top;
};

/**
 *  Creates and appends a child DOM element to the target, from the given
 *  element definition.
 *  @private
 *  @name DocmaWeb.Utils.DOM._createChild
 *  @function
 *  @static
 *
 *  @param {HTMLElement} target
 *         Target container element.
 *  @param {String} [type="div"]
 *         Type of the element to be appended.
 *  @param {Object} [attrs]
 *         Element attributes.
 *
 *  @returns {HTMLElement} - Appended element.
 */
Utils.DOM._createChild = function (target, type, attrs) {
    attrs = attrs || {};
    var el = document.createElement(type || 'div');
    Object.keys(attrs).forEach(function (key) {
        el[key] = attrs[key]; // e.g. id, innerHTML, etc...
    });
    target.appendChild(el);
    return el;
};

/**
 *  Removes the style tags that are previously marked to indicate that they
 *  were moved from the body to head.
 *  @private
 *  @name DocmaWeb.Utils.DOM._removePrevBodyStyles
 *  @function
 *  @static
 */
Utils.DOM._removePrevBodyStyles = function () {
    var head = document.getElementsByTagName('head')[0];
    var prevBodyStyles = head.querySelectorAll('[' + ATTR_BODY_STYLE + ']');
    while (prevBodyStyles.length > 0) {
        prevBodyStyles[0].parentNode.removeChild(prevBodyStyles[0]);
    }
};

/**
 *  Moves style tags found within the body and appends them to the head of
 *  the document.
 *  @private
 *  @name DocmaWeb.Utils.DOM._moveBodyStylesToHead
 *  @function
 *  @static
 */
Utils.DOM._moveBodyStylesToHead = function () {
    var head = document.getElementsByTagName('head')[0];
    var stylesInBody = document.body.getElementsByTagName('style');
    var i, styleElem;
    for (i = 0; i < stylesInBody.length; i++) {
        styleElem = stylesInBody[i];
        styleElem.parentNode.removeChild(styleElem);
        styleElem.setAttribute(ATTR_BODY_STYLE, '');
        head.appendChild(styleElem);
    }
};

// ----------------------
// LINKS for JS & WEB-API BUILT-IN Objects/Types
// ----------------------

// Data below is around 5KB.

var _builtinURLs = {
    globals: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/',
    statements: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/',
    operators: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/',
    functions: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/',
    web: 'https://developer.mozilla.org/en-US/docs/Web/API/'
};
var _builtins = {
    globals: [
        'Infinity',
        'NaN',
        'undefined',
        'null',
        'Object',
        'Function',
        'function',
        'Boolean',
        'boolean',
        'Symbol',
        'Error',
        'EvalError',
        'InternalError',
        'RangeError',
        'ReferenceError',
        'SyntaxError',
        'TypeError',
        'URIError',
        'Number',
        'number',
        'Math',
        'Date',
        'String',
        'string',
        'RegExp',
        'Array',
        'Int8Array',
        'Uint8Array',
        'Uint8ClampedArray',
        'Int16Array',
        'Uint16Array',
        'Int32Array',
        'Uint32Array',
        'Float32Array',
        'Float64Array',
        'Map',
        'Set',
        'WeakMap',
        'WeakSet',
        'ArrayBuffer',
        'DataView',
        'JSON',
        'Promise',
        'Generator',
        'GeneratorFunction',
        'Reflect',
        'Proxy',
        'TypedArray',
        'Intl',
        'Intl.Collator',
        'Intl.DateTimeFormat',
        'Intl.NumberFormat',
        'WebAssembly',
        'WebAssembly.Module',
        'WebAssembly.Instance',
        'WebAssembly.Memory',
        'WebAssembly.Table',
        'WebAssembly.CompileError',
        'WebAssembly.LinkError',
        'WebAssembly.RuntimeError'
    ],
    statements: [
        'function',
        'function*',
        'async function',
        'class',
        'debugger'
    ],
    operators: [
        'void',
        'super',
        'this'
    ],
    functions: [
        'arguments'
    ],
    web: [
        'AbstractWorker',
        'AnalyserNode',
        'AudioBuffer',
        'AudioContext',
        'AudioListener',
        'AudioNode',
        'BaseAudioContext',
        'BeforeUnloadEvent',
        'Blob',
        'BlobEvent',
        'BufferSource',
        'ByteString',
        'CSSMediaRule',
        'CSSPageRule',
        'CSSPrimitiveValue',
        'CSSRule',
        'CSSRuleList',
        'CSSStyleDeclaration',
        'CSSStyleRule',
        'CSSStyleSheet',
        'CSSSupportsRule',
        'CSSValue',
        'CSSValueList',
        'CloseEvent',
        'CompositionEvent',
        'Console',
        'Coordinates',
        'Crypto',
        'CryptoKey',
        'CustomEvent',
        'DOMException',
        'DOMImplementation',
        'Document',
        'DocumentFragment',
        'DocumentType',
        'DoubleRange',
        'DragEvent',
        'Element',
        'ErrorEvent',
        'Event',
        'EventListener',
        'EventSource',
        'EventTarget',
        'File',
        'FileList',
        'FileReader',
        'FileReaderSync',
        'FormData',
        'Geolocation',
        'HTMLAnchorElement',
        'HTMLAreaElement',
        'HTMLAudioElement',
        'HTMLBRElement',
        'HTMLBaseElement',
        'HTMLBodyElement',
        'HTMLButtonElement',
        'HTMLCanvasElement',
        'HTMLCollection',
        'HTMLDListElement',
        'HTMLDataElement',
        'HTMLDataListElement',
        'HTMLDetailsElement',
        'HTMLDivElement',
        'HTMLDocument',
        'HTMLElement',
        'HTMLEmbedElement',
        'HTMLFieldSetElement',
        'HTMLFormControlsCollection',
        'HTMLFormElement',
        'HTMLHRElement',
        'HTMLHeadElement',
        'HTMLHeadingElement',
        'HTMLHtmlElement',
        'HTMLIFrameElement',
        'HTMLImageElement',
        'HTMLInputElement',
        'HTMLKeygenElement',
        'HTMLLIElement',
        'HTMLLabelElement',
        'HTMLLegendElement',
        'HTMLLinkElement',
        'HTMLMapElement',
        'HTMLMediaElement',
        'HTMLMetaElement',
        'HTMLMeterElement',
        'HTMLModElement',
        'HTMLOListElement',
        'HTMLObjectElement',
        'HTMLOptGroupElement',
        'HTMLOptionElement',
        'HTMLOptionsCollection',
        'HTMLOutputElement',
        'HTMLParagraphElement',
        'HTMLParamElement',
        'HTMLPreElement',
        'HTMLProgressElement',
        'HTMLQuoteElement',
        'HTMLScriptElement',
        'HTMLSelectElement',
        'HTMLSlotElement',
        'HTMLSourceElement',
        'HTMLSpanElement',
        'HTMLStyleElement',
        'HTMLTableCaptionElement',
        'HTMLTableCellElement',
        'HTMLTableColElement',
        'HTMLTableDataCellElement',
        'HTMLTableElement',
        'HTMLTableHeaderCellElement',
        'HTMLTableRowElement',
        'HTMLTableSectionElement',
        'HTMLTemplateElement',
        'HTMLTextAreaElement',
        'HTMLTimeElement',
        'HTMLTitleElement',
        'HTMLTrackElement',
        'HTMLUListElement',
        'HTMLUnknownElement',
        'HTMLVideoElement',
        'HashChangeEvent',
        'History',
        'ImageData',
        'InputEvent',
        'KeyboardEvent',
        'LinkStyle',
        'Location',
        'LongRange',
        'MediaDevices',
        'MediaDeviceInfo',
        'MediaError',
        'MediaRecorder',
        'MediaStream',
        'MessageChannel',
        'MessageEvent',
        'MessagePort',
        'MouseEvent',
        'MutationObserver',
        'MutationRecord',
        'NamedNodeMap',
        'Navigator',
        'NavigatorGeolocation',
        'Node',
        'NodeIterator',
        'NodeList',
        'NonDocumentTypeChildNode',
        'Notification',
        'PageTransitionEvent',
        'PointerEvent',
        'PopStateEvent',
        'Position',
        'PositionError',
        'PositionOptions',
        'ProgressEvent',
        'PromiseRejectionEvent',
        'RTCCertificate',
        'RTCConfiguration',
        'RTCDTMFSender',
        'RTCDTMFToneChangeEvent',
        'RTCDataChannel',
        'RTCPeerConnection',
        'RTCPeerConnection',
        'RTCRtpCodecParameters',
        'RTCRtpContributingSource',
        'RTCRtpReceiver',
        'RTCRtpSender',
        'RTCRtpSynchronizationSource',
        'RTCRtpTransceiver',
        'RTCRtpTransceiverDirection',
        'RTCRtpTransceiverInit',
        'RTCStatsReport',
        'RadioNodeList',
        'RandomSource',
        'Range',
        'RenderingContext',
        'SVGAnimateElement',
        'SVGAnimateMotionElement',
        'SVGAnimateTransformElement',
        'SVGAnimationElement',
        'SVGCircleElement',
        'SVGClipPathElement',
        'SVGCursorElement',
        'SVGElement',
        'SVGEllipseElement',
        'SVGEvent',
        'SVGFilterElement',
        'SVGGeometryElement',
        'SVGGradientElement',
        'SVGGraphicsElement',
        'SVGImageElement',
        'SVGLineElement',
        'SVGLinearGradientElement',
        'SVGMPathElement',
        'SVGMaskElement',
        'SVGMetadataElement',
        'SVGPathElement',
        'SVGPatternElement',
        'SVGPolygonElement',
        'SVGPolylineElement',
        'SVGRadialGradientElement',
        'SVGRect',
        'SVGRectElement',
        'SVGSVGElement',
        'SVGScriptElement',
        'SVGSetElement',
        'SVGStopElement',
        'SVGStyleElement',
        'SVGSwitchElement',
        'SVGSymbolElement',
        'SVGTSpanElement',
        'SVGTextContentElement',
        'SVGTextElement',
        'SVGTextPathElement',
        'SVGTextPositioningElement',
        'SVGTitleElement',
        'SVGTransform',
        'SVGTransformList',
        'SVGTransformable',
        'SVGUseElement',
        'SVGViewElement',
        'ShadowRoot',
        'SharedWorker',
        'Storage',
        'StorageEvent',
        'StyleSheet',
        'StyleSheetList',
        'Text',
        'TextMetrics',
        'TimeEvent',
        'TimeRanges',
        'Touch',
        'TouchEvent',
        'TouchList',
        'Transferable',
        'TreeWalker',
        'UIEvent',
        'URL',
        'WebGLActiveInfo',
        'WebGLBuffer',
        'WebGLContextEvent',
        'WebGLFramebuffer',
        'WebGLProgram',
        'WebGLRenderbuffer',
        'WebGLRenderingContext',
        'WebGLShader',
        'WebGLTexture',
        'WebGLUniformLocation',
        'WebGLVertexArrayObject',
        'WebSocket',
        'WheelEvent',
        'Window',
        'Worker',
        'WorkerGlobalScope',
        'WorkerLocation',
        'WorkerNavigator',
        'XMLHttpRequest',
        'XMLHttpRequestEventTarget',
        'XMLSerializer',
        'XPathExpression',
        'XPathResult',
        'XSLTProcessor'
    ]
};

/** @private */
var _cats = Object.keys(_builtins);

/**
 *  Gets an external link for documentation of the given type or object.
 *  @private
 *  @param {String} type -
 *  @returns {String} -
 */
Utils._getTypeExternalLink = function (type) {
    var i, cat;
    for (i = 0; i < _cats.length; i++) {
        cat = _cats[i];
        if (_builtins[cat].indexOf(type) >= 0) {
            return _builtinURLs[cat] + (type || '').replace(/^([^.]*\.)/, '');
            // e.g. remove "WebAssembly." from "WebAssembly.Instance" bec. MDN link is .../Instance
        }
    }
    return '';
};


/* global docma, Utils, dust, EventEmitter, XMLHttpRequest */
/* eslint no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

// --------------------------------
// CLASS: DocmaWeb
// https://github.com/onury/docma
// --------------------------------

/**
 *  Gets Docma version which the documentation is built with.
 *  @name DocmaWeb#version
 *  @type {String}
 */

/**
 *  Docma (web) core.
 *
 *  When you build the documentation with a template, `docma-web.js` will be
 *  generated (and linked in the main HTML); which is the core engine for the
 *  documentation web app. This will include everything the app needs such as
 *  the documentation data, compiled partials, dustjs engine, etc...
 *
 *  <blockquote>An instance of this object is globally accessible within the generated SPA
 *  as <code>docma</code>. Note that the size of the `docma-web.js` script depends primarily
 *  on the generated documentation data.</blockquote>
 *
 *  @class
 *  @name DocmaWeb
 *  @hideconstructor
 *  @emits DocmaWeb~event:ready
 *  @emits DocmaWeb~event:render
 *  @emits DocmaWeb~event:route
 *  @emits DocmaWeb~event:navigate
 */

function DocmaWeb(data) {
    this._ = data || {};

    // Flag for page load. Used for triggering the "ready" event only for page
    // load and not for route changes.
    this._.initialLoad = false;
    // app entrance optionally set @ build-time
    this._.appEntranceRI = null;

    this._.emitter = new EventEmitter();

    /**
     *  Provides configuration data of the generated SPA, which is originally set
     *  at build-time, by the user.
     *  See {@link api/#Docma~BuildConfiguration|build configuration} for more
     *  details on how these settings take affect.
     *  @name DocmaWeb#app
     *  @type {Object}
     *
     *  @property {String} title
     *            Document title for the main file of the generated app.
     *            (Value of the `&lt;title/>` tag.)
     *  @property {Array} meta
     *            Array of arbitrary objects set for main document meta (tags).
     *  @property {String} base
     *            Base path of the generated web app.
     *  @property {String} entrance
     *            Name of the initial content displayed, when the web app is first
     *            loaded.
     *  @property {String|Object} routing
     *            Routing settings for the generated SPA.
     *  @property {String} server
     *            Server/host type of the generated SPA.
     */
    Object.defineProperty(this, 'app', {
        configurable: false,
        get: function () {
            return this._.app || null;
        }
    });

    /**
     *	Hash-map of JSDoc documentation outputs.
        *	Each key is the name of an API (formed by grouped Javascript files).
        *	e.g. `docma.apis["some-api"]`
        *
        *  Unnamed documentation data (consisting of ungrouped Javascript files) can be
        *  accessed via `docma.apis._def_`.
        *
        *	Each value is an `Object` with the following signature:
        *	`{ documentation:Array, symbols:Array }`. `documentation` is the actual
        *	JSDoc data, and `symbols` is a flat array of symbol names.
        *
        *  <blockquote>See {@link api/#Docma~BuildConfiguration|build configuration} for more
        *  details on how Javascript files can be grouped (and named) to form separate
        *  API documentations and SPA routes.</blockquote>
        *
        *  @name DocmaWeb#apis
        *  @type {Object}
        *
        *  @example <caption>Programmatic access to documentation data</caption>
        *  // output ungrouped (unnamed) API documentation data
        *  console.log(docma.apis._def_.documentation);
        *  console.log(docma.apis._def_.symbols); // flat list of symbol names
        *  // output one of the grouped (named) API documentation data
        *  console.log(docma.apis['my-scondary-api'].documentation);
        *
        *  @example <caption>Usage in a Dust partial</caption>
        *  <!--
        *  	Each API data is passed to the partial, according to the route.
        *  	So you'll always use `documentation` within the partials.
        *  -->
        *  {#documentation}
        *      <h4>{longname}</h4>
        *      <p>{description}</p>
        *      <hr />
        *  {/documentation}
        */
    Object.defineProperty(this, 'apis', {
        configurable: false,
        get: function () {
            return this._.apis || {};
        }
    });

    /**
     *  Array of available SPA routes of the documentation.
     *  This is created at build-time and defined via the `src` param of the
     *  {@link api/#Docma~BuildConfiguration|build configuration}.
     *
     *  @name DocmaWeb#routes
     *  @type {Array}
     *
     *  @see {@link #DocmaWeb.Route|`DocmaWeb.Route`}
     */
    Object.defineProperty(this, 'routes', {
        configurable: false,
        get: function () {
            return this._.routes || {};
        }
    });

    /**
     *  Provides template specific configuration data.
     *  This is also useful within the Dust partials of the Docma template.
     *  @name DocmaWeb#template
     *  @type {Object}
     *
     *  @property {Object} options - Docma template options. Defined at build-time,
     *  by the user.
     *  @property {String} name
     *            Name of the Docma template.
     *  @property {String} version
     *            Version of the Docma template.
     *  @property {String} author
     *            Author information for the Docma template.
     *  @property {String} license
     *            License information for the Docma template.
     *  @property {String} mainHTML
     *            Name of the main file of the template. i.e. `index.html`
     *
     *  @example <caption>Usage in a Dust partial</caption>
     *  <div>
     *      {?template.options.someOption}
     *      <span>Displayed if someOption is true.</span>
     *      {/template.options.someOption}
     *  </div>
     *  <div class="footer">{template.name} by {template.author}</div>
     */
    Object.defineProperty(this, 'template', {
        configurable: false,
        get: function () {
            return this._.template || {};
        }
    });

    // --------------------------------
    // DOCMA-WEB STATE
    // --------------------------------

    /**
     *  Similar to `window.location` but with differences and additional
     *  information.
     *
     *  @name DocmaWeb#location
     *  @type {Object}
     *  @readonly
     *
     *  @property {String} origin
     *            Gets the protocol, hostname and port number of the current URL.
     *  @property {String} host
     *            Gets the hostname and port number of the current URL.
     *  @property {String} hostname
     *            Gets the domain name of the web host.
     *  @property {String} protocol
     *            Gets the web protocol used, without `:` suffix.
     *  @property {String} href
     *            Gets the href (URL) of the current location.
     *  @property {String} entrance
     *            Gets the application entrance route, which is set at Docma build-time.
     *  @property {String} base
     *            Gets the base path of the application URL, which is set at Docma build-time.
     *  @property {String} fullpath
     *            Gets the path and filename of the current URL.
     *  @property {String} pathname
     *            Gets the path and filename of the current URL, without the base.
     *  @property {String} path
     *            Gets the path, filename and query-string of the current URL, without the base.
     *  @property {String} hash
     *            Gets the anchor `#` of the current URL, without `#` prefix.
     *  @property {String} query
     *            Gets the querystring part of the current URL, without `?` prefix.
     *  @property {Function} getQuery()
     *            Gets the value of the given querystring parameter.
     */
    Object.defineProperty(this, 'location', {
        configurable: false,
        get: function () {
            var fullpath = Utils._ensureSlash(true, window.location.pathname, true),
                base = Utils._ensureSlash(true, docma.app.base, true),
                pathname = fullpath;
            if (fullpath.slice(0, base.length) === base) {
                pathname = fullpath.slice(base.length - 1, fullpath.length);
            }
            return {
                host: window.location.host,
                hostname: window.location.hostname,
                origin: window.location.origin,
                port: window.location.port,
                protocol: (window.location.protocol || '').replace(/:$/, ''),
                entrance: Utils._ensureSlash(true, docma.app.entrance, false),
                base: base,
                hash: (window.location.hash || '').replace(/^#/, ''),
                query: (window.location.search || '').replace(/^\?/, ''),
                href: window.location.href,
                fullpath: fullpath,
                pathname: pathname,
                path: pathname + (window.location.search || ''),
                getQuery: function (name, query) {
                    // Modified from http://stackoverflow.com/a/901144/112731
                    query = query === undefined ? (window.location.search || '') : query;
                    if (query.slice(0, 1) === '?') query = query.slice(1);
                    name = (name || '').replace(/[[\]]/g, '\\$&');
                    var regex = new RegExp('&?' + name + '(=([^&#]*)|&|#|$)'),
                        results = regex.exec(query);
                    if (!results || !results[2]) return '';
                    return decodeURIComponent(results[2].replace(/\+/g, ' '));
                }

            };
        }
    });

    /**
     *  Gets the route information for the current rendered content being
     *  displayed.
     *
     *  @name DocmaWeb#currentRoute
     *  @type {DocmaWeb.Route}
     *  @readonly
     *
     *  @property {String} type
     *            Type of the current route. If a generated JSDoc API
     *            documentation is being displayed, this is set to `"api"`.
     *            If any other HTML content (such as a converted markdown) is
     *            being displayed; this is set to `"content"`.
     *  @property {String} name
     *            Name of the current route. For `api` routes, this is the name
     *            of the grouped JS files parsed. If no name is given, this is
     *            set to `"_def_"` by default. For `content` routes, this is
     *            either the custom name given at build-time or, by default; the
     *            name of the generated HTML file; lower-cased, without the
     *            extension. e.g. `"README.md"` will have the route name
     *            `"readme"` after the build.
     *  @property {String} path
     *            Path of the current route.
     */
    Object.defineProperty(this, 'currentRoute', {
        configurable: false,
        get: function () {
            return this._.currentRoute || null;
        }
    });

    /**
     *	JSDoc documentation data for the current API route.
     *	If current route is not an API route, this will be `null`.
     *
     *  <blockquote>See {@link api/#Docma~BuildConfiguration|build configuration} for more
     *  details on how Javascript files can be grouped (and named) to form
     *  separate API documentations and SPA routes.</blockquote>
     *
     *  @name DocmaWeb#documentation
     *  @type {Array}
     *
     *  @example <caption>Output current API documentation data</caption>
     *  if (docma.currentRoute.type === 'api') {
     *  	console.log(docma.documentation);
     *  }
     *
     *  @example <caption>Usage in (Dust) partial</caption>
     *  {#documentation}
     *      <h4>{longname}</h4>
     *      <p>{description}</p>
     *      <hr />
     *  {/documentation}
     */
    Object.defineProperty(this, 'documentation', {
        configurable: false,
        get: function () {
            return this._.documentation || [];
        }
    });

    /**
     *	A flat array of JSDoc documentation symbol names. This is useful for
     *	building menus, etc... If current route is not an API route, this will
     *	be `null`.
     *
     *  <blockquote>See {@link api/docma#Docma~BuildConfiguration|build configuration} for more
     *  details on how Javascript files can be grouped (and named) to form
     *  separate API documentations and SPA routes.</blockquote>
     *
     *  @name DocmaWeb#symbols
     *  @type {Array}
     *
     *  @example <caption>Usage in (Dust) partial</caption>
     *  <ul class="menu">
     *      {#symbols}
     *          <li><a href="#{.}">{.}</a></li>
     *      {/symbols}
     *  </ul>
     */
    Object.defineProperty(this, 'symbols', {
        configurable: false,
        get: function () {
            return this._.symbols || [];
        }
    });
}

// --------------------------------
// EVENTS
// --------------------------------

/** @private */
DocmaWeb.prototype._trigger = function (eventName, args) {
    this.info('Event:', eventName, args ? args[0] : '');
    this._.emitter.trigger(eventName, args);
};

/**
 *  Fired when Docma is ready and the initial content is rendered.
 *  This is only fired once.
 *
 *  @event DocmaWeb~event:ready
 *
 *  @example
 *  docma.once('ready', function () {
 *      // do stuff...
 *  });
 */

/**
 *  Fired when page content (a Dust partial) is rendered. The emitted obeject is
 *  `currentRoute`. If the route does not exist (404), `currentRoute` will be
 *  `null`. This is fired after the `route` event.
 *
 *  @event DocmaWeb~event:render
 *  @type {DocmaWeb.Route}
 *
 *  @example
 *  docma.on('render', function (currentRoute) {
 *      if (currentRoute && currentRoute.type === docma.Route.Type.API) {
 *          // do stuff...
 *      }
 *  });
 */

/**
 *  Fired when SPA route is changed. The emitted obeject is `currentRoute`. If
 *  the route does not exist (404), `currentRoute` will be `null`. This is fired
 *  before the `render` event.
 *
 *  @event DocmaWeb~event:route
 *  @type {DocmaWeb.Route}
 *
 *  @example
 *  docma.on('route', function (currentRoute) {
 *      if (currentRoute && currentRoute.type === docma.Route.Type.API) {
 *          // do stuff...
 *      }
 *  });
 */

/**
 *  Fired either when the route is changed or navigated to a bookmark
 *  (i.e. on hash-change). If the route does not exist (404), `currentRoute`
 *  will be `null`.
 *
 *  @event DocmaWeb~event:navigate
 *  @type {DocmaWeb.Route}
 *
 *  @example
 *  docma.on('navigate', function (currentRoute) {
 *      if (currentRoute) {
 *          // do stuff...
 *      }
 *  });
 */

/**
 *  Docma SPA events enumeration.
 *  @enum {String}
 */
DocmaWeb.Event = {
    /**
     *  Emitted when Docma is ready and the initial content is rendered.
     *  @type {String}
     */
    Ready: 'ready',
    /**
     *  Emitted when page content (a Dust partial) is rendered.
     *  @type {String}
     */
    Render: 'render',
    /**
     *  Emitted when SPA route is changed.
     *  @type {String}
     */
    Route: 'route',
    /**
     *  Emitted either when the route is changed or navigated to a
     *  bookmark (i.e. hashchange).
     *  @type {String}
     */
    Navigate: 'navigate'
};

/**
 *  Adds a listener function to the specified event.
 *  Note that the listener will not be added if it is a duplicate.
 *  If the listener returns true then it will be removed after it is called.
 *  @name DocmaWeb#on
 *  @function
 *  @alias DocmaWeb#addListener
 *  @chainable
 *
 *  @param {String} eventName
 *         Name of the event to attach the listener to.
 *         See {@link #DocmaWeb.Event|`DocmaWeb.Event`} enumeration.
 *  @param {Function} listener
 *         Function to be called when the event is emitted. If the function
 *         returns true then it will be removed after calling.
 *
 *  @returns {DocmaWeb} - `DocmaWeb` instance for chaining.
 *
 *  @example
 *  docma.on('render', function (currentRoute) {
 *  	if (!currentRoute) {
 *  		console.log('Not found!');
 *  		return;
 *  	}
 *  	if (currentRoute.type === docma.Route.Type.API) {
 *  		console.log('This is an API route.')
 *  	}
 *  });
 */
DocmaWeb.prototype.on = function (eventName, listener) { // eslint-disable-line
    this._.emitter.on.apply(this._.emitter, arguments);
    return docma;
};

/**
 *  Adds a listener that will be automatically removed after its first
 *  execution.
 *  @name DocmaWeb#once
 *  @function
 *  @alias DocmaWeb#addOnceListener
 *  @chainable
 *
 *  @param {String} eventName
 *         Name of the event to attach the listener to.
 *         See {@link #DocmaWeb.Event|`DocmaWeb.Event`} enumeration.
 *  @param {Function} listener
 *         Function to be called when the event is emitted.
 *
 *  @returns {DocmaWeb} - `DocmaWeb` instance for chaining.
 *
 *  @example
 *  docma.once('ready', function () {
 *  	console.log('Docma is ready!');
 *  });
 */
DocmaWeb.prototype.once = function () {
    this._.emitter.once.apply(this._.emitter, arguments);
    return this;
};

/**
 *  Removes the given listener from the specified event.
 *  @name DocmaWeb#off
 *  @function
 *  @alias DocmaWeb#removeListener
 *  @chainable
 *
 *  @param {String} eventName
 *         Name of the event to remove the listener from.
 *         See {@link #DocmaWeb.Event|`DocmaWeb.Event`} enumeration.
 *  @param {Function} listener
 *         Function to be removed from the event.
 *
 *  @returns {DocmaWeb} - `DocmaWeb` instance for chaining.
 */
DocmaWeb.prototype.off = function () {
    this._.emitter.off.apply(this._.emitter, arguments);
    return this;
};

/**
 *  Alias for `DocmaWeb#on`
 *  @private
 */
DocmaWeb.prototype.addListener = DocmaWeb.prototype.on;
/**
 *  Alias for `DocmaWeb#once`
 *  @private
 */
DocmaWeb.prototype.addListenerOnce = DocmaWeb.prototype.once;
/**
 *  Alias for `DocmaWeb#off`
 *  @private
 */
DocmaWeb.prototype.removeListener = DocmaWeb.prototype.off;

// --------------------------------
// DEBUG / LOGS
// --------------------------------

/**
 *  Outputs a general log to the browser console. (Unlike `console.log()`) this
 *  method respects `debug` option of Docma build configuration.
 *  @param {...*} [args=""] - Arguments to be logged.
 */
DocmaWeb.prototype.log = function () {
    if (!docma._.logsEnabled) return;
    console.log.apply(console, arguments);
};

/**
 *  Outputs an informational log to the browser console. (Unlike
 *  `console.info()`) this method respects `debug` option of Docma build
 *  configuration.
 *  @param {...*} [args=""] - Arguments to be logged.
 */
DocmaWeb.prototype.info = function () {
    if (!docma._.logsEnabled) return;
    console.info.apply(console, arguments);
};

/**
 *  Outputs a warning log to the browser console. (Unlike `console.warn()`) this
 *  method respects `debug` option of Docma build configuration.
 *  @param {...*} [args=""] - Arguments to be logged.
 */
DocmaWeb.prototype.warn = function () {
    if (!docma._.logsEnabled) return;
    console.warn.apply(console, arguments);
};

/**
 *  Outputs an error log to the browser console. (Unlike `console.error()`) this
 *  method respects `debug` option of Docma build configuration.
 *  @param {...*} [args=""] - Arguments to be logged.
 */
DocmaWeb.prototype.error = function () {
    if (!docma._.logsEnabled) return;
    console.error.apply(console, arguments);
};

// --------------------------------
// DOM
// --------------------------------

/**
 *  Gets Docma main DOM element which the Dust templates will be rendered
 *  into.
 *
 *  @returns {HTMLElement} - Docma main DOM element.
 */
DocmaWeb.prototype.getDocmaElem = function () {
    var docmaElem = document.getElementById(this._.elementID);
    if (!docmaElem) {
        docmaElem = Utils.DOM.createChild(document.body, 'div', {
            id: this._.elementID
        });
    }
    return docmaElem;
};

/**
 *  Gets Docma content DOM element that the HTML content will be loaded
 *  into. This should be called for `docma-content` partial.
 *
 *  @returns {HTMLElement} - Docma content DOM element.
 */
DocmaWeb.prototype.getContentElem = function () {
    // docma-content template (should) have a
    // <div id="docma-content"></div> element whithin.
    var dContent = document.getElementById(this._.contentElementID);
    if (!dContent) {
        // this is fatal, so we always throw if invalid content partial
        // TODO: this should be checked during build process
        throw new Error('Partial ' + this._.partials.content + ' should have an element with id="' + this._.contentElementID + '".');
    }
    return dContent;
};

/**
 *  Loads the given HTML content into `docma-content` element. This is a
 *  low-level method. Typically you would not need to use this.
 *
 *  @param {String} html - Content to be loaded.
 */
DocmaWeb.prototype.loadContent = function (html) {
    var dContent = this.getContentElem();
    dContent.innerHTML = html;

    // If this is a parsed HTML file that is loaded as content; it might
    // include some styles within the body. We'll move them to head. But
    // first, remove if there are any previously moved styles in the head.
    Utils.DOM._removePrevBodyStyles();
    // now move the styles within the current rendered body.
    Utils.DOM._moveBodyStylesToHead();

    // this._fixAnchors();
    Utils.DOM.scrollTo(); // top
};

/**
 *  Loads dust-compiled HTML content into `docma-main` element.
 *  @private
 *
 *  @param {String} compiledHTML - Dust-compiled HTML content.
 */
DocmaWeb.prototype._loadCompiledContent = function (compiledHTML) {
    // load compiled content into <div id="docma-main"></div>
    var docmaElem = this.getDocmaElem();
    docmaElem.innerHTML = compiledHTML;
    // this._fixAnchors();
};

/**
 *  Fixes the base+hash issue. When base tag is set in the head of an HTML,
 *  bookmark anchors will navigate to the base URL with a hash; even with
 *  sub paths. This will fix that behaviour.
 *  @private
 *
 *  @param {Function} cb - Callback.
 *
 *  @returns {void}
 */
DocmaWeb.prototype._fixAnchors = function (cb) {
    if (this.app.base) {
        setTimeout(function () {
            var i, el,
                nodes = document.querySelectorAll('a[href^="#"]');
            for (i = 0; i < nodes.length; i++) {
                el = nodes[i];
                var href = el.getAttribute('href');
                if (href.slice(0, 1) === '#' && href.length > 1) {
                    href = window.location.pathname + (window.location.search || '') + href;
                    el.setAttribute('href', href);
                }
            }
            if (typeof cb === 'function') cb();
        }, 50);
    }
};

// --------------------------------
// DUST FILTERS
// --------------------------------

/**
 *  Adds a new Dust filter.
 *  @chainable
 *  @see {@link templates/filters/|Existing Docma (Dust) filters}
 *  @see {@link http://www.dustjs.com/docs/filter-api|Dust Filter API}
 *
 *  @param {String} name - Name of the filter to be added.
 *  @param {Function} fn - Filter function.
 *
 *  @returns {DocmaWeb} - `DocmaWeb` instance for chaining.
 *  @throws {Error} - If a filter with the given name already exists.
 */
DocmaWeb.prototype.addFilter = function (name, fn) {
    if (this.filterExists(name)) {
        throw new Error('Filter "' + name + '" already exists.');
    }
    dust.filters[name] = fn;
    return this;
};

/**
 *  Removes an existing Dust filter.
 *  @chainable
 *  @param {String} name - Name of the filter to be removed.
 *  @returns {DocmaWeb} - `DocmaWeb` instance for chaining.
 */
DocmaWeb.prototype.removeFilter = function (name) {
    delete dust.filters[name];
    return this;
};

/**
 *  Checks whether a Dust filter with the given name already exists.
 *  @param {String} name - Name of the filter to be checked.
 *  @returns {Boolean} -
 */
DocmaWeb.prototype.filterExists = function (name) {
    return typeof dust.filters[name] === 'function';
};

// --------------------------------
// ROUTES
// --------------------------------

/**
 *  Creates a SPA route information object for the given route name and type.
 *
 *  @param {String} name
 *         Name of the route.
 *  @param {String} type
 *         Type of the SPA route. See {@link #DocmaWeb.Route.Type|`DocmaWeb.Route.Type`}
 *         enumeration for possible values.
 *
 *  @returns {DocmaWeb.Route} - Route instance.
 */
DocmaWeb.prototype.createRoute = function (name, type) {
    return new DocmaWeb.Route(this, name, type);
};

/**
 *  Get route information object from the given route ID.
 *  @private
 *
 *  @param {String} id - ID of the route (in `type:name` format).
 *
 *  @returns {DocmaWeb.Route} - Route instance.
 */
DocmaWeb.prototype.createRouteFromID = function (id) {
    if (typeof id !== 'string') {
        this.warn('Route ID is not a string: ' + id);
        return new DocmaWeb.Route(this, null);
    }
    var s = id.split(':');
    return new DocmaWeb.Route(this, s[1], s[0]); // name, type
};

/**
 *  Get route information object from the given query-string.
 *  @private
 *
 *  @param {String} querystring - Query-string.
 *
 *  @returns {DocmaWeb.Route} - Route instance.
 */
DocmaWeb.prototype.createRouteFromQuery = function (querystring) {
    if (!querystring) return new DocmaWeb.Route(null);
    // get the first key=value pair
    var query = querystring.split('&')[0].split('='),
        routeType = query[0].toLowerCase(), // "api" or "content"
        routeName = query[1];

    return new DocmaWeb.Route(this, routeName, routeType);
};

// --------------------------------
// DUST / RENDER
// --------------------------------

/**
 *  Renders the given Dust template into the docma main element.
 *  @private
 *
 *  @param {String} dustTemplateName
 *         Name of the Dust template.
 *  @param {Function} [callback]
 *         Function to be executed when the rendering is complete.
 */
DocmaWeb.prototype._render = function (dustTemplateName, callback) {
    var self = this;
    // render docma main template
    dust.render(dustTemplateName, this, function (err, compiledHTML) {
        if (err) {
            self.warn('Could not load Docma partial:', dustTemplateName);
            self.log('Compiled HTML: ', compiledHTML);
            throw err;
        }
        self._loadCompiledContent(compiledHTML);
        if (typeof callback === 'function') callback();
    });
};

/**
 *  Triggers "render" event and checks if now is the time to also trigger
 *  "ready" event.
 *  @private
 */
DocmaWeb.prototype._triggerAfterRender = function () {
    this._trigger(DocmaWeb.Event.Render, [docma.currentRoute]);
    if (this._.initialLoad) {
        this._trigger(DocmaWeb.Event.Ready);
        this._.initialLoad = false;
    }
};

/**
 *  Renders docma-404 partial. Used for not-found routes.
 *  @private
 *  @param {Object} routeInfo -
 *  @param {Function} statusCallback -
 */
DocmaWeb.prototype._render404 = function (routeInfo, statusCallback) {
    this._.currentRoute = this.createRoute(null);
    var self = this;
    this._render(this._.partials.notFound, function () {
        self._trigger(DocmaWeb.Event.Render, [null]);
        Utils.DOM.scrollTo();
        if (typeof statusCallback === 'function') return statusCallback(404);
        // no callback, throw...
        throw new Error('Page or content not found for route: ' + Utils._safeStringify(routeInfo));
    });
};

/**
 *  Asynchronously fetches (text) content from the given URL via an
 *  `XmlHttpRequest`. Note that the URL has to be in the same-origin, for
 *  this to work.
 *
 *  @param {String} url
 *         URL to be fetched.
 *  @param {Function} callback
 *         Function to be executed when the content is fetched; with the
 *         following signature: `function (status, responseText) { .. }`
 */
DocmaWeb.prototype.fetch = function (url, callback) {
    var xhr = new XMLHttpRequest();
    var self = this;
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            var text = xhr.status === 200 ? xhr.responseText : '';
            self.log('XHR GET:', xhr.status, url);
            return callback(xhr.status, text);
        }
    };
    xhr.open('GET', url, true); // async
    xhr.send();
};

/**
 *  Renders content into docma-main element, by the given route information.
 *
 *  If the content is empty or `"api"`, we'll render the `docma-api` Dust
 *  template. Otherwise, (e.g. `"readme"`) we'll render `docma-content` Dust
 *  template, then  fetch `content/readme.html` and load it in the `docma-main`
 *  element.
 *
 *  <blockquote>Note that rendering and the callback will be cancelled if the given
 *  content is the latest content rendered.</blockquote>
 *
 *  @param {DocmaWeb.Route} routeInfo - Route information of the page to be
 *  rendered.
 *  @param {Function} [callback] - Function to be executed when the rendering is
 *  complete. `function (httpStatus:Number) { .. }`
 *  @returns {void}
 *  @emits DocmaWeb~event:render
 */
DocmaWeb.prototype.render = function (routeInfo, callback) {
    // if no route info, render not-found partial (docma-404)
    if (!routeInfo || !routeInfo.exists()) return this._render404(routeInfo, callback);
    // return if same route
    if (routeInfo.isEqualTo(this.currentRoute)) return;
    // set current route
    this._.currentRoute = routeInfo;

    var isCbFn = typeof callback === 'function';
    var self = this;

    if (routeInfo.type === DocmaWeb.Route.Type.API) {
        this._render(this._.partials.api, function () {
            self._triggerAfterRender();
            if (isCbFn) callback(200);
            self._fixAnchors(function () {
                Utils.DOM.scrollTo();
            });
        });
    } else { // if (routeInfo.type === Route.Type.CONTENT) {
        docma.fetch(routeInfo.contentPath, function (status, html) {
            if (status === 404) return self._render404(routeInfo, callback);
            // rendering docma-content Dust template
            self._render(self._.partials.content, function () {
                self.loadContent(html);
                self._triggerAfterRender();
                if (isCbFn) callback(status);
                self._fixAnchors(function () {
                    Utils.DOM.scrollTo();
                });
            });
        });
    }
};

// --------------------------------
// UTILS
// --------------------------------

/**
 *  Utilities for inspecting JSDoc documentation and symbols; and parsing
 *  documentation data into proper HTML.
 *  See {@link api/web/utils|`DocmaWeb.Utils` documentation}.
 *  @type {Object}
 *  @namespace
 */
DocmaWeb.Utils = Utils;


/* global DocmaWeb, Utils */
/* eslint no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

// --------------------------------
// CLASS: DocmaWeb.Route
// https://github.com/onury/docma
// --------------------------------

/** @private */
var _arrRouteTypes;

/**
 *  @classdesc Creates SPA route information object for the given route name
 *  and type. You cannot directly construct an instance of this class via
 *  `new` operator. Use {@link #DocmaWeb#createRoute|`DocmaWeb#createRoute`}
 *  method instead.
 *  @class
 *  @hideconstructor
 *
 *  @param {DocmaWeb} docma `DocmaWeb` instance.
 *  @param {String} name Name of the route.
 *  @param {String} type Type of the SPA route. See
 *         {@link #DocmaWeb.Route.Type|`DocmaWeb.Route.Type`} enumeration
 *         for possible values.
 */
DocmaWeb.Route = function (docma, name, type) {
    this._docma = docma;
    if (!type || _arrRouteTypes.indexOf(type) < 0) return; // 404

    if (!name) {
        if (type !== DocmaWeb.Route.Type.API) return; // 404
        name = docma._.defaultApiName;
    } else {
        if (!docma.app.routing.caseSensitive) name = name.toLowerCase();
    }

    // `docma.routes` array is created @ build-time. If no route is found;
    // this will create a `Route` instance but it will be equivalent to 404
    // route. No properties such as `id`, `name`, `type` and `path`.

    // search in existing routes.
    var info = Utils._find(docma.routes, {
        type: type,
        name: name
    });
    // if found, assign properties `id`, `name`, `type` and `path`.
    if (info) Utils._assign(this, info);
};

/**
 *  Enumerates the Docma SPA route types.
 *  @name DocmaWeb.Route.Type
 *  @enum {String}
 *  @static
 *  @readonly
 *
 *  @example <caption>When `docma.app.routing.method` is `"query"`</caption>
 *  type     name              path
 *  -------  ----------------  --------------------------
 *  api      _def_             ?api
 *  api      web               ?api=web
 *  content  templates         ?content=templates
 *  content  guide             ?content=guide
 *
 *  @example <caption>When `docma.app.routing.method` is `"path"`</caption>
 *  type     name              path
 *  -------  ----------------  --------------------------
 *  api      _def_             api/
 *  api      web               api/web/
 *  content  templates         templates/
 *  content  guide             guide/
 *
 */
DocmaWeb.Route.Type = {
    /**
     *  Indicates that the route is for API documentation content, generated
     *  from one or more Javascript files.
     *  @type {String}
     */
    API: 'api',
    /**
     *  Indicates that the route is for other content, such as parsed HTML
     *  files or HTML files generated from markdown.
     *  @type {String}
     */
    CONTENT: 'content'
};
_arrRouteTypes = Utils._values(DocmaWeb.Route.Type);

/**
 *  Enumerates the source types that a SPA route is generated from.
 *  @name DocmaWeb.Route.SourceType
 *  @enum {String}
 *  @static
 *  @readonly
 */
DocmaWeb.Route.SourceType = {
    /**
     *  Indicates that the documentation route is generated from Javascript
     *  source.
     *  @type {String}
     */
    JS: 'js',
    /**
     *  Indicates that the documentation route is generated from markdown
     *  source.
     *  @type {String}
     */
    MD: 'md',
    /**
     *  Indicates that the documentation route is generated from HTML
     *  source.
     *  @type {String}
     */
    HTML: 'html'
};

/**
 *  Gets the ID of the route. A route ID consists of the route type and the
 *  name; delimited via a colon. e.g. `api:web`.
 *  @name DocmaWeb.Route#id
 *  @type {String}
 *  @instance
 */

/**
 *  Gets the path of the generated content (HTML) file.
 *  If this is an API route, `contentPath` is `null`.
 *  @name DocmaWeb.Route#contentPath
 *  @type {String}
 *  @instance
 */

/**
 *  Gets the URL path of the SPA route. For example, if SPA route method is
 *  `query`, the URL path for a route named `guide` will be `?content=guide`.
 *  If routing method is `path` it will be `guide/`.
 *  @name DocmaWeb.Route#path
 *  @type {String}
 *  @instance
 */

/**
 *  Gets the type of the generated SPA route. See
 *  {@link #DocmaWeb.Route.Type|`DocmaWeb.Route.Type`} enumeration
 *  for possible values.
 *  @name DocmaWeb.Route#type
 *  @type {String}
 *  @instance
 */

/**
 *  Gets the type of the source which this route is generated from. See
 *  {@link #DocmaWeb.Route.SourceType|`DocmaWeb.Route.SourceType`} enumeration
 *  for possible values.
 *  @name DocmaWeb.Route#sourceType
 *  @type {String}
 *  @instance
 */

/**
 *  Gets the name of the SPA route, which is either set by the user when
 *  building the documentation; or auto-generated from the source file name.
 *  @name DocmaWeb.Route#name
 *  @type {String}
 *  @instance
 */

/**
 *  Checks whether the route actually exists.
 *  @returns {Boolean} -
 */
DocmaWeb.Route.prototype.exists = function () {
    return Boolean(this.id);
};

/**
 *  Checks whether the route is equal to the given route.
 *  @param {DocmaWeb.Route} routeInfo - Route to be checked against.
 *  @returns {Boolean} -
 */
DocmaWeb.Route.prototype.isEqualTo = function (routeInfo) {
    if (!routeInfo || !routeInfo.exists() || !this.exists()) return false;
    return routeInfo.path === this.path;
};

/**
 *  Checks whether the route is currently being viewed.
 *  @param {DocmaWeb.Route} routeInfo - Object to be checked.
 *  @returns {Boolean} -
 */
DocmaWeb.Route.prototype.isCurrent = function () {
    return this.isEqualTo(this._docma.currentRoute);
};

/**
 *  Applies the route to the application.
 *  @emits DocmaWeb~event:route
 *  @param {Function} [cb] - Callback function to be executed after route is
 *  rendered.
 *  @returns {DocmaWeb.Route} - The route instance for chaining.
 */
DocmaWeb.Route.prototype.apply = function (cb) {
    if (this.type === DocmaWeb.Route.Type.API) {
        this._docma._.documentation = this._docma.apis[this.name].documentation;
        this._docma._.symbols = this._docma.apis[this.name].symbols;
    } else {
        // reset documentation & symbols since this is not an API route
        this._docma._.documentation = null;
        this._docma._.symbols = null;
    }
    // this._docma.log('Route Info:', this.toString());
    this._docma._trigger(DocmaWeb.Event.Route, [this.exists() ? this : null]);
    this._docma.render(this, cb);
    return this;
};

/**
 *  Gets the string representation of the route.
 *  @returns {String} -
 */
DocmaWeb.Route.prototype.toString = function () {
    var o = this.toJSON();
    return Object.keys(o).map(function (key) {
        return key + ': ' + o[key];
    }).join(', ');
};

/**
 *  @private
 *  @returns {Object} - Always return an object for toJSON() method.
 */
DocmaWeb.Route.prototype.toJSON = function () {
    return {
        id: this.id,
        contentPath: this.contentPath,
        path: this.path,
        type: this.type,
        sourceType: this.sourceType,
        name: this.name
    };
};


/* global DocmaWeb, dust */
/* eslint max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

// --------------------------------
// DocmaWeb (Dust) filters
// https://github.com/onury/docma
// --------------------------------

dust.filters = dust.filters || {};

dust.filters.$pt = function (str) {
    return DocmaWeb.Utils.parseTicks(str);
};

dust.filters.$pnl = function (str) {
    return DocmaWeb.Utils.parseNewLines(str, { keepIfSingle: true });
};

dust.filters.$pl = function (str) {
    return DocmaWeb.Utils.parseLinks(str);
};

dust.filters.$tl = function (str) {
    return DocmaWeb.Utils.trimLeft(str);
};

dust.filters.$tnl = function (str) {
    return DocmaWeb.Utils.trimNewLines(str);
};

dust.filters.$p = function (str) {
    return DocmaWeb.Utils.parse(str, { keepIfSingle: true });
};

dust.filters.$nt = function (str) {
    return DocmaWeb.Utils.normalizeTabs(str);
};

dust.filters.$desc = function (symbol) {
    return DocmaWeb.Utils.parse(symbol.classdesc || symbol.description || '');
};

var reJSValues = (/true|false|null|undefined|Infinity|NaN|\d+|Number\.\w+|Math\.(PI|E|LN(2|10)|LOG(2|10)E|SQRT(1_)?2)|\[.*?]|\{.*?}|new [a-zA-Z]+.*|\/.+\/[gmiu]*|Date\.(now\(\)|UTC\(.*)|window|document/);

function getFormatValue(symbol, val) {
    if (arguments.length < 2) {
        val = DocmaWeb.Utils.notate(symbol, 'meta.code.value') || symbol.defaultvalue;
    }
    // if (val === undefined) return 'undefined';
    if (typeof val !== 'string') return String(val);
    var types = DocmaWeb.Utils.notate(symbol, 'type.names') || [];
    // first char is NOT a single or double quote or tick
    if (!(/['"`]/).test(val.slice(0, 1))
        // types include "String"
        && types.indexOf('String') >= 0
        // only "String" type or value is NOT a JS non-string value/keyword
        && (types.length === 1 || reJSValues.indexOf(val) === -1)) {
        return '"' + val + '"';
    }
    return String(val);
}

dust.filters.$def = function (symbolOrParam) {
    if (!symbolOrParam.hasOwnProperty('defaultvalue')) return 'undefined';
    return getFormatValue(symbolOrParam, symbolOrParam.defaultvalue);
};

dust.filters.$val = function (symbol) {
    return getFormatValue(symbol);
};

dust.filters.$id = function (symbol) {
    var id;
    if (typeof symbol === 'string') {
        id = symbol;
    } else {
        var nw = DocmaWeb.Utils.isConstructor(symbol) ? 'new-' : '';
        id = nw + symbol.$longname; // DocmaWeb.Utils.getFullName(symbol);
    }
    return id.replace(/ /g, '-');
};


DocmaWeb.version = "3.2.2";
return DocmaWeb;
})();
var docma = Object.freeze(new DocmaWeb({"version":"3.2.2","routes":[{"id":"api:","type":"api","name":"_def_","path":"?api","contentPath":null,"sourceType":"js"},{"id":"content:readme","type":"content","name":"readme","path":"?content=readme","contentPath":"content/readme.html","sourceType":"md"}],"apis":{"_def_":{"documentation":[{"comment":"/**\n   *\n   * Create a new JSON database or initialize an exisiting database.\n   *\n   * @param {string} database The name of the JSON database to be created or used.\n   * @returns {boolean} Whether an existing JSON file was used or created or the action failed.\n   * @example\n   * const jsoning = require('jsoning');\n   * var database = new jsoning(\"database.json\");\n   *\n   */","meta":{"range":[550,1124],"filename":"jsoning.js","lineno":19,"columnno":2,"path":"/home/khalby786/Documents/jsoning/src","code":{"id":"astnode100000027","name":"Jsoning","type":"MethodDefinition","paramnames":["database"]},"vars":{"":null}},"description":"Create a new JSON database or initialize an exisiting database.","params":[{"type":{"names":["string"]},"description":"The name of the JSON database to be created or used.","name":"database"}],"returns":[{"type":{"names":["boolean"]},"description":"Whether an existing JSON file was used or created or the action failed."}],"examples":["const jsoning = require('jsoning');\nvar database = new jsoning(\"database.json\");"],"name":"Jsoning","longname":"Jsoning","kind":"class","scope":"global","$longname":"Jsoning","$kind":"constructor","$docmaLink":"?api#Jsoning"},{"comment":"/**\n   *\n   * Returns all the elements and their values of the JSON database.\n   *\n   * @returns {Object} The object of all the key-value pairs of the database.\n   * @example\n   * database.set(\"foo\", \"bar\");\n   * database.set(\"hi\", \"hello\");\n   *\n   * let all = database.all();\n   * console.log(all); // { \"foo\": \"bar\", \"hi\": \"hello\" }\n   *\n   */","meta":{"range":[2454,2587],"filename":"jsoning.js","lineno":80,"columnno":2,"path":"/home/khalby786/Documents/jsoning/src","code":{"id":"astnode100000157","name":"Jsoning#all","type":"MethodDefinition","paramnames":[]},"vars":{"":null}},"description":"Returns all the elements and their values of the JSON database.","returns":[{"type":{"names":["Object"]},"description":"The object of all the key-value pairs of the database."}],"examples":["database.set(\"foo\", \"bar\");\ndatabase.set(\"hi\", \"hello\");\n\nlet all = database.all();\nconsole.log(all); // { \"foo\": \"bar\", \"hi\": \"hello\" }"],"name":"all","longname":"Jsoning#all","kind":"function","memberof":"Jsoning","scope":"instance","params":[],"$longname":"Jsoning#all","$kind":"method","$docmaLink":"?api#Jsoning#all"},{"comment":"/**\n   *\n   * Clear the whole JSON database.\n   *\n   * @returns {Boolean}\n   * @example\n   * database.set(\"foo\", \"bar\");\n   * database.set(\"en\", \"db\");\n   *\n   * database.clear(); // return {}\n   *\n   */","meta":{"range":[4309,4464],"filename":"jsoning.js","lineno":160,"columnno":2,"path":"/home/khalby786/Documents/jsoning/src","code":{"id":"astnode100000311","name":"Jsoning#clear","type":"MethodDefinition","paramnames":[]},"vars":{"":null}},"description":"Clear the whole JSON database.","returns":[{"type":{"names":["Boolean"]}}],"examples":["database.set(\"foo\", \"bar\");\ndatabase.set(\"en\", \"db\");\n\ndatabase.clear(); // return {}"],"name":"clear","longname":"Jsoning#clear","kind":"function","memberof":"Jsoning","scope":"instance","params":[],"$longname":"Jsoning#clear","$kind":"method","$docmaLink":"?api#Jsoning#clear"},{"comment":"/**\n   *\n   * Delete an element from the database based on its key.\n   *\n   * @param {string} key The key of the element to be deleted.\n   * @returns {Boolean} Returns true if the value exists, else returns false.\n   * @example\n   * database.set(\"ping\", \"pong\");\n   * database.set(\"foo\", \"bar\");\n   *\n   * database.delete(\"foo\"); // returns true\n   *\n   */","meta":{"range":[2950,3397],"filename":"jsoning.js","lineno":99,"columnno":2,"path":"/home/khalby786/Documents/jsoning/src","code":{"id":"astnode100000185","name":"Jsoning#delete","type":"MethodDefinition","paramnames":["key"]},"vars":{"":null}},"description":"Delete an element from the database based on its key.","params":[{"type":{"names":["string"]},"description":"The key of the element to be deleted.","name":"key"}],"returns":[{"type":{"names":["Boolean"]},"description":"Returns true if the value exists, else returns false."}],"examples":["database.set(\"ping\", \"pong\");\ndatabase.set(\"foo\", \"bar\");\n\ndatabase.delete(\"foo\"); // returns true"],"name":"delete","longname":"Jsoning#delete","kind":"function","memberof":"Jsoning","scope":"instance","$longname":"Jsoning#delete","$kind":"method","$docmaLink":"?api#Jsoning#delete"},{"comment":"/**\n   *\n   * Gets the value of an element based on it's key.\n   *\n   * @param {string} key The key of the element to be fetched.\n   * @returns {*} Returns value, if element exists, else returns false.\n   * @example\n   * database.set(\"food\", \"pizza\");\n   *\n   * let food = database.get(\"food\");\n   * console.log(\"food\") // returns pizza\n   *\n   */","meta":{"range":[3751,4099],"filename":"jsoning.js","lineno":131,"columnno":2,"path":"/home/khalby786/Documents/jsoning/src","code":{"id":"astnode100000254","name":"Jsoning#get","type":"MethodDefinition","paramnames":["key"]},"vars":{"":null}},"description":"Gets the value of an element based on it's key.","params":[{"type":{"names":["string"]},"description":"The key of the element to be fetched.","name":"key"}],"returns":[{"type":{"names":["*"]},"description":"Returns value, if element exists, else returns false."}],"examples":["database.set(\"food\", \"pizza\");\n\nlet food = database.get(\"food\");\nconsole.log(\"food\") // returns pizza"],"name":"get","longname":"Jsoning#get","kind":"function","memberof":"Jsoning","scope":"instance","$longname":"Jsoning#get","$kind":"method","$docmaLink":"?api#Jsoning#get"},{"comment":"/**\n   *\n   * Adds an element to a database with the specified value. If element exists, element value is updated.\n   *\n   * @param {string} key Key of the element to be set.\n   * @param {*} value Value of the element to be set.\n   * @returns {boolean} If element is set/updated successfully, returns true, else false.\n   * @example\n   * database.set(\"foo\", \"bar\");\n   * database.set(\"hi\", 3);\n   *\n   * database.set(\"en\", \"db\"); // { \"en\": \"db\" }\n   * database.set(\"en\", \"en\"); // { \"en\": \"en\" }\n   *\n   * let set = database.set(\"khaleel\", \"gibran\");\n   * console.log(set); // returns true\n   *\n   */","meta":{"range":[1732,2101],"filename":"jsoning.js","lineno":54,"columnno":2,"path":"/home/khalby786/Documents/jsoning/src","code":{"id":"astnode100000097","name":"Jsoning#set","type":"MethodDefinition","paramnames":["key","value"]},"vars":{"":null}},"description":"Adds an element to a database with the specified value. If element exists, element value is updated.","params":[{"type":{"names":["string"]},"description":"Key of the element to be set.","name":"key"},{"type":{"names":["*"]},"description":"Value of the element to be set.","name":"value"}],"returns":[{"type":{"names":["boolean"]},"description":"If element is set/updated successfully, returns true, else false."}],"examples":["database.set(\"foo\", \"bar\");\ndatabase.set(\"hi\", 3);\n\ndatabase.set(\"en\", \"db\"); // { \"en\": \"db\" }\ndatabase.set(\"en\", \"en\"); // { \"en\": \"en\" }\n\nlet set = database.set(\"khaleel\", \"gibran\");\nconsole.log(set); // returns true"],"name":"set","longname":"Jsoning#set","kind":"function","memberof":"Jsoning","scope":"instance","$longname":"Jsoning#set","$kind":"method","$docmaLink":"?api#Jsoning#set"}],"symbols":["Jsoning","Jsoning#all","Jsoning#clear","Jsoning#delete","Jsoning#get","Jsoning#set"]}},"app":{"title":"jsoning","meta":[{"charset":"utf-8"},{"name":"viewport","content":"width=device-width,initial-scale=1.0"},{"property":"og:url","content":"https://jsoning.js.org"},{"property":"og:title","content":"jsoning"},{"property":"og:description","content":"A simple key-value JSON-based persistent lightweight database."},{"property":"og:image","content":"images/jsoning.png"}],"base":"/jsoning/","entrance":"?content:readme","routing":{"method":"query","caseSensitive":true},"server":"static","favicon":""},"template":{"name":"docma-template-zebra","description":"Zebra - Default template for Docma. https://github.com/onury/docma","version":"2.3.1","supportedDocmaVersion":">=2.0.0","author":"Onur Yıldırım","license":"MIT","mainHTML":"index.html","options":{"title":"jsoning","logo":null,"sidebar":{"enabled":true,"outline":"tree","collapsed":false,"toolbar":true,"itemsFolded":false,"itemsOverflow":"crop","badges":true,"search":true,"animations":true},"symbols":{"autoLink":true,"params":"list","enums":"list","props":"list","meta":false},"contentView":{"bookmarks":false,"faVersion":"5.5.0","faLibs":"all"},"navbar":{"enabled":true,"fixed":true,"dark":false,"animations":true,"menu":[{"label":"README","href":"?content=readme","iconClass":"ico-md ico-info"},{"label":"Documentation","href":"?api=jsoning","iconClass":"ico-book"},{"label":"GitHub","href":"https://github.com/khalby786/jsoning","target":"_blank","iconClass":"ico-md ico-github"}]}}},"partials":{"api":"docma-api","content":"docma-content","notFound":"docma-404"},"elementID":"docma-main","contentElementID":"docma-content","defaultApiName":"_def_","logsEnabled":true}));

/* global docma, DocmaWeb, page, sessionStorage */
/* eslint no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

// --------------------------------
// DocmaWeb - SPA
// https://github.com/onury/docma
// --------------------------------

(function () {

    'use strict';

    /**
     *  Flag for app routing method
     *  @private
     */
    var PATH_ROUTING = docma.app.routing.method === 'path';

    // --------------------------------
    // ROUTING with (page.js)
    // --------------------------------

    /**
     *  This is used for "path" routing method.
     *  i.e. docma.app.routing.method = "path" and docma.app.server === "github"
     *  or none
     *
     *  In this case, Docma generates directories with an index file for each
     *  route. Index files will set a redirect path to sessionStorage and
     *  meta-refresh itself to main (root) index file.
     *
     *  Then we'll read the redirect path from `sessionStorage` into memory and
     *  reset the storage. Then redirect the SPA to the set path.
     *
     *  Note that if `.app.routing.method` is set to `"query"`, we don't need
     *  this since, routing via query-string always operates on the main page
     *  already.
     *  @private
     *
     *  @returns {Boolean} - Whether the SPA is redirecting from a
     *  sub-directory path.
     */
    function _redirecting() {
        if (PATH_ROUTING) {
            var redirectPath = sessionStorage.getItem('redirectPath') || null;
            if (redirectPath) {
                sessionStorage.removeItem('redirectPath');
                docma.info('Redirecting to:', redirectPath);
                page.redirect(redirectPath);
                return true;
            }
        }
        return false;
    }

    function _getQueryString(ctxQueryString) {
        var qs = ctxQueryString || window.location.search;
        // remove leading ? or & if any
        if ((/^[?&]/).test(qs)) qs = qs.slice(1);
        return qs || null;
    }

    function getRouteName(context) {
        return (context.params[1] || '').replace(/\/$/, ''); // remove end slash
    }

    // Setup page.js routes

    // if routing method is "path"; e.g. for `/guide` we render `docma-content`
    // Dust template, then fetch `content/guide.html` and load it in the
    // docma-main element. Otherwise, we'll render `docma-api` Dust
    // template. (_def_) API documentation will be accessible @ `/api`.
    // Named API documentation will be accessible @ `/api/name`.

    // if routing method is "query"; we look for query-string param "api" or
    // "content". e.g. for `?content=readme` we render `docma-content` Dust
    // template, then fetch `content/readme.html` and load it in the docma-main
    // element. e.g. "?api=mylib", we'll render `docma-api` Dust template.

    if (docma.app.base) page.base(docma.app.base);
    page.redirect('(/)?' + docma.template.main, '');

    function apiRouteHandler(context, next) {
        var apiName = getRouteName(context) || docma._.defaultApiName; // e.g. api or api/web
        var routeInfo = docma.createRoute(apiName, DocmaWeb.Route.Type.API);
        // route not found, send to next (not-found)
        if (!routeInfo || !routeInfo.exists()) return next();
        routeInfo.apply();
    }

    if (PATH_ROUTING) {
        page('(/)?api/(.+)', apiRouteHandler);
        page('(/)?api(/)?', apiRouteHandler);
        page('(/)?(.*)', function (context, next) {
            var content = getRouteName(context); // e.g. cli or templates/filters
            var routeInfo = docma.createRoute(content, DocmaWeb.Route.Type.CONTENT);
            // route not found, send to next (not-found)
            if (!routeInfo || !routeInfo.exists()) return next();
            routeInfo.apply();
        });
    }

    page('(/)?', function (context, next) {
        if (_redirecting()) return;
        // docma.log(context);

        // context.querystring has problems.
        // See our issue @ https://github.com/visionmedia/page.js/issues/377
        // And this PR for a fix: https://github.com/visionmedia/page.js/pull/408
        // This PR is still not merged as of Aug, 2017. Revise below once it's merged.

        // So first, we check if context.querystring has a value. if not, we'll
        // try window.location.search but, it needs a little delay to capture
        // the change.
        setTimeout(function () {
            var routeInfo,
                qs = _getQueryString(context.querystring); // this needs the timeout

            if (PATH_ROUTING) {
                // only expecting paths, shouldn't have querystring
                if (qs) return next(); // not found
                // no query-string, just "/" root received
                routeInfo = docma._.appEntranceRI;
            } else { // query routing
                docma.log('Query-string:', qs);
                routeInfo = qs ? docma.createRouteFromQuery(qs) : docma._.appEntranceRI;
            }

            var is404 = !routeInfo || !routeInfo.exists();

            // route not found, send to next (not-found)
            if (is404) return next();

            function triggerNav() {
                // on route-change or hashchange
                docma._trigger(DocmaWeb.Event.Navigate, [routeInfo]);
            }

            // if this is already the current route, do nothing...
            if (routeInfo.isCurrent()) {
                triggerNav();
                return;
            }

            // now, we can apply the route
            routeInfo.apply(function (status) {
                if (status === 200) triggerNav();
            });

        }, 100);
    });

    page('*', function (context) { // (context, next)
        docma.warn('Unknown Route:', context.path);
        docma.log('context:', context);
        docma.createRoute(null).apply();
    });

    // --------------------------------
    // INITIALIZE
    // --------------------------------

    docma.info('Docma SPA Configuration:');
    docma.info('App Title:          ', docma.app.title);
    docma.info('Routing Method:     ', docma.app.routing.method);
    docma.info('App Server:         ', docma.app.server);
    docma.info('Base Path:          ', docma.app.base);
    docma.info('Entrance Route ID:  ', docma.app.entrance);

    window.onload = function () { // (event)

        // mark initial page load
        docma._.initialLoad = true;
        // convert entrance route ID to routeInfo for later use
        docma._.appEntranceRI = docma.createRouteFromID(docma.app.entrance);
        // configure page.js
        page.start({
            click: true,
            popstate: true,
            dispatch: true,
            hashbang: false,
            decodeURLComponents: true
        });

        docma.info('Docma SPA loaded!');
    };

})();
