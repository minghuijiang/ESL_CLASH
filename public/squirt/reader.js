var dom = {

    // Efficiently append a large number of children to el
    // by removing el from the DOM, appending the children,
    // and re-attaching.
    appendChildren: function(el, children) {
        var parent = el.parentElement;
        var nextSibling = el.nextSibling;
        $(el).remove();
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
        classStr.split(' ').map(function(cls) {
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
        var values = opts.target.split(' ').map(function(target) {
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
                container.appendChild(selection.getRangeAt(i).cloneContents());
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
        var string = (queryString || window.location.search).substring(1);
        var object = {};
        string.split('&').map(function(component) {
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
        _.keys(evtsToHandlers).map(function(evtStr) {
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

        (dispatcher || document).dispatchEvent(e);

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
            targetOrigin = window.location.protocol + window.sq.iframeQueryParams.host;
        }
        var msg = {
            event: e,
            frameOfOrigin: window.sq.context
        };
        attrs && _.extend(msg, attrs);
        targetFrame.postMessage(msg, "*");
    }
};

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


evt.on(dom.qs('.article-veil'),
    'click',
    _.partial(evt.dispatch, 'squirt.pause', null, null));

evt.on(dom.qs('.close'),
    'click',
    _.partial(evt.dispatch, 'squirt.close', null, null));





evt.on(window, 'message', function(e) {
    var data = e.data;
    var event = data.event;
    if (event === undefined) return;
    delete data.event;
    if (event.match(/squirt\./)) evt.dispatch(event, data);
});