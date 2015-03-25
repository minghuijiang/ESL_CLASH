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
	// event handling, dispatch squirt event to different handler.
    1: [function(require, module, exports) {
        var evt = require('./evt');
		
        evt.on(window, 'message', function(e) {
            var data = e.data;
            var event = data.event;
            if (event === undefined) return;
            delete data.event;
            if (event.match(/squirt\./)) evt.dispatch(event, data);
        });

}, {
        "./evt": 3
    }],
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
                var container = dom.makeEl('div', {
                    style: "visibility: hidden"
                }, document.body);
                container.innerHTML = html;
				console.log('html: '+html);
                var children = container.children;
                container.remove();
                return children.length > 1 ? js.array(children) : children[0];
            },

            draggable: function(el, constraints) {
                var moveHandler, elStartCoord, mouseStartCoord, removeHandlers = [];
                el.style.position = 'absolute';

                function constrain(val, bounds) {
                    return Math.max(bounds.min, Math.min(bounds.max, val));
                }

                function x(val) {
                    el.style.left = constrain(val, constraints.x) + 'px'
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
                };

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
                };
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
                el = dom._elFromElOrSelector(el);
                el.style.display = 'block';
            },

            hide: function(el) {
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
        }

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
                })
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
                }
                remover = evt.on.call(null, bus, evts, newCallback, true);
            },

            dispatch: function(evtStr, attrs, dispatcher) {
                var e = new Event(evtStr);

                for (var k in attrs) {
                    if (!attrs.hasOwnProperty(k)) continue
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
        }

        module.exports = evt;
}, {
        "./js": 5,
        "underscore": 13
    }],
    4: [function(require, module, exports) {
        var _ = require('underscore'),
            jtf = require('./just-the-facts'),
            dom = require('./dom'),
            evt = require('./evt'),
            fs = require('fs'),
            loading = require('./loading'),
            js = require('./js');

        var initialized = false; // used in the re-install flow
        var sq = window.sq;
        sq.innerFrame = null;
        sq.pageScriptVersion = '0.3.0';


        ! function initSquirt() {

            // reinstall flow
           // if (!upToDate()) return reinstall();//mark


            // after reinstall, if the user clicks the new bookmarklet without refreshing...
            var reinstallDialog = dom.qs('.sq-reinstall-wrapper');
            reinstallDialog && reinstallDialog.remove();

            // loading view
            loading.show();
            sq.pageContent = jtf.grabArticleText();

            dom.injectStylesheet('/frame.outer.css');

            // inject reader iframe
           

            var iframeSrc = 
                '/views/iframe.html';

            sq.innerFrame = createIframe(iframeSrc, _.compose(
                loading.hide,
                setText));

            // events
            require('./cross-frame-events');
            sq.context = 'outer';
            evt.on('squirt.play', blurPage);
            evt.on('squirt.pause', unblurPage);
            evt.on('squirt.redirect', function(e) {
                window.location.href = e.href;
            });
            evt.on('squirt.close', function() {
                sq.innerFrame.classList.add('closed');
                sq.innerFrame.contentWindow.blur();
                window.focus()
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

        }(initialized = true);

        function upToDate() {
            return sq && sq.bookmarkletVersion && sq.bookmarkletVersion.localeCompare(sq.pageScriptVersion) == 0;
        }

        function createIframe(src, onLoad) {
            var frame = dom.makeEl('iframe', {
                src: src,
				style: "top:20%",
                class: 'sq-frame'
            }, document.body);
            frame.style.border = 0
            frame.addEventListener('load', function() {
                onLoad && onLoad();
                frame.focus();
                dom.transition(document.body)
            });
            return frame;
        };

        function blurPage() {
            js.array(document.body.children)
                .filter(function(node) {
                    return !node.classList.contains('sq-frame')
                })
                .map(dom.addClass('sq-blur'));
        };

        function unblurPage() {
            js.array(document.body.children)
                .map(function(node) {
                    node.classList.remove('sq-blur');
                });
        }
		
		
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
										case '"':
											if(openSingle){ // close single, attach to right
												str+=w;
											}else{  // open single, a
												str+=" "+w;
												attachRight = true;
											}
											openSingle=!openSingle;
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
							if(token['slashed']=='true'){
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
				console.log(text+" "+str);
				return text+" "+str;
		}
		

        function setText() {
            var text = getTextFromJson();//sq.demoText || dom.getSelectedText() || sq.pageContent;
            evt.dispatch('squirt.setText', {
                text: text
            });
        }
		
		
		

        sq.again = function(didWaitForBlur) {
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
        "./cross-frame-events": 1,
        "./dom": 2,
        "./evt": 3,
        "./js": 5,
        "./just-the-facts": 6,
        "./loading": 8,
        "fs": 9,
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
                };
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
                    var v = obj[key]
                    givesTo.map(function(f) {
                        f(v);
                    });
                    return v;
                }
                getter.giveTo = function(f) {
                    givesTo.push(f);
                    return getter;
                }
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
    6: [function(require, module, exports) {
        // Forked/hacked for Squirt: github.com/cameron/squirt

        /* Original Source:  http://code.google.com/p/arc90labs-readability
         * Copyright (c) 2010 Arc90 Inc
         * Readability is licensed under the Apache License, Version 2.0.
         **/

        var dbg = function() {};

        var readability = {
            flags: 0x1 | 0x2 | 0x4,
            /* Start with all flags set. */

            /* constants */
            FLAG_STRIP_UNLIKELYS: 0x1,
            FLAG_WEIGHT_CLASSES: 0x2,
            FLAG_CLEAN_CONDITIONALLY: 0x4,

            regexps: {
                unlikelyCandidates: /ad|aside|combx|comment|community|disqus|extra|foot|header|menu|remark|rss|shoutbox|sidebar|sponsor|ad-break|agegate|pagination|pager|popup|tweet|twitter|figure|figcaption/i,
                okMaybeItsACandidate: /and|article|body|column|main|shadow/i,
                positive: /article|body|content|entry|hentry|main|page|pagination|post|text|blog|story/i,
                negative: /combx|comment|com-|contact|foot|footer|footnote|masthead|media|meta|outbrain|promo|related|scroll|shoutbox|sidebar|sponsor|shopping|tags|tool|widget/i,
                extraneous: /print|archive|comment|discuss|e[\-]?mail|share|reply|all|login|sign|single/i,
                divToPElements: /<(a|blockquote|dl|div|img|ol|p|pre|table|ul)/i,
                replaceBrs: /(<br[^>]*>[ \n\r\t]*){2,}/gi,
                replaceFonts: /<(\/?)font[^>]*>/gi,
                trim: /^\s+|\s+$/g,
                normalize: /\s{2,}/g,
                killBreaks: /(<br\s*\/?>(\s|&nbsp;?)*){1,}/g,
                videos: /http:\/\/(www\.)?(youtube|vimeo)\.com/i,
                skipFootnoteLink: /^\s*(\[?[a-z0-9]{1,2}\]?|^|edit|citation needed)\s*$/i,
                nextLink: /(next|weiter|continue|>([^\|]|$)|»([^\|]|$))/i, // Match: next, continue, >, >>, » but not >|, »| as those usually mean last.
                prevLink: /(prev|earl|old|new|<|«)/i
            },

            // Get the article title as an H1.
            getArticleTitle: function() {
                var curTitle = "",
                    origTitle = "";

                try {
                    curTitle = origTitle = document.title;

                    if (typeof curTitle !== "string") { /* If they had an element with id "title" in their HTML */
                        curTitle = origTitle = document.getElementsByTagName('title')[0].textContent;
                    }
                } catch (e) {}

                if (curTitle.match(/ [\|\-] /)) {
                    curTitle = origTitle.replace(/(.*)[\|\-] .*/gi, '$1');

                    if (curTitle.split(' ')
                        .length < 3) {
                        curTitle = origTitle.replace(/[^\|\-]*[\|\-](.*)/gi, '$1');
                    }
                } else if (curTitle.indexOf(': ') !== -1) {
                    curTitle = origTitle.replace(/.*:(.*)/gi, '$1');

                    if (curTitle.split(' ')
                        .length < 3) {
                        curTitle = origTitle.replace(/[^:]*[:](.*)/gi, '$1');
                    }
                } else if (curTitle.length > 150 || curTitle.length < 15) {
                    var hOnes = document.getElementsByTagName('h1');
                    if (hOnes.length === 1) {
                        curTitle = hOnes[0].textContent;
                    }
                }

                curTitle = curTitle.replace(readability.regexps.trim, "");

                if (curTitle.split(' ')
                    .length <= 4) {
                    curTitle = origTitle;
                }

                var articleTitle = document.createElement("H1");
                articleTitle.innerHTML = curTitle;

                return articleTitle;
            },

            prepArticle: function(articleContent) {
                readability.killBreaks(articleContent);

                /* Clean out junk from the article content */
                readability.cleanConditionally(articleContent, "form");
                readability.clean(articleContent, "object");
                readability.clean(articleContent, "h1");

                /**
                 * If there is only one h2, they are probably using it
                 * as a header and not a subheader, so remove it since we already have a header.
                 ***/
                if (articleContent.getElementsByTagName('h2')
                    .length === 1) {
                    readability.clean(articleContent, "h2");
                }
                readability.clean(articleContent, "iframe");

                readability.cleanHeaders(articleContent);

                /* Do these last as the previous stuff may have removed junk that will affect these */
                readability.cleanConditionally(articleContent, "table");
                readability.cleanConditionally(articleContent, "ul");
                readability.cleanConditionally(articleContent, "div");

                /* Remove extra paragraphs */
                var articleParagraphs = articleContent.getElementsByTagName('p');
                for (var i = articleParagraphs.length - 1; i >= 0; i -= 1) {
                    var imgCount = articleParagraphs[i].getElementsByTagName('img')
                        .length;
                    var embedCount = articleParagraphs[i].getElementsByTagName('embed')
                        .length;
                    var objectCount = articleParagraphs[i].getElementsByTagName('object')
                        .length;

                    if (imgCount === 0 && embedCount === 0 && objectCount === 0 && articleParagraphs[i].textContent === '') {
                        articleParagraphs[i].parentNode.removeChild(articleParagraphs[i]);
                    }
                }

                try {
                    articleContent.innerHTML = articleContent.innerHTML.replace(/<br[^>]*>\s*<p/gi, '<p');
                } catch (e) {
                    dbg("Cleaning innerHTML of breaks failed. This is an IE strict-block-elements bug. Ignoring.: " + e);
                }
            },

            /**
             * Initialize a node with the readability object. Also checks the
             * className/id for special names to add to its score.
             *
             * @param Element
             * @return void
             **/
            initializeNode: function(node) {
                node.readability = {
                    "contentScore": 0
                };

                switch (node.tagName) {
                    case 'DIV':
                        node.readability.contentScore += 5;
                        break;

                    case 'PRE':
                    case 'TD':
                    case 'BLOCKQUOTE':
                        node.readability.contentScore += 3;
                        break;

                    case 'ADDRESS':
                    case 'OL':
                    case 'UL':
                    case 'DL':
                    case 'DD':
                    case 'DT':
                    case 'LI':
                    case 'FORM':
                        node.readability.contentScore -= 3;
                        break;

                    case 'H1':
                    case 'H2':
                    case 'H3':
                    case 'H4':
                    case 'H5':
                    case 'H6':
                    case 'TH':
                        node.readability.contentScore -= 5;
                        break;
                }

                node.readability.contentScore += readability.getClassWeight(node);
            },

            candidateFetcherForDomain: {
                'getpocket.com': function() {
                    return document.querySelector('.text_body p');
                },
                'medium.com': function() {
                    return document.querySelector('.post-content');
                }
            },

            getBestTextNode: function() {

                var stripUnlikelyCandidates = readability.flagIsActive(readability.FLAG_STRIP_UNLIKELYS);

                var page = document.body.cloneNode(true);

                var pageCacheHtml = page.innerHTML;

                var allElements = page.getElementsByTagName('*');

                /**
                 * First, node prepping. Trash nodes that look cruddy (like ones with the
                 * class name "comment", etc), and turn divs into P tags where they have
                 * been used inappropriately (as in, where they contain no other block
                 * level elements.)
                 *
                 * Note: Assignment from index for performance. See
                 * http://www.peachpit.com/articles/article.aspx?p=31567&seqNum=5
                 * TODO: Shouldn't this be a reverse traversal?
                 **/
                var node = null;
                var nodesToScore = [];
                var nodeIndex;
                var remove = function(node) {
                    node.remove();
                    nodeIndex--;
                }
                for (nodeIndex = 0;
                    (node = allElements[nodeIndex]); nodeIndex += 1) {
                    if (node.tagName == 'svg') {
                        remove(node);
                        continue;
                    }
                    if (stripUnlikelyCandidates) {
                        var unlikelyMatchString = node.className + node.id + node.tagName;
                        if (unlikelyMatchString.search(readability.regexps.unlikelyCandidates) !== -1 &&
                            unlikelyMatchString.search(readability.regexps.okMaybeItsACandidate) === -1 &&
                            node.tagName !== "BODY") {
                            remove(node);
                            continue;
                        }
                    }

                    if (node.tagName === "P" || node.tagName === "TD" ||
                        node.tagName === "PRE") {
                        nodesToScore[nodesToScore.length] = node;
                    }

                    /* Turn all divs that don't have children block level elements into p's */
                    if (node.tagName === "DIV") {
                        if (node.innerHTML.search(readability.regexps.divToPElements) === -1) {
                            var newNode = document.createElement('p');
                            try {
                                newNode.innerHTML = node.innerHTML;
                                node.parentNode.replaceChild(newNode, node);
                                nodeIndex -= 1;

                                nodesToScore[nodesToScore.length] = node;
                            } catch (e) {
                                dbg("Could not alter div to p, probably an IE restriction, reverting back to div.: " + e);
                            }
                        } else {
                            /* EXPERIMENTAL */
                            for (var i = 0, il = node.childNodes.length; i < il; i += 1) {
                                var childNode = node.childNodes[i];
                                if (childNode.nodeType === 3) { // Node.TEXT_NODE
                                    var p = document.createElement('p');
                                    p.innerHTML = childNode.nodeValue;
                                    p.style.display = 'inline';
                                    p.className = 'readability-styled';
                                    childNode.parentNode.replaceChild(p, childNode);
                                }
                            }
                        }
                    }
                }

                /**
                 * Loop through all paragraphs, and assign a score to them based on how
                 * content-y they look.
                 *
                 * Then add their score to their parent node.
                 *
                 * A score is determined by things like number of commas, class names,
                 * etc. Maybe eventually link density.
                 **/
                var candidates = [];
                for (var pt = 0; pt < nodesToScore.length; pt += 1) {
                    var parentNode = nodesToScore[pt].parentNode;
                    var grandParentNode = parentNode ? parentNode.parentNode : null;
                    var innerText = nodesToScore[pt].textContent;

                    if (!parentNode || typeof(parentNode.tagName) === 'undefined') {
                        continue;
                    }

                    /* If this paragraph is less than 25 characters, don't even count it. */
                    if (innerText.length < 25) continue

                    /* Initialize readability data for the parent. */
                    if (typeof parentNode.readability === 'undefined') {
                        readability.initializeNode(parentNode);
                        candidates.push(parentNode);
                    }

                    /* Initialize readability data for the grandparent. */
                    if (grandParentNode && typeof(grandParentNode.readability) === 'undefined' && typeof(grandParentNode.tagName) !== 'undefined') {
                        readability.initializeNode(grandParentNode);
                        candidates.push(grandParentNode);
                    }

                    var contentScore = 0;

                    /* Add a point for the paragraph itself as a base. */
                    contentScore += 1;

                    /* Add points for any commas within this paragraph */
                    contentScore += innerText.split(',')
                        .length;

                    /* For every 100 characters in this paragraph, add another point. Up to 3 points. */
                    contentScore += Math.min(Math.floor(innerText.length / 100), 3);

                    /* Add the score to the parent. The grandparent gets half. */
                    parentNode.readability.contentScore += contentScore;

                    if (grandParentNode) {
                        grandParentNode.readability.contentScore += contentScore / 2;
                    }
                }

                /**
                 * After we've calculated scores, loop through all of the possible candidate nodes we found
                 * and find the one with the highest score.
                 **/
                var topCandidate = null;
                for (var c = 0, cl = candidates.length; c < cl; c += 1) {
                    /**
                     * Scale the final candidates score based on link density. Good content should have a
                     * relatively small link density (5% or less) and be mostly unaffected by this operation.
                     **/
                    candidates[c].readability.contentScore = candidates[c].readability.contentScore * (1 - readability.getLinkDensity(candidates[c]));

                    dbg('Candidate: ' + candidates[c] + " (" + candidates[c].className + ":" + candidates[c].id + ") with score " + candidates[c].readability.contentScore);

                    if (!topCandidate || candidates[c].readability.contentScore > topCandidate.readability.contentScore) {
                        topCandidate = candidates[c];
                    }
                }

                /**
                 * If we still have no top candidate, just use the body as a last resort.
                 * We also have to copy the body node so it is something we can modify.
                 **/
                if (topCandidate === null || topCandidate.tagName === "BODY") {
                    topCandidate = document.createElement("DIV");
                    topCandidate.innerHTML = page.innerHTML;
                    page.innerHTML = "";
                    page.appendChild(topCandidate);
                    readability.initializeNode(topCandidate);
                }
                return topCandidate;
            },

            grabArticle: function() {
                var bestTextNode, getter = readability.candidateFetcherForDomain[window.location.host];
                if (getter && (bestTextNode = getter())) {
                    readability.initializeNode(bestTextNode);
                } else {
                    bestTextNode = readability.getBestTextNode();
                }
                return readability.getContentViaCandidate(bestTextNode);
            },

            getContentViaCandidate: function(candidate) {

                /**
                 * Now that we have the top candidate, look through its siblings for content that might also be related.
                 * Things like preambles, content split by ads that we removed, etc.
                 **/
                var articleContent = document.createElement("DIV");
                var siblingScoreThreshold = Math.max(10, candidate.readability.contentScore * 0.2);
                var siblingNodes = candidate.parentNode.childNodes;


                for (var s = 0, sl = siblingNodes.length; s < sl; s += 1) {
                    var siblingNode = siblingNodes[s];
                    var append = false;

                    /**
                     * Fix for odd IE7 Crash where siblingNode does not exist even though this should be a live nodeList.
                     * Example of error visible here: http://www.esquire.com/features/honesty0707
                     **/
                    if (!siblingNode) {
                        continue;
                    }

                    dbg("Looking at sibling node: " + siblingNode + " (" + siblingNode.className + ":" + siblingNode.id + ")" + ((typeof siblingNode.readability !== 'undefined') ? (" with score " + siblingNode.readability.contentScore) : ''));
                    dbg("Sibling has score " + (siblingNode.readability ? siblingNode.readability.contentScore : 'Unknown'));

                    if (siblingNode === candidate) {
                        append = true;
                    }

                    var contentBonus = 0;
                    /* Give a bonus if sibling nodes and top candidates have the example same classname */
                    if (siblingNode.className === candidate.className && candidate.className !== "") {
                        contentBonus += candidate.readability.contentScore * 0.2;
                    }

                    if (typeof siblingNode.readability !== 'undefined' && (siblingNode.readability.contentScore + contentBonus) >= siblingScoreThreshold) {
                        append = true;
                    }

                    if (siblingNode.nodeName === "P") {
                        var linkDensity = readability.getLinkDensity(siblingNode);
                        var nodeContent = siblingNode.textContent;
                        var nodeLength = nodeContent.length;

                        if (nodeLength > 80 && linkDensity < 0.25) {
                            append = true;
                        } else if (nodeLength < 80 && linkDensity === 0 && nodeContent.search(/\.( |$)/) !== -1) {
                            append = true;
                        }
                    }

                    if (append) {
                        dbg("Appending node: " + siblingNode);

                        var nodeToAppend = null;
                        if (siblingNode.nodeName !== "DIV" && siblingNode.nodeName !== "P") {
                            /* We have a node that isn't a common block level element, like a form or td tag. Turn it into a div so it doesn't get filtered out later by accident. */

                            dbg("Altering siblingNode of " + siblingNode.nodeName + ' to div.');
                            nodeToAppend = document.createElement("DIV");
                            try {
                                nodeToAppend.id = siblingNode.id;
                                nodeToAppend.innerHTML = siblingNode.innerHTML;
                            } catch (er) {
                                dbg("Could not alter siblingNode to div, probably an IE restriction, reverting back to original.");
                                nodeToAppend = siblingNode;
                                s -= 1;
                                sl -= 1;
                            }
                        } else {
                            nodeToAppend = siblingNode;
                            s -= 1;
                            sl -= 1;
                        }

                        /* To ensure a node does not interfere with readability styles, remove its classnames */
                        nodeToAppend.className = "";

                        /* Append sibling and subtract from our list because it removes the node when you append to another node */
                        articleContent.appendChild(nodeToAppend);
                    }
                }

                /**
                 * So we have all of the content that we need. Now we clean it up for presentation.
                 **/
                readability.prepArticle(articleContent);

                if (readability.curPageNum === 1) {
                    articleContent.innerHTML = '<div id="readability-page-1" class="page">' + articleContent.innerHTML + '</div>';
                }

                /**
                 * Now that we've gone through the full algorithm, check to see if we got
                 * any meaningful content.
                 *
                 * If we didn't, we may need to re-run grabArticle with different flags
                 * set. This gives us a higher likelihood of finding the content, and
                 * the sieve approach gives us a higher likelihood of finding the
                 * -right- content.
                 **/
                if (articleContent.textContent.length < 250) {

                    if (readability.flagIsActive(readability.FLAG_STRIP_UNLIKELYS)) {
                        readability.removeFlag(readability.FLAG_STRIP_UNLIKELYS);
                        return readability.grabArticle();
                    } else if (readability.flagIsActive(readability.FLAG_WEIGHT_CLASSES)) {
                        readability.removeFlag(readability.FLAG_WEIGHT_CLASSES);
                        return readability.grabArticle();
                    } else if (readability.flagIsActive(readability.FLAG_CLEAN_CONDITIONALLY)) {
                        readability.removeFlag(readability.FLAG_CLEAN_CONDITIONALLY);
                        return readability.grabArticle();
                    } else {
                        return null;
                    }
                }

                return articleContent;
            },

            // with line breaks between paragraphs
            // --cam
            grabArticleText: function extract(node) {
                node = node || readability.grabArticle();
                if (!node) return '';
                var child, nodeName, text = '';
                for (var childIdx = 0; childIdx < node.childNodes.length; childIdx++) {
                    child = node.childNodes[childIdx];
                    nodeName = child.nodeName.toLowerCase();
                    if (nodeName == "#text") {
                        text += child.nodeValue.replace(/^\n+/, "")
                            .replace(/\n+$/, "");
                    } else {
                        text += extract(child);
                    }
                };
                nodeName = node.nodeName.toLowerCase();
                if (nodeName.match(/p|div|blockquote|h[1-6]|li/)) {
                    if (text[text.length - 1] != '\n') text += '\n'
                    text += ' ';
                }
                return text;
            },

            /**
             * Get the number of times a string s appears in the node e.
             *
             * @param Element
             * @param string - what to split on. Default is ","
             * @return number (integer)
             **/
            getCharCount: function(e, s) {
                s = s || ",";
                return e.textContent.split(s)
                    .length - 1;
            },


            /**
             * Get the density of links as a percentage of the content
             * This is the amount of text that is inside a link divided by the total text in the node.
             *
             * @param Element
             * @return number (float)
             **/
            getLinkDensity: function(e) {
                var links = e.getElementsByTagName("a");
                var textLength = e.textContent.length;
                var linkLength = 0;
                for (var i = 0, il = links.length; i < il; i += 1) {
                    linkLength += links[i].textContent.length;
                }

                return linkLength / textLength;
            },

            getClassWeight: function(e) {
                if (!readability.flagIsActive(readability.FLAG_WEIGHT_CLASSES)) {
                    return 0;
                }

                var weight = 0;

                /* Look for a special classname */
                if (typeof(e.className) === 'string' && e.className !== '') {
                    if (e.className.search(readability.regexps.negative) !== -1) {
                        weight -= 25;
                    }

                    if (e.className.search(readability.regexps.positive) !== -1) {
                        weight += 25;
                    }
                }

                /* Look for a special ID */
                if (typeof(e.id) === 'string' && e.id !== '') {
                    if (e.id.search(readability.regexps.negative) !== -1)
                        weight -= 25;

                    if (e.id.search(readability.regexps.positive) !== -1)
                        weight += 25;
                }
                return weight;
            },

            /**
             * Clean an element of all tags of type "tag" if they look fishy.
             * "Fishy" is an algorithm based on content length, classnames,
             * link density, number of images & embeds, etc.
             *
             * @return void
             **/
            cleanConditionally: function(e, tag) {

                if (!readability.flagIsActive(readability.FLAG_CLEAN_CONDITIONALLY)) {
                    return;
                }

                var tagsList = e.getElementsByTagName(tag);
                var curTagsLength = tagsList.length;

                /**
                 * Gather counts for other typical elements embedded within.
                 * Traverse backwards so we can remove nodes at the same time
                 *  without effecting the traversal.
                 *
                 * TODO: Consider taking into account original contentScore here.
                 **/
                for (var i = curTagsLength - 1; i >= 0; i -= 1) {
                    var weight = readability.getClassWeight(tagsList[i]);
                    var contentScore = (typeof tagsList[i].readability !== 'undefined') ?
                        tagsList[i].readability.contentScore : 0;

                    dbg("Cleaning Conditionally " + tagsList[i] +
                        " (" + tagsList[i].className + ":" + tagsList[i].id + ")" +
                        ((typeof tagsList[i].readability !== 'undefined') ?
                            (" with score " + tagsList[i].readability.contentScore) : ''));

                    if (weight + contentScore < 0) {
                        tagsList[i].parentNode.removeChild(tagsList[i]);
                    } else if (readability.getCharCount(tagsList[i], ',') < 10) {
                        /**
                         * If there are not very many commas, and the number of
                         * non-paragraph elements is more than paragraphs or other
                         *  ominous signs, remove the element.
                         **/
                        var p = tagsList[i].getElementsByTagName("p")
                            .length;
                        var img = tagsList[i].getElementsByTagName("img")
                            .length;
                        var li = tagsList[i].getElementsByTagName("li")
                            .length - 100;
                        var input = tagsList[i].getElementsByTagName("input")
                            .length;

                        var embedCount = 0;
                        var embeds = tagsList[i].getElementsByTagName("embed");
                        for (var ei = 0, il = embeds.length; ei < il; ei += 1) {
                            if (embeds[ei].src.search(readability.regexps.videos) === -1) {
                                embedCount += 1;
                            }
                        }

                        var linkDensity = readability.getLinkDensity(tagsList[i]);
                        var contentLength = tagsList[i].textContent.length;
                        var toRemove = false;

                        if (img > p) {
                            toRemove = true;
                        } else if (li > p && tag !== "ul" && tag !== "ol") {
                            toRemove = true;
                        } else if (input > Math.floor(p / 3)) {
                            toRemove = true;
                        } else if (contentLength < 25 && (img === 0 || img > 2)) {
                            toRemove = true;
                        } else if (weight < 25 && linkDensity > 0.2) {
                            toRemove = true;
                        } else if (weight >= 25 && linkDensity > 0.5) {
                            toRemove = true;
                        } else if ((embedCount === 1 && contentLength < 75) || embedCount > 1) {
                            toRemove = true;
                        }

                        if (toRemove) {
                            tagsList[i].parentNode.removeChild(tagsList[i]);
                        }
                    }
                }
            },

            // Remove extraneous break tags from a node.
            killBreaks: function(e) {
                try {
                    e.innerHTML = e.innerHTML
                        .replace(readability.regexps.killBreaks, '<br />');
                } catch (eBreaks) {
                    dbg("KillBreaks failed - this is an IE bug. Ignoring.: " + eBreaks);
                }
            },

            // Clean a node of all elements of type "tag".
            // (Unless it's a youtube/vimeo video. People love movies.)
            clean: function(e, tag) {
                var targetList = e.getElementsByTagName(tag);
                var isEmbed = (tag === 'object' || tag === 'embed');

                for (var y = targetList.length - 1; y >= 0; y -= 1) {
                    /* Allow youtube and vimeo videos through as people usually want to see those. */
                    if (isEmbed) {
                        var attributeValues = "";
                        for (var i = 0, il = targetList[y].attributes.length; i < il; i += 1) {
                            attributeValues += targetList[y].attributes[i].value + '|';
                        }

                        /* First, check the elements attributes to see if any of
                         *                 * them contain youtube or vimeo */
                        if (attributeValues.search(readability.regexps.videos) !== -1) {
                            continue;
                        }

                        /* Then check the elements inside this element for the same. */
                        if (targetList[y].innerHTML.search(readability.regexps.videos) !== -1) continue;
                    }

                    targetList[y].parentNode.removeChild(targetList[y]);
                }
            },

            /**
             * Clean out spurious headers from an Element. Checks things like classnames
             * and link density.
             *
             * @param Element
             * @return void
             **/
            cleanHeaders: function(e) {
                for (var headerIndex = 1; headerIndex < 3; headerIndex += 1) {
                    var headers = e.getElementsByTagName('h' + headerIndex);
                    for (var i = headers.length - 1; i >= 0; i -= 1) {
                        if (readability.getClassWeight(headers[i]) < 0 ||
                            readability.getLinkDensity(headers[i]) > 0.33) {
                            headers[i].parentNode.removeChild(headers[i]);
                        }
                    }
                }
            },

            flagIsActive: function(flag) {
                return (readability.flags & flag) > 0;
            },

            removeFlag: function(flag) {
                readability.flags = readability.flags & ~flag;
            }
        };

        module.exports = readability;

}, {}],
    7: [function(require, module, exports) {

}, {}],
    8: [function(require, module, exports) {
        (function(Buffer) {
            var dom = require('./dom'),
                evt = require('./evt'),
                fs = require('fs');

            var loading = {
                wrapperEl: null,

                show: function() {
                    var loadingHtml = Buffer("PGRpdiBjbGFzcz0nbG9hZGluZy13cmFwcGVyJz4KICA8c3R5bGU+CiAgICAuc3EtbG9hZGluZyB7CiAgICAgIHdpZHRoOiAxMDAlOwogICAgICBoZWlnaHQ6IDEwMCU7CiAgICAgIHBvc2l0aW9uOiBmaXhlZDsKICAgICAgbGVmdDogMDsKICAgICAgdG9wOiAwOwogICAgICBvcGFjaXR5OiAwOwoKICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAxLjJzIGVhc2UtaW4tb3V0IDA7CiAgICAgIC1tb3otdHJhbnNpdGlvbjogb3BhY2l0eSAxLjJzIGVhc2UtaW4tb3V0IDA7CiAgICAgIC13ZWJraXQtdHJhbnNpdGlvbjogb3BhY2l0eSAxLjJzIGVhc2UtaW4tb3V0IDA7CiAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjA5LCAyMDksIDIwOSwgMC4zKTsKICAgIH0KCiAgICAudmlzaWJsZSB7CiAgICAgIG9wYWNpdHk6IDE7CiAgICB9CgogIDwvc3R5bGU+CiAgPGRpdiBjbGFzcz0ic3EtbG9hZGluZyI+CiAgPC9kaXY+CjwvZGl2Pgo=", "base64"
					//"PGRpdiBjbGFzcz0nbG9hZGluZy13cmFwcGVyJyBzdHlsZT0ncG9zaXRpb246IHJlbGF0aXZlO3RvcDo1MCUnPg0KICA8c3R5bGU+DQogICAgLnNxLWxvYWRpbmcgew0KICAgICAgd2lkdGg6IDEwMCU7DQogICAgICBoZWlnaHQ6IDEwMCU7DQogICAgICBwb3NpdGlvbjogZml4ZWQ7DQogICAgICBsZWZ0OiAwOw0KICAgICAgdG9wOiAwOw0KICAgICAgb3BhY2l0eTogMDsNCg0KICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAxLjJzIGVhc2UtaW4tb3V0IDA7DQogICAgICAtbW96LXRyYW5zaXRpb246IG9wYWNpdHkgMS4ycyBlYXNlLWluLW91dCAwOw0KICAgICAgLXdlYmtpdC10cmFuc2l0aW9uOiBvcGFjaXR5IDEuMnMgZWFzZS1pbi1vdXQgMDsNCiAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjA5LCAyMDksIDIwOSwgMC4zKTsNCiAgICB9DQoNCiAgICAudmlzaWJsZSB7DQogICAgICBvcGFjaXR5OiAxOw0KICAgIH0NCg0KICA8L3N0eWxlPg0KICA8ZGl2IGNsYXNzPSJzcS1sb2FkaW5nIj4NCiAgPC9kaXY+DQo8L2Rpdj4=","base64"
					
					
					
					);
                    loading.wrapperEl = dom.compileHtml(loadingHtml);
				//	;position: relative;top: 50%;transform: translateY(-50%)
					console.log('wrapper: '+dom.compileHtml(loadingHtml));
                    document.body.appendChild(loading.wrapperEl);
                    dom.addClass(dom.qs('.sq-loading'), 'visible');
                },

                hide: function() {
                    var el = dom.qs('.sq-loading');
                    el.classList.remove('visible');
                    evt.once(el, dom.transitionEndEvents, function() {
                        loading.wrapperEl.remove();
                    });
                }
            };

            module.exports = loading;
        })
        .call(this, require("buffer")
            .Buffer)
}, {
        "./dom": 2,
        "./evt": 3,
        "buffer": 10,
        "fs": 9
    }],
    9: [function(require, module, exports) {

}, {}],
    10: [function(require, module, exports) {
        /**
         * The buffer module from node.js, for the browser.
         *
         * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
         * License:  MIT
         *
         * `npm install buffer`
         */

        var base64 = require('base64-js')
        var ieee754 = require('ieee754')

        exports.Buffer = Buffer
        exports.SlowBuffer = Buffer
        exports.INSPECT_MAX_BYTES = 50
        Buffer.poolSize = 8192

        /**
         * If `Buffer._useTypedArrays`:
         *   === true    Use Uint8Array implementation (fastest)
         *   === false   Use Object implementation (compatible down to IE6)
         */
        Buffer._useTypedArrays = (function() {
            // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
            // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
            // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
            // because we need to be able to add all the node Buffer API methods. This is an issue
            // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
            try {
                var buf = new ArrayBuffer(0)
                var arr = new Uint8Array(buf)
                arr.foo = function() {
                    return 42
                }
                return 42 === arr.foo() &&
                    typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
            } catch (e) {
                return false
            }
        })()

        /**
         * Class: Buffer
         * =============
         *
         * The Buffer constructor returns instances of `Uint8Array` that are augmented
         * with function properties for all the node `Buffer` API functions. We use
         * `Uint8Array` so that square bracket notation works as expected -- it returns
         * a single octet.
         *
         * By augmenting the instances, we can avoid modifying the `Uint8Array`
         * prototype.
         */
        function Buffer(subject, encoding, noZero) {
            if (!(this instanceof Buffer))
                return new Buffer(subject, encoding, noZero)

            var type = typeof subject

            // Workaround: node's base64 implementation allows for non-padded strings
            // while base64-js does not.
            if (encoding === 'base64' && type === 'string') {
                subject = stringtrim(subject)
                while (subject.length % 4 !== 0) {
                    subject = subject + '='
                }
            }

            // Find the length
            var length
            if (type === 'number')
                length = coerce(subject)
            else if (type === 'string')
                length = Buffer.byteLength(subject, encoding)
            else if (type === 'object')
                length = coerce(subject.length) // assume that object is array-like
            else
                throw new Error('First argument needs to be a number, array or string.')

            var buf
            if (Buffer._useTypedArrays) {
                // Preferred: Return an augmented `Uint8Array` instance for best performance
                buf = Buffer._augment(new Uint8Array(length))
            } else {
                // Fallback: Return THIS instance of Buffer (created by `new`)
                buf = this
                buf.length = length
                buf._isBuffer = true
            }

            var i
            if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
                // Speed optimization -- use set if we're copying from a typed array
                buf._set(subject)
            } else if (isArrayish(subject)) {
                // Treat array-ish objects as a byte array
                for (i = 0; i < length; i++) {
                    if (Buffer.isBuffer(subject))
                        buf[i] = subject.readUInt8(i)
                    else
                        buf[i] = subject[i]
                }
            } else if (type === 'string') {
                buf.write(subject, 0, encoding)
            } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
                for (i = 0; i < length; i++) {
                    buf[i] = 0
                }
            }

            return buf
        }

        // STATIC METHODS
        // ==============

        Buffer.isEncoding = function(encoding) {
            switch (String(encoding)
                .toLowerCase()) {
                case 'hex':
                case 'utf8':
                case 'utf-8':
                case 'ascii':
                case 'binary':
                case 'base64':
                case 'raw':
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                    return true
                default:
                    return false
            }
        }

        Buffer.isBuffer = function(b) {
            return !!(b !== null && b !== undefined && b._isBuffer)
        }

        Buffer.byteLength = function(str, encoding) {
            var ret
            str = str + ''
            switch (encoding || 'utf8') {
                case 'hex':
                    ret = str.length / 2
                    break
                case 'utf8':
                case 'utf-8':
                    ret = utf8ToBytes(str)
                        .length
                    break
                case 'ascii':
                case 'binary':
                case 'raw':
                    ret = str.length
                    break
                case 'base64':
                    ret = base64ToBytes(str)
                        .length
                    break
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                    ret = str.length * 2
                    break
                default:
                    throw new Error('Unknown encoding')
            }
            return ret
        }

        Buffer.concat = function(list, totalLength) {
            assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
                'list should be an Array.')

            if (list.length === 0) {
                return new Buffer(0)
            } else if (list.length === 1) {
                return list[0]
            }

            var i
            if (typeof totalLength !== 'number') {
                totalLength = 0
                for (i = 0; i < list.length; i++) {
                    totalLength += list[i].length
                }
            }

            var buf = new Buffer(totalLength)
            var pos = 0
            for (i = 0; i < list.length; i++) {
                var item = list[i]
                item.copy(buf, pos)
                pos += item.length
            }
            return buf
        }

        // BUFFER INSTANCE METHODS
        // =======================

        function _hexWrite(buf, string, offset, length) {
            offset = Number(offset) || 0
            var remaining = buf.length - offset
            if (!length) {
                length = remaining
            } else {
                length = Number(length)
                if (length > remaining) {
                    length = remaining
                }
            }

            // must be an even number of digits
            var strLen = string.length
            assert(strLen % 2 === 0, 'Invalid hex string')

            if (length > strLen / 2) {
                length = strLen / 2
            }
            for (var i = 0; i < length; i++) {
                var byte = parseInt(string.substr(i * 2, 2), 16)
                assert(!isNaN(byte), 'Invalid hex string')
                buf[offset + i] = byte
            }
            Buffer._charsWritten = i * 2
            return i
        }

        function _utf8Write(buf, string, offset, length) {
            var charsWritten = Buffer._charsWritten =
                blitBuffer(utf8ToBytes(string), buf, offset, length)
            return charsWritten
        }

        function _asciiWrite(buf, string, offset, length) {
            var charsWritten = Buffer._charsWritten =
                blitBuffer(asciiToBytes(string), buf, offset, length)
            return charsWritten
        }

        function _binaryWrite(buf, string, offset, length) {
            return _asciiWrite(buf, string, offset, length)
        }

        function _base64Write(buf, string, offset, length) {
            var charsWritten = Buffer._charsWritten =
                blitBuffer(base64ToBytes(string), buf, offset, length)
            return charsWritten
        }

        function _utf16leWrite(buf, string, offset, length) {
            var charsWritten = Buffer._charsWritten =
                blitBuffer(utf16leToBytes(string), buf, offset, length)
            return charsWritten
        }

        Buffer.prototype.write = function(string, offset, length, encoding) {
            // Support both (string, offset, length, encoding)
            // and the legacy (string, encoding, offset, length)
            if (isFinite(offset)) {
                if (!isFinite(length)) {
                    encoding = length
                    length = undefined
                }
            } else { // legacy
                var swap = encoding
                encoding = offset
                offset = length
                length = swap
            }

            offset = Number(offset) || 0
            var remaining = this.length - offset
            if (!length) {
                length = remaining
            } else {
                length = Number(length)
                if (length > remaining) {
                    length = remaining
                }
            }
            encoding = String(encoding || 'utf8')
                .toLowerCase()

            var ret
            switch (encoding) {
                case 'hex':
                    ret = _hexWrite(this, string, offset, length)
                    break
                case 'utf8':
                case 'utf-8':
                    ret = _utf8Write(this, string, offset, length)
                    break
                case 'ascii':
                    ret = _asciiWrite(this, string, offset, length)
                    break
                case 'binary':
                    ret = _binaryWrite(this, string, offset, length)
                    break
                case 'base64':
                    ret = _base64Write(this, string, offset, length)
                    break
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                    ret = _utf16leWrite(this, string, offset, length)
                    break
                default:
                    throw new Error('Unknown encoding')
            }
            return ret
        }

        Buffer.prototype.toString = function(encoding, start, end) {
            var self = this

            encoding = String(encoding || 'utf8')
                .toLowerCase()
            start = Number(start) || 0
            end = (end !== undefined) ? Number(end) : end = self.length

            // Fastpath empty strings
            if (end === start)
                return ''

            var ret
            switch (encoding) {
                case 'hex':
                    ret = _hexSlice(self, start, end)
                    break
                case 'utf8':
                case 'utf-8':
                    ret = _utf8Slice(self, start, end)
                    break
                case 'ascii':
                    ret = _asciiSlice(self, start, end)
                    break
                case 'binary':
                    ret = _binarySlice(self, start, end)
                    break
                case 'base64':
                    ret = _base64Slice(self, start, end)
                    break
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                    ret = _utf16leSlice(self, start, end)
                    break
                default:
                    throw new Error('Unknown encoding')
            }
            return ret
        }

        Buffer.prototype.toJSON = function() {
            return {
                type: 'Buffer',
                data: Array.prototype.slice.call(this._arr || this, 0)
            }
        }

        // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
        Buffer.prototype.copy = function(target, target_start, start, end) {
            var source = this

            if (!start) start = 0
            if (!end && end !== 0) end = this.length
            if (!target_start) target_start = 0

            // Copy 0 bytes; we're done
            if (end === start) return
            if (target.length === 0 || source.length === 0) return

            // Fatal error conditions
            assert(end >= start, 'sourceEnd < sourceStart')
            assert(target_start >= 0 && target_start < target.length,
                'targetStart out of bounds')
            assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
            assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

            // Are we oob?
            if (end > this.length)
                end = this.length
            if (target.length - target_start < end - start)
                end = target.length - target_start + start

            var len = end - start

            if (len < 100 || !Buffer._useTypedArrays) {
                for (var i = 0; i < len; i++)
                    target[i + target_start] = this[i + start]
            } else {
                target._set(this.subarray(start, start + len), target_start)
            }
        }

        function _base64Slice(buf, start, end) {
            if (start === 0 && end === buf.length) {
                return base64.fromByteArray(buf)
            } else {
                return base64.fromByteArray(buf.slice(start, end))
            }
        }

        function _utf8Slice(buf, start, end) {
            var res = ''
            var tmp = ''
            end = Math.min(buf.length, end)

            for (var i = start; i < end; i++) {
                if (buf[i] <= 0x7F) {
                    res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
                    tmp = ''
                } else {
                    tmp += '%' + buf[i].toString(16)
                }
            }

            return res + decodeUtf8Char(tmp)
        }

        function _asciiSlice(buf, start, end) {
            var ret = ''
            end = Math.min(buf.length, end)

            for (var i = start; i < end; i++)
                ret += String.fromCharCode(buf[i])
            return ret
        }

        function _binarySlice(buf, start, end) {
            return _asciiSlice(buf, start, end)
        }

        function _hexSlice(buf, start, end) {
            var len = buf.length

            if (!start || start < 0) start = 0
            if (!end || end < 0 || end > len) end = len

            var out = ''
            for (var i = start; i < end; i++) {
                out += toHex(buf[i])
            }
            return out
        }

        function _utf16leSlice(buf, start, end) {
            var bytes = buf.slice(start, end)
            var res = ''
            for (var i = 0; i < bytes.length; i += 2) {
                res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
            }
            return res
        }

        Buffer.prototype.slice = function(start, end) {
            var len = this.length
            start = clamp(start, len, 0)
            end = clamp(end, len, len)

            if (Buffer._useTypedArrays) {
                return Buffer._augment(this.subarray(start, end))
            } else {
                var sliceLen = end - start
                var newBuf = new Buffer(sliceLen, undefined, true)
                for (var i = 0; i < sliceLen; i++) {
                    newBuf[i] = this[i + start]
                }
                return newBuf
            }
        }

        // `get` will be removed in Node 0.13+
        Buffer.prototype.get = function(offset) {
            console.log('.get() is deprecated. Access using array indexes instead.')
            return this.readUInt8(offset)
        }

        // `set` will be removed in Node 0.13+
        Buffer.prototype.set = function(v, offset) {
            console.log('.set() is deprecated. Access using array indexes instead.')
            return this.writeUInt8(v, offset)
        }

        Buffer.prototype.readUInt8 = function(offset, noAssert) {
            if (!noAssert) {
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset < this.length, 'Trying to read beyond buffer length')
            }

            if (offset >= this.length)
                return

            return this[offset]
        }

        function _readUInt16(buf, offset, littleEndian, noAssert) {
            if (!noAssert) {
                assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
            }

            var len = buf.length
            if (offset >= len)
                return

            var val
            if (littleEndian) {
                val = buf[offset]
                if (offset + 1 < len)
                    val |= buf[offset + 1] << 8
            } else {
                val = buf[offset] << 8
                if (offset + 1 < len)
                    val |= buf[offset + 1]
            }
            return val
        }

        Buffer.prototype.readUInt16LE = function(offset, noAssert) {
            return _readUInt16(this, offset, true, noAssert)
        }

        Buffer.prototype.readUInt16BE = function(offset, noAssert) {
            return _readUInt16(this, offset, false, noAssert)
        }

        function _readUInt32(buf, offset, littleEndian, noAssert) {
            if (!noAssert) {
                assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
            }

            var len = buf.length
            if (offset >= len)
                return

            var val
            if (littleEndian) {
                if (offset + 2 < len)
                    val = buf[offset + 2] << 16
                if (offset + 1 < len)
                    val |= buf[offset + 1] << 8
                val |= buf[offset]
                if (offset + 3 < len)
                    val = val + (buf[offset + 3] << 24 >>> 0)
            } else {
                if (offset + 1 < len)
                    val = buf[offset + 1] << 16
                if (offset + 2 < len)
                    val |= buf[offset + 2] << 8
                if (offset + 3 < len)
                    val |= buf[offset + 3]
                val = val + (buf[offset] << 24 >>> 0)
            }
            return val
        }

        Buffer.prototype.readUInt32LE = function(offset, noAssert) {
            return _readUInt32(this, offset, true, noAssert)
        }

        Buffer.prototype.readUInt32BE = function(offset, noAssert) {
            return _readUInt32(this, offset, false, noAssert)
        }

        Buffer.prototype.readInt8 = function(offset, noAssert) {
            if (!noAssert) {
                assert(offset !== undefined && offset !== null,
                    'missing offset')
                assert(offset < this.length, 'Trying to read beyond buffer length')
            }

            if (offset >= this.length)
                return

            var neg = this[offset] & 0x80
            if (neg)
                return (0xff - this[offset] + 1) * -1
            else
                return this[offset]
        }

        function _readInt16(buf, offset, littleEndian, noAssert) {
            if (!noAssert) {
                assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
            }

            var len = buf.length
            if (offset >= len)
                return

            var val = _readUInt16(buf, offset, littleEndian, true)
            var neg = val & 0x8000
            if (neg)
                return (0xffff - val + 1) * -1
            else
                return val
        }

        Buffer.prototype.readInt16LE = function(offset, noAssert) {
            return _readInt16(this, offset, true, noAssert)
        }

        Buffer.prototype.readInt16BE = function(offset, noAssert) {
            return _readInt16(this, offset, false, noAssert)
        }

        function _readInt32(buf, offset, littleEndian, noAssert) {
            if (!noAssert) {
                assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
            }

            var len = buf.length
            if (offset >= len)
                return

            var val = _readUInt32(buf, offset, littleEndian, true)
            var neg = val & 0x80000000
            if (neg)
                return (0xffffffff - val + 1) * -1
            else
                return val
        }

        Buffer.prototype.readInt32LE = function(offset, noAssert) {
            return _readInt32(this, offset, true, noAssert)
        }

        Buffer.prototype.readInt32BE = function(offset, noAssert) {
            return _readInt32(this, offset, false, noAssert)
        }

        function _readFloat(buf, offset, littleEndian, noAssert) {
            if (!noAssert) {
                assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
            }

            return ieee754.read(buf, offset, littleEndian, 23, 4)
        }

        Buffer.prototype.readFloatLE = function(offset, noAssert) {
            return _readFloat(this, offset, true, noAssert)
        }

        Buffer.prototype.readFloatBE = function(offset, noAssert) {
            return _readFloat(this, offset, false, noAssert)
        }

        function _readDouble(buf, offset, littleEndian, noAssert) {
            if (!noAssert) {
                assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
            }

            return ieee754.read(buf, offset, littleEndian, 52, 8)
        }

        Buffer.prototype.readDoubleLE = function(offset, noAssert) {
            return _readDouble(this, offset, true, noAssert)
        }

        Buffer.prototype.readDoubleBE = function(offset, noAssert) {
            return _readDouble(this, offset, false, noAssert)
        }

        Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
            if (!noAssert) {
                assert(value !== undefined && value !== null, 'missing value')
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset < this.length, 'trying to write beyond buffer length')
                verifuint(value, 0xff)
            }

            if (offset >= this.length) return

            this[offset] = value
        }

        function _writeUInt16(buf, value, offset, littleEndian, noAssert) {
            if (!noAssert) {
                assert(value !== undefined && value !== null, 'missing value')
                assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
                verifuint(value, 0xffff)
            }

            var len = buf.length
            if (offset >= len)
                return

            for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
                buf[offset + i] =
                    (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
                    (littleEndian ? i : 1 - i) * 8
            }
        }

        Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
            _writeUInt16(this, value, offset, true, noAssert)
        }

        Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
            _writeUInt16(this, value, offset, false, noAssert)
        }

        function _writeUInt32(buf, value, offset, littleEndian, noAssert) {
            if (!noAssert) {
                assert(value !== undefined && value !== null, 'missing value')
                assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
                verifuint(value, 0xffffffff)
            }

            var len = buf.length
            if (offset >= len)
                return

            for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
                buf[offset + i] =
                    (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
            }
        }

        Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
            _writeUInt32(this, value, offset, true, noAssert)
        }

        Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
            _writeUInt32(this, value, offset, false, noAssert)
        }

        Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
            if (!noAssert) {
                assert(value !== undefined && value !== null, 'missing value')
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset < this.length, 'Trying to write beyond buffer length')
                verifsint(value, 0x7f, -0x80)
            }

            if (offset >= this.length)
                return

            if (value >= 0)
                this.writeUInt8(value, offset, noAssert)
            else
                this.writeUInt8(0xff + value + 1, offset, noAssert)
        }

        function _writeInt16(buf, value, offset, littleEndian, noAssert) {
            if (!noAssert) {
                assert(value !== undefined && value !== null, 'missing value')
                assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
                verifsint(value, 0x7fff, -0x8000)
            }

            var len = buf.length
            if (offset >= len)
                return

            if (value >= 0)
                _writeUInt16(buf, value, offset, littleEndian, noAssert)
            else
                _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
        }

        Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
            _writeInt16(this, value, offset, true, noAssert)
        }

        Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
            _writeInt16(this, value, offset, false, noAssert)
        }

        function _writeInt32(buf, value, offset, littleEndian, noAssert) {
            if (!noAssert) {
                assert(value !== undefined && value !== null, 'missing value')
                assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
                verifsint(value, 0x7fffffff, -0x80000000)
            }

            var len = buf.length
            if (offset >= len)
                return

            if (value >= 0)
                _writeUInt32(buf, value, offset, littleEndian, noAssert)
            else
                _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
        }

        Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
            _writeInt32(this, value, offset, true, noAssert)
        }

        Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
            _writeInt32(this, value, offset, false, noAssert)
        }

        function _writeFloat(buf, value, offset, littleEndian, noAssert) {
            if (!noAssert) {
                assert(value !== undefined && value !== null, 'missing value')
                assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
                verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
            }

            var len = buf.length
            if (offset >= len)
                return

            ieee754.write(buf, value, offset, littleEndian, 23, 4)
        }

        Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
            _writeFloat(this, value, offset, true, noAssert)
        }

        Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
            _writeFloat(this, value, offset, false, noAssert)
        }

        function _writeDouble(buf, value, offset, littleEndian, noAssert) {
            if (!noAssert) {
                assert(value !== undefined && value !== null, 'missing value')
                assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                assert(offset !== undefined && offset !== null, 'missing offset')
                assert(offset + 7 < buf.length,
                    'Trying to write beyond buffer length')
                verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
            }

            var len = buf.length
            if (offset >= len)
                return

            ieee754.write(buf, value, offset, littleEndian, 52, 8)
        }

        Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
            _writeDouble(this, value, offset, true, noAssert)
        }

        Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
            _writeDouble(this, value, offset, false, noAssert)
        }

        // fill(value, start=0, end=buffer.length)
        Buffer.prototype.fill = function(value, start, end) {
            if (!value) value = 0
            if (!start) start = 0
            if (!end) end = this.length

            if (typeof value === 'string') {
                value = value.charCodeAt(0)
            }

            assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
            assert(end >= start, 'end < start')

            // Fill 0 bytes; we're done
            if (end === start) return
            if (this.length === 0) return

            assert(start >= 0 && start < this.length, 'start out of bounds')
            assert(end >= 0 && end <= this.length, 'end out of bounds')

            for (var i = start; i < end; i++) {
                this[i] = value
            }
        }

        Buffer.prototype.inspect = function() {
            var out = []
            var len = this.length
            for (var i = 0; i < len; i++) {
                out[i] = toHex(this[i])
                if (i === exports.INSPECT_MAX_BYTES) {
                    out[i + 1] = '...'
                    break
                }
            }
            return '<Buffer ' + out.join(' ') + '>'
        }

        /**
         * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
         * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
         */
        Buffer.prototype.toArrayBuffer = function() {
            if (typeof Uint8Array !== 'undefined') {
                if (Buffer._useTypedArrays) {
                    return (new Buffer(this))
                        .buffer
                } else {
                    var buf = new Uint8Array(this.length)
                    for (var i = 0, len = buf.length; i < len; i += 1)
                        buf[i] = this[i]
                    return buf.buffer
                }
            } else {
                throw new Error('Buffer.toArrayBuffer not supported in this browser')
            }
        }

        // HELPER FUNCTIONS
        // ================

        function stringtrim(str) {
            if (str.trim) return str.trim()
            return str.replace(/^\s+|\s+$/g, '')
        }

        var BP = Buffer.prototype

        /**
         * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
         */
        Buffer._augment = function(arr) {
            arr._isBuffer = true

            // save reference to original Uint8Array get/set methods before overwriting
            arr._get = arr.get
            arr._set = arr.set

            // deprecated, will be removed in node 0.13+
            arr.get = BP.get
            arr.set = BP.set

            arr.write = BP.write
            arr.toString = BP.toString
            arr.toLocaleString = BP.toString
            arr.toJSON = BP.toJSON
            arr.copy = BP.copy
            arr.slice = BP.slice
            arr.readUInt8 = BP.readUInt8
            arr.readUInt16LE = BP.readUInt16LE
            arr.readUInt16BE = BP.readUInt16BE
            arr.readUInt32LE = BP.readUInt32LE
            arr.readUInt32BE = BP.readUInt32BE
            arr.readInt8 = BP.readInt8
            arr.readInt16LE = BP.readInt16LE
            arr.readInt16BE = BP.readInt16BE
            arr.readInt32LE = BP.readInt32LE
            arr.readInt32BE = BP.readInt32BE
            arr.readFloatLE = BP.readFloatLE
            arr.readFloatBE = BP.readFloatBE
            arr.readDoubleLE = BP.readDoubleLE
            arr.readDoubleBE = BP.readDoubleBE
            arr.writeUInt8 = BP.writeUInt8
            arr.writeUInt16LE = BP.writeUInt16LE
            arr.writeUInt16BE = BP.writeUInt16BE
            arr.writeUInt32LE = BP.writeUInt32LE
            arr.writeUInt32BE = BP.writeUInt32BE
            arr.writeInt8 = BP.writeInt8
            arr.writeInt16LE = BP.writeInt16LE
            arr.writeInt16BE = BP.writeInt16BE
            arr.writeInt32LE = BP.writeInt32LE
            arr.writeInt32BE = BP.writeInt32BE
            arr.writeFloatLE = BP.writeFloatLE
            arr.writeFloatBE = BP.writeFloatBE
            arr.writeDoubleLE = BP.writeDoubleLE
            arr.writeDoubleBE = BP.writeDoubleBE
            arr.fill = BP.fill
            arr.inspect = BP.inspect
            arr.toArrayBuffer = BP.toArrayBuffer

            return arr
        }

        // slice(start, end)
        function clamp(index, len, defaultValue) {
            if (typeof index !== 'number') return defaultValue
            index = ~~index; // Coerce to integer.
            if (index >= len) return len
            if (index >= 0) return index
            index += len
            if (index >= 0) return index
            return 0
        }

        function coerce(length) {
            // Coerce length to a number (possibly NaN), round up
            // in case it's fractional (e.g. 123.456) then do a
            // double negate to coerce a NaN to 0. Easy, right?
            length = ~~Math.ceil(+length)
            return length < 0 ? 0 : length
        }

        function isArray(subject) {
            return (Array.isArray || function(subject) {
                return Object.prototype.toString.call(subject) === '[object Array]'
            })(subject)
        }

        function isArrayish(subject) {
            return isArray(subject) || Buffer.isBuffer(subject) ||
                subject && typeof subject === 'object' &&
                typeof subject.length === 'number'
        }

        function toHex(n) {
            if (n < 16) return '0' + n.toString(16)
            return n.toString(16)
        }

        function utf8ToBytes(str) {
            var byteArray = []
            for (var i = 0; i < str.length; i++) {
                var b = str.charCodeAt(i)
                if (b <= 0x7F)
                    byteArray.push(str.charCodeAt(i))
                else {
                    var start = i
                    if (b >= 0xD800 && b <= 0xDFFF) i++
                        var h = encodeURIComponent(str.slice(start, i + 1))
                            .substr(1)
                            .split('%')
                    for (var j = 0; j < h.length; j++)
                        byteArray.push(parseInt(h[j], 16))
                }
            }
            return byteArray
        }

        function asciiToBytes(str) {
            var byteArray = []
            for (var i = 0; i < str.length; i++) {
                // Node's code seems to be doing this and not & 0x7F..
                byteArray.push(str.charCodeAt(i) & 0xFF)
            }
            return byteArray
        }

        function utf16leToBytes(str) {
            var c, hi, lo
            var byteArray = []
            for (var i = 0; i < str.length; i++) {
                c = str.charCodeAt(i)
                hi = c >> 8
                lo = c % 256
                byteArray.push(lo)
                byteArray.push(hi)
            }

            return byteArray
        }

        function base64ToBytes(str) {
            return base64.toByteArray(str)
        }

        function blitBuffer(src, dst, offset, length) {
            var pos
            for (var i = 0; i < length; i++) {
                if ((i + offset >= dst.length) || (i >= src.length))
                    break
                dst[i + offset] = src[i]
            }
            return i
        }

        function decodeUtf8Char(str) {
            try {
                return decodeURIComponent(str)
            } catch (err) {
                return String.fromCharCode(0xFFFD) // UTF 8 invalid char
            }
        }

        /*
         * We have to make sure that the value is a valid integer. This means that it
         * is non-negative. It has no fractional component and that it does not
         * exceed the maximum allowed value.
         */
        function verifuint(value, max) {
            assert(typeof value === 'number', 'cannot write a non-number as a number')
            assert(value >= 0, 'specified a negative value for writing an unsigned value')
            assert(value <= max, 'value is larger than maximum value for type')
            assert(Math.floor(value) === value, 'value has a fractional component')
        }

        function verifsint(value, max, min) {
            assert(typeof value === 'number', 'cannot write a non-number as a number')
            assert(value <= max, 'value larger than maximum allowed value')
            assert(value >= min, 'value smaller than minimum allowed value')
            assert(Math.floor(value) === value, 'value has a fractional component')
        }

        function verifIEEE754(value, max, min) {
            assert(typeof value === 'number', 'cannot write a non-number as a number')
            assert(value <= max, 'value larger than maximum allowed value')
            assert(value >= min, 'value smaller than minimum allowed value')
        }

        function assert(test, message) {
            if (!test) throw new Error(message || 'Failed assertion')
        }

}, {
        "base64-js": 11,
        "ieee754": 12
    }],
    11: [function(require, module, exports) {
        var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

        ;
        (function(exports) {
            'use strict';

            var Arr = (typeof Uint8Array !== 'undefined') ? Uint8Array : Array

            var ZERO = '0'.charCodeAt(0)
            var PLUS = '+'.charCodeAt(0)
            var SLASH = '/'.charCodeAt(0)
            var NUMBER = '0'.charCodeAt(0)
            var LOWER = 'a'.charCodeAt(0)
            var UPPER = 'A'.charCodeAt(0)

            function decode(elt) {
                var code = elt.charCodeAt(0)
                if (code === PLUS)
                    return 62 // '+'
                if (code === SLASH)
                    return 63 // '/'
                if (code < NUMBER)
                    return -1 //no match
                if (code < NUMBER + 10)
                    return code - NUMBER + 26 + 26
                if (code < UPPER + 26)
                    return code - UPPER
                if (code < LOWER + 26)
                    return code - LOWER + 26
            }

            function b64ToByteArray(b64) {
                var i, j, l, tmp, placeHolders, arr

                if (b64.length % 4 > 0) {
                    throw new Error('Invalid string. Length must be a multiple of 4')
                }

                // the number of equal signs (place holders)
                // if there are two placeholders, than the two characters before it
                // represent one byte
                // if there is only one, then the three characters before it represent 2 bytes
                // this is just a cheap hack to not do indexOf twice
                var len = b64.length
                placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

                // base64 is 4/3 + up to two characters of the original data
                arr = new Arr(b64.length * 3 / 4 - placeHolders)

                // if there are placeholders, only get up to the last complete 4 chars
                l = placeHolders > 0 ? b64.length - 4 : b64.length

                var L = 0

                function push(v) {
                    arr[L++] = v
                }

                for (i = 0, j = 0; i < l; i += 4, j += 3) {
                    tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
                    push((tmp & 0xFF0000) >> 16)
                    push((tmp & 0xFF00) >> 8)
                    push(tmp & 0xFF)
                }

                if (placeHolders === 2) {
                    tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
                    push(tmp & 0xFF)
                } else if (placeHolders === 1) {
                    tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
                    push((tmp >> 8) & 0xFF)
                    push(tmp & 0xFF)
                }

                return arr
            }

            function uint8ToBase64(uint8) {
                var i,
                    extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
                    output = "",
                    temp, length

                function encode(num) {
                    return lookup.charAt(num)
                }

                function tripletToBase64(num) {
                    return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
                }

                // go through the array every three bytes, we'll deal with trailing stuff later
                for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
                    temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
                    output += tripletToBase64(temp)
                }

                // pad the end with zeros, but make sure to not forget the extra bytes
                switch (extraBytes) {
                    case 1:
                        temp = uint8[uint8.length - 1]
                        output += encode(temp >> 2)
                        output += encode((temp << 4) & 0x3F)
                        output += '=='
                        break
                    case 2:
                        temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
                        output += encode(temp >> 10)
                        output += encode((temp >> 4) & 0x3F)
                        output += encode((temp << 2) & 0x3F)
                        output += '='
                        break
                }

                return output
            }

            module.exports.toByteArray = b64ToByteArray
            module.exports.fromByteArray = uint8ToBase64
        }())

}, {}],
    12: [function(require, module, exports) {
        exports.read = function(buffer, offset, isLE, mLen, nBytes) {
            var e, m,
                eLen = nBytes * 8 - mLen - 1,
                eMax = (1 << eLen) - 1,
                eBias = eMax >> 1,
                nBits = -7,
                i = isLE ? (nBytes - 1) : 0,
                d = isLE ? -1 : 1,
                s = buffer[offset + i];

            i += d;

            e = s & ((1 << (-nBits)) - 1);
            s >>= (-nBits);
            nBits += eLen;
            for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

            m = e & ((1 << (-nBits)) - 1);
            e >>= (-nBits);
            nBits += mLen;
            for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

            if (e === 0) {
                e = 1 - eBias;
            } else if (e === eMax) {
                return m ? NaN : ((s ? -1 : 1) * Infinity);
            } else {
                m = m + Math.pow(2, mLen);
                e = e - eBias;
            }
            return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
        };

        exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
            var e, m, c,
                eLen = nBytes * 8 - mLen - 1,
                eMax = (1 << eLen) - 1,
                eBias = eMax >> 1,
                rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
                i = isLE ? 0 : (nBytes - 1),
                d = isLE ? 1 : -1,
                s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

            value = Math.abs(value);

            if (isNaN(value) || value === Infinity) {
                m = isNaN(value) ? 1 : 0;
                e = eMax;
            } else {
                e = Math.floor(Math.log(value) / Math.LN2);
                if (value * (c = Math.pow(2, -e)) < 1) {
                    e--;
                    c *= 2;
                }
                if (e + eBias >= 1) {
                    value += rt / c;
                } else {
                    value += rt * Math.pow(2, 1 - eBias);
                }
                if (value * c >= 2) {
                    e++;
                    c /= 2;
                }

                if (e + eBias >= eMax) {
                    m = 0;
                    e = eMax;
                } else if (e + eBias >= 1) {
                    m = (value * c - 1) * Math.pow(2, mLen);
                    e = e + eBias;
                } else {
                    m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
                    e = 0;
                }
            }

            for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

            e = (e << mLen) | m;
            eLen += mLen;
            for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

            buffer[offset + i - d] |= s * 128;
        };

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
}, {}, [4])
