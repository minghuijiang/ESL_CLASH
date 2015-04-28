(
// merge different module to perform squirt
function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                throw new Error("Cannot find module '" + o + "'")
            }
            var f = n[o] = {
                exports: {}
            };
            t[o][0].call(f.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, f, f.exports, e, t, n, r)
        }
        return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s
})(
{
    2: [function(require, module, exports) {
        var js = require('./js'),
            _ = require('underscore'),
            evt = require('./evt');

        var dom = {

            // Efficiently append a large number of children to el
            // by removing el from the DOM, appending the children,
            // and re-attaching.
            appendChildren: function(el, children) {
                var parent = el.parentElement;
                var nextSibling = el.nextSibling;
                el.remove();
                children.map(function(node) {
                    el.appendChild(node);
                });
                parent[nextSibling ? 'insertBefore' : 'appendChild'](el, nextSibling);
            },


            compileHtml: function(html) {
                console.log(html);
                var container = dom.makeEl('div', {
                    style: "visibility: hidden"
                }, document.body);
                container.innerHTML = html;
                var children = container.children;
                $(container).remove();
                return children.length > 1 ? js.array(children) : children[0];
            },

            draggable: function(el, constraints) {
                var moveHandler, elStartCoord, mouseStartCoord, removeHandlers = [];
                el.style.position = 'absolute';

                function constrain(val, bounds) {
                    return Math.max(bounds.min, Math.min(bounds.max, val));
                }

                function x(val) {
                    el.style.left = constrain(val, constraints.x) + 'px';
                    var diff = constraints.x.max - constraints.x.min;
                    return diff > 0 ? el.offsetLeft / diff : 0;
                }

                function y(val) {
                    el.style.top = constrain(val, constraints.y) + 'px';
                    var diff = constraints.y.max - constraints.y.min;
                    return diff > 0 ? el.offsetTop / diff : 0;
                }

                function setupConstraints(el) {
                    var x = constraints.x = constraints.x || {};
                    var y = constraints.y = constraints.y || {};
                    if (constraints.disableX)
                        x.min = el.offsetLeft, x.max = el.offsetLeft;

                    if (constraints.disableY)
                        y.min = el.offsetTop, y.max = el.offsetTop;

                    x.min = x.min === undefined ? -Infinity : x.min;
                    x.max = x.max === undefined ? Infinity : x.max;
                    x.range = x.max - x.min;

                    y.min = y.min === undefined ? -Infinity : y.min;
                    y.max = y.max === undefined ? Infinity : y.max;
                    y.range = y.max - y.min;
                }
                var dragHandler = function(e) {
                    var loc = {};
                    loc.x = x(elStartCoord.x + (e.clientX - mouseStartCoord.x));
                    loc.y = y(elStartCoord.y + (e.clientY - mouseStartCoord.y));
                    evt.dispatch('drag', {
                        location: loc
                    }, el);
                };

                var mouseUpHandler = function(e) {
                    js.invoke(removeHandlers);
                    evt.dispatch('dragged', {}, el);
                };

                evt.on(el, 'mousedown', function(e) {
                    mouseStartCoord = {
                        x: e.clientX,
                        y: e.clientY
                    };
                    elStartCoord = {
                        x: el.offsetLeft,
                        y: el.offsetTop
                    };
                    removeHandlers.push(evt.on('mousemove', dragHandler));
                    removeHandlers.push(evt.on('mouseup', mouseUpHandler));
                });
                setupConstraints(el);
                return function(xPerc, yPerc) {
                    x((xPerc * constraints.x.range) - constraints.x.min), y(yPerc);
                };
            },

            multiClassOp: function(el, classStr, method) {
                classStr.split(' ')
                    .map(function(cls) {
                        el.classList[method](cls);
                    });
            },

            addClass: function(el, classStr) {
                if (typeof el === 'string') {
                    classStr = el;
                    return function(el) {
                        dom.multiClassOp(el, classStr, 'add');
                    }
                }
                return dom.multiClassOp(el, classStr, 'add');
            },

            removeClass: function(el, classStr) {
                return dom.multiClassOp(el, classStr, 'remove');
            },

            transitionEndEvents: 'webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd',
            _transitionProps: ['transition', '-moz-transition', 'MozTransition', '-webkit-transition'],
            transition: function(el, duration, opts) {

                // Apply inline css transitions.
                // e.g., "all .1 ease-in-out"
                //
                // - duration is in seconds
                // - opts.target can be "opacity left", and will expand:
                //     - e.g., "opacity .1 ease-in-out, left .1 ease-in-out"

                duration = duration / 1000;
                opts = _.defaults(opts || {}, {
                    type: 'ease-in-out',
                    target: 'all',
                    delay: '0'
                });

                var valueSuffix = [duration + 's', opts.type, opts.delay + 's'].join(' ');
                var values = opts.target.split(' ')
                    .map(function(target) {
                        return target + ' ' + valueSuffix;
                    });
                var style = el.style;

                function applyValueToProp(prop, value) {
                    if (style[prop] && style[prop].match(opts.target)) {
                        style[prop] = style[prop].replace(new RegExp(opts.target + '[^,]+'), value)
                    } else if (style[prop] === undefined) {
                        style[prop] = value
                    } else {
                        style[prop] += (style[prop].length ? ', ' : '') + value;
                    }
                }

                js.map2d(dom._transitionProps, values, applyValueToProp);
                return function clearTransition() {
                    var propRegex = new RegExp(opts.target + '[^,]*');
                    js.map2d(dom._transitionProps, values, function(prop, value) {
                        style[prop] = style[prop].replace(propRegex, '');
                    });
                };
            },

            qs: document.querySelector.bind(document),

            qsa: _.compose(js.array, document.querySelectorAll.bind(document)),

            makeEl: function(type, attrs, parent) {
                var el = document.createElement(type);
                for (var k in attrs) {
                    if (!attrs.hasOwnProperty(k)) continue;
                    el.setAttribute(k, attrs[k]);
                }
                parent && parent.appendChild(el);
                return el;
            },

            // data binding... *cough*
            bind: function(expr, data, el) {
                el.render = dom.render.bind(null, expr, data, el);
                return evt.on('squirt.els.render', function() {
                    el.render();
                });
            },

            render: function(expr, data, el) {
                var match,
                    exprRx = /{{\s?([^\s}]+)\s?}}/g,
                    rendered = expr;

                while (match = exprRx.exec(expr)) {
                    if (match.length < 2) continue;
                    rendered = rendered.replace(match[0], data[match[1]]);
                }
                el.textContent = rendered;
            },

            makeDiv: function(attrs, parent) {
                return dom.makeEl('div', attrs, parent);
            },

            injectStylesheet: function(url, onLoad) {
                var el = dom.makeEl('link', {
                    rel: 'stylesheet',
                    href: url,
                    type: 'text/css'
                }, document.head);

                function loadHandler() {
                    onLoad();
                    el.removeEventListener('load', loadHandler)
                }
                onLoad && evt.on(el, 'load', loadHandler);
            },

            _elFromElOrSelector: function(elOrSelector) {
                return typeof elOrSelector == 'string' ?
                    dom.qs(elOrSelector) :
                    elOrSelector;
            },

            toggle: function(el) {
                el = dom._elFromElOrSelector(el);
                var s = window.getComputedStyle(el);
                return (el.style.display = s.display == 'none' ? 'block' : 'none') == 'block';
            },

            show: function(el) {
                console.log('show ');
                console.log(el);
                el = dom._elFromElOrSelector(el);
                el.style.display = 'block';
            },

            hide: function(el) {
                console.log('hide ');
                console.log(el);
                el = dom._elFromElOrSelector(el);
                el.style.display = 'none';
            },

            getSelectedText: function() {
                var selection = window.getSelection();
                if (selection.type == 'Range') {
                    var container = document.createElement("div");
                    for (var i = 0, len = selection.rangeCount; i < len; ++i) {
                        container.appendChild(selection.getRangeAt(i)
                            .cloneContents());
                    }
                    return container.innerText;
                }
            },

            // DOM isn't exactly the right place for these
            toQueryString: function(object) {
                return Object
                    .keys(object)
                    .reduce(function(pairs, key) {
                        pairs.push(key + '=' + encodeURIComponent(object[key]));
                        return pairs
                    }, [])
                    .join('&');
            },

            // DOM isn't exactly the right place for these
            fromQueryString: function(queryString) {
                var string = (queryString || window.location.search)
                    .substring(1);
                var object = {};
                string.split('&')
                    .map(function(component) {
                        var pair = component.split('=');
                        var val, key = decodeURIComponent(pair[0]);
                        if (pair.length > 1) {
                            val = decodeURIComponent(pair[1]);
                        }
                        object[key] = val;
                    });
                return object;
            }
        };

        module.exports = dom;
}, {
        "./evt": 3,
        "./js": 5,
        "underscore": 13
    }],
    3: [function(require, module, exports) {
            _ = require('underscore'),
            js = require('./js');

        // TODO
        // drop this weird default global bus pattern in
        // favor of explicit emitters

        var evt = {

            // argument processing for `on` and `once`
            // (I am genuinely sorry about these three functions.)
            _onArgs: function(buses, evts, cb) {
                // two forms
                // - on(evt, callback) -> add listener to document
                // - on(bus, evt, callback) -> add listener to bus
                if (cb === undefined) {
                    cb = evts;
                    evts = buses;
                    buses = [document];
                }
                if (buses.splice === undefined) buses = [buses];
                evts = evts.split(' ');
                return [buses, evts, cb, true];
            },

            handle: function(evtsToHandlers) {
                _.keys(evtsToHandlers)
                    .map(function(evtStr) {
                        evt.on(evtStr, evtsToHandlers[evtStr]);
                    });
            },

            on: function(buses, evts, cb, processedArgs) {
                if (!processedArgs) return evt.on.apply(null, evt._onArgs.apply(null, arguments));
                js.map2d(buses, evts, function(bus, evt) {
                    bus.addEventListener(evt, cb);
                });
                return function() {
                    js.map2d(buses, evts, function(bus, evt) {
                        bus.removeEventListener(evt, cb);
                    });
                }
            },

            once: function(bus, evts, cb, processedArgs) {
                if (!processedArgs) return evt.once.apply(null, evt._onArgs.apply(null, arguments));
                var remover, newCallback = function(e) {
                    remover();
                    return cb(e);
                };
                remover = evt.on.call(null, bus, evts, newCallback, true);
            },

            dispatch: function(evtStr, attrs, dispatcher) {
                var e = new Event(evtStr);

                for (var k in attrs) {
                    if (!attrs.hasOwnProperty(k)) continue;
                    e[k] = attrs[k];
                }

                (dispatcher || document)
                .dispatchEvent(e);

                if (!attrs || !attrs.frameOfOrigin) {
                    evt.dispatchXF(evtStr, attrs);
                }


                // squirt.*.echo is subscribed to by rendering routines
                if (evtStr.indexOf('echo') == -1) {
                    js.tick(function() {
                        evt.dispatch(evtStr + '.echo');
                    });
                }
            },

            // cross-frame event dispbatch
            dispatchXF: function(e, attrs) {
                var targetFrame, targetOrigin;
                if (window.sq.context == 'inner') {
                    targetFrame = window.parent;
                    targetOrigin = window.sq.parentOrigin;
                } else {
                    targetFrame = document.querySelector('.sq-frame');
                    targetFrame = targetFrame && targetFrame.contentWindow;
                    if (!targetFrame) return;
                   // targetOrigin = window.location.protocol + window.sq.iframeQueryParams.host;
                }
                var msg = {
                    event: e,
                    frameOfOrigin: window.sq.context
                };
                attrs && _.extend(msg, attrs);
                targetFrame.postMessage(msg, "*");
            }
        };

        module.exports = evt;
}, {
        "./js": 5,
        "underscore": 13
    }],
    4: [function(require, module, exports) {
        var _ = require('underscore'),
            dom = require('./dom'),
            evt = require('./evt'),
            js = require('./js');

        var initialized = false; // used in the re-install flow
        var sq = window.sq;
        sq.innerFrame = null;
        sq.pageScriptVersion = '0.3.0';

        var loading = {
            wrapperEl: null,

            show: function() {
                var loadingHtml ='<div class="loading-wrapper sq-trans">  ' +
                    '<style>   ' +
                    ' .sq-loading {     ' +
                    'width: 100%;      ' +
                    'height: 100%;      ' +
                    'position: fixed;      ' +
                    'left: 0;      ' +
                    'top: 0;      ' +
                    'opacity: 0;      ' +
                    'background-color: rgba(209, 209, 209, 0.3);    ' +
                    '}    ' +
                    '.visible {      ' +
                    'opacity: 1;     ' +
                    '}  ' +
                    '</style>  ' +
                    '<div class="sq-loading visible" style="display: none;">  ' +
                    '</div>' +
                    '</div>';

                loading.wrapperEl = dom.compileHtml(loadingHtml);
                console.log(loading.wrapperEl);
                document.body.appendChild(loading.wrapperEl);
                dom.addClass(dom.qs('.sq-loading'), 'visible');
            },

            hide: function() {
                $('.sq-loading').hide();
            }
        };

        ! function initSquirt() {

            // loading view
            loading.show();

            dom.injectStylesheet('squirt/css/frame.outer.css');

            // inject reader iframe


            var iframeSrc =
                'squirt/views/iframe.html';

            sq.innerFrame = createIframe(iframeSrc, _.compose(
                loading.hide,
                setText));

            // events
            //cross frame
            evt.on(window, 'message', function(e) {
                var data = e.data;
                var event = data.event;
                if (event === undefined) return;
                delete data.event;
                if (event.match(/squirt\./)) evt.dispatch(event, data);
            });
            sq.context = 'outer';
            evt.on('squirt.play', blurPage);
            evt.on('squirt.pause', unblurPage);
            evt.on('squirt.redirect', function(e) {
                window.location.href = e.href;
            });
            evt.on('squirt.close', function() {
                sq.innerFrame.classList.add('closed');
                sq.innerFrame.contentWindow.blur();
                window.focus();
                unblurPage()
            });
            evt.on('squirt.pageBodyOffsetTop', function(e) {
                document.body.style.top = 0 + 'px';
                dom.transition(document.body, e.duration, {
                    target: 'top'
                });
                js.tick(function() {
                    document.body.style.top = e.top + 'px'
                }, 0);
            });

            // apply transitions class for smooth blur during play/pause
            js.array(document.body.children)
                .map(function(node) {
                    node.classList.add('sq-trans');
                });
            startTime = new Date().getMilliseconds();
            timeRead = 0;
            lexicalRead= 0;
            wordRead = 0;
            regression=0;
            fixation = 0;
            sent=false;
        }(initialized = true);

        function createIframe(src, onLoad) {
            var frame = dom.makeEl('iframe', {
                src: src,
				//style: "height:100%",
                class: 'sq-frame'
            }, document.body);
            frame.style.border = 0;
            frame.addEventListener('load', function() {
                onLoad && onLoad();
                frame.focus();
                dom.transition(document.body)
            });
            return frame;
        }

        function blurPage() {
            js.array(document.body.children)
                .filter(function(node) {
                    return !node.classList.contains('sq-frame')
                })
                .map(dom.addClass('sq-blur'));
        }

        function unblurPage() {
            js.array(document.body.children)
                .map(function(node) {
                    node.classList.remove('sq-blur');
                });
        }

        var tokenDelimiter='ˇ';

		function getTextFromJson(){
				var contents = json.contents;
				var text ="";
				var str = "";
				var openDouble = false;
				var openSingle = false;
				var attachRight = false;
				for(i=0; i<contents.length;i++){
					var para = contents[i];
					for(j=0;j<para.length;j++){
						var sent = para[j].tokens;
						for(z=0;z<sent.length;z++){
							var token = sent[z];
							{
								if(token['tagged']=='Symbol'){
									var w = token['word'];
									switch(w){
										case '.':
										case '!':
										case '?':
										case ',':
										case ';':
										case ':':
										case ')':
										case ']':
										case '>': // those punctuation attach to word on left.
											str+=w;
											break;
										case '(':
										case '[':
											attachRight = true;
											str+= " "+w;
											break;
										case '"':
											if(openDouble){ // close double quotes attach to right
												str+=w;
											}else{     // open quote attach to left;
												str+=" "+w;
												attachRight = true;
											}
											openDouble=!openDouble;
											break;
										case '\'':
											if(openSingle){ // close single, attach to right
												str+=w;
											}else{  // open single, a
												str+=" "+w;
												attachRight = true;
											}
											openSingle=!openSingle;
											break;
                                        default :
                                            str+=" "+w;
                                            break;
									}
								}
								else{
									if(attachRight){
										str+=token['word'];
										attachRight = false;
									}
									else{
										str+=" "+token['word'];
									}
								}
							}
							if(token['slashed']){
								if(z==sent.length-1&&j == para.length-1)
									text+=str.trim()+"\n"+tokenDelimiter;
								else
									text+=str.trim()+tokenDelimiter;
								str = "";
							}
						}

					}
					//text+="\n"+tokenDelimiter;
					//str="";
				}
				return text+" "+str;
		}


        function setText() {
            var text = getTextFromJson();//sq.demoText || dom.getSelectedText() || sq.pageContent;

            evt.dispatch('squirt.setText', {
                text: text
            });
        }
        function sendRecord(){
            var select =$('#fileSelector')[0];
            var selectedFile =select.options[select.selectedIndex];
            var data = {
                instructor: selectedFile.value,
                filename: selectedFile.innerHTML,
                timeSpend: new Date().getMilliseconds() -startTime +timeRead,
                wordRead: wordRead,
                lbRead: lexicalRead,
                regression: regression,
                fixation: fixation
            };
            $.get('api/addRecord?'+$.param(data),function(data){
                if(data.error)
                    onError(data);
                else{
                    console.log('sended data');
                }
            })
        }
        sendRecord();

        var startTime,timeRead,lexicalRead,wordRead,regression,fixation,sent;

        sq.again = function(didWaitForBlur) {
            startTime = new Date().getMilliseconds();
            timeRead = 0;
            lexicalRead= 0;
            wordRead = 0;
            regression=0;
            fixation = 0;
            sent = false;
            // handle the situation where the user clicks the bookmarklet immediately
            // after reinstalling
            if (!initialized) return initSquirt();
            sq.innerFrame.classList.remove('closed');
            setText();
            if (didWaitForBlur) return evt.dispatch('squirt.play', {
                extraSlowStart: true
            });

            blurPage();
            setTimeout(function() {
                sq.again(true)
            }, 250);
        };

}, {
        "./dom": 2,
        "./evt": 3,
        "./js": 5,
        "underscore": 13
    }],
    5: [function(require, module, exports) {

        var js = {

            array: function(listLike) {
                return Array.prototype.slice.call(listLike);
            },

            // invoke([f1, f2]); // calls f1() and f2()
            // invoke([o1, o2], 'func'); // calls o1.func(), o2.func()
            // args are applied to both invocation patterns
            invoke: function(objs, funcName, args) {
                args = args || [];
                var objsAreFuncs = false;
                switch (typeof funcName) {
                    case "object":
                        args = funcName;
                        break;
                    case "undefined":
                        objsAreFuncs = true;
                }
                return objs.map(function(o) {
                    return objsAreFuncs ? o.apply(null, args) : o[funcName].apply(o, args);
                });
            },

            map2d: function(arr1, arr2, mapper) {
                return arr1.map(function(obj1, idx1, arr1) {
                    return arr2.map(function(obj2, idx2, arr2) {
                        mapper(obj1, obj2, idx1, idx2, arr1, arr2);
                    });
                });
            },

            tick: function(f, timeout) {
                return setTimeout(f, timeout || 0);
            },

            // Returns a function that will return the value at `key`
            // from its first argument.
            //
            // The returned function also has a `then` method, which is
            // a shortcut to a promise that resolves to the value that
            // the created getter function returns.
            getter: function(key) {
                var givesTo = [];
                var getter = function(obj) {
                    var v = obj[key];
                    givesTo.map(function(f) {
                        f(v);
                    });
                    return v;
                };
                getter.giveTo = function(f) {
                    givesTo.push(f);
                    return getter;
                };
                return getter;
            },

            invoker: function() {
                var args = js.array(arguments);
                return function() {
                    js.invoke(args);
                }
            }
        };

        module.exports = js;
}, {}],

    13: [function(require, module, exports) {
        //     Underscore.js 1.6.0
        //     http://underscorejs.org
        //     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
        //     Underscore may be freely distributed under the MIT license.

        (function() {

            // Baseline setup
            // --------------

            // Establish the root object, `window` in the browser, or `exports` on the server.
            var root = this;

            // Save the previous value of the `_` variable.
            var previousUnderscore = root._;

            // Establish the object that gets returned to break out of a loop iteration.
            var breaker = {};

            // Save bytes in the minified (but not gzipped) version:
            var ArrayProto = Array.prototype,
                ObjProto = Object.prototype,
                FuncProto = Function.prototype;

            // Create quick reference variables for speed access to core prototypes.
            var
                push = ArrayProto.push,
                slice = ArrayProto.slice,
                concat = ArrayProto.concat,
                toString = ObjProto.toString,
                hasOwnProperty = ObjProto.hasOwnProperty;

            // All **ECMAScript 5** native function implementations that we hope to use
            // are declared here.
            var
                nativeForEach = ArrayProto.forEach,
                nativeMap = ArrayProto.map,
                nativeReduce = ArrayProto.reduce,
                nativeReduceRight = ArrayProto.reduceRight,
                nativeFilter = ArrayProto.filter,
                nativeEvery = ArrayProto.every,
                nativeSome = ArrayProto.some,
                nativeIndexOf = ArrayProto.indexOf,
                nativeLastIndexOf = ArrayProto.lastIndexOf,
                nativeIsArray = Array.isArray,
                nativeKeys = Object.keys,
                nativeBind = FuncProto.bind;

            // Create a safe reference to the Underscore object for use below.
            var _ = function(obj) {
                if (obj instanceof _) return obj;
                if (!(this instanceof _)) return new _(obj);
                this._wrapped = obj;
            };

            // Export the Underscore object for **Node.js**, with
            // backwards-compatibility for the old `require()` API. If we're in
            // the browser, add `_` as a global object via a string identifier,
            // for Closure Compiler "advanced" mode.
            if (typeof exports !== 'undefined') {
                if (typeof module !== 'undefined' && module.exports) {
                    exports = module.exports = _;
                }
                exports._ = _;
            } else {
                root._ = _;
            }

            // Current version.
            _.VERSION = '1.6.0';

            // Collection Functions
            // --------------------

            // The cornerstone, an `each` implementation, aka `forEach`.
            // Handles objects with the built-in `forEach`, arrays, and raw objects.
            // Delegates to **ECMAScript 5**'s native `forEach` if available.
            var each = _.each = _.forEach = function(obj, iterator, context) {
                if (obj == null) return obj;
                if (nativeForEach && obj.forEach === nativeForEach) {
                    obj.forEach(iterator, context);
                } else if (obj.length === +obj.length) {
                    for (var i = 0, length = obj.length; i < length; i++) {
                        if (iterator.call(context, obj[i], i, obj) === breaker) return;
                    }
                } else {
                    var keys = _.keys(obj);
                    for (var i = 0, length = keys.length; i < length; i++) {
                        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
                    }
                }
                return obj;
            };

            // Return the results of applying the iterator to each element.
            // Delegates to **ECMAScript 5**'s native `map` if available.
            _.map = _.collect = function(obj, iterator, context) {
                var results = [];
                if (obj == null) return results;
                if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
                each(obj, function(value, index, list) {
                    results.push(iterator.call(context, value, index, list));
                });
                return results;
            };

            var reduceError = 'Reduce of empty array with no initial value';

            // **Reduce** builds up a single result from a list of values, aka `inject`,
            // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
            _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
                var initial = arguments.length > 2;
                if (obj == null) obj = [];
                if (nativeReduce && obj.reduce === nativeReduce) {
                    if (context) iterator = _.bind(iterator, context);
                    return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
                }
                each(obj, function(value, index, list) {
                    if (!initial) {
                        memo = value;
                        initial = true;
                    } else {
                        memo = iterator.call(context, memo, value, index, list);
                    }
                });
                if (!initial) throw new TypeError(reduceError);
                return memo;
            };

            // The right-associative version of reduce, also known as `foldr`.
            // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
            _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
                var initial = arguments.length > 2;
                if (obj == null) obj = [];
                if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
                    if (context) iterator = _.bind(iterator, context);
                    return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
                }
                var length = obj.length;
                if (length !== +length) {
                    var keys = _.keys(obj);
                    length = keys.length;
                }
                each(obj, function(value, index, list) {
                    index = keys ? keys[--length] : --length;
                    if (!initial) {
                        memo = obj[index];
                        initial = true;
                    } else {
                        memo = iterator.call(context, memo, obj[index], index, list);
                    }
                });
                if (!initial) throw new TypeError(reduceError);
                return memo;
            };

            // Return the first value which passes a truth test. Aliased as `detect`.
            _.find = _.detect = function(obj, predicate, context) {
                var result;
                any(obj, function(value, index, list) {
                    if (predicate.call(context, value, index, list)) {
                        result = value;
                        return true;
                    }
                });
                return result;
            };

            // Return all the elements that pass a truth test.
            // Delegates to **ECMAScript 5**'s native `filter` if available.
            // Aliased as `select`.
            _.filter = _.select = function(obj, predicate, context) {
                var results = [];
                if (obj == null) return results;
                if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
                each(obj, function(value, index, list) {
                    if (predicate.call(context, value, index, list)) results.push(value);
                });
                return results;
            };

            // Return all the elements for which a truth test fails.
            _.reject = function(obj, predicate, context) {
                return _.filter(obj, function(value, index, list) {
                    return !predicate.call(context, value, index, list);
                }, context);
            };

            // Determine whether all of the elements match a truth test.
            // Delegates to **ECMAScript 5**'s native `every` if available.
            // Aliased as `all`.
            _.every = _.all = function(obj, predicate, context) {
                predicate || (predicate = _.identity);
                var result = true;
                if (obj == null) return result;
                if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
                each(obj, function(value, index, list) {
                    if (!(result = result && predicate.call(context, value, index, list))) return breaker;
                });
                return !!result;
            };

            // Determine if at least one element in the object matches a truth test.
            // Delegates to **ECMAScript 5**'s native `some` if available.
            // Aliased as `any`.
            var any = _.some = _.any = function(obj, predicate, context) {
                predicate || (predicate = _.identity);
                var result = false;
                if (obj == null) return result;
                if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
                each(obj, function(value, index, list) {
                    if (result || (result = predicate.call(context, value, index, list))) return breaker;
                });
                return !!result;
            };

            // Determine if the array or object contains a given value (using `===`).
            // Aliased as `include`.
            _.contains = _.include = function(obj, target) {
                if (obj == null) return false;
                if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
                return any(obj, function(value) {
                    return value === target;
                });
            };

            // Invoke a method (with arguments) on every item in a collection.
            _.invoke = function(obj, method) {
                var args = slice.call(arguments, 2);
                var isFunc = _.isFunction(method);
                return _.map(obj, function(value) {
                    return (isFunc ? method : value[method])
                        .apply(value, args);
                });
            };

            // Convenience version of a common use case of `map`: fetching a property.
            _.pluck = function(obj, key) {
                return _.map(obj, _.property(key));
            };

            // Convenience version of a common use case of `filter`: selecting only objects
            // containing specific `key:value` pairs.
            _.where = function(obj, attrs) {
                return _.filter(obj, _.matches(attrs));
            };

            // Convenience version of a common use case of `find`: getting the first object
            // containing specific `key:value` pairs.
            _.findWhere = function(obj, attrs) {
                return _.find(obj, _.matches(attrs));
            };

            // Return the maximum element or (element-based computation).
            // Can't optimize arrays of integers longer than 65,535 elements.
            // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
            _.max = function(obj, iterator, context) {
                if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
                    return Math.max.apply(Math, obj);
                }
                var result = -Infinity,
                    lastComputed = -Infinity;
                each(obj, function(value, index, list) {
                    var computed = iterator ? iterator.call(context, value, index, list) : value;
                    if (computed > lastComputed) {
                        result = value;
                        lastComputed = computed;
                    }
                });
                return result;
            };

            // Return the minimum element (or element-based computation).
            _.min = function(obj, iterator, context) {
                if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
                    return Math.min.apply(Math, obj);
                }
                var result = Infinity,
                    lastComputed = Infinity;
                each(obj, function(value, index, list) {
                    var computed = iterator ? iterator.call(context, value, index, list) : value;
                    if (computed < lastComputed) {
                        result = value;
                        lastComputed = computed;
                    }
                });
                return result;
            };

            // Shuffle an array, using the modern version of the
            // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
            _.shuffle = function(obj) {
                var rand;
                var index = 0;
                var shuffled = [];
                each(obj, function(value) {
                    rand = _.random(index++);
                    shuffled[index - 1] = shuffled[rand];
                    shuffled[rand] = value;
                });
                return shuffled;
            };

            // Sample **n** random values from a collection.
            // If **n** is not specified, returns a single random element.
            // The internal `guard` argument allows it to work with `map`.
            _.sample = function(obj, n, guard) {
                if (n == null || guard) {
                    if (obj.length !== +obj.length) obj = _.values(obj);
                    return obj[_.random(obj.length - 1)];
                }
                return _.shuffle(obj)
                    .slice(0, Math.max(0, n));
            };

            // An internal function to generate lookup iterators.
            var lookupIterator = function(value) {
                if (value == null) return _.identity;
                if (_.isFunction(value)) return value;
                return _.property(value);
            };

            // Sort the object's values by a criterion produced by an iterator.
            _.sortBy = function(obj, iterator, context) {
                iterator = lookupIterator(iterator);
                return _.pluck(_.map(obj, function(value, index, list) {
                        return {
                            value: value,
                            index: index,
                            criteria: iterator.call(context, value, index, list)
                        };
                    })
                    .sort(function(left, right) {
                        var a = left.criteria;
                        var b = right.criteria;
                        if (a !== b) {
                            if (a > b || a === void 0) return 1;
                            if (a < b || b === void 0) return -1;
                        }
                        return left.index - right.index;
                    }), 'value');
            };

            // An internal function used for aggregate "group by" operations.
            var group = function(behavior) {
                return function(obj, iterator, context) {
                    var result = {};
                    iterator = lookupIterator(iterator);
                    each(obj, function(value, index) {
                        var key = iterator.call(context, value, index, obj);
                        behavior(result, key, value);
                    });
                    return result;
                };
            };

            // Groups the object's values by a criterion. Pass either a string attribute
            // to group by, or a function that returns the criterion.
            _.groupBy = group(function(result, key, value) {
                _.has(result, key) ? result[key].push(value) : result[key] = [value];
            });

            // Indexes the object's values by a criterion, similar to `groupBy`, but for
            // when you know that your index values will be unique.
            _.indexBy = group(function(result, key, value) {
                result[key] = value;
            });

            // Counts instances of an object that group by a certain criterion. Pass
            // either a string attribute to count by, or a function that returns the
            // criterion.
            _.countBy = group(function(result, key) {
                _.has(result, key) ? result[key] ++ : result[key] = 1;
            });

            // Use a comparator function to figure out the smallest index at which
            // an object should be inserted so as to maintain order. Uses binary search.
            _.sortedIndex = function(array, obj, iterator, context) {
                iterator = lookupIterator(iterator);
                var value = iterator.call(context, obj);
                var low = 0,
                    high = array.length;
                while (low < high) {
                    var mid = (low + high) >>> 1;
                    iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
                }
                return low;
            };

            // Safely create a real, live array from anything iterable.
            _.toArray = function(obj) {
                if (!obj) return [];
                if (_.isArray(obj)) return slice.call(obj);
                if (obj.length === +obj.length) return _.map(obj, _.identity);
                return _.values(obj);
            };

            // Return the number of elements in an object.
            _.size = function(obj) {
                if (obj == null) return 0;
                return (obj.length === +obj.length) ? obj.length : _.keys(obj)
                    .length;
            };

            // Array Functions
            // ---------------

            // Get the first element of an array. Passing **n** will return the first N
            // values in the array. Aliased as `head` and `take`. The **guard** check
            // allows it to work with `_.map`.
            _.first = _.head = _.take = function(array, n, guard) {
                if (array == null) return void 0;
                if ((n == null) || guard) return array[0];
                if (n < 0) return [];
                return slice.call(array, 0, n);
            };

            // Returns everything but the last entry of the array. Especially useful on
            // the arguments object. Passing **n** will return all the values in
            // the array, excluding the last N. The **guard** check allows it to work with
            // `_.map`.
            _.initial = function(array, n, guard) {
                return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
            };

            // Get the last element of an array. Passing **n** will return the last N
            // values in the array. The **guard** check allows it to work with `_.map`.
            _.last = function(array, n, guard) {
                if (array == null) return void 0;
                if ((n == null) || guard) return array[array.length - 1];
                return slice.call(array, Math.max(array.length - n, 0));
            };

            // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
            // Especially useful on the arguments object. Passing an **n** will return
            // the rest N values in the array. The **guard**
            // check allows it to work with `_.map`.
            _.rest = _.tail = _.drop = function(array, n, guard) {
                return slice.call(array, (n == null) || guard ? 1 : n);
            };

            // Trim out all falsy values from an array.
            _.compact = function(array) {
                return _.filter(array, _.identity);
            };

            // Internal implementation of a recursive `flatten` function.
            var flatten = function(input, shallow, output) {
                if (shallow && _.every(input, _.isArray)) {
                    return concat.apply(output, input);
                }
                each(input, function(value) {
                    if (_.isArray(value) || _.isArguments(value)) {
                        shallow ? push.apply(output, value) : flatten(value, shallow, output);
                    } else {
                        output.push(value);
                    }
                });
                return output;
            };

            // Flatten out an array, either recursively (by default), or just one level.
            _.flatten = function(array, shallow) {
                return flatten(array, shallow, []);
            };

            // Return a version of the array that does not contain the specified value(s).
            _.without = function(array) {
                return _.difference(array, slice.call(arguments, 1));
            };

            // Split an array into two arrays: one whose elements all satisfy the given
            // predicate, and one whose elements all do not satisfy the predicate.
            _.partition = function(array, predicate) {
                var pass = [],
                    fail = [];
                each(array, function(elem) {
                    (predicate(elem) ? pass : fail)
                    .push(elem);
                });
                return [pass, fail];
            };

            // Produce a duplicate-free version of the array. If the array has already
            // been sorted, you have the option of using a faster algorithm.
            // Aliased as `unique`.
            _.uniq = _.unique = function(array, isSorted, iterator, context) {
                if (_.isFunction(isSorted)) {
                    context = iterator;
                    iterator = isSorted;
                    isSorted = false;
                }
                var initial = iterator ? _.map(array, iterator, context) : array;
                var results = [];
                var seen = [];
                each(initial, function(value, index) {
                    if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
                        seen.push(value);
                        results.push(array[index]);
                    }
                });
                return results;
            };

            // Produce an array that contains the union: each distinct element from all of
            // the passed-in arrays.
            _.union = function() {
                return _.uniq(_.flatten(arguments, true));
            };

            // Produce an array that contains every item shared between all the
            // passed-in arrays.
            _.intersection = function(array) {
                var rest = slice.call(arguments, 1);
                return _.filter(_.uniq(array), function(item) {
                    return _.every(rest, function(other) {
                        return _.contains(other, item);
                    });
                });
            };

            // Take the difference between one array and a number of other arrays.
            // Only the elements present in just the first array will remain.
            _.difference = function(array) {
                var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
                return _.filter(array, function(value) {
                    return !_.contains(rest, value);
                });
            };

            // Zip together multiple lists into a single array -- elements that share
            // an index go together.
            _.zip = function() {
                var length = _.max(_.pluck(arguments, 'length')
                    .concat(0));
                var results = new Array(length);
                for (var i = 0; i < length; i++) {
                    results[i] = _.pluck(arguments, '' + i);
                }
                return results;
            };

            // Converts lists into objects. Pass either a single array of `[key, value]`
            // pairs, or two parallel arrays of the same length -- one of keys, and one of
            // the corresponding values.
            _.object = function(list, values) {
                if (list == null) return {};
                var result = {};
                for (var i = 0, length = list.length; i < length; i++) {
                    if (values) {
                        result[list[i]] = values[i];
                    } else {
                        result[list[i][0]] = list[i][1];
                    }
                }
                return result;
            };

            // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
            // we need this function. Return the position of the first occurrence of an
            // item in an array, or -1 if the item is not included in the array.
            // Delegates to **ECMAScript 5**'s native `indexOf` if available.
            // If the array is large and already in sort order, pass `true`
            // for **isSorted** to use binary search.
            _.indexOf = function(array, item, isSorted) {
                if (array == null) return -1;
                var i = 0,
                    length = array.length;
                if (isSorted) {
                    if (typeof isSorted == 'number') {
                        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
                    } else {
                        i = _.sortedIndex(array, item);
                        return array[i] === item ? i : -1;
                    }
                }
                if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
                for (; i < length; i++)
                    if (array[i] === item) return i;
                return -1;
            };

            // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
            _.lastIndexOf = function(array, item, from) {
                if (array == null) return -1;
                var hasIndex = from != null;
                if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
                    return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
                }
                var i = (hasIndex ? from : array.length);
                while (i--)
                    if (array[i] === item) return i;
                return -1;
            };

            // Generate an integer Array containing an arithmetic progression. A port of
            // the native Python `range()` function. See
            // [the Python documentation](http://docs.python.org/library/functions.html#range).
            _.range = function(start, stop, step) {
                if (arguments.length <= 1) {
                    stop = start || 0;
                    start = 0;
                }
                step = arguments[2] || 1;

                var length = Math.max(Math.ceil((stop - start) / step), 0);
                var idx = 0;
                var range = new Array(length);

                while (idx < length) {
                    range[idx++] = start;
                    start += step;
                }

                return range;
            };

            // Function (ahem) Functions
            // ------------------

            // Reusable constructor function for prototype setting.
            var ctor = function() {};

            // Create a function bound to a given object (assigning `this`, and arguments,
            // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
            // available.
            _.bind = function(func, context) {
                var args, bound;
                if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
                if (!_.isFunction(func)) throw new TypeError;
                args = slice.call(arguments, 2);
                return bound = function() {
                    if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
                    ctor.prototype = func.prototype;
                    var self = new ctor;
                    ctor.prototype = null;
                    var result = func.apply(self, args.concat(slice.call(arguments)));
                    if (Object(result) === result) return result;
                    return self;
                };
            };

            // Partially apply a function by creating a version that has had some of its
            // arguments pre-filled, without changing its dynamic `this` context. _ acts
            // as a placeholder, allowing any combination of arguments to be pre-filled.
            _.partial = function(func) {
                var boundArgs = slice.call(arguments, 1);
                return function() {
                    var position = 0;
                    var args = boundArgs.slice();
                    for (var i = 0, length = args.length; i < length; i++) {
                        if (args[i] === _) args[i] = arguments[position++];
                    }
                    while (position < arguments.length) args.push(arguments[position++]);
                    return func.apply(this, args);
                };
            };

            // Bind a number of an object's methods to that object. Remaining arguments
            // are the method names to be bound. Useful for ensuring that all callbacks
            // defined on an object belong to it.
            _.bindAll = function(obj) {
                var funcs = slice.call(arguments, 1);
                if (funcs.length === 0) throw new Error('bindAll must be passed function names');
                each(funcs, function(f) {
                    obj[f] = _.bind(obj[f], obj);
                });
                return obj;
            };

            // Memoize an expensive function by storing its results.
            _.memoize = function(func, hasher) {
                var memo = {};
                hasher || (hasher = _.identity);
                return function() {
                    var key = hasher.apply(this, arguments);
                    return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
                };
            };

            // Delays a function for the given number of milliseconds, and then calls
            // it with the arguments supplied.
            _.delay = function(func, wait) {
                var args = slice.call(arguments, 2);
                return setTimeout(function() {
                    return func.apply(null, args);
                }, wait);
            };

            // Defers a function, scheduling it to run after the current call stack has
            // cleared.
            _.defer = function(func) {
                return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
            };

            // Returns a function, that, when invoked, will only be triggered at most once
            // during a given window of time. Normally, the throttled function will run
            // as much as it can, without ever going more than once per `wait` duration;
            // but if you'd like to disable the execution on the leading edge, pass
            // `{leading: false}`. To disable execution on the trailing edge, ditto.
            _.throttle = function(func, wait, options) {
                var context, args, result;
                var timeout = null;
                var previous = 0;
                options || (options = {});
                var later = function() {
                    previous = options.leading === false ? 0 : _.now();
                    timeout = null;
                    result = func.apply(context, args);
                    context = args = null;
                };
                return function() {
                    var now = _.now();
                    if (!previous && options.leading === false) previous = now;
                    var remaining = wait - (now - previous);
                    context = this;
                    args = arguments;
                    if (remaining <= 0) {
                        clearTimeout(timeout);
                        timeout = null;
                        previous = now;
                        result = func.apply(context, args);
                        context = args = null;
                    } else if (!timeout && options.trailing !== false) {
                        timeout = setTimeout(later, remaining);
                    }
                    return result;
                };
            };

            // Returns a function, that, as long as it continues to be invoked, will not
            // be triggered. The function will be called after it stops being called for
            // N milliseconds. If `immediate` is passed, trigger the function on the
            // leading edge, instead of the trailing.
            _.debounce = function(func, wait, immediate) {
                var timeout, args, context, timestamp, result;

                var later = function() {
                    var last = _.now() - timestamp;
                    if (last < wait) {
                        timeout = setTimeout(later, wait - last);
                    } else {
                        timeout = null;
                        if (!immediate) {
                            result = func.apply(context, args);
                            context = args = null;
                        }
                    }
                };

                return function() {
                    context = this;
                    args = arguments;
                    timestamp = _.now();
                    var callNow = immediate && !timeout;
                    if (!timeout) {
                        timeout = setTimeout(later, wait);
                    }
                    if (callNow) {
                        result = func.apply(context, args);
                        context = args = null;
                    }

                    return result;
                };
            };

            // Returns a function that will be executed at most one time, no matter how
            // often you call it. Useful for lazy initialization.
            _.once = function(func) {
                var ran = false,
                    memo;
                return function() {
                    if (ran) return memo;
                    ran = true;
                    memo = func.apply(this, arguments);
                    func = null;
                    return memo;
                };
            };

            // Returns the first function passed as an argument to the second,
            // allowing you to adjust arguments, run code before and after, and
            // conditionally execute the original function.
            _.wrap = function(func, wrapper) {
                return _.partial(wrapper, func);
            };

            // Returns a function that is the composition of a list of functions, each
            // consuming the return value of the function that follows.
            _.compose = function() {
                var funcs = arguments;
                return function() {
                    var args = arguments;
                    for (var i = funcs.length - 1; i >= 0; i--) {
                        args = [funcs[i].apply(this, args)];
                    }
                    return args[0];
                };
            };

            // Returns a function that will only be executed after being called N times.
            _.after = function(times, func) {
                return function() {
                    if (--times < 1) {
                        return func.apply(this, arguments);
                    }
                };
            };

            // Object Functions
            // ----------------

            // Retrieve the names of an object's properties.
            // Delegates to **ECMAScript 5**'s native `Object.keys`
            _.keys = function(obj) {
                if (!_.isObject(obj)) return [];
                if (nativeKeys) return nativeKeys(obj);
                var keys = [];
                for (var key in obj)
                    if (_.has(obj, key)) keys.push(key);
                return keys;
            };

            // Retrieve the values of an object's properties.
            _.values = function(obj) {
                var keys = _.keys(obj);
                var length = keys.length;
                var values = new Array(length);
                for (var i = 0; i < length; i++) {
                    values[i] = obj[keys[i]];
                }
                return values;
            };

            // Convert an object into a list of `[key, value]` pairs.
            _.pairs = function(obj) {
                var keys = _.keys(obj);
                var length = keys.length;
                var pairs = new Array(length);
                for (var i = 0; i < length; i++) {
                    pairs[i] = [keys[i], obj[keys[i]]];
                }
                return pairs;
            };

            // Invert the keys and values of an object. The values must be serializable.
            _.invert = function(obj) {
                var result = {};
                var keys = _.keys(obj);
                for (var i = 0, length = keys.length; i < length; i++) {
                    result[obj[keys[i]]] = keys[i];
                }
                return result;
            };

            // Return a sorted list of the function names available on the object.
            // Aliased as `methods`
            _.functions = _.methods = function(obj) {
                var names = [];
                for (var key in obj) {
                    if (_.isFunction(obj[key])) names.push(key);
                }
                return names.sort();
            };

            // Extend a given object with all the properties in passed-in object(s).
            _.extend = function(obj) {
                each(slice.call(arguments, 1), function(source) {
                    if (source) {
                        for (var prop in source) {
							try {
								obj[prop] = source[prop];
							}
							catch(err) {
								console.log('assign prop ['+prop+'] with ['+source[prop]+'] with err: '+err);
							}

                        }
                    }
                });
                return obj;
            };

            // Return a copy of the object only containing the whitelisted properties.
            _.pick = function(obj) {
                var copy = {};
                var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
                each(keys, function(key) {
                    if (key in obj) copy[key] = obj[key];
                });
                return copy;
            };

            // Return a copy of the object without the blacklisted properties.
            _.omit = function(obj) {
                var copy = {};
                var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
                for (var key in obj) {
                    if (!_.contains(keys, key)) copy[key] = obj[key];
                }
                return copy;
            };

            // Fill in a given object with default properties.
            _.defaults = function(obj) {
                each(slice.call(arguments, 1), function(source) {
                    if (source) {
                        for (var prop in source) {
                            if (obj[prop] === void 0) obj[prop] = source[prop];
                        }
                    }
                });
                return obj;
            };

            // Create a (shallow-cloned) duplicate of an object.
            _.clone = function(obj) {
                if (!_.isObject(obj)) return obj;
                return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
            };

            // Invokes interceptor with the obj, and then returns obj.
            // The primary purpose of this method is to "tap into" a method chain, in
            // order to perform operations on intermediate results within the chain.
            _.tap = function(obj, interceptor) {
                interceptor(obj);
                return obj;
            };

            // Internal recursive comparison function for `isEqual`.
            var eq = function(a, b, aStack, bStack) {
                // Identical objects are equal. `0 === -0`, but they aren't identical.
                // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
                if (a === b) return a !== 0 || 1 / a == 1 / b;
                // A strict comparison is necessary because `null == undefined`.
                if (a == null || b == null) return a === b;
                // Unwrap any wrapped objects.
                if (a instanceof _) a = a._wrapped;
                if (b instanceof _) b = b._wrapped;
                // Compare `[[Class]]` names.
                var className = toString.call(a);
                if (className != toString.call(b)) return false;
                switch (className) {
                    // Strings, numbers, dates, and booleans are compared by value.
                    case '[object String]':
                        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                        // equivalent to `new String("5")`.
                        return a == String(b);
                    case '[object Number]':
                        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
                        // other numeric values.
                        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
                    case '[object Date]':
                    case '[object Boolean]':
                        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                        // millisecond representations. Note that invalid dates with millisecond representations
                        // of `NaN` are not equivalent.
                        return +a == +b;
                        // RegExps are compared by their source patterns and flags.
                    case '[object RegExp]':
                        return a.source == b.source &&
                            a.global == b.global &&
                            a.multiline == b.multiline &&
                            a.ignoreCase == b.ignoreCase;
                }
                if (typeof a != 'object' || typeof b != 'object') return false;
                // Assume equality for cyclic structures. The algorithm for detecting cyclic
                // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
                var length = aStack.length;
                while (length--) {
                    // Linear search. Performance is inversely proportional to the number of
                    // unique nested structures.
                    if (aStack[length] == a) return bStack[length] == b;
                }
                // Objects with different constructors are not equivalent, but `Object`s
                // from different frames are.
                var aCtor = a.constructor,
                    bCtor = b.constructor;
                if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                        _.isFunction(bCtor) && (bCtor instanceof bCtor)) && ('constructor' in a && 'constructor' in b)) {
                    return false;
                }
                // Add the first object to the stack of traversed objects.
                aStack.push(a);
                bStack.push(b);
                var size = 0,
                    result = true;
                // Recursively compare objects and arrays.
                if (className == '[object Array]') {
                    // Compare array lengths to determine if a deep comparison is necessary.
                    size = a.length;
                    result = size == b.length;
                    if (result) {
                        // Deep compare the contents, ignoring non-numeric properties.
                        while (size--) {
                            if (!(result = eq(a[size], b[size], aStack, bStack))) break;
                        }
                    }
                } else {
                    // Deep compare objects.
                    for (var key in a) {
                        if (_.has(a, key)) {
                            // Count the expected number of properties.
                            size++;
                            // Deep compare each member.
                            if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
                        }
                    }
                    // Ensure that both objects contain the same number of properties.
                    if (result) {
                        for (key in b) {
                            if (_.has(b, key) && !(size--)) break;
                        }
                        result = !size;
                    }
                }
                // Remove the first object from the stack of traversed objects.
                aStack.pop();
                bStack.pop();
                return result;
            };

            // Perform a deep comparison to check if two objects are equal.
            _.isEqual = function(a, b) {
                return eq(a, b, [], []);
            };

            // Is a given array, string, or object empty?
            // An "empty" object has no enumerable own-properties.
            _.isEmpty = function(obj) {
                if (obj == null) return true;
                if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
                for (var key in obj)
                    if (_.has(obj, key)) return false;
                return true;
            };

            // Is a given value a DOM element?
            _.isElement = function(obj) {
                return !!(obj && obj.nodeType === 1);
            };

            // Is a given value an array?
            // Delegates to ECMA5's native Array.isArray
            _.isArray = nativeIsArray || function(obj) {
                return toString.call(obj) == '[object Array]';
            };

            // Is a given variable an object?
            _.isObject = function(obj) {
                return obj === Object(obj);
            };

            // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
            each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
                _['is' + name] = function(obj) {
                    return toString.call(obj) == '[object ' + name + ']';
                };
            });

            // Define a fallback version of the method in browsers (ahem, IE), where
            // there isn't any inspectable "Arguments" type.
            if (!_.isArguments(arguments)) {
                _.isArguments = function(obj) {
                    return !!(obj && _.has(obj, 'callee'));
                };
            }

            // Optimize `isFunction` if appropriate.
            if (typeof(/./) !== 'function') {
                _.isFunction = function(obj) {
                    return typeof obj === 'function';
                };
            }

            // Is a given object a finite number?
            _.isFinite = function(obj) {
                return isFinite(obj) && !isNaN(parseFloat(obj));
            };

            // Is the given value `NaN`? (NaN is the only number which does not equal itself).
            _.isNaN = function(obj) {
                return _.isNumber(obj) && obj != +obj;
            };

            // Is a given value a boolean?
            _.isBoolean = function(obj) {
                return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
            };

            // Is a given value equal to null?
            _.isNull = function(obj) {
                return obj === null;
            };

            // Is a given variable undefined?
            _.isUndefined = function(obj) {
                return obj === void 0;
            };

            // Shortcut function for checking if an object has a given property directly
            // on itself (in other words, not on a prototype).
            _.has = function(obj, key) {
                return hasOwnProperty.call(obj, key);
            };

            // Utility Functions
            // -----------------

            // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
            // previous owner. Returns a reference to the Underscore object.
            _.noConflict = function() {
                root._ = previousUnderscore;
                return this;
            };

            // Keep the identity function around for default iterators.
            _.identity = function(value) {
                return value;
            };

            _.constant = function(value) {
                return function() {
                    return value;
                };
            };

            _.property = function(key) {
                return function(obj) {
                    return obj[key];
                };
            };

            // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
            _.matches = function(attrs) {
                return function(obj) {
                    if (obj === attrs) return true; //avoid comparing an object to itself.
                    for (var key in attrs) {
                        if (attrs[key] !== obj[key])
                            return false;
                    }
                    return true;
                }
            };

            // Run a function **n** times.
            _.times = function(n, iterator, context) {
                var accum = Array(Math.max(0, n));
                for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
                return accum;
            };

            // Return a random integer between min and max (inclusive).
            _.random = function(min, max) {
                if (max == null) {
                    max = min;
                    min = 0;
                }
                return min + Math.floor(Math.random() * (max - min + 1));
            };

            // A (possibly faster) way to get the current timestamp as an integer.
            _.now = Date.now || function() {
                return new Date()
                    .getTime();
            };

            // List of HTML entities for escaping.
            var entityMap = {
                escape: {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;'
                }
            };
            entityMap.unescape = _.invert(entityMap.escape);

            // Regexes containing the keys and values listed immediately above.
            var entityRegexes = {
                escape: new RegExp('[' + _.keys(entityMap.escape)
                    .join('') + ']', 'g'),
                unescape: new RegExp('(' + _.keys(entityMap.unescape)
                    .join('|') + ')', 'g')
            };

            // Functions for escaping and unescaping strings to/from HTML interpolation.
            _.each(['escape', 'unescape'], function(method) {
                _[method] = function(string) {
                    if (string == null) return '';
                    return ('' + string)
                        .replace(entityRegexes[method], function(match) {
                            return entityMap[method][match];
                        });
                };
            });

            // If the value of the named `property` is a function then invoke it with the
            // `object` as context; otherwise, return it.
            _.result = function(object, property) {
                if (object == null) return void 0;
                var value = object[property];
                return _.isFunction(value) ? value.call(object) : value;
            };

            // Add your own custom functions to the Underscore object.
            _.mixin = function(obj) {
                each(_.functions(obj), function(name) {
                    var func = _[name] = obj[name];
                    _.prototype[name] = function() {
                        var args = [this._wrapped];
                        push.apply(args, arguments);
                        return result.call(this, func.apply(_, args));
                    };
                });
            };

            // Generate a unique integer id (unique within the entire client session).
            // Useful for temporary DOM ids.
            var idCounter = 0;
            _.uniqueId = function(prefix) {
                var id = ++idCounter + '';
                return prefix ? prefix + id : id;
            };

            // By default, Underscore uses ERB-style template delimiters, change the
            // following template settings to use alternative delimiters.
            _.templateSettings = {
                evaluate: /<%([\s\S]+?)%>/g,
                interpolate: /<%=([\s\S]+?)%>/g,
                escape: /<%-([\s\S]+?)%>/g
            };

            // When customizing `templateSettings`, if you don't want to define an
            // interpolation, evaluation or escaping regex, we need one that is
            // guaranteed not to match.
            var noMatch = /(.)^/;

            // Certain characters need to be escaped so that they can be put into a
            // string literal.
            var escapes = {
                "'": "'",
                '\\': '\\',
                '\r': 'r',
                '\n': 'n',
                '\t': 't',
                '\u2028': 'u2028',
                '\u2029': 'u2029'
            };

            var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

            // JavaScript micro-templating, similar to John Resig's implementation.
            // Underscore templating handles arbitrary delimiters, preserves whitespace,
            // and correctly escapes quotes within interpolated code.
            _.template = function(text, data, settings) {
                var render;
                settings = _.defaults({}, settings, _.templateSettings);

                // Combine delimiters into one regular expression via alternation.
                var matcher = new RegExp([
                    (settings.escape || noMatch)
                    .source,
                    (settings.interpolate || noMatch)
                    .source,
                    (settings.evaluate || noMatch)
                    .source
    ].join('|') + '|$', 'g');

                // Compile the template source, escaping string literals appropriately.
                var index = 0;
                var source = "__p+='";
                text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
                    source += text.slice(index, offset)
                        .replace(escaper, function(match) {
                            return '\\' + escapes[match];
                        });

                    if (escape) {
                        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
                    }
                    if (interpolate) {
                        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
                    }
                    if (evaluate) {
                        source += "';\n" + evaluate + "\n__p+='";
                    }
                    index = offset + match.length;
                    return match;
                });
                source += "';\n";

                // If a variable is not specified, place data values in local scope.
                if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

                source = "var __t,__p='',__j=Array.prototype.join," +
                    "print=function(){__p+=__j.call(arguments,'');};\n" +
                    source + "return __p;\n";

                try {
                    render = new Function(settings.variable || 'obj', '_', source);
                } catch (e) {
                    e.source = source;
                    throw e;
                }

                if (data) return render(data, _);
                var template = function(data) {
                    return render.call(this, data, _);
                };

                // Provide the compiled function source as a convenience for precompilation.
                template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

                return template;
            };

            // Add a "chain" function, which will delegate to the wrapper.
            _.chain = function(obj) {
                return _(obj)
                    .chain();
            };

            // OOP
            // ---------------
            // If Underscore is called as a function, it returns a wrapped object that
            // can be used OO-style. This wrapper holds altered versions of all the
            // underscore functions. Wrapped objects may be chained.

            // Helper function to continue chaining intermediate results.
            var result = function(obj) {
                return this._chain ? _(obj)
                    .chain() : obj;
            };

            // Add all of the Underscore functions to the wrapper object.
            _.mixin(_);

            // Add all mutator Array functions to the wrapper.
            each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
                var method = ArrayProto[name];
                _.prototype[name] = function() {
                    var obj = this._wrapped;
                    method.apply(obj, arguments);
                    if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
                    return result.call(this, obj);
                };
            });

            // Add all accessor Array functions to the wrapper.
            each(['concat', 'join', 'slice'], function(name) {
                var method = ArrayProto[name];
                _.prototype[name] = function() {
                    return result.call(this, method.apply(this._wrapped, arguments));
                };
            });

            _.extend(_.prototype, {

                // Start chaining a wrapped Underscore object.
                chain: function() {
                    this._chain = true;
                    return this;
                },

                // Extracts the result from a wrapped and chained object.
                value: function() {
                    return this._wrapped;
                }

            });

            // AMD registration happens at the end for compatibility with AMD loaders
            // that may not enforce next-turn semantics on modules. Even though general
            // practice for AMD registration is to be anonymous, underscore registers
            // as a named module because, like jQuery, it is a base library that is
            // popular enough to be bundled in a third party lib, but not be part of
            // an AMD load request. Those cases could generate an error when an
            // anonymous define() is called outside of a loader request.
            if (typeof define === 'function' && define.amd) {
                define('underscore', [], function() {
                    return _;
                });
            }
        })
        .call(this);

}, {}]
}, {}, [4]);
