//underscore helper function
function compose() {
    var funcs = arguments;
    return function() {
        var args = arguments;
        for (var i = funcs.length - 1; i >= 0; i--) {
            args = [funcs[i].apply(this, args)];
        }
        return args[0];
    };
}

function keys(obj) {
    var keys = [];
    for (var key in obj)
        if (obj.hasOwnProperty(key)) keys.push(key);
    return keys;
}
function defaults(obj,source){
    if(source)
        for (var prop in source) {
            if (obj[prop] === void 0) obj[prop] = source[prop];
        }
    return obj;
}

function extend(obj) {
    var source = arguments[1];
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
    return obj;
}
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
// Returns a function that will return the value at `key`
    // from its first argument.
    //
    // The returned function also has a `then` method, which is
    // a shortcut to a promise that resolves to the value that
    // the created getter function returns.
    getter: function(key) {
        console.log('getter out: '+key);
        var givesTo = [];
        var getter = function(obj) {
            console.log('getter: ');
            console.log(obj);
            var v = obj[key];
            console.log('v: ');
            console.log(v);
            givesTo.map(function(f) {
                f(v);
            });
            return v;
        };
        getter.giveTo = function(f) {
            console.log('give to : ');
            console.log(f);
            givesTo.push(f);
            return getter;
        };
        return getter;
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

    invoker: function() {
        var args = js.array(arguments);
        return function() {
            js.invoke(args);
        }
    }
};
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
        //$(container).remove();
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

        opts = defaults(opts || {}, {
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

    qsa: compose(js.array, document.querySelectorAll.bind(document)),

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
};

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
        keys(evtsToHandlers).map(function(evtStr) {
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
        var e;
        try {
            e = new Event(evtStr);
        }
        catch (err) {
            e = document.createEvent('Event');
            e.initEvent(evtStr, true, true);
        }

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
        attrs && extend(msg, attrs);
        targetFrame.postMessage(msg, "*");
    }
};


var sq = window.sq = window.sq || {};
sq.context = 'inner';
extend(sq, dom.fromQueryString());


// user setting

var localStorageKey = 'userSettings';
var defaultSetting = load();

function save() {
    window.localStorage[localStorageKey] = JSON.stringify(defaultSetting);
}

function load() {
    return JSON.parse(window.localStorage[localStorageKey] || "{}");
}

var userSettings = {
    get: function(k, defVal) {
        if (defaultSetting[k] === undefined) {
            userSettings.set(k, defVal);
            return defVal;
        }
        return defaultSetting[k];
    },
    set: function(k, v) {
        defaultSetting[k] = v;
        if (v === undefined) {
            delete defaultSetting[k];
        }
        save();
    }
};
window.parent.sq.tracking['userSettings'] = userSettings;
var tracking = window.parent.sq.tracking;


sq.playing = true;
sq.rewinding = false;

// TODO reduce the amount of global state in this file,
// use a more functional approach
var intervalMs,
    _wpm,
    seekPPS = { // pixels per second
        start: 650,
        accel: 40,
        max: 1200,
        current: undefined
    },
    nodeIdx = 0,
    nextNodeTimeoutId,
    focusNode,
    focusNodePrev,
    slowStartIdx,
    carousel = dom.qs('.carousel'),
    nodesContainer = dom.qs('.carousel .nodes'),
    clearSeekTransition,
    clearSeekTransitionUpdater;

var anims = {
    showContext: {
        ms: 150
    },
    hideContext: {
        extraSlowFactor: 2.8,
        ms: 600,
        word: {
            ms: 300
        }
    }
};

var updateAndDispatchProgress = function() {
    sq.progress = nodeIdx / c.nodes.length;
    evt.dispatch('squirt.progress');
};

var getNextNodeIdx = incrementNodeIdx;

function decrementNodeIdx() {
    if (nodeIdx > 0) return nodeIdx--;
}

function incrementNodeIdx() {
    if (nodeIdx < c.nodes.length - 1) return ++nodeIdx;
}

function seekingFFOrRewind() { // i.e., not dragging
    return sq.seeking && sq.seeking != 'drag';
}

var lock = false;
function waitOnNode(node,callback) {
    if(lock)
        return;
    lock = true;
    // if we'r ff/rewinding, advance as soon as the current transition ends
    if (seekingFFOrRewind()) {
        evt.once(nodesContainer, dom.transitionEndEvents,function(){lock = false;callback();});

        // otherwise, we're playing, so resolve the promise after displaying the node
    } else {
        setTimeout(function() {
                lock = false;
                if (!sq.playing&& !seekingFFOrRewind()) return; // paused or ff/rewinding
                callback();
            },
            intervalMs * (focusNode.delayFactor + slowStartFactor()));
    }
}

function noMoreNodes() {
    if (nodeIdx != c.nodes.length - 1) return;
    nodeIdx = 0;
    return evt.dispatch('squirt.carousel.end');
}

function advanceNode() {
    tracking.lexicalRead++;
    tracking.wordRead+= c.nodes[nodeIdx].word.trim().split(/[\s]+/g).length;
    updateAndDispatchProgress();
    if (!getNextNodeIdx()) return noMoreNodes();
    focusOnNodeAtIdx(nodeIdx);
    waitOnNode(c.nodes[nodeIdx],advanceNode);
}

function focusOnNodeAtIdx(idx) {
    // the focusNodePrev business avoids animating
    // the focusNode from opacity 1 to 0, which is otherwise
    // incurred by the opacity transition applied to .word
    focusNode && (
        focusNode.classList.remove('focus-node'),
            focusNode.classList.add('focus-node-prev')
    );
    focusNodePrev && focusNodePrev.classList.remove('focus-node-prev');
    focusNodePrev = focusNode;

    focusNode = c.nodes[idx];
    focusNode.classList.add('focus-node');
    centerOnFocus();

}

function centerOnFocus() {
    var orpNode = focusNode.querySelector('.orp');
    nodesContainer.style.left = "-" + (orpNode.offsetLeftCached + orpNode.offsetWidthCached / 2) + "px";
}

function contextNodes(ctxNodeRange) {
    var nodes = [];
    var idx = Math.max(0, nodeIdx); // hack -- nodeIdx is -1 on start
    return c.nodes
        .slice(Math.max(0, idx - ctxNodeRange), idx)
        .concat(
        c.nodes.slice(idx,
            Math.min(idx + ctxNodeRange, c.nodes.length)));
}

function slowStartFactor() {
    if (wordsSincePlay > 24) return 0;
    var wordsSincePlay = nodeIdx - slowStartIdx;
    return 2.2 * (1 / wordsSincePlay) - .1;
}

function hideContextNodes(extraSlow, callback) { // initial reader, show fade of word.
    console.log('hide context nodes');
    var animationLength = anims.hideContext.ms;
    animationLength *= extraSlow ? anims.hideContext.extraSlowFactor : 1;
    var wordsAnimationLength = animationLength * .7;
    var ctxNodeRange = 10;
    var ctxNodes = contextNodes(ctxNodeRange);
    var focusIdx = ctxNodes.indexOf(focusNode);
    var gDelay=0;
    ctxNodes.map(function(node, idx) {
        if (node.classList.contains('focus-node')) return;
        node.classList.add('serial-fade');
        var delayFactor = (ctxNodeRange - Math.abs(idx - focusIdx)) / ctxNodeRange;
        gDelay =delayFactor * wordsAnimationLength;
        setTimeout(function() {
            node.classList.remove('serial-fade')
        },delayFactor * wordsAnimationLength);
    });
    setTimeout(callback,animationLength+gDelay); // when other part fade, and wait for the animation, then advance node.

}
var linearLeft = {
    target: 'left',
    type: 'linear'
};

function constantPPSTransition(directionIdx) {
    var distance = Math.abs(focusNode.orp.offsetLeftCached - c.nodes[nodeIdx + directionIdx].orp.offsetLeftCached);
    var ms = distance * 1000 / seekPPS.current;
    return dom.transition(nodesContainer, ms, linearLeft);
}

function setupSeekTransition() {
    // ease into the seek, and then use a linear transition adjusted for constant speed
    seekPPS.current = seekPPS.start;
    var directionIdx = sq.seeking == 'backward' ? -1 : 1;
    clearSeekTransition = dom.transition(nodesContainer, 200, {
        target: 'left',
        type: 'ease-in'
    });
    clearSeekTransitionUpdater = evt.on(nodesContainer, dom.transitionEndEvents, function(e) {
        if (e.target != nodesContainer) return;
        seekPPS.current = Math.min(seekPPS.max, seekPPS.current + seekPPS.accel);
        clearSeekTransition = constantPPSTransition(directionIdx);
    });
}

function setSeekState(state) {
    if (state === sq.seeking) return;
    tracking.timeRead += new Date().getTime()-tracking.startTime;

    getNextNodeIdx = state == 'backward' ? decrementNodeIdx : incrementNodeIdx;

    var wasSeeking = sq.seeking;
    sq.seeking = state;
    if (wasSeeking) return; // catch an instantaneous switch from forwards to backwards?

    carousel.classList.add('seeking');
    c.pause();

    if (state == 'drag') return; // for scrubber

    setupSeekTransition();
    advanceNode();
}

function clearSeek() {
    sq.seeking = false;
    carousel.classList.remove('seeking');
}


var c = {
    hide: dom.hide.bind(null, carousel),
    show: dom.show.bind(null, carousel),
    nodes: null,

    pause: function() {
        tracking.fixation++;
        var current = new Date().getTime();
        tracking.timeRead+=(current -tracking.startTime);

        if (!sq.playing) return;
        sq.playing = false;
        carousel.classList.remove('playing');
    },

    play: function(extraSlowStart) {
        tracking.startTime=new Date().getTime();
        clearSeek();
        sq.playing = true;
        getNextNodeIdx = incrementNodeIdx;
        carousel.classList.add('playing');
        slowStartIdx = nodeIdx;
        hideContextNodes(extraSlowStart,advanceNode)
    },

    wpm: function(wpm) {// this tell time bar how much time need to read the document.
        _wpm = wpm;
        intervalMs = 60 * 1000 / wpm;
        //TODO update display
        sq.duration = (c.nodes.length * intervalMs / 1000 / 60).toFixed(1);
    },

    seek: function(location) {
        if(location.x==1)
            return;
        setSeekState('drag');
        nodeIdx = Math.floor(location.x * c.nodes.length);
        focusOnNodeAtIdx(nodeIdx);
    },

    seekForward: function(){
        setSeekState('forward');
    },

    seekBackward: function() {
        tracking.regression++;
        setSeekState('backward');
    },

    stopSeeking: function() {
        tracking.startTime=new Date().getTime();
        sq.seeking = false;
        clearSeekTransitionUpdater();
        evt.once(nodesContainer, dom.transitionEndEvents, clearSeekTransition);
    },

    setNodes: function(childNodes, preserveIdx) {
        nodesContainer.innerHTML = '';
        dom.appendChildren(nodesContainer, childNodes, true);
        c.nodes = childNodes;
        var shouldHide;

        // cache offsets to optimize rendering
        childNodes.map(function(node) {
            node.orp.offsetLeftCached = node.orp.offsetLeft;
            node.orp.offsetWidthCached = node.orp.offsetWidth;
        });

        !preserveIdx && (nodeIdx = 0);
        focusOnNodeAtIdx(nodeIdx);
    },

    contextNodes: function() {
        return contextNodes(5);
    }
};



var delays = {
    shortWord: 1.2,
    comma: 2,
    period: 3,
    paragraph: 3.5,
    longWord: 1.5
};

var w = {
    getTokenDelay: function(word) {
        var lastChar = word[word.length - 1];
        if (lastChar.match('”|"'))
            lastChar = word[word.length - 2];
        if (lastChar == '\n')
            return delays.paragraph;
        if ('.!?'.indexOf(lastChar) != -1)
            return delays.period;
        if (',;:–'.indexOf(lastChar) != -1)
            return delays.comma;
        if (word.length < 4)
            return delays.shortWord;
        if (word.length > 11)
            return delays.longWord;
        return 1;
    },

    getDelay: function(node) {
        var word = node.word.trim().split(/[\s]+/g);
        var delay = 0;
        for (var i = 0; i < word.length; i++) {
            delay += w.getTokenDelay(word[i]);
        }
        return delay;
    },



    // ORP: Optimal Recgonition Point
    getORPIndex: function(word) {
        var length = word.length;
        var lastChar = word[word.length - 1];
        if (lastChar == '\n') {
            lastChar = word[word.length - 2];
            length--;
        }
        if (',.?!:;"'.indexOf(lastChar) != -1) length--;
        return length <= 1 ? 0 :
            (length == 2 ? 1 :
                (length == 3 ? 1 :
                Math.floor(length / 2) - 1));
    },

    toNode: function(word) {
        var node = dom.makeDiv({
            'class': 'word'
        });
        node.word = word;
        var orpIdx = w.getORPIndex(node.word);

        node.word.split('').map(function charToNode(char, idx) {
            var span = dom.makeEl('span', {}, node);
            span.textContent = char;
            if (idx == orpIdx) {
                span.classList.add('orp');
                node.orp = span;
            }
        });

        node.delayFactor = w.getDelay(node);

        return node;
    }

};

// We multiply the average delay per word by the user-set WPM to
// obtain a baseline per-word interval that, when modified by
// each word's specific delay value, will approach the user's
// desired speed.
var avgDelayPerWord = null;

var tokenDelimiter = 'ˇ';

function textToNodes(text,wbw) {
    text = text.trim('\n').replace(/\s+\n/g, '\n');
    var array;
    if(wbw){
        text=text.replace(/\s/g, tokenDelimiter);
    }
    array= text.replace(/[-—\,\.\!\:\;](?![\"\'\)\]\}])/g, "$& ").split(tokenDelimiter);

    var totalDelay = 0;
    var length = 0;
    var nodes = text
        .replace(/[-—\,\.\!\:\;](?![\"\'\)\]\}])/g, "$& ")
        .split(tokenDelimiter)
        //  .split(/[\s]+/g)
        .filter(function(word) {
            return word.length;
        })
        .map(w.toNode)
        .map(function(node) {
            totalDelay += node.delayFactor;
            return node
        })
        .map(function(node) {
            length += node.word.trim().split(/[\s]+/g).length;
            return node
        });
    avgDelayPerWord = totalDelay / length;
    return nodes;
}

var size=userSettings.get('fontSize',2);
$(".carousel").css('font-size',size+'em');
function changeFont(s) {
    size+=s;
    userSettings.set('fontSize',size);
    $(".carousel").css('font-size',size+'em');
    rebuildNodes(true);
}

function changeNode(wbw){
    c.setNodes(textToNodes(currentText,wbw));
}

var rebuildNodes = function(preserveIdx) {
    c.setNodes(textToNodes(currentText), preserveIdx);
};
// TODO the location of these event handlers is inconsistent.
// some are here, some are in the main.iframe module. sort it out.
evt.handle({
    'squirt.rewind.start': c.seekBackward,
    'squirt.rewind.stop': c.stopSeeking,
    'squirt.ff.start': c.seekForward,
    'squirt.ff.stop': c.stopSeeking,
    'squirt.seek': function(ev){
        var loc = ev.location;
        loc.y=0;
        c.seek(loc)},
    'squirt.changeFont': changeFont
});

evt.on('keydown keyup', function keyEvent(e){
    if(!keyHasAtLeastOneHandler(e.keyCode)) return true;
    if(keyAlreadyDown(e)) return e.preventDefault(); // has side effects
    var handler = keyHandlers[e.type][e.keyCode];
    if(!handler) return true;
    handler && handler(e);
    return e.preventDefault();
});

var downKeys = {}; // track pressed keys
var keyHandlers = {
    keydown: {
        32: togglePlay,
        27: evt.dispatch.bind(null, 'squirt.close', {}, null),
        38: evt.dispatch.bind(null, 'squirt.wpm.adjust', {value: 10}, null),
        40: evt.dispatch.bind(null, 'squirt.wpm.adjust', {value: -10}, null),
        37: evt.dispatch.bind(null, 'squirt.rewind.start', {}, null),
        39: evt.dispatch.bind(null, 'squirt.ff.start', {}, null)
    },
    keyup: {
        37: evt.dispatch.bind(null, 'squirt.rewind.stop', {}, null),
        39: evt.dispatch.bind(null, 'squirt.ff.stop', {}, null),
        83: evt.dispatch.bind(null, 'squirt.toggleSettings', {}, null)
    }
};

function togglePlay(){
    evt.dispatch('squirt.' + (sq.playing ? 'pause' : 'play'));
}

// for keys that have a keyup handler, prevent keydown from
// firing repeatedly when held
function keyAlreadyDown(e){
    if(e.type == 'keydown' && keyHandlers['keyup'][e.keyCode] !== undefined){
        if(downKeys[e.keyCode]) return true;
        downKeys[e.keyCode] = true;
    } else {
        delete downKeys[e.keyCode];
    }
    return false;
}

function keyHasAtLeastOneHandler(keyCode){
    return keyHandlers['keyup'][keyCode] || keyHandlers['keydown'][keyCode];
}


var setting = dom.qs('.toolbar-settings');
evt.on(setting, 'click', function(){
    evt.dispatch( 'squirt.toggleSettings', null, null);
});


//Play

var a = dom.qs('.pause');

function updateIcon() {
    a.innerHTML = sq.playing ? "pause" : "play";
}

evt.on('squirt.pause.echo squirt.play.echo', updateIcon);

evt.on(dom.qs('.pause'), 'click', function(clickEvt) {
    evt.dispatch('squirt.' + (sq.playing ? 'pause' : 'play'));
    clickEvt.preventDefault();
});

updateIcon();

//scroll bar


function updateProgressBar(location) {
    var progress = Math.round(location.x * 100);
    dom.qs('.scrubber-bar-left').style.width = progress + '%';
    dom.qs('.scrubber-bar-right').style.width = (100 - progress) + '%';
    dom.qs('.scrubber-bar-right').style.left = progress + '%';
}

var scrubber = dom.qs('.scrubber');
var scrubberKnob = dom.qs('.scrubber-knob');
var setDraggableXY = dom.draggable(scrubberKnob, {
    disableY: true,
    x: {
        min: 0,
        max: scrubber.offsetWidth - 19
    }
    // note about magic number 19:
    // scrubberKnob.offsetWidth reports 60px before the icon font kicks in
});

evt.on(scrubberKnob, 'drag', function(e) {
    evt.dispatch('squirt.seek', {
        location: e.location
    });
    updateProgressBar(e.location);
    e.preventDefault();
});

evt.on(scrubberKnob, 'dragged', evt.dispatch.bind(null, 'squirt.play', {}, null));

evt.on('squirt.progress', function(e) {
    updateProgressBar({
        x: sq.progress
    });
    setDraggableXY(sq.progress);
});

var timeToRead = dom.qs('.time-to-read');
dom.bind("{{ duration }} mins", sq, timeToRead);
evt.on('squirt.wpm.echo', timeToRead.render);

//wpm

var wpm = dom.qs('.wpm-count');

dom.bind("{{wpm}} WPM", sq, wpm);

evt.on('squirt.wpm.echo', wpm.render);

evt.on(dom.qs('.wpm-up'), 'click', function() {
    evt.dispatch('squirt.wpm.adjust', {
        value: 20
    });
});

evt.on(dom.qs('.wpm-down'), 'click', function() {
    evt.dispatch('squirt.wpm.adjust', {
        value: -20
    });
});

wpm.render();
var currentText;
// reader
var reader= {

    setText: function(text) {
        console.log(tracking);
        tracking.reset(tracking);
        var id = setInterval(function(){
            if(tracking.isReading){
                tracking.send(tracking);
            }else{
                clearInterval(id);
            }
        },20000);
        currentText=text;
        rebuildNodes = function(preserveIdx) {
            c.setNodes(textToNodes(text), preserveIdx);
        };
        rebuildNodes();
    },

    stop: c.pause,

        wpm: function(targetWPM) {
    c.wpm(targetWPM * avgDelayPerWord);
},

    play: function(extraSlowStart) {
        c.play(extraSlowStart);
    },

    currentContextWords: function() {
        return $.map(c.contextNodes(), function(e) { return e['word']; });
    }
};

// gui
//evt.on(dom.qs('.article-veil'),
//    'click',
//    function(){
//        evt.dispatch('squirt.pause', null, null);
//    });

evt.on(dom.qs('.close'),
    'click',
    function(){
        evt.dispatch('squirt.close', null, null);
    });


//cross frame
evt.on(window, 'message', function(e) {
    var data = e.data;
    var event = data.event;
    if (event === undefined) return;
    console.log(event);
    delete data.event;
    if (event.match(/squirt\./)) evt.dispatch(event, data);
});
evt.dispatch('squirt.load');

var modal = dom.qs('.modal');
evt.on(window, 'load', function(){
    slideModalTo('settingsClosed', true);
});


// TODO the location of these event handlers is inconsistent.
// some are here, some are in the reader module. sort it out.
var events = {
    'squirt.pause': function(e) {
        reader.stop();
        evt.dispatch('squirt.scrollToWords', {
            words: reader.currentContextWords()
        });
        document.body.classList.remove('playing');
    },

    'squirt.play': function(e) {
        slideModalTo('settingsClosed', true);

        dom.show('.carousel');
        dom.hide('.reader-content');
        reader.play(e.extraSlowStart);
        document.body.classList.add('playing');
    },

    'squirt.close': function() {
        tracking.send(tracking);
        tracking.isReading=false;
        sq.closed = true;
        reader.stop();
        slideModalTo('hidden');
        document.body.classList.remove('playing');
    },

    'squirt.wpm.adjust': function(e) {
        evt.dispatch('squirt.wpm', {
            value: e.value + sq.wpm
        });
    },

    'squirt.wpm': function(e) {
        console.log('in squirt.wpm ');
        console.log(e);
        sq.wpm = Number(e.value);
        userSettings.set('wpm', sq.wpm);
        reader.wpm(sq.wpm);
    },

    'squirt.setText': function(e) {
        tracking.send(tracking);
        reader.setText(e.text);
        evt.dispatch('squirt.wpm', {
            value: userSettings.get('wpm', 320),
            notForKeen: true
        });
    },

    'squirt.toggleSettings': function() {
        evt.dispatch('squirt.' + ($('.drawer').is(':hidden') ? 'showSettings': 'closeSettings'));
    },

    'squirt.showSettings': function() {
        evt.dispatch('squirt.pause');
        slideModalTo(0);
    },

    'squirt.closeSettings': function() {
        evt.dispatch('squirt.play');
        slideModalTo('settingsClosed');
    },

    // ideally, we're not listening to the carousel directly
    'squirt.carousel.end': function(e) {
        dom.hide('.carousel');
        //dom.show('.reader-content');
        evt.dispatch('squirt.pause');
        tracking.isReading=false;
        tracking.send(tracking);
    }

};

evt.handle(events);

function slideModalTo(offset, play) {
    if (offset == 'settingsClosed') {
        $('.drawer').hide('slow');
    } else if (offset == 'hidden') {
        $('.drawer').hide('slow');
    } else {
        $('.drawer').show('slow');
    }

}
